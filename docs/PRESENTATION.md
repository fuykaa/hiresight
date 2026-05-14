# HireSight — AI ATS Analysis: Technical Overview

> Dokumen ini ditujukan untuk anggota tim dan reviewer/senior yang mengaudit proyek ini.
> Mencakup latar belakang, keputusan teknis, algoritma, dan status implementasi.

---

## 1. Latar Belakang

### Masalah

Proses melamar kerja di Indonesia memiliki satu hambatan yang jarang dibicarakan: banyak CV yang
tidak pernah dibaca manusia karena sudah tersaring di tahap screening awal — baik oleh ATS
(Applicant Tracking System) maupun oleh recruiter yang melakukan boolean keyword search secara manual.

Masalahnya: **kandidat tidak mendapat feedback apapun.** CV ditolak tanpa penjelasan, dan kandidat
tidak tahu apakah masalahnya di keyword, format, pengalaman, atau hal lain.

Tools yang tersedia saat ini punya dua kelemahan besar:
- **Tools internasional** (Jobscan, Resume Worded) tidak memahami konteks Indonesia: section header
  Bahasa Indonesia tidak dikenali, bilingual CV dianggap cacat, dan saran tidak relevan untuk
  pasar kerja lokal.
- **Layanan lokal** yang ada umumnya hanya memberikan saran generik, tidak berbasis job description
  spesifik yang dilamar.

### Solusi: HireSight

HireSight menganalisis CV **berbasis job description spesifik** yang diinputkan user, bukan
analisis generik. Output yang dihasilkan:

- Skor ATS dan keyword match yang dapat dijelaskan (explainable)
- Daftar keyword yang ditemukan dan yang hilang, dengan klasifikasi wajib vs. diutamakan
- Feedback tertulis yang disesuaikan dengan profil kandidat (fresh graduate, berpengalaman,
  atau career changer)
- Deteksi section header non-standar yang mungkin tidak terbaca parser ATS

---

## 2. Arsitektur Sistem

### Stack

| Layer     | Teknologi                                          |
|-----------|----------------------------------------------------|
| Backend   | Go 1.25, Gin 1.12, GORM 1.31, PostgreSQL           |
| Frontend  | Next.js (App Router), React, Tailwind, shadcn/ui   |
| AI        | Groq API — `llama-3.3-70b-versatile`               |
| Auth      | JWT via cookie `token`                             |

### Alur Kerja Tingkat Tinggi

```
USER                    FRONTEND               BACKEND                AI (Groq)
 │                          │                      │                      │
 │── upload PDF + JD ──────>│                      │                      │
 │                          │── POST /resume/upload>│                      │
 │                          │<── {resume_id} ───────│                      │
 │                          │                      │                      │
 │                          │── POST /analysis/:id >│                      │
 │                          │<── 202 Accepted ──────│                      │
 │                          │                      │                      │
 │                          │                      │ [goroutine async]     │
 │                          │                      │── extractPDFText      │
 │                          │                      │── AnalyzeWithGroq ───>│
 │                          │                      │                      │ ekstrak fakta
 │                          │                      │<── AIResult ──────────│ (keyword, section,
 │                          │                      │                      │  profile, language)
 │                          │                      │ CalculateScores()     │
 │                          │                      │ GenerateFeedback()    │
 │                          │                      │ simpan ke DB          │
 │                          │                      │                      │
 │                          │── GET /analysis/:id ─>│ ← polling 2 detik   │
 │                          │<── {status: completed}│                      │
 │                          │                      │                      │
 │<── tampilkan result ─────│                      │                      │
```

### Pemisahan Tanggung Jawab

Keputusan arsitektur terpenting adalah **memisahkan peran AI dari scoring**:

```
AI (Groq)          →  hanya ekstraksi fakta  →  AIResult (struct Go)
Go (scorer.go)     →  hitung semua skor      →  deterministik, reproducible
Go (scorer.go)     →  hasilkan semua feedback →  deterministik, tidak memanggil AI
```

