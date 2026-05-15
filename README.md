# HireSight

HireSight: Smarter CV, Stronger Career — aplikasi web yang memanfaatkan AI untuk menganalisis resume berdasarkan standar ATS (Applicant Tracking System).

Kelompok 15 Senior Project

| Nama | NIM | Peran |
|------|-----|-------|
| Kistosi Al Ghifari | 23/515523/TK/56680 | Project Leader, AI Engineer |
| Kurniawan Surya Atmaja | *(NIM)* | Backend Engineer, Database Engineer |
| Abdul Halim Edi Rahmansyah | *(NIM)* | Software Engineer, UI/UX Designer |

---

## Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | Go 1.25, Gin, GORM, PostgreSQL |
| Frontend | Next.js (App Router), React, Tailwind, shadcn/ui |
| AI | Groq API — llama-3.3-70b-versatile |
| Auth | JWT via cookie |

---

## Cara Menjalankan

### Prasyarat

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (wajib)
- [Go 1.25+](https://go.dev/dl/) (untuk dev lokal tanpa Docker penuh)
- [Node.js 18+](https://nodejs.org/) (untuk dev lokal tanpa Docker penuh)
- Akun Groq — [console.groq.com](https://console.groq.com) → buat API Key (gratis)

### Langkah 1 — Siapkan Environment Variables

```bash
cp .env.example .env
```

Buka `.env` dan isi nilai berikut:
- `DB_PASSWORD` — password bebas untuk database lokal
- `JWT_SECRET` — string random panjang (bisa generate: `openssl rand -hex 32`)
- `GROQ_API_KEY` — API key dari console.groq.com

Untuk dev lokal, nilai `CORS_ORIGIN` dan `NEXT_PUBLIC_API_URL` sudah benar di template.

---

### Opsi A — Jalankan Semua via Docker (Direkomendasikan)

```bash
docker compose up -d --build
```

Tunggu semua container running. Buka `http://localhost:3000`.

Untuk stop:
```bash
docker compose down
```

---

### Opsi B — Dev Lokal (dengan hot reload)

**Jalankan database saja via Docker:**
```bash
docker compose -f docker-compose.db.yml up -d
```

**Jalankan backend:**
```bash
cd backend-hiresight
go run cmd/api/main.go
```

**Jalankan frontend (terminal baru):**
```bash
cd hiresight-app
npm install
npm run dev
```

Buka `http://localhost:3000`.

---

## Deploy ke VPS

1. Clone repo ke VPS
2. Copy dan isi `.env`:
   ```bash
   cp .env.example .env
   # Edit .env: isi semua nilai, ganti CORS_ORIGIN dan NEXT_PUBLIC_API_URL ke IP VPS
   ```
3. Jalankan:
   ```bash
   docker compose up -d --build
   ```

Frontend: `http://IP_VPS:3000`  
Backend API: `http://IP_VPS:8081`

---

## Environment Variables

| Variable | Keterangan |
|----------|-----------|
| `DB_USER` | Username PostgreSQL |
| `DB_PASSWORD` | Password PostgreSQL |
| `DB_NAME` | Nama database |
| `DB_HOST` | Host database (lokal: `localhost`, Docker full: diset otomatis) |
| `DB_PORT` | Port database (default: `5432`) |
| `JWT_SECRET` | Secret key untuk JWT token |
| `GROQ_API_KEY` | API key Groq untuk analisis AI |
| `CORS_ORIGIN` | URL frontend yang diizinkan (lokal: `http://localhost:3000`) |
| `NEXT_PUBLIC_API_URL` | URL backend yang diakses browser (lokal: `http://localhost:8081`) |
