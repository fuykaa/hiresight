# Presentasi HireSight — Responsi Senior Project
# Kelompok 15 | 2026

---
**INSTRUKSI UNTUK CLAUDE.AI:**
Buat file PPTX dari dokumen ini. Gunakan dark theme (background navy gelap #0F172A, aksen teal #14B8A6).
Font heading: Poppins Bold. Font body: Inter Regular. Setiap slide punya 1 visual utama sesuai deskripsi di bagian [VISUAL].
---

---

## SLIDE 1 — COVER

**Judul Besar:** HireSight

**Subjudul:** Smarter CV, Stronger Career
*AI-Powered ATS Resume Analyzer*

**Tim:**
- Kistosi Al Ghifari (23/515523/TK/56680) — Project Leader, AI Engineer
- Kurniawan Surya Atmaja — Backend Engineer, Database Engineer
- Abdul Halim Edi Rahmansyah — Software Engineer, UI/UX Designer

**Label:** Kelompok 15 — Senior Project | 2026

[VISUAL]
Background dark navy. Logo/ikon: kaca pembesar di atas dokumen CV, warna teal.
Nama anggota di pojok kiri bawah dengan font kecil abu-abu.

---

## SLIDE 2 — LATAR BELAKANG MASALAH

**Judul:** Masalah yang Kami Temukan

**Poin 1:** 75% resume tidak lolos screening ATS
- Bukan karena kandidat tidak kompeten
- Tapi karena format CV tidak ramah mesin

**Poin 2:** ATS adalah "black box"
- Kandidat tidak tahu kriteria apa yang membuat mereka gugur di tahap screening awal

**Poin 3:** Tools ATS yang ada tidak cocok untuk Indonesia
- Jobscan, Resume.com tidak memahami CV bilingual (Indonesia–Inggris)
- Tidak mengenali format CV lokal Indonesia

**Fakta Riset:**
- Hanya 20% perusahaan Indonesia menggunakan AI dalam rekrutmen
- Mayoritas "ATS" lokal = boolean keyword search manual
- Implikasi: exact-match keyword bahkan lebih krusial

[VISUAL]
Diagram funnel rekrutmen: "100 Pelamar" → "25 Lolos ATS" (75% tersaring, angka merah besar).
Di bawah funnel: 3 ikon kecil mewakili masalah (robot mesin, tanda tanya, bendera Indonesia).

---

## SLIDE 3 — SOLUSI: HIRESIGHT

**Judul:** HireSight — Solusi Kami

**Deskripsi singkat:**
Aplikasi web yang menganalisis resume berdasarkan standar ATS secara transparan dan terukur.

**4 Keunggulan vs Tools Sejenis:**

| # | Keunggulan | Detail |
|---|-----------|--------|
| 1 | Algoritma Terbuka | Bobot scoring berbasis riset akademis IEEE/ACM/Elsevier, bukan klaim vendor |
| 2 | Bilingual Matching | Mengenali padanan Indonesia–Inggris: "Manajemen Proyek" = "Project Management" |
| 3 | Konteks Indonesia | Memahami format CV lokal, tidak memaksa format Barat |
| 4 | Feedback Actionable | Saran spesifik per aspek: format, konten, keyword |

[VISUAL]
Split layout 2 kolom:
- Kiri (merah): ikon masalah — "Tidak transparan", "Tidak bilingual", "Tidak kontekstual"
- Kanan (teal): ikon solusi — logo HireSight dengan 4 poin keunggulan

---

## SLIDE 4 — FITUR UTAMA

**Judul:** Fitur Utama Aplikasi

**Grid 6 Fitur (2 baris × 3 kolom):**

**[1] Upload Resume**
Ikon: cloud-upload
Upload PDF + masukkan posisi dan deskripsi pekerjaan target

**[2] Analisis ATS Otomatis**
Ikon: gear/cog berputar
Backend ekstrak teks PDF, AI identifikasi keyword & section headers

**[3] Skor Multi-dimensi**
Ikon: speedometer
Tiga skor terpisah: ATS Score, Keyword Score, Format Score (skala 0–100)

**[4] Keyword Analysis**
Ikon: tag/label
Tabel detail: keyword required vs preferred, ditemukan/tidak, lokasi section

**[5] Feedback Teks**
Ikon: chat bubble
Narasi feedback spesifik per aspek: format, konten, keyword

**[6] Riwayat Analisis**
Ikon: list dengan checkmark
Dashboard: semua resume tersimpan + status analisis per resume

[VISUAL]
Grid kartu 2×3 dengan warna teal. Tiap kartu punya ikon besar di atas, judul bold, deskripsi kecil di bawah.

---

## SLIDE 5 — ARSITEKTUR SISTEM

**Judul:** Arsitektur Sistem

**Tabel Stack:**

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui | SSR, performa, komponen siap pakai |
| Backend | Go 1.25, Gin 1.12, GORM 1.31 | Performa tinggi, single binary, goroutine native |
| Database | PostgreSQL 18 | Data relasional terstruktur (user, resume, analysis) |
| AI | Groq API — llama-3.3-70b-versatile | Inferensi cepat, gratis tier tersedia |
| Auth | JWT via HTTP cookie bernama "token" | Stateless, aman, kompatibel dengan SSR |
| Infra | Docker Compose + Azure VM + Nginx + PM2 | Production-ready, CI/CD otomatis |

[VISUAL]
Diagram arsitektur horizontal berlapis:
  Browser
    ↓
  Nginx :80 (reverse proxy)
    ↓                    ↓
  Frontend :3000    Backend :8081
                         ↓         ↓
                   PostgreSQL   Groq API (eksternal)

Warna per layer: biru = frontend, hijau = backend, oranye = DB, ungu = AI/Groq

---

## SLIDE 6 — ALUR KERJA SISTEM

**Judul:** Alur Kerja: Dari Upload ke Hasil

**Flow (berurutan):**

**[1]** User upload PDF resume + job description via form web

**[2]** Backend simpan file, buat record Resume di database

**[3]** `POST /api/analysis/:resume_id`
→ Backend langsung return **202 Accepted** (tidak menunggu)

**[4] GOROUTINE ASYNC (background):**
- `extractPDFText` — ekstrak teks dari PDF (minimum 100 karakter, hanya text-based PDF)
- `AnalyzeWithGroq` — LLM ekstrak keyword, section headers, bahasa, profil kandidat
- `CalculateScores` — hitung skor deterministik (pure Go, tanpa AI)
- `GenerateFeedback` — buat narasi feedback (pure Go, tanpa AI)
- Simpan ke DB → `status = "completed"` (atau `"failed"` jika error)

**[5]** Frontend polling GET tiap 2 detik → tampilkan hasil saat status completed

[VISUAL]
Flowchart horizontal 5 langkah dengan panah.
Langkah 4 diberi kotak border putus-putus berlabel "Async / Background Process".
Label "202 Accepted" berwarna kuning/oranye di antara langkah 3 dan 4.
Langkah 5 menunjukkan ikon refresh/loop bertuliskan "Polling 2s".

---

## SLIDE 7 — ALGORITMA SCORING

**Judul:** Algoritma ATS Scoring — Berbasis Riset Akademis

**Rumus (tampilkan sebagai code block atau formula visual):**

```
keyword_score = (required_found / total_required × 70%)
              + (preferred_found / total_preferred × 30%)

section_score = std_sections / (std_sections + nonstandard) × 100
language_score = English→100 | Mixed→60 | Indonesian→30
format_score  = (section_score × 60%) + (language_score × 40%)

ats_score     = keyword_score × 65% + format_score × 35%
overall_score = ats_score  [range 0–100]
```

**Justifikasi Bobot:**
- Keyword required **70%** → knockout filter dominan di ATS nyata (IEEE/Jobscan)
- Section headers **60%** dari format → ATS parser bergantung struktur section
- Bahasa Inggris dibobot 100 → relevan untuk MNC & multinasional

**Desain Keputusan Penting:**
> Scoring **100% deterministik** (pure Go). AI hanya ekstraksi fakta.
> Input sama → skor sama, setiap saat, tanpa risiko LLM hallucination.

[VISUAL]
Tiga donut chart kecil berdampingan:
  [Keyword Score: 70%/30%] [Format Score: 60%/40%] [ATS Score: 65%/35%]
Di bawah: footnote kecil — "Sumber: ATS_RESEARCH.md — IEEE, ACM, Elsevier, Jobscan Research"

---

## SLIDE 8 — PERAN AI (GROQ)

**Judul:** Peran AI: Ekstraksi Fakta, Bukan Penilaian

**Kolom KIRI — AI (Groq) HANYA untuk:**
- Mengekstrak daftar keyword dari job description (required vs preferred)
- Mengidentifikasi keyword yang ditemukan di CV dan lokasinya (section mana)
- Mendeteksi section headers yang ada di CV
- Mendeteksi bahasa CV (English / mixed / Indonesian)
- Mengklasifikasikan profil kandidat (experienced / fresh_graduate / career_changer)

**Kolom KANAN — Go (scorer.go) bertugas:**
- Menghitung keyword_score, format_score, ats_score
- Menghasilkan narasi feedback per aspek
- Semua keputusan kuantitatif dan kualitatif

**Panah tengah:** `AIResult struct` (hanya data fakta, tanpa opini)

**Mengapa desain ini?**
- Menghindari LLM hallucination dalam proses penilaian angka
- Skor reproducible dan auditable
- AI sebagai "mata" (melihat fakta) → Go sebagai "otak" (membuat keputusan)

[VISUAL]
Diagram 2 kolom berdampingan:
- Kiri: kotak ungu berlabel "Groq LLM" dengan bullet list tugasnya
- Kanan: kotak biru berlabel "Go scorer.go" dengan bullet list tugasnya
- Panah dari kiri ke kanan bertuliskan "AIResult{}"

---

## SLIDE 9 — SCREENSHOT APLIKASI

**Judul:** Tampilan Aplikasi

**Layout: Grid 2×3 screenshot dengan label:**

**[1] Landing Page**
Hero section — tagline "Smarter CV, Stronger Career"

**[2] Dashboard**
Stats cards + daftar resume terbaru

**[3] Halaman Analisis**
Form upload: file PDF + job position + job description

**[4] Hasil Analisis (HIGHLIGHT)**
Tiga skor melingkar (ATS/Keyword/Format) + tabel keyword analysis

**[5] Halaman Resume**
Tabel riwayat dengan status badge berwarna:
Selesai (hijau) | Diproses (kuning) | Gagal (merah)

**[6] Profil Pengguna**
Form edit profil + avatar

[VISUAL]
Screenshot nyata dari aplikasi yang sudah di-deploy.
Tiap screenshot diberi frame browser mockup.
Screenshot #4 (Hasil Analisis) diberi callout/lingkaran highlight pada angka skor.
Catatan: Ambil screenshot dari Azure VM (20.198.216.160) atau localhost.

---

## SLIDE 10 — DEPLOYMENT & INFRASTRUKTUR

**Judul:** Deployment & Infrastruktur Production

**Stack Deployment:**
- **Azure VM** — server cloud publik
- **Docker Compose** — orkestrasi 4 container sekaligus
- **Nginx** — reverse proxy, static cache 1 tahun, routing `/api/*` → backend
- **PM2** — process manager frontend (auto-restart jika crash)
- **GitHub Actions** — CI/CD otomatis setiap push ke branch `main`

**Pipeline CI/CD (2 Job Sequential):**

```
Push to main
     ↓
Job 1: Deploy Backend
  → Cross-compile Go binary (GOOS=linux GOARCH=amd64)
  → SCP binary ke Azure VM
  → Restart Docker container

Job 2: Deploy Frontend (setelah Job 1 selesai)
  → npm ci + npm run build (Next.js standalone)
  → Tar .next/standalone + static + public
  → SCP ke Azure VM
  → PM2 reload

Health Check:
  Backend  → docker inspect + docker logs
  Frontend → curl http://127.0.0.1:3000 = HTTP 200
```

**Docker Compose — 4 Container:**
`nginx:80` → `frontend:3000` + `backend:8081` → `postgres:5432`

[VISUAL]
Diagram alir CI/CD: GitHub → (panah) → Azure VM
Di Azure VM: kotak Docker Compose dengan 4 container berwarna berbeda terhubung satu sama lain.

---

## SLIDE 11 — TANTANGAN & SOLUSI

**Judul:** Tantangan Teknis & Solusi

**Tabel Tantangan vs Solusi:**

| Tantangan | Solusi yang Diterapkan |
|-----------|----------------------|
| Tidak ada formula ATS yang dipublikasikan | Riset literatur IEEE/ACM/Elsevier → bobot berbasis evidence akademis |
| Groq kadang wrap response dalam ```json``` markdown | Strip markdown wrapper di `ai_service.go` sebelum JSON parse |
| PDF scanned (berbasis gambar) tidak bisa diekstrak | By design: tolak dengan `status="failed"`, user upload PDF text-based |
| Frontend tidak tahu kapan goroutine selesai | Polling GET /api/analysis tiap 2 detik sampai `completed` atau `failed` |
| Cross-compile Go untuk Alpine Linux di CI | `GOOS=linux GOARCH=amd64 CGO_ENABLED=0` di GitHub Actions |
| Next.js build besar untuk transfer ke VM | Multi-stage Dockerfile + `standalone` output, hanya artifact yang perlu |

[VISUAL]
6 kartu horizontal (atau tabel 2 kolom).
Kolom kiri: ikon merah + teks tantangan.
Kolom kanan: ikon hijau centang + teks solusi.

---

## SLIDE 12 — HASIL & ROADMAP

**Judul:** Hasil & Pengembangan Selanjutnya

**Bagian KIRI — Pencapaian (v1.0):**
✅ Semua fitur inti berfungsi dan live di production
✅ Pipeline CI/CD otomatis (auto-deploy on push)
✅ Algoritma scoring berbasis riset akademis, bukan asumsi
✅ Desain async (goroutine) — tidak ada request timeout pada analisis panjang
✅ Deployed di Azure VM dengan Nginx + PM2

**Bagian KANAN — Roadmap (v1.1 & v2.0):**

*Known Gaps (v1.1):*
⬜ AVG ATS Score & Analysis Done di dashboard (masih hardcoded "—")
⬜ PDF preview embed di halaman hasil
⬜ Search/filter di halaman riwayat resume
⬜ DOCX support (UI sudah siap, backend belum)

*Future Enhancement (v2.0):*
🔵 Job title match scoring (+10.6× interview rate — data Jobscan)
🔵 Keyword frequency scoring (sweet spot: 2–3 kemunculan)
🔵 Bilingual dictionary expansion Indonesia–Inggris
🔵 OCR untuk scanned PDF

[VISUAL]
Split slide 2 kolom dengan garis pemisah tengah.
Kiri: background hijau gelap, checklist done.
Kanan: background biru gelap, list roadmap bertanda level prioritas.

---

## SLIDE 13 — PENUTUP & Q&A

**Judul:** Terima Kasih

**Kalimat Penutup:**
*"HireSight membantu job seeker Indonesia memahami dan mengoptimalkan resume mereka sesuai standar ATS — secara transparan, terukur, dan berbasis riset akademis."*

**Tim:**
- Kistosi Al Ghifari — Project Leader, AI Engineer
- Kurniawan Surya Atmaja — Backend Engineer
- Abdul Halim Edi Rahmansyah — Software Engineer, UI/UX

**Terbuka untuk Pertanyaan**

[VISUAL]
Background sama dengan slide cover (konsistensi branding).
Logo HireSight di tengah.
Nama tim di bawah.
Opsional: QR code ke live demo atau GitHub repo di pojok kanan bawah.

---

## PANDUAN VISUAL KESELURUHAN

**Palet Warna:**
- Background: `#0F172A` (navy gelap)
- Heading/Accent: `#14B8A6` (teal)
- Success/Done: `#22C55E` (hijau)
- Warning/Process: `#F59E0B` (kuning)
- Error/Danger: `#EF4444` (merah)
- Text sekunder: `#94A3B8` (abu)
- Text utama: `#F8FAFC` (putih)

**Tipografi:**
- Heading: Poppins Bold
- Subheading: Poppins SemiBold
- Body: Inter Regular
- Code/formula: JetBrains Mono atau Fira Code

**Prinsip Layout:**
- Dark mode konsisten di semua slide
- Maksimal 6 bullet per slide — lebih dari itu pecah jadi 2 slide
- Setiap slide wajib punya 1 elemen visual utama
- Slide teknis (arsitektur, algoritma, CI/CD): gunakan diagram/chart, bukan teks panjang