AI tidak pernah menghasilkan angka atau teks feedback secara langsung. Ia hanya menjawab
pertanyaan faktual: *"Apakah keyword X ada di CV ini?"*, *"Di section mana?"*,
*"Apakah kandidat ini fresh graduate atau berpengalaman?"*

---

## 3. Keputusan Teknis Utama

### Deterministik vs. AI untuk Scoring

**Yang dipilih:** Scoring dan feedback sepenuhnya deterministik di Go (`scorer.go`).

**Alternatif yang ditolak:** Meminta AI langsung menghasilkan skor dan teks feedback.

**Alasan:**

| Kriteria           | AI Scoring              | Deterministik (dipilih)        |
|--------------------|-------------------------|--------------------------------|
| Konsistensi        | CV yang sama bisa dapat skor berbeda tiap run | Selalu menghasilkan skor yang sama |
| Explainability     | "AI bilang skormu 72" — tidak bisa dijelaskan | Setiap poin skor bisa ditelusuri ke formula |
| Auditability       | Tidak bisa diverifikasi | Kode bisa dibaca dan diuji     |
| Biaya              | Token lebih banyak       | Tidak ada biaya tambahan       |
| Risiko hallucination | Tinggi untuk angka      | Nol — angka berasal dari kode  |

### Groq vs. Provider LLM Lain

**Yang dipilih:** Groq (`llama-3.3-70b-versatile`)

| Kriteria       | OpenAI GPT-4o         | Gemini 1.5 Pro        | Groq llama-3.3-70b (dipilih) |
|----------------|-----------------------|-----------------------|------------------------------|
| Kecepatan      | ~3–8 detik            | ~3–6 detik            | <1–2 detik (inferensi hardware khusus) |
| Biaya          | Relatif mahal         | Ada free tier terbatas | Free tier cukup untuk development |
| Format API     | OpenAI-compatible     | Berbeda               | OpenAI-compatible — mudah diganti |
| Kualitas JSON  | Baik                  | Baik                  | Baik, kadang perlu strip markdown |

Groq dipilih terutama karena kecepatan — analisis CV adalah operasi yang user tunggu secara
aktif (polling), sehingga latensi AI langsung mempengaruhi UX.

### Async Goroutine vs. Endpoint Sinkronus

**Yang dipilih:** POST `/api/analysis` selalu 202 Accepted, analisis berjalan di goroutine,
frontend polling setiap 2 detik.

**Alasan:** Analisis satu CV bisa memakan waktu 3–10 detik (ekstraksi PDF + Groq API + DB write).
Jika sinkronus, ini mendekati atau melampaui batas timeout HTTP default di beberapa konfigurasi,
dan UX terasa *frozen*. Dengan polling, user melihat status real-time dan bisa menutup tab
tanpa membatalkan analisis.

### Section-Aware Keyword Weighting vs. Flat Binary Match

**Yang dipilih:** Bobot berbeda per section (v2), menggantikan sistem biner found=1/not found=0 (v1).

**Alasan:** Riset ATS (paper MSLEF, arXiv:2509.06200 dan data Jobscan) mengonfirmasi bahwa
keyword yang ditemukan di section Skills/Summary lebih relevan untuk ATS daripada keyword yang
hanya muncul di Education. Sistem v1 memberikan skor yang sama untuk keduanya — tidak akurat.

---

## 4. Algoritma Scoring (v3)

Semua perhitungan ada di `internal/services/scorer.go`. Sumber bobot: `docs/ATS_RESEARCH.md`
berdasarkan literatur akademis IEEE/ACM/Elsevier dan data vendor ATS.

### Langkah-Langkah Scoring

```
PDF CV + Job Description
        │
        ▼
[Step 0] extractPDFText()
   Ekstrak teks mentah dari PDF (hanya text-based, min. 100 karakter)
        │
        ▼
[Step 1 — AI] AnalyzeWithGroq()
   Ekstrak fakta: keyword[], sections_detected (whitelist),
   all_headers_detected (semua), candidate_profile, language_mix, job_titles_extracted
        │
        ▼
[Step 1b — Go] ComputeNonstandard(allHeaders, sectionsDetected)
   sections_nonstandard = all_headers_detected − sections_detected
   (deterministik, tidak bisa dipengaruhi halusinasi AI)
        │
        ▼
[Step 2] Section Weight per keyword yang ditemukan
   skills/summary → 1.0 | experience → 0.8 | education → 0.6 | null → 0.5
        │
        ▼
[Step 3] keyword_score  ──┐
[Step 4] format_score   ──┤──► ats_score
                          │
[Step 5] job_title_bonus──┘──► overall_score
```

