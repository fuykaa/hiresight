package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
)

type KeywordItem struct {
	Keyword         string  `json:"keyword"`
	Weight          string  `json:"weight"`
	FoundInCV       bool    `json:"found_in_cv"`
	Section         *string `json:"section"`
	OccurrenceCount int     `json:"occurrence_count"`
}

type AIResult struct {
	CandidateProfile    string        `json:"candidate_profile"`
	Keywords            []KeywordItem `json:"keywords"`
	SectionsDetected    []string      `json:"sections_detected"`
	SectionsNonstandard []string      `json:"sections_nonstandard"`
	LanguageMix         string        `json:"language_mix"`
	JobTitlesExtracted  []string      `json:"job_titles_extracted"`
	AllHeadersDetected  []string      `json:"all_headers_detected"`
	MinYearsRequired    int           `json:"min_years_required"`
	YearsOfExperience   float64       `json:"years_of_experience"`
}

const groqModel    = "llama-3.3-70b-versatile"
const groqEndpoint = "https://api.groq.com/openai/v1/chat/completions"

const promptTemplate = `Kamu adalah sistem ATS (Applicant Tracking System) analyzer untuk pasar Indonesia.

## TUGAS 1 — Ekstrak keyword dari Job Description

Ambil keyword PERSIS seperti tertulis di JD. Jangan parafrase, jangan generalisasi.
Contoh benar: "Next.js", "Docker", "REST API"
Contoh salah: "programming logic", "web framework", "containerization" (terlalu umum/tidak ada di JD)

Klasifikasi keyword:
- "required" jika ada frasa: "wajib", "minimal", "must have", "harus", "dibutuhkan", "required", "minimum qualifications"
- "preferred" jika ada frasa: "diutamakan", "nilai plus", "nice to have", "lebih disukai", "preferred", "ideally"
- Jika tidak ada frasa klasifikasi → default "preferred"

## TUGAS 2 — Cek keyword di CV

Cek apakah setiap keyword ditemukan secara eksplisit di CV. Kenali padanan resmi Indonesia-Inggris:
- "Pengembangan Perangkat Lunak" = "Software Development"
- "Manajemen Proyek" = "Project Management"
- Akronim resmi: "ML" = "Machine Learning", "UI/UX" = "User Interface/User Experience"

Jangan tandai found=true jika hanya ada konsep umum yang tidak spesifik.
Catat di section mana keyword itu ditemukan: "skills", "experience", "education", "summary", atau null.
Hitung berapa kali keyword (atau padanan resminya) muncul di SELURUH CV — di semua section. Kembalikan di field "occurrence_count".
Jika found_in_cv=false, occurrence_count=0. Jika found=true tapi hanya 1 kali, occurrence_count=1.

## TUGAS 3 — Tentukan candidate_profile

Gunakan kriteria ketat berikut:

"experienced":
- Ada pengalaman kerja PROFESIONAL (full-time, part-time, atau kontrak, BUKAN magang/PKL)
- Durasi ≥ 1 tahun total, relevan dengan bidang JD
- Contoh: Software Engineer 2 tahun di perusahaan, Backend Developer freelance 1.5 tahun

"fresh_graduate":
- Mahasiswa aktif, atau lulus ≤ 2 tahun tanpa pengalaman kerja profesional
- Atau pengalamannya HANYA berupa: magang/PKL (< 6 bulan), asisten lab/dosen, proyek kampus, organisasi kemahasiswaan
- Contoh: mahasiswa S1 dengan proyek GitHub dan sertifikat online

"career_changer":
- Ada pengalaman kerja profesional ≥ 1 tahun, TAPI di bidang yang berbeda dari JD
- Contoh: mantan guru yang melamar posisi developer, akuntan yang melamar posisi data analyst

## TUGAS 4 — Ekstrak jabatan dari CV

Ambil semua jabatan/posisi pernah dipegang dari section Experience CV (hanya pekerjaan profesional, bukan kegiatan kampus).
Jika tidak ada pengalaman kerja profesional, kembalikan array kosong [].

## TUGAS 5 — Deteksi section header dan bahasa

TUGAS 5A — sections_detected (whitelist only):
Scan CV untuk baris yang terlihat seperti section header (baris pendek yang berdiri sendiri sebagai judul kategori).
Masukkan ke sections_detected HANYA yang namanya ADA dalam whitelist berikut (pencocokan case-insensitive):

Skills, Keahlian, Kemampuan, Keterampilan, Kompetensi,
Work Experience, Experience, Pengalaman Kerja, Pengalaman, Riwayat Pekerjaan,
Education, Pendidikan, Riwayat Pendidikan,
Summary, Profile, Profil, Ringkasan, Tentang Saya,
Certifications, Sertifikasi, Sertifikat,
Projects, Proyek, Portofolio,
Organizations, Organisasi, Pengalaman Organisasi, Kegiatan Organisasi, Aktivitas,
Awards, Penghargaan, Prestasi,
Languages, Bahasa,
Volunteer, Volunter, Pengabdian Masyarakat,
Interests, Hobbies, Minat

TUGAS 5B — all_headers_detected (semua header, tanpa filter):
Masukkan ke all_headers_detected SEMUA baris yang terlihat seperti section header di CV — termasuk yang tidak ada di whitelist di atas. Ini digunakan sistem untuk mendeteksi section nonstandar.
Ingat: baris yang mengandung tahun, nama organisasi spesifik, nama acara, atau nama proyek BUKAN section header.

TUGAS 5C — sections_nonstandard:
SELALU kembalikan array kosong: "sections_nonstandard": []
Sistem akan menghitung ini secara terpisah di Go.

TUGAS 5D — language_mix:
Deteksi dominasi bahasa CV secara keseluruhan.

## TUGAS 6 — Ekstrak informasi pengalaman kerja

TUGAS 6A — min_years_required (dari JD):
Cari frasa seperti "minimal X tahun", "minimum X years", "at least X years", "X+ years experience", "pengalaman minimal X tahun".
Kembalikan angka integer dari frasa tersebut. Jika tidak ada persyaratan eksplisit → kembalikan 0.
Contoh: "minimal 2 tahun pengalaman" → 2; "5+ years of experience" → 5; tidak ada persyaratan → 0

TUGAS 6B — years_of_experience (dari CV):
Hitung total tahun pengalaman kerja PROFESIONAL dari CV (full-time, part-time, kontrak — BUKAN magang/PKL, organisasi kampus).
Gabungkan semua periode kerja profesional, estimasi boleh jika tanggal tidak lengkap.
Jika tidak ada pengalaman profesional → kembalikan 0.
Kembalikan angka float dengan satu desimal (contoh: 1.5, 3.0, 0.5).

---

Balas HANYA dengan JSON berikut. Tidak ada teks lain, tidak ada markdown:
{
  "candidate_profile": "experienced" | "fresh_graduate" | "career_changer",
  "keywords": [
    {
      "keyword": "nama keyword persis dari JD",
      "weight": "required" | "preferred",
      "found_in_cv": true | false,
      "section": "skills" | "experience" | "education" | "summary" | null,
      "occurrence_count": 2
    }
  ],
  "sections_detected": ["Skills", "Education"],
  "sections_nonstandard": [],
  "all_headers_detected": ["Skills", "Education", "Perjalanan Karirku"],
  "language_mix": "english" | "indonesian" | "mixed",
  "job_titles_extracted": ["Software Engineer", "Frontend Developer"],
  "min_years_required": 2,
  "years_of_experience": 1.5
}

CV:
%s

Job Description:
%s`

