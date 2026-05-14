package services

import (
	"fmt"
	"strings"
)

type ScoreResult struct {
	KeywordScore int
	FormatScore  int
	ATSScore     int
	OverallScore int
}

func hasAny(detected map[string]bool, group []string) bool {
	for _, s := range group {
		if detected[s] {
			return true
		}
	}
	return false
}

// sectionWeight mengembalikan bobot berdasarkan letak keyword di CV.
// Skills/Summary mendapat bobot penuh; Education lebih rendah karena ATS memprioritaskan keahlian aktif.
func sectionWeight(section *string) float64 {
	if section == nil {
		return 0.5
	}
	switch *section {
	case "skills", "summary":
		return 1.0
	case "experience":
		return 0.8
	case "education":
		return 0.6
	default:
		return 0.5
	}
}

// frequencyMultiplier mengembalikan bobot tambahan berdasarkan frekuensi kemunculan keyword di CV.
// 2–3 kemunculan adalah sweet spot ATS (Prioritas 4, ATS_RESEARCH.md).
// 4+ kemunculan sama dengan 2–3 untuk mencegah reward atas keyword stuffing.
func frequencyMultiplier(count int) float64 {
	if count >= 2 {
		return 1.1
	}
	return 1.0
}

func CalculateScores(result *AIResult, jobPosition string) ScoreResult {
	// Hitung keyword_score dengan section-aware weighting + frequency multiplier
	var totalRequired, foundRequired, totalPreferred, foundPreferred float64
	for _, kw := range result.Keywords {
		if kw.Weight == "required" {
			totalRequired++
			if kw.FoundInCV {
				foundRequired += sectionWeight(kw.Section) * frequencyMultiplier(kw.OccurrenceCount)
			}
		} else {
			totalPreferred++
			if kw.FoundInCV {
				foundPreferred += sectionWeight(kw.Section) * frequencyMultiplier(kw.OccurrenceCount)
			}
		}
	}

	var requiredScore, preferredScore float64
	if totalRequired > 0 {
		requiredScore = foundRequired / totalRequired * 100
	}
	if totalPreferred > 0 {
		preferredScore = foundPreferred / totalPreferred * 100
	}
	keywordScore := int((requiredScore * 0.7) + (preferredScore * 0.3))
	if keywordScore > 100 {
		keywordScore = 100
	}

	// Hitung format_score — presence-based: 3 section inti × 25 + bonus completeness × 25
	detectedLower := make(map[string]bool, len(result.SectionsDetected))
	for _, s := range result.SectionsDetected {
		detectedLower[strings.ToLower(strings.TrimSpace(s))] = true
	}

	skillsGroup := []string{
		"skills", "keahlian", "kemampuan", "keterampilan", "kompetensi",
	}
	experienceGroup := []string{
		"work experience", "experience", "pengalaman kerja", "pengalaman", "riwayat pekerjaan",
		"pengalaman organisasi", "kegiatan organisasi", "pengalaman kepanitiaan", "kepanitiaan",
		"organisasi", "activities", "aktivitas",
	}
	educationGroup := []string{
		"education", "pendidikan", "riwayat pendidikan",
	}

	summaryGroup := []string{
		"summary", "profile", "profil", "ringkasan", "tentang saya",
		"objective", "about me",
	}

	var sectionScore float64
	if hasAny(detectedLower, skillsGroup)     { sectionScore += 33 }
	if hasAny(detectedLower, experienceGroup) { sectionScore += 33 }
	if hasAny(detectedLower, educationGroup)  { sectionScore += 34 }
	if hasAny(detectedLower, summaryGroup)    { sectionScore += 10 }
	if sectionScore > 100                     { sectionScore = 100 }

	var languageScore float64
	switch result.LanguageMix {
	case "english":
		languageScore = 100
	case "mixed":
		languageScore = 60
	case "indonesian":
		languageScore = 30
	}

	formatScore := int((sectionScore * 0.6) + (languageScore * 0.4))

	// Hitung ats_score
	atsScore := int(float64(keywordScore)*0.65 + float64(formatScore)*0.35)

	// Job title match bonus — jabatan di CV vs posisi yang dilamar
	// Exact match +10, partial match +5 (Jobscan: job title match → 10.6× interview invitation)
	titleBonus := jobTitleBonus(result.JobTitlesExtracted, jobPosition)
	overallScore := atsScore + titleBonus
	if overallScore > 100 {
		overallScore = 100
	}

	return ScoreResult{
		KeywordScore: keywordScore,
		FormatScore:  formatScore,
		ATSScore:     atsScore,
		OverallScore: overallScore,
	}
}

// ComputeNonstandard mengembalikan header dari allHeaders yang tidak ada di sectionsDetected.
// Dipanggil setelah AnalyzeWithGroq untuk mengisi AIResult.SectionsNonstandard di Go,
// menggantikan deteksi nonstandar oleh AI yang rawan false positive.
func ComputeNonstandard(allHeaders, sectionsDetected []string) []string {
	detected := make(map[string]bool, len(sectionsDetected))
	for _, s := range sectionsDetected {
		detected[strings.ToLower(strings.TrimSpace(s))] = true
	}
	var nonstandard []string
	for _, h := range allHeaders {
		if !detected[strings.ToLower(strings.TrimSpace(h))] {
			nonstandard = append(nonstandard, h)
		}
	}
	return nonstandard
}

func jobTitleBonus(extractedTitles []string, jobPosition string) int {
	if len(extractedTitles) == 0 || jobPosition == "" {
		return 0
	}
	target := strings.ToLower(strings.TrimSpace(jobPosition))
	for _, t := range extractedTitles {
		title := strings.ToLower(strings.TrimSpace(t))
		if title == target {
			return 10
		}
		if strings.Contains(target, title) || strings.Contains(title, target) {
			return 5
		}
	}
	return 0
}

