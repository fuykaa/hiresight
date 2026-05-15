# ATS_RESEARCH.md — Referensi Algoritma Scoring HireSight
> Dokumen ini adalah ringkasan riset ATS yang digunakan sebagai dasar pengembangan algoritma scoring.
> Sumber: literatur akademis IEEE/ACM/Elsevier, dokumentasi vendor primer, data pasar Indonesia.
> Gunakan sebagai referensi saat mengembangkan atau memodifikasi scorer.go dan ai_service.go.

---

## Prinsip Utama yang Harus Dipegang

**Tidak ada formula universal yang dipublikasikan vendor manapun.**
Semua bobot persentase yang beredar di internet (Keyword 40%, Formatting 25%, dll) adalah hasil
reverse-engineering pihak ketiga — bukan ground truth. HireSight menggunakan bobot yang
didasarkan pada prinsip yang terkonfirmasi, bukan angka yang diklaim vendor.

**Yang benar-benar terkonfirmasi dari riset:**
- Hard skills / required keywords → pengaruh dominan, sering jadi knockout filter
- Job title match → 10.6× lebih banyak interview invitation (Jobscan, ~1 juta sample)
- Soft skills → pengaruh lemah
- Keyword di section Skills/Summary → lebih berbobot dari keyword di Experience lama
- DOCX lebih aman dari PDF di parser legacy (89% vs 84% field extraction accuracy)
- Section header nonstandar → konten tidak terdeteksi parser

---

## Variabel Scoring — Tingkat Kepercayaan

### Tier 1 — Terkonfirmasi kuat (implementasi wajib)

| Variabel | Cara implementasi di HireSight |
|---|---|
| Required keyword match | Knockout weight 70% di keyword_score |
| Preferred keyword match | Bonus weight 30% di keyword_score |
| Section header standar | Komponen utama format_score |
| Keyword placement (section mana) | Field `section` di JSON AI |
| Bahasa CV (Indonesia vs Inggris) | Komponen language_score di format_score |

### Tier 2 — Terkonfirmasi kategoris (pertimbangkan untuk iterasi)

| Variabel | Catatan |
|---|---|
| Job title match | Sangat signifikan — bisa ditambahkan sebagai bonus score |
| Years of experience | Sering knockout jika di bawah minimum di JD |
| File format PDF vs DOCX | Informasikan ke user, bukan scoring |
| Recency of skill use | Dimodelkan Eightfold — kompleks, skip untuk sekarang |

### Tier 3 — Tidak terkonfirmasi (jangan implementasi)

| Variabel | Alasan |
|---|---|
| University prestige | Tidak ada bukti vendor besar pakai ini |
| GPA | Inkonsisten, tidak universal |
| Quantified achievements | Jobscan konfirmasi ini tidak dihitung ATS |
| Career gap | Hanya flagged untuk human review, bukan scoring |

---

## Keyword Scoring — Detail Implementasi

### Required vs Preferred
Sumber bahasa JD untuk klasifikasi otomatis:
- **Required**: "wajib", "minimal", "must have", "harus", "dibutuhkan", "required", "minimum qualifications"
- **Preferred**: "diutamakan", "nilai plus", "nice to have", "lebih disukai", "preferred", "ideally"
- Default jika tidak ada frasa klasifikasi: **preferred**

### Section Weight untuk Keyword
Keyword yang ditemukan di section berbeda harus mendapat bobot berbeda:

| Section | Bobot multiplier |
|---|---|
| skills | 1.0 (penuh) |
| summary | 1.0 (penuh) |
| experience | 0.8 |
| education | 0.6 |
| null / tidak diketahui | 0.5 |

### Bilingual Matching — Konteks Indonesia
AI harus mengenali padanan Indonesia-Inggris. Ini keunggulan HireSight vs tools internasional:
- "Manajemen Proyek" = "Project Management"
- "Pengembangan Perangkat Lunak" = "Software Development"
- "Layanan Pelanggan" = "Customer Service"
- "Memimpin tim" = "Team Leadership"
- Akronim harus dikenali: "ML" = "Machine Learning", "SE" = "Software Engineering"

---

## Format Scoring — Detail Implementasi

### Section Header Standar yang Dikenali ATS
Parser ATS mengenali header berikut — semakin banyak ada di CV, semakin tinggi section_score:

**Tier A (paling penting):**
- Skills / Keahlian
- Work Experience / Pengalaman Kerja / Pengalaman
- Education / Pendidikan

**Tier B (penting):**
- Summary / Ringkasan / Profil
- Certifications / Sertifikasi
- Projects / Proyek

