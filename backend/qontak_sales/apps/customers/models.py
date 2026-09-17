import os

from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import models
from django.db.models.signals import pre_save
from django.dispatch import receiver

from qontak_sales.apps.accounts.models import CustomUser
from qontak_sales.apps.accounts.utils import compress_avatar_on_save


class Customer(models.Model):
    STATUS_CHOICES = [
        ("PROSPECT", "prospect"),
        ("CUSTOMER", "customer"),
        ("INACTIVE", "inactive"),
    ]

    name = models.CharField(max_length=150)
    company_name = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    country = models.ForeignKey(
        "regions.Country",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="customers",
    )
    province = models.ForeignKey(
        "regions.Province",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="customers",
    )
    regency = models.ForeignKey(
        "regions.Regency",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="customers",
    )
    district = models.ForeignKey(
        "regions.District",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="customers",
    )
    village = models.ForeignKey(
        "regions.Village",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="customers",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PROSPECT",
    )

    agent = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="customers",
        limit_choices_to={"role": "AGENT"},
    )

    notes = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="customers/", blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # pegang nilai avatar saat objek dibaca dari DB, untuk deteksi ganti file
        self._initial_avatar_pk = self.avatar.name if self.avatar else None

    @property
    def avatar_url(self):
        if self.avatar:
            return self.avatar.url
        return None

    def atur_nama_avatar(self):
        """Simpen ulang avatar pakai nama customers/customer-<id>.jpg.

        File lama dibuang biar storage gak numpuk. Dipanggil viewset
        setelah objek aman ke-simpan (ID baru keisi setelah INSERT).
        """
        f = self.avatar
        if not f or not getattr(f, "size", None):
            return

        # upload_to="customers/" -> simpan nama relatif (customer-<id>.jpg),
        # Django ImageField nambahin foldernya sendiri pas di-save
        nama_benar = f"customer-{self.pk}.jpg"
        if f.name == nama_benar or f.name.endswith(f"/{nama_benar}"):
            return

        # baca dulu sebelum file lama dibuang, kalau gagal jangan lanjut
        try:
            f.open("rb")
            data = f.read()
        except Exception:
            return
        if not data:
            return

        # hapus SEMUA versi lama (customer-10.jpg maupun customer-10_abc.jpg),
        # kalau gak, FileSystemStorage nambah suffix random pas nama nabrak
        path_benar = os.path.join("customers", nama_benar)
        kandidat = {f.name, path_benar}
        if f.name:
            kandidat.add(os.path.join("customers", os.path.basename(f.name)))
        for path in kandidat:
            if not path:
                continue
            try:
                if default_storage.exists(path):
                    default_storage.delete(path)
            except Exception:
                pass  # gagal hapus bukan halangan

        # matiin kompresi sebentar: ini cuma ganti nama, bukan kompres ulang.
        # kalau gak dimatiin, pre_save bikin file kedua + nama jadi acak lagi.
        pre_save.disconnect(compress_customer_avatar_on_save, sender=Customer)
        try:
            self.avatar.save(
                nama_benar,
                SimpleUploadedFile(nama_benar, data, content_type="image/jpeg"),
                save=True,
            )
        finally:
            pre_save.connect(compress_customer_avatar_on_save, sender=Customer)


@receiver(pre_save, sender=Customer)
def compress_customer_avatar_on_save(sender, instance, **kwargs):
    """Sama kayak akun: kompres avatar customer <=35% sebelum masuk storage."""
    compress_avatar_on_save(instance)

