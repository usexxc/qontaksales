# QontakSales CRM

Multi-tenant CRM sederhana: Login/Register (JWT), Dashboard, Agents, Customers (dengan wilayah Indonesia berjenjang: negara → provinsi → kabupaten/kota → kecamatan → kelurahan/desa), Chart of Accounts (COA).

## Stack
- **Backend**: Django 5.1 + DRF + SimpleJWT + PostgreSQL + Pillow (avatar) + openpyxl (import Excel)
- **Frontend**: React 19 + Vite 6 + Tailwind CSS v4 + Axios + React Router (tanpa library UI — Chakra sudah dicopot)

## Prasyarat
- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL 14+** yang jalan di `localhost:5432`
- Database kosong bernama `qontak_sales`

## Setup

### 1. Siapkan PostgreSQL
```bash
sudo -u postgres psql -c "CREATE USER qontak WITH PASSWORD 'rahasiamu';"
sudo -u postgres psql -c "CREATE DATABASE qontak_sales OWNER qontak;"
```
Kalau pakai user `postgres` bawaan, cukup `createdb qontak_sales` lalu isi `DB_USER`/`DB_PASSWORD` di `.env` sesuai.

### 2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # edit DB_USER / DB_PASSWORD / SECRET_KEY
python manage.py migrate
python manage.py import_regions   # isi data wilayah (perlu untuk dropdown customer)
python manage.py seed_coa         # isi contoh Chart of Accounts
python manage.py runserver        # http://127.0.0.1:8000
```

`import_regions` membaca CSV di `backend/data/regions/` (sudah ikut di repo, ~90rb baris kelurahan). Pakai `--skip-villages` kalau cuma butuh provinsi/kabupaten/kecamatan, dan `--force` untuk import ulang.

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_URL, default http://localhost:8000/api
npm run dev                   # http://127.0.0.1:5173
```

Backend harus jalan dulu — `CORS_ALLOWED_ORIGINS` hanya mengizinkan origin `localhost:5173` / `5174`.

### 4. Akun pertama
Buat akun manager lewat halaman **Register** di frontend, atau:
```bash
python manage.py createsuperuser   # login via /admin/
```

### 5. (Opsional) Data demo
```bash
python manage.py seed_demo --email manager@email-kamu.com
```
Mengisi 6 agent + 32 customer contoh untuk perusahaan manager tersebut. Semua data fiktif (email domain `.test` / `.co.id` contoh).

## Struktur
- `backend/qontak_sales/apps/accounts` — Company, CustomUser (role MANAGER/AGENT), auth JWT, CRUD agent, dashboard stats
- `backend/qontak_sales/apps/customers` — Customer per perusahaan + wilayah FK berjenjang, scoping agent/manager, import/export Excel
- `backend/qontak_sales/apps/coa` — COA per perusahaan (tulis khusus manager)
- `backend/qontak_sales/apps/regions` — hierarki wilayah (negara s/d kelurahan) + API filter per induk
- `backend/data/regions/*.csv` — data wilayah Indonesia, sumber: repo GitHub `alifbint/indonesia-38-provinsi`
- `frontend/src/pages` — Login, Register, Dashboard, Agents, Customers, COA

## Endpoint utama
| Method | Path | Akses |
|---|---|---|
| POST | `/api/auth/register/` | publik |
| POST | `/api/token/` | publik (email + password) |
| POST | `/api/token/refresh/` | publik |
| GET/PUT | `/api/auth/profile/` | login |
| GET | `/api/dashboard/stats/` | login |
| CRUD | `/api/agents/` | manager |
| CRUD | `/api/customers/` | login (scoped per perusahaan) |
| POST | `/api/customers/import/` | login (upload .xlsx) |
| GET | `/api/customers/template/` | login (unduh template) |
| GET | `/api/customers/export/` | login |
| GET | `/api/regions/countries/` | login |
| GET | `/api/regions/provinces/?country=<id>` | login |
| GET | `/api/regions/regencies/?province=<id>` | login |
| GET | `/api/regions/districts/?regency=<id>` | login |
| GET | `/api/regions/villages/?district=<id>` | login |
| CRUD | `/api/coa/` | read: login, write: manager |

## Testing & lint
```bash
cd backend && python manage.py test qontak_sales
cd frontend && npm run lint
```

## Catatan penting
- **Multi-tenant**: semua data (customers, COA, agents) otomatis discoping per `company` user yang login.
- **Wilayah**: dropdown berjenjang (negara/provinsi/kabupaten/kecamatan/kelurahan), datanya diimpor dari CSV Kemendagri ke app `regions` lewat `python manage.py import_regions`. Sumber: repo GitHub `alifbint/indonesia-38-provinsi`.
- **Soft delete agent**: DELETE `/api/agents/:id/` cuma menonaktifkan (`is_active=False`), riwayat customer tetap.
- **Pagination**: list API pakai `PageNumberPagination`, 25/halaman.
- **Data demo**: file `import-customer-demo.xlsx` berisi data fiktif untuk mencoba fitur import.

## Lisensi
MIT — lihat [LICENSE](LICENSE).
