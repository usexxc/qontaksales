import csv
import io

from django.http import HttpResponse
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, PatternFill
from rest_framework import status, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from qontak_sales.apps.accounts.models import CustomUser
from qontak_sales.apps.regions.models import District, Province, Regency, Village

from .models import Customer
from .serializers import CustomerSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Customer.objects.select_related("agent").order_by("-created_at")
        if user.role == "MANAGER":
            return qs.filter(company=user.company)
        return qs.filter(company=user.company, agent=user)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == "MANAGER":
            serializer.save(company=user.company)
        else:
            serializer.save(agent=user, company=user.company)

# header Excel boleh bebas, yang penting kena kata kuncinya
HEADER_MAP = [
    (lambda h: "nama perusahaan" in h, "company_name"),
    (lambda h: h.startswith("nama") or "company_name" in h, "name"),
    (lambda h: "agent" in h, "agent"),
    (lambda h: "email" in h and "agent" not in h, "email"),
    (lambda h: "telepon" in h or "phone" in h or "hp" in h, "phone"),
    (lambda h: "alamat" in h or "address" in h, "address"),
    (lambda h: "provinsi" in h, "province_code"),
    (lambda h: "kabupaten" in h or "kota" in h, "regency_code"),
    (lambda h: "kecamatan" in h or "district" in h, "district_code"),
    (lambda h: "kelurahan" in h or "desa" in h or "village" in h, "village_code"),
    (lambda h: "status" in h, "status"),
    (lambda h: "catatan" in h or "note" in h, "notes"),
]

VALID_STATUS = {"PROSPECT", "CUSTOMER", "INACTIVE"}

def normalize_code(value):
    if value is None:
        return ""
    text = str(value).strip()
    if not text:
        return ""
    parts = text.split(".")
    out = [parts[0].zfill(2)]
    for p in parts[1:]:
        out.append(p.zfill(4) if len(out) == 3 else p.zfill(2))
    return ".".join(out)