### Tabel Section Weight

| Section tempat keyword ditemukan | Bobot (`w`) | Dasar |
|----------------------------------|-------------|-------|
| `skills` atau `summary`          | 1.0         | Keyword aktif, langsung terlihat recruiter |
| `experience`                     | 0.8         | Relevan tapi mungkin sudah lama |
| `education`                      | 0.6         | Kurang relevan untuk hard skills |
| `null` / tidak terdeteksi        | 0.5         | Tidak bisa diverifikasi sectionnya |

### Formula Lengkap

```
keyword_score = (Σ w_required_found / N_required × 70)
              + (Σ w_preferred_found / N_preferred × 30)

section_score = (Skills∈detected  ? 33 : 0)      ← Yu et al. (ACL 2005) + Oracle Taleo
              + (Experience∈detected ? 33 : 0)    ← diperluas: Organisasi, Kepanitiaan, Aktivitas
              + (Education∈detected  ? 34 : 0)
              + (Summary∈detected    ? 10 : 0)    ← bonus praktis, tanpa syarat
              capped at 100
              sections_nonstandard → TIDAK masuk skor, hanya ditampilkan di feedback

format_score  = (section_score × 0.60) + (language_score × 0.40)
                  english=100, mixed=60, indonesian=30

ats_score     = keyword_score × 0.65 + format_score × 0.35

overall_score = min(100, ats_score + job_title_bonus)
                job_title_bonus: exact match=+10, partial match=+5, tidak match=0
```

### Contoh End-to-End

**Skenario:** Fresh graduate melamar posisi "Backend Developer".

JD punya 6 keyword required (Go, Docker, REST API, PostgreSQL, Git, Linux) dan 2 keyword
preferred (Kubernetes, Redis).

CV mengandung:
- Go → ditemukan di `skills` (w=1.0) ✓
- REST API → ditemukan di `experience` (w=0.8) ✓
- Git → ditemukan di `education` (w=0.6) ✓
- Docker, PostgreSQL, Linux → tidak ditemukan
- Kubernetes, Redis → tidak ditemukan
- Jabatan di CV: tidak ada (fresh graduate)

```
required_found  = 1.0 + 0.8 + 0.6 = 2.4
required_total  = 6
required_score  = 2.4 / 6 × 100 = 40

preferred_found = 0
preferred_score = 0

keyword_score   = (40 × 0.70) + (0 × 0.30) = 28
```

CV punya section: Education, Skills, Experience, Projects. Bahasa Inggris.

```
section_score:
  Skills    ✓ → +33
  Experience✓ → +33
  Education ✓ → +34
  Summary     → tidak ada, tidak ada bonus
  Projects    → tidak masuk grup manapun, tidak dihitung
  total = 100, cap = 100

language_score  = 100
format_score    = (100 × 0.60) + (100 × 0.40) = 100
```

```
ats_score       = (28 × 0.65) + (100 × 0.35) = 18.2 + 35 = 53
job_title_bonus = 0 (fresh graduate, tidak ada jabatan)
overall_score   = 53
```

Output feedback: kandidat diberi tahu Docker, PostgreSQL, Linux adalah keyword wajib yang hilang,
dan konten feedback disesuaikan ke profil `fresh_graduate`.

---

## 5. Konteks Indonesia

### Realita ATS di Pasar Kerja Indonesia

Berdasarkan data Jobstreet by SEEK 2024:
- Hanya **20% perusahaan Indonesia** menggunakan AI dalam rekrutmen
- **76% dari 20% itu** menggunakannya untuk screening kandidat
- Mayoritas "ATS" Indonesia = **database dengan boolean keyword search** yang dioperasikan
  recruiter manusia secara manual

