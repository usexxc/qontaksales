from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from qontak_sales.apps.accounts.permissions import IsManager

from .models import COA
from .serializers import COASerializer


class COAViewSet(viewsets.ModelViewSet):
    """Tiap perusahaan cuma lihat COA miliknya; nulis cuma boleh manager."""
    serializer_class = COASerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsManager()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return COA.objects.all()

    def perform_create(self, serializer):
        serializer.save()
