from django.urls import path

from .views import (
    CountryListView,
    DistrictListView,
    ProvinceListView,
    RegencyListView,
    VillageListView,
)

urlpatterns = [
    path("regions/countries/", CountryListView.as_view(), name="region-countries"),
    path("regions/provinces/", ProvinceListView.as_view(), name="region-provinces"),
    path("regions/regencies/", RegencyListView.as_view(), name="region-regencies"),
    path("regions/districts/", DistrictListView.as_view(), name="region-districts"),
    path("regions/villages/", VillageListView.as_view(), name="region-villages"),
]
