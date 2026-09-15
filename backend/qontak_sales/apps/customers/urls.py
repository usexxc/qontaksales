from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    CustomerExportView,
    CustomerImportView,
    CustomerTemplateView,
    CustomerViewSet,
)

router = DefaultRouter()
router.register(r"customers", CustomerViewSet, basename="customer")

urlpatterns = [
    path("customers/import/", CustomerImportView.as_view(), name="customer-import"),
    path("customers/template/", CustomerTemplateView.as_view(), name="customer-template"),
    path("customers/export/", CustomerExportView.as_view(), name="customer-export"),
    *router.urls,
]