**Tier C (bonus):**
- Organizations / Organisasi
- Awards / Penghargaan
- Languages / Bahasa

### Header Nonstandar yang Harus Diflag
Contoh header yang menyebabkan parser gagal:
- "Perjalanan Karirku", "My Journey", "Career Path"
- "Yang Sudah Aku Capai", "What I've Done"
- "Tentang Saya" tanpa padanan Inggris
- "Hobi dan Minat" (bukan ATS-relevant)

### Language Score
| language_mix | Score | Catatan |
|---|---|---|
| english | 100 | Paling aman untuk semua jenis perusahaan |
| mixed | 60 | Aman tapi berisiko untuk beberapa keyword |
| indonesian | 30 | Aman hanya untuk BUMN/instansi pemerintah |

---

## Konteks Indonesia — Yang Harus Dipertimbangkan Sistem

### Adopsi ATS di Indonesia
- Hanya 20% perusahaan Indonesia pakai AI dalam rekrutmen (Jobstreet by SEEK 2024)
- 76% dari 20% itu menggunakannya untuk screening kandidat
- Mayoritas "ATS" Indonesia = database dengan boolean keyword search oleh recruiter manusia
- **Implikasi**: exact-match keyword bahkan lebih krusial dari semantic matching

### Segmentasi Perusahaan untuk Feedback
HireSight harus memberikan saran yang berbeda berdasarkan target perusahaan:

| Target | Bahasa CV | Format |
|---|---|---|
| MNC / Tech startup | Inggris wajib | ATS-friendly, tanpa foto |
| BUMN / Instansi pemerintah | Indonesia diterima | Tradisional OK, mungkin perlu foto |
| Perusahaan lokal / UMKM | Fleksibel | Tergantung industri |

### Format CV Tradisional Indonesia vs ATS-friendly
CV tradisional Indonesia sering menyertakan elemen yang tidak terbaca ATS:
- Foto → ATS tidak bisa membaca gambar
- Agama, status pernikahan, golongan darah → tidak relevan untuk scoring
- Tabel dan kolom → parser membaca scrambled
- **Sistem harus menginformasikan ini ke user tanpa memaksa menghapusnya**

---

## Rumus Scoring Saat Ini di HireSight

### keyword_score (0–100)
```
required_score = (required_found / required_total) × 100
preferred_score = (preferred_found / preferred_total) × 100
keyword_score = (required_score × 0.70) + (preferred_score × 0.30)
```

### format_score (0–100)
```
section_score = (len(sections_detected) / (len(sections_detected) + len(sections_nonstandard))) × 100
language_score = english:100 | mixed:60 | indonesian:30
format_score = (section_score × 0.60) + (language_score × 0.40)
```

### ats_score (0–100)
```
ats_score = (keyword_score × 0.65) + (format_score × 0.35)
overall_score = ats_score
```

---

## Pengembangan Algoritma — Prioritas Iterasi Berikutnya

Berdasarkan riset, ini yang paling impactful untuk ditambahkan ke algoritma:

**Prioritas 1 — Section-aware keyword placement weight**
Keyword di Skills mendapat bobot penuh, di Experience 80%, di Education 60%.
Ini terkonfirmasi dari paper MSLEF (arXiv:2509.06200) dan Resume Optimizer Pro.

**Prioritas 2 — Job title match bonus**
Jika job title di CV exact-match atau semantically close dengan posisi di JD,
tambahkan bonus 10-15 poin ke overall_score.
Dasar: Jobscan data — exact title match → 10.6× interview invitation.

**Prioritas 3 — Years of experience check**
Ekstrak minimum years of experience dari JD, bandingkan dengan total pengalaman di CV.
Jika di bawah minimum → flag sebagai potential knockout dengan pesan spesifik.

**Prioritas 4 — Keyword frequency scoring**
Keyword yang muncul 2-3 kali di CV (bukan hanya sekali) mendapat bobot lebih tinggi.
Konvensi praktisi: 2-3 kemunculan adalah sweet spot sebelum dianggap stuffing.

---

## Yang Tidak Perlu Diimplementasi

Berdasarkan riset, ini yang tidak perlu ada di HireSight:
- **Career trajectory modeling** (RNN next-title prediction) → butuh jutaan data historis
- **Semantic embedding matching** (SBERT, CareerBERT) → kompleks, perlu model khusus
- **University prestige scoring** → tidak terkonfirmasi vendor manapun
- **GPA scoring** → inkonsisten antar institusi
- **Anti-stuffing detection** → terlalu kompleks untuk scope saat ini