type groqRequest struct {
	Model    string        `json:"model"`
	Messages []groqMessage `json:"messages"`
}

type groqMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type groqResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func AnalyzeWithGroq(cvText, jdText string) (*AIResult, error) {
	apiKey := os.Getenv("GROQ_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GROQ_API_KEY tidak ditemukan di environment")
	}

	prompt := fmt.Sprintf(promptTemplate, cvText, jdText)

	reqBody := groqRequest{
		Model:    groqModel,
		Messages: []groqMessage{{Role: "user", Content: prompt}},
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("gagal marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", groqEndpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("gagal membuat HTTP request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("gagal kirim request ke Groq: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Groq API error %d: %s", resp.StatusCode, string(body))
	}

	var groqResp groqResponse
	if err := json.NewDecoder(resp.Body).Decode(&groqResp); err != nil {
		return nil, fmt.Errorf("gagal decode response Groq: %w", err)
	}

	if len(groqResp.Choices) == 0 {
		return nil, fmt.Errorf("Groq tidak mengembalikan hasil")
	}

	rawJSON := strings.TrimSpace(groqResp.Choices[0].Message.Content)

	// Strip markdown code block jika Groq membungkus response dengan ```json ... ```
	if strings.HasPrefix(rawJSON, "```") {
		if idx := strings.Index(rawJSON, "\n"); idx != -1 {
			rawJSON = rawJSON[idx+1:]
		}
		rawJSON = strings.TrimSpace(strings.TrimSuffix(strings.TrimSpace(rawJSON), "```"))
	}

	var result AIResult
	if err := json.Unmarshal([]byte(rawJSON), &result); err != nil {
		return nil, fmt.Errorf("gagal parse JSON dari Groq: %w", err)
	}

	return &result, nil
}
