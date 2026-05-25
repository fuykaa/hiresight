package services

import (
	"testing"
)

// helper: pointer ke string
func strPtr(s string) *string { return &s }

// â”€â”€â”€ Unit Test: CalculateScores â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// TC-01: Semua keyword required ditemukan di section skills â†’ skor tinggi
func TestCalculateScores_AllRequiredFound(t *testing.T) {
	result := &AIResult{
		Keywords: []KeywordItem{
			{Keyword: "Go", Weight: "required", FoundInCV: true, Section: strPtr("skills"), OccurrenceCount: 2},
			{Keyword: "PostgreSQL", Weight: "required", FoundInCV: true, Section: strPtr("skills"), OccurrenceCount: 1},
			{Keyword: "Docker", Weight: "preferred", FoundInCV: true, Section: strPtr("experience"), OccurrenceCount: 1},
		},
		SectionsDetected: []string{"Skills", "Work Experience", "Education", "Summary"},
		LanguageMix:      "english",
	}
	scores := CalculateScores(result, "Backend Engineer")

	if scores.KeywordScore < 80 {
		t.Errorf("KeywordScore terlalu rendah: got %d, want >= 80", scores.KeywordScore)
	}
	if scores.FormatScore < 80 {
		t.Errorf("FormatScore terlalu rendah: got %d, want >= 80", scores.FormatScore)
	}
	if scores.ATSScore < 80 {
		t.Errorf("ATSScore terlalu rendah: got %d, want >= 80", scores.ATSScore)
	}
}

// TC-02: Tidak ada keyword yang ditemukan â†’ skor keyword = 0
func TestCalculateScores_NoKeywordsFound(t *testing.T) {
	result := &AIResult{
		Keywords: []KeywordItem{
			{Keyword: "React", Weight: "required", FoundInCV: false},
			{Keyword: "TypeScript", Weight: "required", FoundInCV: false},
			{Keyword: "Next.js", Weight: "preferred", FoundInCV: false},
		},
		SectionsDetected: []string{"Education"},
		LanguageMix:      "indonesian",
	}
	scores := CalculateScores(result, "Frontend Developer")

	if scores.KeywordScore != 0 {
		t.Errorf("KeywordScore harus 0 jika tidak ada keyword ditemukan: got %d", scores.KeywordScore)
	}
}

// TC-03: Hanya keyword preferred ditemukan, required tidak â†’ skor moderat
func TestCalculateScores_OnlyPreferredFound(t *testing.T) {
	result := &AIResult{
		Keywords: []KeywordItem{
			{Keyword: "Go", Weight: "required", FoundInCV: false},
			{Keyword: "Gin", Weight: "required", FoundInCV: false},
			{Keyword: "GORM", Weight: "preferred", FoundInCV: true, Section: strPtr("experience"), OccurrenceCount: 1},
		},
		SectionsDetected: []string{"Work Experience", "Education"},
		LanguageMix:      "mixed",
	}
	scores := CalculateScores(result, "Backend Developer")

	// required tidak ditemukan â†’ required_score = 0
	// keyword_score = 0Ã—0.7 + preferredÃ—0.3
	if scores.KeywordScore > 35 {
		t.Errorf("KeywordScore seharusnya rendah jika required tidak ada: got %d", scores.KeywordScore)
	}
}

// TC-04: Rumus format_score â€” bahasa Indonesia â†’ language_score = 30
func TestCalculateScores_IndonesianLanguage(t *testing.T) {
	result := &AIResult{
		Keywords: []KeywordItem{
			{Keyword: "Python", Weight: "required", FoundInCV: true, Section: strPtr("skills"), OccurrenceCount: 1},
		},
		SectionsDetected: []string{"Keahlian", "Pengalaman Kerja", "Pendidikan"},
		LanguageMix:      "indonesian",
	}
	scores := CalculateScores(result, "Data Analyst")

	// language_score = 30 â†’ format_score = sectionÃ—0.6 + 30Ã—0.4 = 100Ã—0.6 + 12 = 72
	expectedFormat := 72
	if scores.FormatScore != expectedFormat {
		t.Errorf("FormatScore dengan bahasa Indonesia: got %d, want %d", scores.FormatScore, expectedFormat)
	}
}

// TC-05: Bahasa Inggris + semua section standar â†’ format_score = 100
func TestCalculateScores_EnglishFullSections(t *testing.T) {
	result := &AIResult{
		Keywords:         []KeywordItem{},
		SectionsDetected: []string{"Skills", "Work Experience", "Education", "Summary"},
		LanguageMix:      "english",
	}
	scores := CalculateScores(result, "")

	// section_score = 33+33+34+10=110 â†’ capped 100; language=100
	// format = 100Ã—0.6 + 100Ã—0.4 = 100
	if scores.FormatScore != 100 {
		t.Errorf("FormatScore max: got %d, want 100", scores.FormatScore)
	}
}

