# HireSight — Implementation Notes: AI Analysis Feature

## 1. File yang Dibuat atau Diubah

### Backend (`backend-hiresight/`)

| File | Status | Fungsi |
|------|--------|--------|
| `internal/models/analysis.go` | Dibuat | Struct `AnalysisResult` — tabel `analysis_results` di PostgreSQL, menyimpan semua output analisis |
| `internal/repository/analysis_repository.go` | Dibuat | `Save` (create/update) dan `GetResultWithSecurity` (query dengan JOIN ke resumes untuk validasi kepemilikan) |
| `internal/services/ai_service.go` | Dibuat | Integrasi Groq API: kirim CV + job description, terima JSON `AIResult` (keywords, sections, candidate_profile, language_mix, job_titles_extracted, all_headers_detected) |
| `internal/services/scorer.go` | Dibuat | `CalculateScores` — hitung keyword/format/ats/overall score secara deterministik; `GenerateFeedback` — hasilkan teks umpan balik tanpa AI |
| `internal/handlers/analysis_handler.go` | Dibuat | `TriggerAnalysis` (POST, async 202), `GetResult` (GET), `runAnalysis` (goroutine: ekstrak PDF → AI → score → feedback → simpan) |
| `cmd/api/main.go` | Diubah | Tambah `AnalysisResult` dan `Resume` ke `AutoMigrate`; daftarkan route `/api/analysis/:resume_id` |

### Frontend (`hiresight-app/src/`)

| File | Status | Fungsi |
|------|--------|--------|
| `middleware.js` | Dibuat | Guard route berbasis cookie `token` — redirect ke `/login` jika belum auth, redirect ke `/dashboard` jika sudah auth mencoba buka `/login` |
| `app/page.jsx` | Dibuat | Landing page (Navbar, Hero, Features, HowItWorks, Footer) |
| `app/analyze/page.jsx` | Diubah | Upload multipart → trigger analisis → polling setiap 2 detik → redirect ke result |
| `app/analyze/result/page.jsx` | Diubah | Fetch hasil analisis dari API, tampilkan skor + keyword analysis + feedback; diferensiasi berdasarkan `candidate_profile` |
| `app/(dashboard)/resume/page.jsx` | Diubah | Fetch daftar resume + status analisis per resume secara paralel via `Promise.allSettled` |
| `app/(dashboard)/dashboard/page.jsx` | Diubah | Fetch data nyata dari `/api/resumes` dan `/api/profile` (sebelumnya dummy) |
| `components/Resume/ResumeTable.jsx` | Diubah | Tombol View simpan `resume_id` ke `sessionStorage` lalu navigate ke result; badge status per analisis |

---

## 2. Alur Kerja Sistem

```
USER                        FRONTEND                    BACKEND                     AI (Groq)
 │                              │                            │                           │
 │── upload PDF + JD ──────────>│                            │                           │
 │                              │── POST /api/resume/upload >│                           │
 │                              │                            │ simpan file + metadata     │
 │                              │<── {data: {id: resume_id}} │                           │
 │                              │                            │                           │
 │                              │── POST /api/analysis/:id ─>│                           │
 │                              │<── 202 Accepted ───────────│                           │
 │                              │                            │                           │
 │                              │                            │ [goroutine]                │
 │                              │                            │── extractPDFText ──────────│
 │                              │                            │   (≥100 char, text-based)  │
 │                              │                            │                           │
 │                              │                            │── AnalyzeWithGroq ────────>│
 │                              │                            │                           │ parse CV + JD
 │                              │                            │<── AIResult ───────────────│ return JSON
 │                              │                            │                           │
 │                              │                            │ CalculateScores(AIResult, jobPosition)  │
 │                              │                            │ GenerateFeedback(...)      │
 │                              │                            │ simpan ke DB               │
 │                              │                            │   status = "completed"     │
 │                              │                            │                           │
 │                              │── GET /api/analysis/:id ──>│ (polling 2 detik)          │
 │                              │<── {status: "completed"} ──│                           │
 │                              │                            │                           │
 │                              │ redirect /analyze/result   │                           │
 │                              │                            │                           │
 │<── tampilkan result ─────────│── GET /api/analysis/:id ──>│                           │
 │                              │── GET /api/resume/:id ─────>│                           │
 │                              │<── AnalysisResult + Resume ─│                           │
```

**Jika ekstraksi PDF gagal atau teks < 100 karakter:** goroutine set `status = "failed"`, frontend tampilkan pesan error dan tombol "Coba Lagi".

---

## 3. Environment Variables

