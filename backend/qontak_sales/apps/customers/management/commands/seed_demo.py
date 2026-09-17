"""Seed data demo: agent + customer untuk perusahaan si manager.

Pakai: python manage.py seed_demo --email manager@test.com
Password agent demo: Agent12345
"""
import random

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from qontak_sales.apps.accounts.models import Company
from qontak_sales.apps.customers.models import Customer
from qontak_sales.apps.regions.models import (
    Country,
    District,
    Province,
    Regency,
    Village,
)

User = get_user_model()

AGENTS = [
    ("siti", "Siti", "Aminah", "0812-3456-7801"),
    ("budi", "Budi", "Santoso", "0812-3456-7802"),
    ("rina", "Rina", "Melati", "0812-3456-7803"),
    ("jojo", "Joko", "Wibowo", "0812-3456-7804"),
    ("dewi", "Dewi", "Lestari", "0812-3456-7805"),
    ("agus", "Agus", "Hermansyah", "0812-3456-7806"),
]

CUSTOMERS = [
    ("PT Sinar Abadi", "Andi", "JAYA TEKNIK", "Jakarta Selatan"),
    ("CV Makmur Sentosa", "Lina", "MAKMUR GROUP", "Bandung"),
    ("PT Global Retailindo", "Tono", "GLOBAL RETAIL", "Surabaya"),
    ("Toko Mitra Sejahtera", "Eka", "MITRA SEAHTERA", "Semarang"),
    ("PT Digital Nusantara", "Wati", "DIGITAL NUSANTARA", "Yogyakarta"),
    ("UD Karya Mandiri", "Rudi", "KARYA MANDIRI", "Medan"),
    ("PT Bangun Persada", "Sari", "BANGUN PERSADA", "Makassar"),
    ("Toko Berkah Jaya", "Ucok", "BERKAH JAYA", "Palembang"),
    ("PT Agro Lestari", "Mega", "AGRO LESTARI", "Bandar Lampung"),
    ("CV Borneo Mas", "Fajar", "BORNEO MAS", "Balikpapan"),
    ("PT Bahari Sukses", "Dina", "BAHARI SUKSES", "Manado"),
    ("Toko Rame Sentosa", "Iwan", "RAME SENTOSA", "Denpasar"),
    ("PT Cendana Media", "Vera", "CENDANA MEDIA", "Jakarta Pusat"),
    ("CV Slamet Transport", "Koko", "SLAMET TRANSPORT", "Cirebon"),
    ("PT Laju Sejahtera", "Nia", "LAJU SEJAHTERA", "Malang"),
    ("Toko Baru Rejeki", "Ombak", "BARU REJEKI", "Padang"),
    ("PT Nusa Wisata", "Rara", "NUSA WISATA", "Mataram"),
    ("CV Inti Elektrik", "Bayu", "INTI ELEKTRIK", "Bekasi"),
    ("PT Tani Subur", "Joko", "TANI SUBUR", "Bogor"),
    ("Toko Gaya Mandiri", "Sisi", "GAYA MANDIRI", "Solo"),
    ("PT Pelita Energi", "Danu", "PELITA ENERGI", "Balikpapan"),
    ("CV Rasa Nusantara", "Mpok", "RASA NUSANTARA", "Tangerang"),
    ("PT Sentra Logam", "Aldi", "SENTRA LOGAM", "Cilegon"),
    ("Toko Mekar Sari", "Nina", "MEKAR SARI", "Banyuwangi"),
    ("PT Angkasa Prima", "Rey", "ANGKASA PRIMA", "Jakarta Barat"),
    ("CV Laut Biru", "Mila", "LAUT BIRU", "Bitung"),
    ("PT Kertas Jaya", "Tejo", "KERTAS JAYA", "Cikarang"),
    ("Toko Amanah", "Ugi", "AMANAH STORE", "Depok"),
    ("PT Fast Logistikk", "Leni", "FAST LOGISTIK", "Tangerang Selatan"),
    ("CV Kopi Enak", "Wawan", "KOPI ENAK", "Bandung"),
    ("PT Media Kreatif", "Sisha", "MEDIA KREATIF", "Yogyakarta"),
    ("Toko Sembako Murah", "Pak De", "SEMBAKO MURAH", "Semarang"),
]

STATUSES = ["CUSTOMER"] * 14 + ["PROSPECT"] * 13 + ["INACTIVE"] * 5


class Command(BaseCommand):
    help = "Isi data demo agent + customer (idempotent, aman dijalankan ulang)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--email",
            default="manager@test.com",
            help="Email manager pemilik data (default: manager@test.com)",
        )

    def handle(self, *args, **opts):
        mgr = User.objects.filter(email__iexact=opts["email"]).first()
        if not mgr:
            raise CommandError(f"Manager '{opts['email']}' gak ditemukan.")
        company, _ = Company.objects.get_or_create(name="PT Test")

        negara = Country.objects.first()
        provinces = list(Province.objects.all())
        if not provinces:
            raise CommandError(
                "Data wilayah kosong. Jalankan dulu: python manage.py import_regions"
            )

        random.seed(42)

        # bikin / refresh akun agent demo
        for uname, first, last, phone in AGENTS:
            email = f"{uname}@{company.name.lower().replace(' ', '')}.test"
            user = User.objects.filter(email=email).first()
            if not user:
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password="***",
                    first_name=first,
                    last_name=last,
                    phone=phone,
                    role="AGENT",
                )
            else:
                user.role = "AGENT"
                user.is_active = True
                user.save()
        agents = list(User.objects.filter(role="AGENT", is_active=True))
        self.stdout.write(f"Agent aktif: {len(agents)}")

        # isi data customer demo
        n_new = n_upd = 0
        for i, (pt, contact, brand, city) in enumerate(CUSTOMERS):
            email = f"kontak{i+1}@{brand.lower().replace(' ', '')}.co.id"
            province = random.choice(provinces)
            regency = random.choice(list(Regency.objects.filter(province=province)))
            district = random.choice(list(District.objects.filter(regency=regency)))
            village = random.choice(list(Village.objects.filter(district=district)))
            defaults = dict(
                company_name=pt,
                email=email,
                phone=f"021-{1000000 + i * 7777}",
                address=f"Jl. {brand.title()} No. {i + 1}, {city}",
                country=negara,
                province=province,
                regency=regency,
                district=district,
                village=village,
                status=STATUSES[i % len(STATUSES)],
                agent=random.choice(agents),
                notes="Data demo untuk testing." if i % 3 == 0 else "",
            )
            _, created = Customer.objects.update_or_create(name=contact, defaults=defaults)
            n_new += created
            n_upd += not created
        self.stdout.write(
            self.style.SUCCESS(
                f"Customer baru: {n_new}, diperbarui: {n_upd}, total: {Customer.objects.count()}"
            )
        )
        self.stdout.write("Login agent demo: siti@pttest.test / Agent12345")