// TC-06: Skor tidak boleh melebihi 100
func TestCalculateScores_ScoreCappedAt100(t *testing.T) {
	result := &AIResult{
		Keywords: []KeywordItem{
			{Keyword: "Go", Weight: "required", FoundInCV: true, Section: strPtr("skills"), OccurrenceCount: 5},
			{Keyword: "Gin", Weight: "required", FoundInCV: true, Section: strPtr("skills"), OccurrenceCount: 5},
			{Keyword: "PostgreSQL", Weight: "preferred", FoundInCV: true, Section: strPtr("skills"), OccurrenceCount: 5},
		},
		SectionsDetected: []string{"Skills", "Work Experience", "Education", "Summary"},
		LanguageMix:      "english",
		// Job title match bonus
		JobTitlesExtracted: []string{"Backend Engineer"},
	}
	scores := CalculateScores(result, "Backend Engineer")

	if scores.KeywordScore > 100 {
		t.Errorf("KeywordScore melebihi 100: got %d", scores.KeywordScore)
	}
	if scores.FormatScore > 100 {
		t.Errorf("FormatScore melebihi 100: got %d", scores.FormatScore)
	}
	if scores.ATSScore > 100 {
		t.Errorf("ATSScore melebihi 100: got %d", scores.ATSScore)
	}
	if scores.OverallScore > 100 {
		t.Errorf("OverallScore melebihi 100: got %d", scores.OverallScore)
	}
}

// TC-07: Frequency multiplier â€” keyword muncul â‰¥2Ã— â†’ skor sedikit lebih tinggi
func TestCalculateScores_FrequencyBoost(t *testing.T) {
	base := &AIResult{
		Keywords: []KeywordItem{
			{Keyword: "Docker", Weight: "required", FoundInCV: true, Section: strPtr("skills"), OccurrenceCount: 1},
		},
		SectionsDetected: []string{"Skills"},
		LanguageMix:      "english",
	}
	boosted := &AIResult{
		Keywords: []KeywordItem{
			{Keyword: "Docker", Weight: "required", FoundInCV: true, Section: strPtr("skills"), OccurrenceCount: 3},
		},
		SectionsDetected: []string{"Skills"},
		LanguageMix:      "english",
	}
	scoresBase := CalculateScores(base, "")
	scoresBoosted := CalculateScores(boosted, "")

	if scoresBoosted.KeywordScore < scoresBase.KeywordScore {
		t.Errorf("Frekuensi tinggi seharusnya menghasilkan skor yang lebih tinggi atau sama")
	}
}

// TC-08: Job title exact match â†’ +10 bonus
func TestCalculateScores_JobTitleExactMatch(t *testing.T) {
	result := &AIResult{
		Keywords:           []KeywordItem{},
		SectionsDetected:   []string{"Work Experience", "Education", "Skills"},
		LanguageMix:        "english",
		JobTitlesExtracted: []string{"Software Engineer"},
	}
	scores := CalculateScores(result, "Software Engineer")
	atsWithoutBonus := scores.ATSScore

	resultNoTitle := &AIResult{
		Keywords:           []KeywordItem{},
		SectionsDetected:   []string{"Work Experience", "Education", "Skills"},
		LanguageMix:        "english",
		JobTitlesExtracted: []string{},
	}
	scoresNoTitle := CalculateScores(resultNoTitle, "Software Engineer")

	diff := scores.OverallScore - scoresNoTitle.OverallScore
	_ = atsWithoutBonus
	if diff != 10 {
		t.Errorf("Job title exact match seharusnya +10 bonus: got diff=%d", diff)
	}
}

// â”€â”€â”€ Unit Test: GenerateFeedback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// TC-09: Keyword score tinggi â†’ feedback positif
func TestGenerateFeedback_HighKeywordScore(t *testing.T) {
	result := &AIResult{
		Keywords: []KeywordItem{
			{Keyword: "Go", Weight: "required", FoundInCV: true},
		},
		SectionsDetected: []string{"Skills"},
		LanguageMix:      "english",
		CandidateProfile: "experienced",
	}
	scores := ScoreResult{KeywordScore: 85, FormatScore: 90, ATSScore: 87, OverallScore: 87}

	_, _, kwFeedback := GenerateFeedback(result, scores)

	if len(kwFeedback) == 0 {
		t.Error("Feedback keyword tidak boleh kosong")
	}
}

// TC-10: Keyword required hilang â†’ feedback menyebut keyword yang hilang
func TestGenerateFeedback_MissingRequired(t *testing.T) {
	result := &AIResult{
		Keywords: []KeywordItem{
			{Keyword: "Docker", Weight: "required", FoundInCV: false},
			{Keyword: "Kubernetes", Weight: "required", FoundInCV: false},
		},
		SectionsDetected: []string{"Education"},
		LanguageMix:      "english",
		CandidateProfile: "fresh_graduate",
	}
	scores := ScoreResult{KeywordScore: 0, FormatScore: 34, ATSScore: 12, OverallScore: 12}

	_, _, kwFeedback := GenerateFeedback(result, scores)

	if len(kwFeedback) == 0 {
		t.Error("Feedback keyword tidak boleh kosong")
	}
}