Buat file `.env` di root project (`hiresight/`) atau di `backend-hiresight/` sesuai konfigurasi.

```env
# Database PostgreSQL
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_PORT=

# Autentikasi JWT
JWT_SECRET=

# Groq API (https://console.groq.com)
GROQ_API_KEY=
```

Frontend (`hiresight-app/.env.local`) — opsional, default ke `http://localhost:8081`:
```env
NEXT_PUBLIC_API_URL=
```

---

## 4. Cara Menjalankan Secara Lokal

### Prasyarat
- Docker & Docker Compose
- Go 1.25+
- Node.js 18+ dan npm/pnpm

### Langkah 1 — Jalankan Database

```bash
# dari root project (hiresight/)
docker compose -f docker-compose.db.yml up -d
```

Ini menjalankan PostgreSQL 18 di container `hiresight-db`. Tabel akan dibuat otomatis oleh `AutoMigrate` saat backend pertama kali dijalankan.

### Langkah 2 — Jalankan Backend

```bash
cd backend-hiresight

# Pastikan file .env sudah ada di hiresight/ atau set env vars secara manual
go run cmd/api/main.go
```

Backend berjalan di **`http://localhost:8081`**.

### Langkah 3 — Jalankan Frontend

```bash
cd hiresight-app
npm install      # atau: pnpm install
npm run dev      # atau: pnpm dev
```

Frontend berjalan di **`http://localhost:3000`**.

### Urutan wajib
Database → Backend → Frontend. Backend tidak akan start jika DB tidak tersedia.

---

## 5. Catatan Teknis

### Model AI — Groq

