from django.db import models

from qontak_sales.apps.accounts.models import Company


class COA(models.Model):
    KATEGORI = [
        ('Aset', 'Aset'), ('Liabilitas', 'Liabilitas'),
        ('Ekuitas', 'Ekuitas'), ('Pendapatan', 'Pendapatan'), ('Beban', 'Beban'),
    ]
    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="coa_entries",
        null=True, blank=True,
    )
    kode = models.CharField(max_length=20)
    nama = models.CharField(max_length=150)
    kategori = models.CharField(max_length=30, choices=KATEGORI)
    saldo = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['kode']
        verbose_name = 'COA'
        verbose_name_plural = 'COA'
        constraints = [
            models.UniqueConstraint(fields=['company', 'kode'], name='unique_coa_kode_per_company'),
        ]

    def __str__(self):
        return f'{self.kode} - {self.nama}'
