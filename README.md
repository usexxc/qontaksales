# QontakSales CRM

Multi-tenant CRM sederhana: Login/Register (JWT), Dashboard, Agents, Customers (dengan wilayah Indonesia berjenjang: negara → provinsi → kabupaten/kota → kecamatan → kelurahan/desa), Chart of Accounts (COA).

## Stack
- **Backend**: Django 5.1 + DRF + SimpleJWT + PostgreSQL + Pillow (avatar)
- **Frontend**: React 19 + Vite + Tailwind CSS v4 + Axios + React Router (tanpa library UI — Chakra sudah dicopot)

## Prasyarat
- Python 3.11+
- Node.js 18+
- **PostgreSQL** yang jalan di `localhost:5432`, dengan user/password sesuai `backend/.env`
- Database `qontak_sales` (buat sekali: `createdb qontak_sales` sebagai user postgres)

## Menjalankan
### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       
python manage.py migrate
python manage.py seed_coa   
python manage.py runserver  
```

### Frontend
```bash
cd frontend
npm install
npm run dev                
```

Buat akun manager pertama lewat halaman **Register** di frontend,
atau superuser: `python manage.py createsuperuser` (login via `/admin/`).

## Struktur
- `backend/qontak_sales/apps/accounts` — Company, CustomUser (role MANAGER/AGENT), auth JWT, CRUD agent, dashboard stats
- `backend/qontak_sales/apps/customers` — Customer per perusahaan + wilayah FK berjenjang, scoping agent/manager
- `backend/qontak_sales/apps/coa` — COA per perusahaan (tulis khusus manager)
- `backend/qontak_sales/apps/regions` — hierarki wilayah (negara s/d kelurahan) + API filter per induk
- `frontend/src/pages` — Login, Register, Dashboard, Agents, Customers, COA

## Catatan penting
- **Multi-tenant**: semua data (customers, COA, agents) otomatis discoping per `company` user yang login.
- **Wilayah**: dropdown berjenjang (negara/provinsi/kabupaten/kecamatan/kelurahan), datanya diimpor dari CSV Kemendagri ke app `regions` lewat `python manage.py import_regions`. Sumber: repo GitHub `alifbint/indonesia-38-provinsi`.
- **Soft delete agent**: DELETE `/api/agents/:id/` cuma menonaktifkan (`is_active=False`), riwayat customer tetap.
- **Pagination**: list API pakai `PageNumberPagination`, 25/halaman.
- **Test backend**: `python manage.py test qontak_sales`
- **Lint frontend**: `npm run lint` (eslint flat config)

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
| GET | `/api/regions/countries/` | login |
| GET | `/api/regions/provinces/?country=<id>` | login |
| GET | `/api/regions/regencies/?province=<id>` | login |
| GET | `/api/regions/districts/?regency=<id>` | login |
| GET | `/api/regions/villages/?district=<id>` | login |
| CRUD | `/api/coa/` | read: login, write: manager |
