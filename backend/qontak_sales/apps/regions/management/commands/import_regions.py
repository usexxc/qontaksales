import csv
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from qontak_sales.apps.regions.models import (
    Country,
    District,
    Province,
    Regency,
    Village,
)

BATCH_SIZE = 5000


def read_csv(path):
    """Baca CSV ida_* (kolom: "id","name", CRLF)."""
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            yield row["id"].strip(), row["name"].strip()


class Command(BaseCommand):
    help = (
        "Import data wilayah Indonesia dari CSV "
        "(backend/data/regions/ida_*.csv): negara, provinsi, "
        "kabupaten/kota, kecamatan, kelurahan/desa."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--source",
            default=None,
            help="Path folder berisi ida_provinsi.csv dll. "
            "Default: backend/data/regions.",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Hapus data wilayah lama lalu import ulang.",
        )
        parser.add_argument(
            "--skip-villages",
            action="store_true",
            help="Lewati kelurahan/desa (83rb baris) biar cepat.",
        )

    def handle(self, *args, **options):
        if options["source"]:
            base = Path(options["source"])
        else:
            base = Path(__file__).resolve().parents[5] / "data" / "regions"

        provinsi_csv = base / "ida_provinsi.csv"
        if not provinsi_csv.exists():
            raise CommandError(f"File tidak ditemukan: {provinsi_csv}")

        if Province.objects.exists() and not options["force"]:
            raise CommandError(
                "Data wilayah sudah ada. Pakai --force untuk import ulang."
            )

        with transaction.atomic():
            if options["force"]:
                Village.objects.all().delete()
                District.objects.all().delete()
                Regency.objects.all().delete()
                Province.objects.all().delete()
                Country.objects.all().delete()

            country = Country.objects.create(code="ID", name="Indonesia")
            self.stdout.write("Negara: 1 (Indonesia)")

            prov_by_code = {}
            for code, name in read_csv(provinsi_csv):
                prov_by_code[code] = Province.objects.create(
                    code=code, country=country, name=name
                )
            self.stdout.write(f"Provinsi: {len(prov_by_code)}")

            reg_by_code = {}
            kab_csv = base / "ida_kabupaten_kota.csv"
            for code, name in read_csv(kab_csv):
                parent_code = code.rsplit(".", 1)[0]
                province = prov_by_code.get(parent_code)
                if province is None:
                    raise CommandError(
                        f"Kabupaten {code} merujuk provinsi {parent_code} "
                        "yang tidak ditemukan."
                    )
                reg_by_code[code] = Regency.objects.create(
                    code=code, province=province, name=name
                )
            self.stdout.write(f"Kabupaten/Kota: {len(reg_by_code)}")

            dist_by_code = {}
            dist_buffer = []
            kec_csv = base / "ida_kecamatan.csv"
            for code, name in read_csv(kec_csv):
                parent_code = code.rsplit(".", 1)[0]
                regency = reg_by_code.get(parent_code)
                if regency is None:
                    raise CommandError(
                        f"Kecamatan {code} merujuk kabupaten {parent_code} "
                        "yang tidak ditemukan."
                    )
                dist = District(code=code, regency=regency, name=name)
                dist_buffer.append(dist)
                if len(dist_buffer) >= BATCH_SIZE:
                    created = District.objects.bulk_create(dist_buffer)
                    for d in created:
                        dist_by_code[d.code] = d
                    dist_buffer = []
            created = District.objects.bulk_create(dist_buffer)
            for d in created:
                dist_by_code[d.code] = d
            self.stdout.write(f"Kecamatan: {len(dist_by_code)}")

            if options["skip_villages"]:
                self.stdout.write("Kelurahan: dilewati (--skip-villages)")
            else:
                kel_csv = base / "ida_kelurahan.csv"
                village_buffer = []
                village_count = 0
                for code, name in read_csv(kel_csv):
                    parent_code = code.rsplit(".", 1)[0]
                    district = dist_by_code.get(parent_code)
                    if district is None:
                        raise CommandError(
                            f"Kelurahan {code} merujuk kecamatan "
                            f"{parent_code} yang tidak ditemukan."
                        )
                    village_buffer.append(
                        Village(code=code, district=district, name=name)
                    )
                    if len(village_buffer) >= BATCH_SIZE:
                        Village.objects.bulk_create(village_buffer)
                        village_count += len(village_buffer)
                        village_buffer = []
                Village.objects.bulk_create(village_buffer)
                village_count += len(village_buffer)
                self.stdout.write(f"Kelurahan/Desa: {village_count}")

        self.stdout.write(self.style.SUCCESS("Import wilayah selesai."))