**Implikasi penting:** Exact-match keyword bahkan *lebih* krusial di Indonesia dibanding
di pasar yang sudah fully automated. Recruiter yang search `"Go" AND "Docker"` tidak akan
menemukan CV yang hanya menyebut "container technology" tanpa kata Docker.

### Masalah CV Tradisional Indonesia

Format CV tradisional Indonesia mengandung elemen yang bermasalah untuk ATS:

| Elemen | Masalah ATS |
|--------|-------------|
| Foto di CV | Parser tidak bisa membaca gambar |
| Tabel dua kolom | Teks terbaca acak/scrambled oleh parser |
| Campuran Indonesia-Inggris | Beberapa keyword tidak cocok dengan query |
| Agama, status pernikahan, golongan darah | Tidak relevan, membuang ruang |
| Section header non-standar | Konten di dalamnya tidak terdeteksi |

HireSight mendeteksi dan menginformasikan masalah-masalah ini tanpa memaksa user
mengubah gaya CV mereka.

### Bilingual Matching

HireSight menginstruksikan AI untuk mengenali padanan resmi Indonesia-Inggris:

| Indonesia | Inggris |
|-----------|---------|
| Manajemen Proyek | Project Management |
| Pengembangan Perangkat Lunak | Software Development |
| Layanan Pelanggan | Customer Service |
| Memimpin tim | Team Leadership |
| ML, UI/UX, SE | Machine Learning, User Interface/Experience, Software Engineering |

Ini adalah keunggulan HireSight dibanding tools internasional yang akan menganggap CV
berbahasa Indonesia sebagai CV tanpa keyword sama sekali.

### Section Header Indonesia

Prompt AI secara eksplisit mengenali header Bahasa Indonesia sebagai standar:

| ATS Standard   | Diterima sebagai standar di HireSight                             |
|----------------|-------------------------------------------------------------------|
| Skills         | Keahlian, Kemampuan, Keterampilan, Kompetensi                     |
| Work Experience| Pengalaman Kerja, Pengalaman, Riwayat Pekerjaan                   |
| Education      | Pendidikan, Riwayat Pendidikan                                    |
| Organizations  | Organisasi, Pengalaman Organisasi, Kegiatan Organisasi, Aktivitas |
| Awards         | Penghargaan, Prestasi                                             |

---

## 6. Status Implementasi

### Yang Sudah Berjalan

| Fitur | Status |
|-------|--------|
| Upload CV (PDF) + job description + posisi | ✅ Berjalan |
| Analisis async (goroutine + polling) | ✅ Berjalan |
| AI ekstraksi fakta via Groq | ✅ Berjalan |
| Scoring v3 (presence-based format + whitelist section + job title bonus) | ✅ Berjalan |
| Feedback deterministik (keywords, format, content) | ✅ Berjalan |
| Klasifikasi candidate_profile | ✅ Berjalan |
| Halaman result (skor + keyword list + feedback) | ✅ Berjalan |
| Daftar resume dengan status analisis | ✅ Berjalan |
| Autentikasi JWT + route guard | ✅ Berjalan |
| Keamanan: validasi kepemilikan resume saat GET result | ✅ Berjalan |
| Dashboard stats: Total Dianalisis + Skor Tertinggi via `GET /api/analysis/stats` | ✅ Berjalan |
| Skor ATS per resume di daftar resume (badge warna dinamis) | ✅ Berjalan |
| Search/filter resume berdasarkan nama file (client-side) | ✅ Berjalan |
| Analisis Ulang: pre-fill resume + job description baru | ✅ Berjalan |
| Validasi PDF-only di frontend (drag/drop) dan backend | ✅ Berjalan |
| Preview PDF: buka di tab baru | ✅ Berjalan |

### Known Gaps

