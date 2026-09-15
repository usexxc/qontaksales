from django.core.management.base import BaseCommand

from qontak_sales.apps.accounts.models import Company
from qontak_sales.apps.coa.models import COA

DATA = [
 ('1001','Kas','Aset',10000000),('1002','Bank','Aset',25000000),
 ('2001','Utang Usaha','Liabilitas',5000000),('3001','Modal','Ekuitas',30000000),
 ('4001','Pendapatan Jasa','Pendapatan',15000000),('5001','Beban Operasional','Beban',4000000),
]
class Command(BaseCommand):
    help = 'Isi contoh data COA'
    def handle(self, *args, **kwargs):
        for company in Company.objects.all():
            for kode,nama,kategori,saldo in DATA:
                COA.objects.update_or_create(kode=kode, company=company, defaults={'nama':nama,'kategori':kategori,'saldo':saldo})
        self.stdout.write(self.style.SUCCESS('Contoh data COA berhasil dibuat.'))