class CustomerImportView(APIView):
    """Import customer massal dari Excel (.xlsx) atau CSV (.csv)."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    MAX_ROWS = 2000

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response(
                {"detail": "Tidak ada file. Upload file .xlsx atau .csv."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        name = file.name.lower()
        try:
            if name.endswith(".xlsx"):
                rows = self._read_xlsx(file)
            elif name.endswith(".csv"):
                rows = self._read_csv(file)
            else:
                return Response(
                    {"detail": "Format file harus .xlsx (Excel) atau .csv."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        if len(rows) < 2:
            return Response(
                {"detail": "File kosong atau cuma ada header tanpa data."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        col_map = self._map_headers(rows[0])
        if "name" not in col_map:
            return Response(
                {"detail": "Header 'Nama' gak ditemukan. Kolom minimal: Nama."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data_rows = rows[1:]
        if len(data_rows) > self.MAX_ROWS:
            return Response(
                {"detail": f"Maksimal {self.MAX_ROWS} baris per import (file ini {len(data_rows)})."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created, updated, errors = 0, 0, []
        for i, row in enumerate(data_rows, start=2):  # row 1 = header
            record = self._read_row(row, col_map)
            if not any(record.values()):
                continue  # baris kosong, lewatin
            problem = self._import_one(user, record)
            if problem == "created":
                created += 1
            elif problem == "updated":
                updated += 1
            else:
                errors.append({"row": i, "name": record.get("name") or "-", "message": problem})

        return Response({
            "total": created + updated + len(errors),
            "created": created,
            "replaced": updated,
            "failed": len(errors),
            "errors": errors[:50],  # biar response gak kegedean
            "errors_truncated": len(errors) > 50,
        })

    def _read_xlsx(self, file):
        """Baca .xlsx jadi list of rows (tuple nilai per baris)."""
        try:
            wb = load_workbook(file, data_only=True, read_only=True)
        except Exception:
            raise ValueError(
                "File Excel gak bisa dibaca. Pastikan .xlsx asli, bukan diganti ekstensinya."
            )
        sheet = wb.active
        rows = list(sheet.iter_rows(values_only=True))
        wb.close()
        return rows

    def _read_csv(self, file):
        """Baca .csv jadi list of rows, format sama kayak _read_xlsx.

        Dateng dari export kita sendiri (BOM + delimiter koma), tapi
        tetap siapin delimiter lain (titik-koma/tab) biar gak mati pas
        user save-an Excel default negara lain.
        """
        # BOM dibuang manual soalnya utf-8-sig cuma jalan kalau file dibuka
        # dari path; dari upload kita baca bytes mentah
        raw = file.read().decode("utf-8-sig")
        if not raw.strip():
            raise ValueError("File CSV kosong.")

        sample = raw[:2048]
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t")
        except csv.Error:
            dialect = csv.excel  # default: koma

        rows = list(csv.reader(io.StringIO(raw), dialect))
        return [tuple(row) for row in rows if row]

    def _map_headers(self, header_row):
        mapping = {}
        for idx, cell in enumerate(header_row):
            # xlsx kasih None untuk cell kosong, CSV kasih string kosong
            if cell is None or str(cell).strip() == "":
                continue
            text = str(cell).strip().lower()
            for match, field in HEADER_MAP:
                # cek berurutan: "nama perusahaan" musti menang dari "nama"
                if match(text):
                    mapping[field] = idx
                    break
        return mapping

    def _read_row(self, row, col_map):
        record = {}
        for field, idx in col_map.items():
            value = row[idx] if idx < len(row) else None
            record[field] = "" if value is None else str(value).strip()
        return record

    def _resolve_region(self, record):
        """Kode kemendagri di Excel -> objek wilayah. Return (dict|None, error)."""
        result, error = {}, None

        def check(obj, label, code):
            nonlocal error
            if obj is None and code:
                error = f"{label} dengan kode '{code}' tidak ditemukan."
            return obj

        prov = check(
            Province.objects.filter(code=normalize_code(record.get("province_code"))).first()
            if record.get("province_code") else None,
            "Provinsi", record.get("province_code"),
        )
        reg = check(
            Regency.objects.filter(code=normalize_code(record.get("regency_code"))).first()
            if record.get("regency_code") else None,
            "Kabupaten/Kota", record.get("regency_code"),
        )
        dist = check(
            District.objects.filter(code=normalize_code(record.get("district_code"))).first()
            if record.get("district_code") else None,
            "Kecamatan", record.get("district_code"),
        )
        vil = check(
            Village.objects.filter(code=normalize_code(record.get("village_code"))).first()
            if record.get("village_code") else None,
            "Kelurahan/Desa", record.get("village_code"),
        )
        if error:
            return None, error

        # rantai harus nyambung: kode anak ngalahin kode induknya
        if vil and not dist:
            dist = vil.district
        if dist and not reg:
            reg = dist.regency
        if reg and not prov:
            prov = reg.province

        if reg and prov and reg.province_id != prov.id:
            return None, "Kode kabupaten/kota tidak sesuai provinsi."
        if dist and reg and dist.regency_id != reg.id:
            return None, "Kode kecamatan tidak sesuai kabupaten/kota."
        if vil and dist and vil.district_id != dist.id:
            return None, "Kode kelurahan/desa tidak sesuai kecamatan."

        result = {"province": prov, "regency": reg, "district": dist, "village": vil}
        return result, None

    def _import_one(self, user, record):
        """Simpan satu baris. Return 'created' / 'updated' / pesan error."""
        if not record.get("name"):
            return "Nama kosong."

        status_value = record.get("status", "").upper()
        if status_value and status_value not in VALID_STATUS:
            return f"Status '{record['status']}' tidak valid (pakai PROSPECT/CUSTOMER/INACTIVE)."

        region, err = self._resolve_region(record)
        if err:
            return err

        agent = None
        if record.get("agent"):
            agent_qs = CustomUser.objects.filter(role="AGENT", company=user.company)
            email = record["agent"]
            agent = agent_qs.filter(email__iexact=email).first()
            if not agent:
                return f"Agent '{email}' tidak ditemukan di perusahaan ini."

        defaults = {
            "company": user.company,
            "company_name": record.get("company_name", ""),
            "email": record.get("email", ""),
            "phone": record.get("phone", ""),
            "address": record.get("address", ""),
            "status": status_value or "PROSPECT",
            "notes": record.get("notes", ""),
            "agent": agent if user.role == "MANAGER" else user,
            **region,
        }

        name = record["name"]
        existing = Customer.objects.filter(
            company=user.company, name__iexact=name
        ).first()
        if existing:
            for k, v in defaults.items():
                setattr(existing, k, v)
            existing.save()
            return "updated"
        Customer.objects.create(name=name, **defaults)
        return "created"


class CustomerExportView(APIView):
    """Export data customer ke Excel (.xlsx) atau CSV. ?type=xlsx|csv."""

    permission_classes = [IsAuthenticated]

    HEADERS = [
        "Nama", "Nama Perusahaan", "Email", "Telepon", "Alamat",
        "Provinsi", "Kabupaten/Kota", "Kecamatan", "Kelurahan/Desa",
        "Status", "Agent", "Catatan",
    ]

    def get(self, request):
        # jangan pake query param "format" — itu reserved DRF (buat content
        # negotiation). ?format=xlsx bikin DRF nyari renderer "xlsx", gak ada,
        # balas 404 sebelum kode di bawah ini sempat jalan.
        fmt = (request.query_params.get("type") or "xlsx").lower()
        if fmt not in ("xlsx", "csv"):
            return Response(
                {"detail": "Format harus 'xlsx' atau 'csv'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        status_filter = (request.query_params.get("status") or "").upper()
        if status_filter and status_filter not in VALID_STATUS:
            return Response(
                {"detail": "Status tidak valid (pakai PROSPECT/CUSTOMER/INACTIVE)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rows = list(self._build_rows(request, status_filter))
        if fmt == "csv":
            return self._to_csv(rows)
        return self._to_xlsx(rows)

    def _export_queryset(self, user):
        # sama persis dengan daftar customer di halaman Customers:
        # manager lihat semua milik perusahaannya, agent hanya miliknya sendiri
        qs = (
            Customer.objects.select_related(
                "agent", "province", "regency", "district", "village"
            )
            .order_by("name")
        )
        if user.role == "MANAGER":
            return qs.filter(company=user.company)
        return qs.filter(company=user.company, agent=user)

    def _build_rows(self, request, status_filter):
        qs = self._export_queryset(request.user)
        if status_filter:
            qs = qs.filter(status=status_filter)

        for c in qs:
            yield [
                c.name,
                c.company_name,
                c.email,
                c.phone,
                c.address,
                c.province.code if c.province else "",
                c.regency.code if c.regency else "",
                c.district.code if c.district else "",
                c.village.code if c.village else "",
                c.status,
                c.agent.email if c.agent else "",
                c.notes,
            ]

    def _to_xlsx(self, rows):
        wb = Workbook()
        ws = wb.active
        ws.title = "Customer"

        ws.append(self.HEADERS)
        head_fill = PatternFill("solid", fgColor="1E293B")
        for cell in ws[1]:
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = head_fill

        for row in rows:
            ws.append(row)

        widths = [24, 24, 26, 16, 30, 12, 14, 14, 18, 12, 26, 24]
        for i, w in enumerate(widths):
            ws.column_dimensions[chr(65 + i)].width = w

        out = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        out["Content-Disposition"] = 'attachment; filename="customer.xlsx"'
        wb.save(out)
        return out

    def _to_csv(self, rows):
        # utf-8-sig nambahin BOM di awal file biar Excel baca karakter
        # non-ASCII (é, —) bener, gak jadi Ã©/â€”
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(self.HEADERS)
        writer.writerows(rows)

        out = HttpResponse(
            buffer.getvalue().encode("utf-8-sig"),
            content_type="text/csv",
        )
        out["Content-Disposition"] = 'attachment; filename="customer.csv"'
        return out


class CustomerTemplateView(APIView):
    """Unduh template import customer (.xlsx atau .csv, ?type=)."""

    permission_classes = [IsAuthenticated]

    HEADERS = [
        "Nama*", "Nama Perusahaan", "Email", "Telepon", "Alamat",
        "Provinsi (kode)", "Kabupaten/Kota (kode)", "Kecamatan (kode)",
        "Kelurahan/Desa (kode)", "Status", "Agent (email)", "Catatan",
    ]
    EXAMPLE = [
        "Budi Hardware", "CV Budi Makmur", "budi@example.com", "081234567890",
        "Jl. Merdeka No. 5", "32", "32.05", "32.05.01", "32.05.01.1001",
        "CUSTOMER", "siti@pttest.test", "Pelanggan lama",
    ]

    def get(self, request):
        fmt = (request.query_params.get("type") or "xlsx").lower()
        if fmt == "csv":
            return self._to_csv()
        return self._to_xlsx()

    def _to_xlsx(self):
        wb = Workbook()
        ws = wb.active
        ws.title = "Customer"

        ws.append(self.HEADERS)
        head_fill = PatternFill("solid", fgColor="1E293B")
        for cell in ws[1]:
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = head_fill

        ws.append(self.EXAMPLE)
        for cell in ws[2]:
            cell.font = Font(color="666666", italic=True)

        ws.append([])
        notes = [
            "Kolom bertanda * wajib diisi.",
            "Kode wilayah = kode Kemendagri. Contoh: 32 = Jawa Barat, 32.05 = Kota Bandung,",
            "  32.05.01 = kecamatan, 32.05.01.1001 = kelurahan.",
            "Kosongkan kolom wilayah kalau tidak mau mengisi.",
            "Status: PROSPECT / CUSTOMER / INACTIVE (kosong = PROSPECT).",
            "Agent: isi email agent yang terdaftar; kosong = otomatis ke akun lo sendiri.",
            "Kalau nama customer sudah ada (case-insensitive), datanya ditimpa (replace).",
        ]
        for line in notes:
            ws.append([line])

        widths = [22, 22, 24, 16, 28, 16, 20, 20, 22, 14, 22, 22]
        for i, w in enumerate(widths):
            ws.column_dimensions[chr(65 + i)].width = w

        out = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        out["Content-Disposition"] = 'attachment; filename="template-import-customer.xlsx"'
        wb.save(out)
        return out

    def _to_csv(self):
        # versi CSV template: header + contoh doang, catatan instruksi
        # dimasukin sebagai kolom komentar di baris contoh biar tetep kebaca
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(self.HEADERS)
        writer.writerow(self.EXAMPLE)

        out = HttpResponse(
            buffer.getvalue().encode("utf-8-sig"),
            content_type="text/csv",
        )
        out["Content-Disposition"] = 'attachment; filename="template-import-customer.csv"'
        return out