| Fitur | Lokasi | Keterangan |
|-------|--------|------------|
| Skor Tertinggi tidak bisa diklik ke result | `StatsCards` | Nilai tampil tapi belum ada navigasi ke analisis dengan skor tertinggi |
| DOCX extraction | `resume_handler.go` | Sengaja ditunda; frontend sudah dibatasi PDF only |
| Years of experience knockout check | `ai_service.go`, `scorer.go` | Backlog — AI ekstrak min_years dari JD, bandingkan dengan CV |
| Keyword frequency weighting | `scorer.go` | Backlog — keyword muncul 2–3× di CV mendapat bobot lebih |

### Bug yang Ditemukan dan Diperbaiki Selama Development

#### Bug 1 — candidate_profile salah mengklasifikasikan mahasiswa sebagai "experienced"

**Gejala:** CV mahasiswa aktif (hanya proyek kampus, organisasi, dan sertifikat online)
diklasifikasikan sebagai `experienced`, sehingga feedback konten memberikan saran untuk
kandidat profesional yang tidak relevan.

**Root cause:** Prompt AI hanya mendefinisikan `"experienced"` sebagai *"ada pengalaman kerja
relevan dengan durasi jelas"* — definisi ini terlalu longgar. AI menginterpretasikan
*proyek kampus yang dideskripsikan dengan bahasa profesional* sebagai pengalaman kerja.

**Solusi:** Kriteria di-perketat secara eksplisit di prompt:
- `experienced` hanya berlaku untuk pekerjaan profesional full-time/kontrak ≥ 1 tahun,
  dengan penegasan "BUKAN magang/PKL"
- `fresh_graduate` secara eksplisit mencakup mahasiswa aktif, alumni ≤ 2 tahun,
  dan siapapun yang pengalamannya hanya berupa magang < 6 bulan, asisten, atau kegiatan kampus

#### Bug 2 — Nama kegiatan masuk ke sections_nonstandard, menurunkan format_score

**Gejala:** Nama kegiatan seperti *"Sajadha 2024"*, *"Technocracy 2024"*, dan *"SRE UGM"*
masuk ke array `sections_nonstandard`. Akibatnya `format_score` turun karena rumus lama
`section_score = standard / (standard + nonstandard)` — padahal CV punya struktur yang benar.

**Root cause:** TUGAS 5 di prompt hanya berisi satu kalimat: *"Pisahkan section header
standar vs non-standar."* Tidak ada definisi apa itu section header, sehingga AI mengisi
kekosongan dengan heuristiknya sendiri dan menganggap teks kapital/bold (termasuk nama acara
dan nama organisasi) sebagai section header.

**Fix pertama (tidak cukup):** TUGAS 5 ditulis ulang dengan aturan eksplisit — baris yang
mengandung tahun bukan section header, nama acara bukan section header, dll. AI tetap
salah secara konsisten karena pendekatan ini masih memberi AI kebebasan untuk menentukan
mana yang nonstandar.

**Solusi final — Whitelist Approach + Presence-Based Scoring:**
1. AI hanya mengisi `sections_detected` dari whitelist yang sudah ditentukan
2. AI mengisi `all_headers_detected` dengan semua header tanpa filter
3. `ComputeNonstandard()` di Go mengisi `sections_nonstandard` dari selisih keduanya —
   deterministik, tidak bisa dipengaruhi halusinasi AI
4. Formula `format_score` diganti ke **presence-based** — `sections_nonstandard` tidak
   masuk kalkulasi skor sama sekali, hanya ditampilkan di feedback sebagai saran

#### Bug 3 — Keyword matching terlalu longgar menghasilkan false positive

**Gejala:** AI mengembalikan keyword generik seperti `"programming logic"` dan fragmen
seperti `"req"` sebagai `found_in_cv: true`, seolah-olah keyword tersebut ada di CV
padahal tidak ada secara eksplisit.

**Root cause:** TUGAS 1 di prompt hanya menginstruksikan *"Ekstrak semua keyword dari
job description"* tanpa batasan ketat. AI cenderung membuat parafrase atau generalisasi
dari kata-kata di JD, lalu mencocokkannya secara semantik dengan konten CV — bukan
exact match. Keyword seperti "programming logic" tidak ada secara literal di JD manapun;
itu adalah inferensi AI.

