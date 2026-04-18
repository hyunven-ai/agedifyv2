# Railway Deployment Guide - Agedify.com

Panduan lengkap untuk deploy Agedify ke Railway dengan custom domain.

---

## Daftar Isi

1. [Arsitektur di Railway](#1-arsitektur-di-railway)
2. [Persiapan](#2-persiapan)
3. [Buat Project di Railway](#3-buat-project-di-railway)
4. [Setup MongoDB](#4-setup-mongodb)
5. [Deploy Backend (FastAPI)](#5-deploy-backend-fastapi)
6. [Deploy Frontend (Next.js)](#6-deploy-frontend-nextjs)
7. [Hubungkan Custom Domain](#7-hubungkan-custom-domain)
8. [Verifikasi Deployment](#8-verifikasi-deployment)
9. [Monitoring & Maintenance](#9-monitoring--maintenance)
10. [Troubleshooting](#10-troubleshooting)
11. [Estimasi Biaya](#11-estimasi-biaya)

---

## 1. Arsitektur di Railway

```
                    ┌─────────────────────────────┐
                    │        Railway Project       │
                    │                              │
  User ──────────► │  Frontend (Next.js)          │
  agedify.com      │    Port: $PORT               │
                    │    │                          │
                    │    │ /api/* (rewrite)         │
                    │    ▼                          │
                    │  Backend (FastAPI)            │
                    │    Port: 8001                 │
                    │    │                          │
                    │    ▼                          │
                    │  MongoDB Plugin               │
                    │    (Railway Managed)           │
                    └─────────────────────────────┘
```

**3 service dalam 1 project:**
- **Frontend**: Next.js (public, menerima traffic dari user)
- **Backend**: FastAPI (internal, hanya diakses oleh frontend)
- **MongoDB**: Plugin Railway (managed database)

---

## 2. Persiapan

### 2.1 Pastikan kode sudah di GitHub

Struktur repo harus seperti ini:
```
/
├── backend/
│   ├── app/
│   ├── server.py
│   ├── requirements.txt
│   └── .env          (JANGAN push ke GitHub!)
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── next.config.js
│   └── .env          (JANGAN push ke GitHub!)
└── ...
```

### 2.2 Pastikan `.gitignore` berisi:

```
backend/.env
frontend/.env
frontend/.next/
node_modules/
__pycache__/
*.pyc
uploads/
```

> **PENTING**: Jangan pernah push file `.env` ke GitHub. Environment variables diatur langsung di Railway.

---

## 3. Buat Project di Railway

### Langkah-langkah:

1. **Buka** [railway.app](https://railway.app) dan login
2. Klik **"New Project"**
3. Pilih **"Empty Project"**
4. Beri nama project: `agedify`

Setelah project dibuat, Anda akan melihat halaman project kosong. Kita akan menambahkan 3 service satu per satu.

---

## 4. Setup MongoDB

### 4.1 Tambahkan MongoDB Plugin

1. Di halaman project, klik **"+ New"** (tombol di kanan atas)
2. Pilih **"Database"**
3. Pilih **"MongoDB"**
4. Railway akan otomatis membuat MongoDB instance

### 4.2 Catat Connection String

1. Klik service MongoDB yang baru dibuat
2. Buka tab **"Variables"**
3. Cari variable `MONGO_URL` — ini adalah connection string yang akan digunakan backend
4. Format: `mongodb://mongo:password@containers-us-west-xxx.railway.app:PORT/railway`

> **Catatan**: Variable ini akan di-reference oleh backend service nanti. Anda tidak perlu copy-paste manual.

---

## 5. Deploy Backend (FastAPI)

### 5.1 Tambahkan Backend Service

1. Di halaman project, klik **"+ New"**
2. Pilih **"GitHub Repo"**
3. Pilih repository Agedify Anda
4. Railway akan menambahkan service baru

### 5.2 Konfigurasi Backend Service

1. Klik service yang baru ditambahkan
2. Buka tab **"Settings"**

#### Atur Root Directory:
```
backend
```
(Klik "Root Directory" dan ketik `backend`)

#### Atur Start Command:
```
uvicorn server:app --host 0.0.0.0 --port 8001
```

#### Atur Build Command (opsional, Railway biasanya auto-detect):
```
pip install -r requirements.txt
```

3. **Rename service** menjadi `backend` (klik nama service di atas, lalu edit)

### 5.3 Atur Environment Variables Backend

Buka tab **"Variables"** pada backend service, lalu tambahkan:

| Variable | Value | Keterangan |
|----------|-------|------------|
| `MONGO_URL` | `${{MongoDB.MONGO_URL}}` | Reference ke MongoDB plugin |
| `DB_NAME` | `agedify_db` | Nama database |
| `JWT_SECRET` | `buat-random-string-32-karakter-atau-lebih` | Secret untuk JWT token |
| `CORS_ORIGINS` | `https://agedify.com,https://www.agedify.com` | Domain yang diizinkan |
| `SITE_URL` | `https://agedify.com` | URL publik website |
| `PORT` | `8001` | Port backend |

> **Cara buat JWT_SECRET yang aman:**
> Buka terminal dan jalankan:
> ```bash
> python3 -c "import secrets; print(secrets.token_hex(32))"
> ```
> Copy hasilnya dan paste sebagai value `JWT_SECRET`.

> **Cara reference MongoDB:**
> Saat mengisi value `MONGO_URL`, ketik `${{` dan Railway akan menampilkan dropdown. Pilih `MongoDB` > `MONGO_URL`.

### 5.4 Atur Networking Backend

1. Buka tab **"Settings"** > bagian **"Networking"**
2. **JANGAN** generate public domain untuk backend (backend hanya diakses internal)
3. Pastikan **Private Networking** aktif (biasanya sudah aktif default)

Backend akan mendapat internal hostname: `backend.railway.internal`

---

## 6. Deploy Frontend (Next.js)

### 6.1 Tambahkan Frontend Service

1. Di halaman project, klik **"+ New"**
2. Pilih **"GitHub Repo"**
3. Pilih repository **yang sama** (Agedify)
4. Railway akan menambahkan service baru

### 6.2 Konfigurasi Frontend Service

1. Klik service frontend
2. Buka tab **"Settings"**

#### Atur Root Directory:
```
frontend
```

#### Atur Build Command:
```
yarn install && yarn build
```

#### Atur Start Command:
```
yarn start
```

3. **Rename service** menjadi `frontend`

### 6.3 Atur Environment Variables Frontend

Buka tab **"Variables"** pada frontend service, lalu tambahkan:

| Variable | Value | Keterangan |
|----------|-------|------------|
| `INTERNAL_BACKEND_URL` | `http://backend.railway.internal:8001` | URL internal backend |
| `NEXT_PUBLIC_SITE_URL` | `https://agedify.com` | URL publik (untuk SEO/meta) |
| `PORT` | `3000` | Port frontend |

> **PENTING**: `INTERNAL_BACKEND_URL` menggunakan Railway Private Networking.
> Format: `http://<nama-service-backend>.railway.internal:<port-backend>`
> 
> Jika Anda menamai backend service `backend` dan port-nya `8001`, maka:
> `http://backend.railway.internal:8001`

### 6.4 Atur Networking Frontend

1. Buka tab **"Settings"** > bagian **"Networking"**
2. Klik **"Generate Domain"** — ini akan membuat domain sementara untuk testing
3. Anda akan mendapat URL seperti: `agedify-frontend-production.up.railway.app`

> Domain ini untuk testing saja. Kita akan hubungkan custom domain nanti.

---

## 7. Hubungkan Custom Domain

### 7.1 Tambahkan Custom Domain di Railway

1. Buka frontend service > tab **"Settings"** > **"Networking"**
2. Klik **"+ Custom Domain"**
3. Ketik: `agedify.com`
4. Klik **"Add"**
5. Railway akan menampilkan **CNAME record** yang perlu Anda tambahkan di DNS

### 7.2 Konfigurasi DNS

Buka panel DNS domain registrar Anda (Namecheap, Cloudflare, GoDaddy, dll.) dan tambahkan:

#### Untuk `agedify.com` (root domain):

| Type | Host/Name | Value | TTL |
|------|-----------|-------|-----|
| CNAME | `@` | `<value-dari-railway>.up.railway.app` | 300 |

> **Catatan untuk root domain (tanpa www):**
> Beberapa registrar tidak mendukung CNAME di root domain. Alternatif:
> - Gunakan **Cloudflare** (gratis) yang mendukung CNAME flattening di root
> - Atau tambahkan domain `www.agedify.com` dan redirect root ke www

#### Untuk `www.agedify.com` (opsional tapi direkomendasikan):

| Type | Host/Name | Value | TTL |
|------|-----------|-------|-----|
| CNAME | `www` | `<value-dari-railway>.up.railway.app` | 300 |

### 7.3 Tunggu Propagasi DNS

- Biasanya selesai dalam **5-30 menit**
- Bisa cek status di: [dnschecker.org](https://dnschecker.org)
- Railway akan otomatis memproses **SSL certificate** setelah DNS propagasi selesai

### 7.4 Update CORS di Backend

Setelah domain aktif, pastikan `CORS_ORIGINS` di backend environment variables sudah termasuk domain baru:

```
https://agedify.com,https://www.agedify.com
```

---

## 8. Verifikasi Deployment

Setelah semua service running, test endpoint berikut:

### 8.1 Backend Health Check
```bash
# Melalui frontend (internal proxy)
curl https://agedify.com/api/health
# Expected: {"status":"healthy","timestamp":"..."}
```

### 8.2 Homepage
Buka browser dan akses: `https://agedify.com`
- Homepage harus tampil dengan benar
- Navigation berfungsi
- Domain list tampil dengan harga

### 8.3 Currency API
```bash
curl https://agedify.com/api/currencies
# Expected: {"currencies":[...],"last_updated":"...","source":"open.er-api.com"}
```

### 8.4 Admin Login
1. Buka `https://agedify.com/admin/login`
2. Login dengan: `admin` / `admin123`
3. Dashboard harus tampil

> **PENTING**: Segera ganti password admin default setelah deploy!

---

## 9. Monitoring & Maintenance

### 9.1 Melihat Logs

1. Buka service di Railway
2. Klik tab **"Logs"**
3. Pilih **"Deploy Logs"** (saat build) atau **"Runtime Logs"** (saat running)

### 9.2 Auto-Deploy

Railway otomatis re-deploy setiap kali Anda push ke branch `main` di GitHub.
- Push code baru → Railway detect → Build → Deploy → Live!

### 9.3 Rollback

Jika deploy baru bermasalah:
1. Buka service > tab **"Deployments"**
2. Cari deployment sebelumnya yang working
3. Klik **"..."** > **"Rollback"**

### 9.4 Database Backup

Railway MongoDB tidak menyediakan auto-backup. Lakukan manual backup berkala:

```bash
# Export database (jalankan dari local)
mongodump --uri="mongodb://...connection-string-dari-railway..." --out=./backup-$(date +%Y%m%d)
```

---

## 10. Troubleshooting

### Error: "Build failed" pada Frontend

**Penyebab**: `INTERNAL_BACKEND_URL` tidak di-set saat build
**Solusi**: Pastikan environment variable `INTERNAL_BACKEND_URL` sudah ditambahkan di frontend service SEBELUM deploy

### Error: "Cannot connect to MongoDB"

**Penyebab**: `MONGO_URL` tidak benar
**Solusi**:
1. Cek apakah MongoDB service running (lihat status di project)
2. Cek apakah `MONGO_URL` reference benar: `${{MongoDB.MONGO_URL}}`
3. Cek logs backend untuk error detail

### Error: "502 Bad Gateway" saat akses /api/*

**Penyebab**: Frontend tidak bisa reach backend via internal network
**Solusi**:
1. Pastikan backend service running (cek logs)
2. Pastikan `INTERNAL_BACKEND_URL` = `http://backend.railway.internal:8001`
3. Pastikan backend listen di port `8001` (cek start command)
4. Pastikan Private Networking aktif di kedua service

### Error: "CORS error" di browser console

**Penyebab**: Domain tidak ditambahkan ke CORS_ORIGINS
**Solusi**: Update `CORS_ORIGINS` di backend variables:
```
https://agedify.com,https://www.agedify.com,https://agedify-frontend-production.up.railway.app
```

### Halaman kosong / blank putih

**Penyebab**: Frontend build gagal atau crash saat start
**Solusi**:
1. Cek frontend deploy logs (apakah build sukses?)
2. Cek runtime logs (apakah ada error saat `next start`?)
3. Pastikan `yarn build` sukses tanpa error

### Gambar upload tidak tampil

**Penyebab**: Railway filesystem bersifat ephemeral (reset setiap deploy)
**Solusi**: Untuk production, gunakan cloud storage seperti:
- Cloudinary (gratis tier generous)
- AWS S3
- Railway Volume (tambahkan volume ke backend service)

Untuk menambahkan Railway Volume:
1. Buka backend service > Settings
2. Scroll ke bagian "Volumes"
3. Klik "+ New Volume"
4. Mount path: `/app/backend/uploads`

---

## 11. Estimasi Biaya

### Railway Pricing (per bulan):

| Service | Estimasi | Keterangan |
|---------|----------|------------|
| Frontend (Next.js) | ~$3-5 | Tergantung traffic |
| Backend (FastAPI) | ~$2-4 | Tergantung API calls |
| MongoDB Plugin | ~$5-7 | 1GB storage included |
| **Total** | **~$10-16/bulan** | Traffic rendah-sedang |

### Tips Hemat:
- Railway memberikan **$5 free credit** per bulan pada plan Hobby ($5/bulan)
- Total biaya efektif: **~$10-16/bulan** (sudah termasuk plan Hobby)
- Monitor usage di Railway dashboard untuk optimasi

---

## Quick Reference

### Environment Variables Summary

**Backend:**
```
MONGO_URL=${{MongoDB.MONGO_URL}}
DB_NAME=agedify_db
JWT_SECRET=<random-32-char-string>
CORS_ORIGINS=https://agedify.com,https://www.agedify.com
SITE_URL=https://agedify.com
PORT=8001
```

**Frontend:**
```
INTERNAL_BACKEND_URL=http://backend.railway.internal:8001
NEXT_PUBLIC_SITE_URL=https://agedify.com
PORT=3000
```

### Service Configuration

**Backend:**
- Root Directory: `backend`
- Start Command: `uvicorn server:app --host 0.0.0.0 --port 8001`
- Networking: Private only (no public domain)

**Frontend:**
- Root Directory: `frontend`
- Build Command: `yarn install && yarn build`
- Start Command: `yarn start`
- Networking: Public domain + Custom domain (agedify.com)

---

## Checklist Deploy

- [ ] Buat project Railway
- [ ] Tambahkan MongoDB plugin
- [ ] Deploy backend service (root dir: `backend`)
- [ ] Set backend environment variables
- [ ] Deploy frontend service (root dir: `frontend`)
- [ ] Set frontend environment variables
- [ ] Generate domain sementara untuk testing
- [ ] Test semua endpoint via domain sementara
- [ ] Tambahkan custom domain `agedify.com`
- [ ] Konfigurasi DNS di domain registrar
- [ ] Tunggu propagasi DNS & SSL
- [ ] Test final dengan custom domain
- [ ] Ganti password admin default!
- [ ] (Opsional) Tambahkan Railway Volume untuk uploads
