from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Country, District, Province, Regency, Village


class CountryListView(APIView):
    """Daftar negara."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = [
            {"id": c.id, "code": c.code, "name": c.name}
            for c in Country.objects.all()
        ]
        return Response(data)


class ProvinceListView(APIView):
    """Daftar provinsi, bisa difilter ?country=<id>."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        country_id = request.query_params.get("country")
        qs = Province.objects.all()
        if country_id:
            qs = qs.filter(country_id=country_id)
        data = [
            {"id": p.id, "country_id": p.country_id, "name": p.name}
            for p in qs
        ]
        return Response(data)


class RegencyListView(APIView):
    """Daftar kabupaten/kota, bisa difilter ?province=<id>."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        province_id = request.query_params.get("province")
        qs = Regency.objects.all()
        if province_id:
            qs = qs.filter(province_id=province_id)
        data = [
            {"id": r.id, "province_id": r.province_id, "name": r.name}
            for r in qs
        ]
        return Response(data)


class DistrictListView(APIView):
    """Daftar kecamatan, bisa difilter ?regency=<id>."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        regency_id = request.query_params.get("regency")
        qs = District.objects.all()
        if regency_id:
            qs = qs.filter(regency_id=regency_id)
        data = [
            {"id": d.id, "regency_id": d.regency_id, "name": d.name}
            for d in qs
        ]
        return Response(data)


class VillageListView(APIView):
    """Daftar kelurahan/desa, bisa difilter ?district=<id>."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        district_id = request.query_params.get("district")
        qs = Village.objects.all()
        if district_id:
            qs = qs.filter(district_id=district_id)
        data = [
            {"id": v.id, "district_id": v.district_id, "name": v.name}
            for v in qs
        ]
        return Response(data)