**Solusi:** Instruksi diperketat: ambil keyword *persis seperti tertulis di JD*, dengan
contoh eksplisit apa yang salah (`"programming logic"`, `"web framework"` → terlalu umum).
Match hanya valid jika keyword atau padanan resminya ditemukan secara eksplisit di CV.

---

## 7. Rencana Pengembangan

Prioritas berdasarkan `docs/ATS_RESEARCH.md` — diurutkan dari dampak tertinggi ke
implementasi paling kompleks.

### Sudah Diselesaikan dari Known Gaps

| Fitur | Keterangan |
|-------|------------|
| Dashboard stats: Total Dianalisis + Skor Tertinggi | `GET /api/analysis/stats` — endpoint baru, StatsCards live |
| Skor ATS per resume di daftar resume | Badge warna dinamis dari data yang sudah di-fetch |
| Search/filter resume berdasarkan nama file | Client-side, tanpa request backend tambahan |
| Analisis Ulang dengan pre-fill + job description baru | `TriggerAnalysis` terima optional body; `sessionStorage` pre-fill |
| Validasi PDF-only di frontend dan backend | Drag/drop berfungsi; backend tolak non-PDF sebelum disimpan |
| Preview PDF | Buka di tab baru via `window.open`; modal dihapus |

### Prioritas 1 — Years of Experience Knockout Check

**Dasar riset:** Minimum years of experience di JD sering menjadi knockout filter sebelum
keyword bahkan dicek. Kandidat dengan 0 tahun pengalaman untuk posisi yang mensyaratkan
"3+ years" perlu diberi tahu secara eksplisit.

**Implementasi:**
- Tambah field `min_experience_years` ke `AIResult` — AI ekstrak dari JD
- Tambah field `experience_years_total` ke `AIResult` — AI ekstrak dari CV
- Jika `experience_years_total < min_experience_years` → flag di feedback dengan pesan spesifik

**Catatan:** Ini bukan pengurangan skor, tapi peringatan eksplisit — konsisten dengan
prinsip bahwa knockout filters ditampilkan terpisah dari skor.

### Prioritas 2 — Keyword Frequency Weighting

**Dasar riset:** Konvensi praktisi ATS: keyword yang muncul 2–3 kali di CV mendapat
perhatian lebih dari ATS, tapi >3 kali dianggap stuffing.

**Implementasi:**
- Tambah field `occurrences` ke `KeywordItem` — AI hitung kemunculan per keyword di CV
- Modifikasi `sectionWeight()` di `scorer.go` untuk mengalikan dengan frequency multiplier:
  1× untuk 1 kemunculan, 1.2× untuk 2–3 kemunculan

### Prioritas 3 — DOCX Extraction

**Dasar riset:** DOCX memiliki field extraction accuracy 89% vs 84% untuk PDF di parser
legacy. Banyak kandidat Indonesia lebih familiar dengan format Word.

**Implementasi:** Tambah handler untuk `.docx` di `resume_handler.go` menggunakan library
seperti `github.com/unidoc/unioffice` atau `github.com/nguyenthenguyen/docx`.
Frontend perlu menerima `.docx` kembali setelah validasi backend siap.

### Yang Sengaja Tidak Diimplementasi

Berdasarkan riset, beberapa teknik canggih sengaja dihindari:

| Teknik | Alasan dihindari |
|--------|-----------------|
| Semantic embedding matching (SBERT, CareerBERT) | Butuh model khusus, infrastruktur berat, latensi tinggi |
| Career trajectory modeling (RNN) | Butuh jutaan data historis rekrutmen |
| University prestige scoring | Tidak ada bukti vendor ATS besar menggunakannya |
| GPA scoring | Inkonsisten antar institusi, tidak universal |
| Anti-stuffing detection | Terlalu kompleks, bukan prioritas untuk scope saat ini |

Kesederhanaan yang disengaja ini membuat sistem tetap dapat diaudit, diprediksi, dan
mudah di-maintain tanpa mengorbankan akurasi yang relevan untuk pasar Indonesia.