// GenerateFeedback menghasilkan teks umpan balik secara deterministik berdasarkan skor dan data AI
func GenerateFeedback(result *AIResult, scores ScoreResult) (format, content, keywords string) {
	// --- FeedbackKeywords ---
	var missingRequired, missingPreferred []string
	for _, kw := range result.Keywords {
		if !kw.FoundInCV {
			if kw.Weight == "required" {
				missingRequired = append(missingRequired, kw.Keyword)
			} else {
				missingPreferred = append(missingPreferred, kw.Keyword)
			}
		}
	}

	var kwBuf strings.Builder
	switch {
	case scores.KeywordScore >= 80:
		kwBuf.WriteString("Keyword CV kamu sangat kuat dan sudah mencakup hampir semua yang dibutuhkan job description.")
	case scores.KeywordScore >= 60:
		kwBuf.WriteString("Sebagian besar keyword penting sudah ada di CV kamu, namun masih ada beberapa yang perlu ditambahkan.")
	default:
		kwBuf.WriteString("CV kamu kekurangan banyak keyword penting dari job description. Perbaikan di area ini akan sangat meningkatkan skor ATS kamu.")
	}
	if len(missingRequired) > 0 {
		kwBuf.WriteString("\n\nKeyword wajib yang belum ditemukan: " + strings.Join(missingRequired, ", ") + ".")
	}
	if len(missingPreferred) > 0 {
		kwBuf.WriteString("\n\nKeyword pilihan yang bisa ditambahkan: " + strings.Join(missingPreferred, ", ") + ".")
	}
	keywords = kwBuf.String()

	// --- FeedbackFormat ---
	var fmtBuf strings.Builder
	switch {
	case scores.FormatScore >= 80:
		fmtBuf.WriteString("Format dan struktur CV kamu sudah sangat baik dan sesuai standar ATS.")
	case scores.FormatScore >= 60:
		fmtBuf.WriteString("Format CV kamu cukup baik, namun beberapa bagian masih bisa dioptimalkan untuk ATS.")
	default:
		fmtBuf.WriteString("Format CV kamu perlu perbaikan signifikan agar lebih mudah dibaca oleh sistem ATS.")
	}
	switch result.LanguageMix {
	case "mixed":
		fmtBuf.WriteString(" CV kamu menggunakan campuran Bahasa Indonesia dan Inggris — gunakan satu bahasa secara konsisten untuk hasil terbaik.")
	case "indonesian":
		fmtBuf.WriteString(" CV kamu ditulis dalam Bahasa Indonesia — pertimbangkan menggunakan Bahasa Inggris untuk meningkatkan kompatibilitas ATS internasional.")
	}
	if len(result.SectionsNonstandard) > 0 {
		fmtBuf.WriteString("\n\nSection berikut menggunakan nama non-standar yang mungkin tidak dikenali ATS: " +
			strings.Join(result.SectionsNonstandard, ", ") +
			". Pertimbangkan mengganti dengan nama standar seperti 'Work Experience', 'Education', atau 'Skills'.")
	}
	format = fmtBuf.String()

	// --- FeedbackContent ---
	var contentBuf strings.Builder

	// Knockout warning — tampilkan di awal jika pengalaman di bawah minimum JD
	if result.MinYearsRequired > 0 && result.YearsOfExperience < float64(result.MinYearsRequired) {
		contentBuf.WriteString(
			"⚠️ POTENSI KNOCKOUT: Posisi ini membutuhkan minimal " +
				itoa(result.MinYearsRequired) +
				" tahun pengalaman profesional, sementara CV kamu menunjukkan sekitar " +
				formatYears(result.YearsOfExperience) +
				" tahun. Banyak sistem ATS menggunakan persyaratan ini sebagai filter otomatis. " +
				"Pastikan semua pengalaman relevan sudah tercantum lengkap di CV kamu.\n\n",
		)
	}

	switch result.CandidateProfile {
	case "experienced":
		contentBuf.WriteString("Sebagai kandidat berpengalaman, pastikan setiap posisi yang pernah kamu jabat disertai pencapaian konkret yang terukur (angka, persentase, atau dampak bisnis). Tonjolkan pengalaman yang paling relevan dengan posisi yang dilamar di bagian teratas CV.")
	case "fresh_graduate":
		contentBuf.WriteString("Sebagai fresh graduate, fokuslah pada proyek akademis, magang, organisasi, dan sertifikasi yang relevan. Tunjukkan potensi dan kemampuan belajar kamu dengan menyertakan proyek nyata yang pernah kamu kerjakan dan teknologi yang kamu kuasai.")
	case "career_changer":
		contentBuf.WriteString("Sebagai kandidat yang beralih karier, jelaskan secara eksplisit bagaimana pengalaman sebelumnya relevan dengan posisi baru yang dilamar. Tambahkan section ringkasan (summary) di awal CV untuk menjembatani latar belakang kamu dengan tujuan karier baru.")
	default:
		contentBuf.WriteString("Pastikan CV kamu mencantumkan informasi yang relevan dengan posisi yang dilamar, disertai pencapaian konkret dan pengalaman yang terstruktur dengan jelas.")
	}
	content = contentBuf.String()

	return
}

func itoa(n int) string {
	return fmt.Sprintf("%d", n)
}

func formatYears(f float64) string {
	s := fmt.Sprintf("%.1f", f)
	// hilangkan ".0" untuk bilangan bulat agar lebih rapi
	if len(s) > 2 && s[len(s)-2:] == ".0" {
		return s[:len(s)-2]
	}
	return s
}
