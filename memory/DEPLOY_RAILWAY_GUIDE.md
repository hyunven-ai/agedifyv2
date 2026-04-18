# Panduan Deploy Agedify ke Railway

## Prasyarat
- Akun GitHub (untuk push kode)
- Akun Railway (https://railway.app) — daftar gratis pakai GitHub
- Akun MongoDB Atlas (https://mongodb.com/atlas) — gratis tier M0

---

## Langkah 1: Siapkan MongoDB Atlas

1. Buka https://cloud.mongodb.com → Buat akun / Login
2. Klik **"Build a Database"** → Pilih **M0 FREE**
3. Pilih region terdekat (Singapore untuk Indonesia)
4. Buat database user:
   - Username: `agedify_admin`
   - Password: (catat password-nya)
5. Di **Network Access** → Klik **"Add IP Address"** → **"Allow Access from Anywhere"** (0.0.0.0/0)
6. Klik **"Connect"** → **"Drivers"** → Copy connection string:
   ```
   mongodb+srv://agedify_admin:<password>@cluster0.xxxxx.mongodb.net/mostdomain_db?retryWrites=true&w=majority
   ```
   Ganti `<password>` dengan password yang tadi dibuat.

---

## Langkah 2: Push Kode ke GitHub

1. Buat repository baru di GitHub (misal: `agedify`)
2. Push kode dari Emergent ke GitHub:
   - Di Emergent, klik **"Save to GitHub"** di chat input
   - Atau download kode dan push manual

---

## Langkah 3: Setup Railway

### A. Buat Project Baru
1. Buka https://railway.app → Login dengan GitHub
2. Klik **"New Project"** → **"Deploy from GitHub Repo"**
3. Pilih repository `agedify`

### B. Deploy Backend (FastAPI)
1. Klik **"New Service"** → **"GitHub Repo"** → Pilih repo yang sama
2. Di **Settings**:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port 8001`
3. Di **Variables**, tambahkan:
   ```
   MONGO_URL=mongodb+srv://agedify_admin:PASSWORD@cluster0.xxxxx.mongodb.net/mostdomain_db?retryWrites=true&w=majority
   DB_NAME=mostdomain_db
   CORS_ORIGINS=*
   JWT_SECRET=buat-secret-key-yang-panjang-dan-random-disini
   SITE_URL=https://nama-app.up.railway.app
   PORT=8001
   ```
4. Di **Networking** → Generate domain (misal: `agedify-api.up.railway.app`)

### C. Deploy Frontend (Next.js)
1. Klik **"New Service"** → **"GitHub Repo"** → Pilih repo yang sama
2. Di **Settings**:
   - **Root Directory**: `frontend`
   - **Build Command**: `yarn install && yarn build`
   - **Start Command**: `yarn start`
3. Di **Variables**, tambahkan:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://agedify-api.up.railway.app
   NEXT_PUBLIC_SITE_URL=https://agedify.up.railway.app
   REACT_APP_BACKEND_URL=https://agedify-api.up.railway.app
   ```
4. Di **Networking** → Generate domain (misal: `agedify.up.railway.app`)

---

## Langkah 4: Update CORS & URL

Setelah kedua service berjalan:
1. Buka backend service → **Variables**
2. Update:
   ```
   CORS_ORIGINS=https://agedify.up.railway.app
   SITE_URL=https://agedify.up.railway.app
   ```
3. Railway akan auto-redeploy

---

## Langkah 5: Custom Domain (agedify.com)

1. Di Railway, buka **frontend service** → **Settings** → **Networking**
2. Klik **"Custom Domain"** → Masukkan `agedify.com`
3. Railway akan berikan CNAME record
4. Di DNS provider domain Anda, tambahkan:
   ```
   Type: CNAME
   Name: @  (atau www)
   Value: [CNAME dari Railway]
   ```
5. Tunggu propagasi DNS (5-30 menit)
6. Update semua URL di Variables kedua service:
   ```
   # Backend Variables
   CORS_ORIGINS=https://agedify.com
   SITE_URL=https://agedify.com

   # Frontend Variables
   NEXT_PUBLIC_BACKEND_URL=https://agedify-api.up.railway.app
   NEXT_PUBLIC_SITE_URL=https://agedify.com
   ```

---

## Langkah 6: Buat Admin Pertama

Setelah deploy berhasil, jalankan di terminal:
```bash
curl -X POST https://agedify-api.up.railway.app/api/admin/setup \
  -H "Content-Type: application/json" \
  -d '{"username":"play","password":"play123"}'
```

Atau ganti URL dengan domain custom jika sudah di-set.

---

## Langkah 7: Verifikasi

Cek semua berfungsi:
```bash
# Health check frontend
curl https://agedify.up.railway.app/health

# Health check backend
curl https://agedify-api.up.railway.app/health

# Test login admin
curl -X POST https://agedify-api.up.railway.app/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"play","password":"play123"}'
```

---

## Estimasi Biaya Railway

| Item | Biaya |
|------|-------|
| Backend (FastAPI) | ~$5/bulan |
| Frontend (Next.js) | ~$5/bulan |
| MongoDB Atlas M0 | GRATIS |
| **Total** | **~$10/bulan** |

Railway memberikan $5 free credit per bulan untuk akun Hobby ($5/bulan).
Total: sekitar **$5-10/bulan** untuk production.

---

## Tips

- **Auto Deploy**: Railway auto-deploy setiap push ke GitHub
- **Logs**: Klik service → "Logs" untuk debug
- **Scaling**: Upgrade RAM/CPU langsung dari Railway dashboard
- **Backup DB**: MongoDB Atlas punya backup otomatis di tier berbayar