- **Provider:** [Groq](https://console.groq.com)
- **Model:** `llama-3.3-70b-versatile`
- **Format API:** OpenAI-compatible (`/openai/v1/chat/completions`)
- **Peran AI:** hanya ekstraksi fakta dari teks CV dan job description — menghasilkan struct `AIResult`:
  - `candidate_profile` — `experienced` | `fresh_graduate` | `career_changer`
  - `keywords[]` — daftar keyword dengan weight, found_in_cv, dan section tempat ditemukan
  - `sections_detected` — header section yang ada di whitelist standar
  - `sections_nonstandard` — selalu `[]` dari AI; diisi oleh `ComputeNonstandard()` di Go
  - `all_headers_detected` — semua header yang terlihat di CV tanpa filter whitelist
  - `language_mix` — `english` | `indonesian` | `mixed`
  - `job_titles_extracted` — jabatan profesional yang pernah dipegang (dari section Experience CV)
- **AI tidak menghitung skor dan tidak menulis feedback.** Keduanya dilakukan di Go secara deterministik.
- Groq kadang membungkus response dengan ` ```json ``` ` — sudah di-strip di `ai_service.go` sebelum di-parse.

#### Klasifikasi `candidate_profile`

Prompt menggunakan kriteria ketat berikut (bukan heuristik longgar):

| Nilai | Kriteria |
|-------|----------|
| `experienced` | Pengalaman kerja profesional (full-time / kontrak, **bukan** magang/PKL) ≥ 1 tahun, relevan dengan bidang JD |
| `fresh_graduate` | Mahasiswa aktif, lulus ≤ 2 tahun, atau pengalaman hanya berupa magang/PKL < 6 bulan, asisten lab/dosen, proyek kampus, atau kegiatan organisasi kemahasiswaan |
| `career_changer` | Pengalaman kerja profesional ≥ 1 tahun tetapi di bidang yang berbeda dari JD |

#### Keyword Matching di Prompt

- Keyword diekstrak **persis dari teks JD** — tidak diparafrase atau digeneralisasi
- Match hanya dianggap valid jika keyword atau padanan resminya ditemukan **secara eksplisit** di CV
- Padanan resmi yang dikenali: "Manajemen Proyek" = "Project Management", "ML" = "Machine Learning", dst.

#### Deteksi Section Header — Whitelist Approach

Setelah beberapa iterasi, deteksi section header menggunakan **whitelist approach** untuk menghilangkan false positive secara permanen.

**Alur:**
1. AI mengisi `sections_detected` — **hanya** header yang namanya ada di whitelist (case-insensitive)
2. AI mengisi `all_headers_detected` — semua header yang terlihat di CV tanpa filter
3. AI **selalu** mengembalikan `sections_nonstandard: []`
4. Go memanggil `ComputeNonstandard(allHeaders, sectionsDetected)` → mengisi `SectionsNonstandard` dari selisih keduanya

`sections_nonstandard` tetap ditampilkan di `feedback_format` sebagai saran ke user, tapi **tidak mempengaruhi skor** sama sekali.

**Whitelist section standar** (dikenali di `sections_detected`):

| Bahasa Inggris    | Padanan Indonesia yang valid                                                   |
|-------------------|--------------------------------------------------------------------------------|
| Skills            | Keahlian, Kemampuan, Keterampilan, Kompetensi                                  |
| Work Experience   | Pengalaman Kerja, Pengalaman, Riwayat Pekerjaan                                |
| Education         | Pendidikan, Riwayat Pendidikan                                                 |
| Summary / Profile | Profil, Ringkasan, Tentang Saya                                                |
| Certifications    | Sertifikasi, Sertifikat                                                        |
| Projects          | Proyek, Portofolio                                                             |
| Organizations     | Organisasi, Pengalaman Organisasi, Kegiatan Organisasi, Aktivitas              |
| Awards            | Penghargaan, Prestasi                                                          |
| Languages         | Bahasa                                                                         |
| Volunteer         | Volunter, Pengabdian Masyarakat                                                |
| Interests/Hobbies | Minat                                                                          |

---

### Ekstraksi PDF — `ledongthuc/pdf`

- Library: `github.com/ledongthuc/pdf v0.0.0-20250511090121-5959a4027728`
- **Hanya mendukung PDF berbasis teks (text-based).** PDF hasil scan atau gambar akan menghasilkan teks kosong → analisis gagal dengan `status = "failed"`.
- Minimum panjang teks yang diterima: **100 karakter** setelah di-trim.

---

### Algoritma Scoring (v3)

Semua perhitungan ada di `internal/services/scorer.go`. Tidak ada angka yang berasal dari AI.

#### Step 1 — Section Weight per Keyword

Sebelum dihitung, setiap keyword yang ditemukan di CV diberi bobot berdasarkan lokasi penemuannya. Dasar: keyword di section aktif (Skills) lebih relevan untuk ATS daripada keyword yang hanya muncul di Education.

| Section tempat keyword ditemukan | Bobot (`w`) |
|----------------------------------|-------------|
| `skills` atau `summary`          | 1.0         |
| `experience`                     | 0.8         |
| `education`                      | 0.6         |
| `null` / tidak diketahui         | 0.5         |

#### Step 2 — Keyword Score (0–100)

```
Untuk setiap keyword required yang found_in_cv = true:
  required_found += w(section)
required_total = jumlah keyword required

Untuk setiap keyword preferred yang found_in_cv = true:
  preferred_found += w(section)
preferred_total = jumlah keyword preferred

required_score  = required_found  / required_total  × 100   (0 jika total = 0)
preferred_score = preferred_found / preferred_total × 100   (0 jika total = 0)

keyword_score = (required_score × 0.70) + (preferred_score × 0.30)
```

**Contoh:**
- JD punya 5 keyword required. CV mengandung 3, yaitu: 2 di section `skills` (w=1.0) dan 1 di `education` (w=0.6).
- `required_found = 1.0 + 1.0 + 0.6 = 2.6`; `required_total = 5`
- `required_score = 2.6 / 5 × 100 = 52`
- Jika tidak ada keyword preferred: `keyword_score = 52 × 0.70 + 0 × 0.30 = 36`

#### Step 3 — Format Score (0–100)

`section_score` dihitung dengan **presence-based** (kehadiran section penting), bukan ratio standar/total. Dasar: Yu et al. (ACL 2005) dan Oracle Taleo mengonfirmasi Skills, Experience, Education adalah section paling krusial untuk parsing ATS.

```
section_score (presence-based, cap 100):
  Ada Skills / Keahlian / Kemampuan / Keterampilan / Kompetensi  → +33
  Ada Experience / Pengalaman Kerja / Pengalaman Organisasi
    / Kepanitiaan / Aktivitas / dan padanannya                   → +33
  Ada Education / Pendidikan / Riwayat Pendidikan                → +34
  Ada Summary / Profile / Profil / Ringkasan / Objective
    / About Me                                                   → +10 (bonus, tanpa syarat)
  min(100, total)

language_score:
  "english"    → 100
  "mixed"      → 60
  "indonesian" → 30

format_score = (section_score × 0.60) + (language_score × 0.40)
```

**Catatan penting:** `sections_nonstandard` **tidak mempengaruhi `section_score` sama sekali**. Ia hanya ditampilkan di `feedback_format` sebagai saran ke user. Ini mencegah nama kegiatan atau acara yang salah masuk menghukum skor CV.

| Contoh sections_detected | section_score |
|--------------------------|---------------|
| Skills + Experience + Education + Summary | min(100, 110) = **100** |
| Skills + Experience + Education | **100** |
| Skills + Education (tanpa Experience) | **67** |
| Skills + Pengalaman Organisasi + Pendidikan + Profil | min(100, 110) = **100** |
| `[]` | **0** |

#### Step 4 — ATS Score (0–100)

```
ats_score = (keyword_score × 0.65) + (format_score × 0.35)
```

#### Step 5 — Job Title Match Bonus

Berdasarkan data Jobscan (~1 juta sampel): job title match meningkatkan peluang interview 10.6×. HireSight menerjemahkan ini ke bonus deterministik.

```
Normalisasi: lowercase + trim untuk jobPosition dan setiap job_titles_extracted

Jika ada exact match      → bonus = 10
Jika ada partial match*   → bonus = 5
Jika tidak ada match      → bonus = 0

*partial match: jobPosition ⊆ title, atau title ⊆ jobPosition

overall_score = min(100, ats_score + bonus)
```

**Contoh:** User melamar "Frontend Developer". CV punya jabatan "Senior Frontend Developer".
- "frontend developer" ⊆ "senior frontend developer" → partial match → bonus = 5
- Jika `ats_score = 68` → `overall_score = 73`

**Catatan:** `ats_score` tetap tidak berubah; bonus hanya masuk ke `overall_score`.

#### Ringkasan Formula

```
keyword_score = Σ(w_required_found) / N_required × 70
              + Σ(w_preferred_found) / N_preferred × 30

section_score = (Skills∈detected ? 33 : 0)
              + (Experience∈detected ? 33 : 0)
              + (Education∈detected ? 34 : 0)
              + (Summary∈detected ? 10 : 0)
              capped at 100

format_score  = (section_score × 0.60) + (language_score × 0.40)

ats_score     = keyword_score × 0.65 + format_score × 0.35

overall_score = min(100, ats_score + job_title_bonus)
              job_title_bonus ∈ {0, 5, 10}
```

---

### Cara Feedback Dihasilkan

Feedback dihasilkan oleh `GenerateFeedback()` di `scorer.go` — **tidak memanggil AI.**

| Field | Sumber |
|-------|--------|
| `feedback_keywords` | Threshold `keyword_score` (≥80 / ≥60 / <60) + daftar keyword required dan preferred yang tidak ditemukan |
| `feedback_format` | Threshold `format_score` + peringatan `language_mix` + nama section non-standar yang perlu diganti |
| `feedback_content` | Teks tetap per profil: 3 varian berbeda untuk `experienced`, `fresh_graduate`, `career_changer` |

### Keamanan Data

- Semua endpoint `/api/*` memerlukan JWT via cookie `token` (set saat login, `HttpOnly` direkomendasikan).
- `GetResultWithSecurity` melakukan JOIN ke tabel `resumes` dan memvalidasi `user_id` — user tidak bisa mengakses hasil analisis milik user lain meski mengetahui `resume_id`.
- File PDF disimpan di `backend-hiresight/uploads/resumes/` dengan nama `{uuid}-{original_filename}`.

### Library Utama Backend

| Library | Versi | Kegunaan |
|---------|-------|---------|
| `gin-gonic/gin` | v1.12.0 | HTTP router |
| `gorm.io/gorm` | v1.31.1 | ORM |
| `gorm.io/driver/postgres` | v1.6.0 | Driver PostgreSQL |
| `gorm.io/datatypes` | v1.2.7 | Tipe JSONB untuk `keyword_analysis` |
| `golang-jwt/jwt/v5` | v5.3.1 | JWT auth |
| `google/uuid` | v1.6.0 | Generate UUID untuk semua primary key |
| `ledongthuc/pdf` | latest | Ekstraksi teks dari PDF |
| `gin-contrib/cors` | v1.7.7 | CORS — allow `localhost:3000` dengan credentials |
| `joho/godotenv` | v1.5.1 | Load `.env` file |

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
| Skor Tertinggi di dashboard dapat diklik ke halaman result | ✅ Berjalan |
| Years of experience knockout check: warning di feedback_content jika di bawah minimum JD | ✅ Berjalan |
| Keyword frequency weighting: keyword muncul ≥2× mendapat bobot 1.1×, tampil badge ×N di result | ✅ Berjalan |
| DOCX extraction: upload dan analisis file .docx menggunakan ZIP+XML parser native Go | ✅ Berjalan |

### Known Gaps

Tidak ada known gaps saat ini. Semua fitur yang direncanakan sudah diimplementasi.