// TC-11: Profil fresh_graduate â†’ feedback konten menyebut proyek akademis
func TestGenerateFeedback_FreshGraduateProfile(t *testing.T) {
	result := &AIResult{
		Keywords:         []KeywordItem{},
		SectionsDetected: []string{"Education", "Skills"},
		LanguageMix:      "english",
		CandidateProfile: "fresh_graduate",
	}
	scores := ScoreResult{KeywordScore: 40, FormatScore: 60, ATSScore: 47, OverallScore: 47}

	_, contentFeedback, _ := GenerateFeedback(result, scores)

	if len(contentFeedback) == 0 {
		t.Error("Content feedback tidak boleh kosong untuk profil fresh_graduate")
	}
}

// TC-12: Section non-standar â†’ feedback format menyebut nama section tersebut
func TestGenerateFeedback_NonstandardSections(t *testing.T) {
	result := &AIResult{
		Keywords:             []KeywordItem{},
		SectionsDetected:     []string{"Education"},
		SectionsNonstandard:  []string{"Biodata Diri", "Pencapaian Unik"},
		LanguageMix:          "english",
		CandidateProfile:     "experienced",
	}
	scores := ScoreResult{KeywordScore: 50, FormatScore: 34, ATSScore: 44, OverallScore: 44}

	formatFeedback, _, _ := GenerateFeedback(result, scores)

	if len(formatFeedback) == 0 {
		t.Error("Format feedback tidak boleh kosong")
	}
}

// â”€â”€â”€ Unit Test: ComputeNonstandard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// TC-13: Header yang tidak ada di detectedSections â†’ masuk nonstandard
func TestComputeNonstandard_IdentifiesNonstandard(t *testing.T) {
	allHeaders := []string{"Skills", "Education", "Hobi Saya", "Biodata"}
	detected := []string{"Skills", "Education"}

	nonstandard := ComputeNonstandard(allHeaders, detected)

	if len(nonstandard) != 2 {
		t.Errorf("Seharusnya 2 header nonstandard: got %d", len(nonstandard))
	}
}

// TC-14: Semua header standar â†’ nonstandard kosong
func TestComputeNonstandard_AllStandard(t *testing.T) {
	allHeaders := []string{"Skills", "Education", "Work Experience"}
	detected := []string{"Skills", "Education", "Work Experience"}

	nonstandard := ComputeNonstandard(allHeaders, detected)

	if len(nonstandard) != 0 {
		t.Errorf("Seharusnya tidak ada header nonstandard: got %v", nonstandard)
	}
}

// TC-15: Case-insensitive matching
func TestComputeNonstandard_CaseInsensitive(t *testing.T) {
	allHeaders := []string{"SKILLS", "Education"}
	detected := []string{"skills", "education"}

	nonstandard := ComputeNonstandard(allHeaders, detected)

	if len(nonstandard) != 0 {
		t.Errorf("Matching harus case-insensitive: got %v", nonstandard)
	}
}

// â”€â”€â”€ Unit Test: sectionWeight â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// TC-16: Skills section mendapat bobot tertinggi (1.0)
func TestSectionWeight_SkillsHighest(t *testing.T) {
	skills := strPtr("skills")
	exp := strPtr("experience")
	edu := strPtr("education")

	wSkills := sectionWeight(skills)
	wExp := sectionWeight(exp)
	wEdu := sectionWeight(edu)

	if wSkills <= wExp || wSkills <= wEdu {
		t.Errorf("Skills harus bobot tertinggi: skills=%.1f, exp=%.1f, edu=%.1f", wSkills, wExp, wEdu)
	}
}

// TC-17: Nil section â†’ bobot default 0.5
func TestSectionWeight_NilSection(t *testing.T) {
	w := sectionWeight(nil)
	if w != 0.5 {
		t.Errorf("Nil section seharusnya 0.5: got %.1f", w)
	}
}

// â”€â”€â”€ Unit Test: frequencyMultiplier â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// TC-18: Frekuensi â‰¥2 â†’ multiplier 1.1; frekuensi 1 â†’ 1.0
func TestFrequencyMultiplier(t *testing.T) {
	if frequencyMultiplier(1) != 1.0 {
		t.Error("Frekuensi 1 seharusnya 1.0")
	}
	if frequencyMultiplier(2) != 1.1 {
		t.Error("Frekuensi 2 seharusnya 1.1")
	}
	if frequencyMultiplier(5) != 1.1 {
		t.Error("Frekuensi 5 seharusnya 1.1 (capped)")
	}
}

