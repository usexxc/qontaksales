from django.contrib import admin

from .models import COA


@admin.register(COA)
class COAAdmin(admin.ModelAdmin):
    list_display = ('kode', 'nama', 'kategori', 'saldo')
    search_fields = ('kode', 'nama')
    list_filter = ('kategori',)
