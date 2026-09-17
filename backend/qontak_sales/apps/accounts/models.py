from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import pre_save
from django.dispatch import receiver

from .utils import compress_avatar_on_save


class Company(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    @classmethod
    def get(cls):
        """Satu perusahaan untuk seluruh aplikasi (single-tenant)."""
        return cls.objects.first()


class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ("MANAGER", "Sales Manager"),
        ("AGENT", "Sales Agent"),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="AGENT")
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # pegang nilai avatar saat objek dibaca dari DB, untuk deteksi ganti file
        self._initial_avatar_pk = self.avatar.name if self.avatar else None

    @property
    def avatar_url(self):
        if self.avatar:
            return self.avatar.url
        return None


@receiver(pre_save, sender=CustomUser)
def compress_avatar_on_save_signal(sender, instance, **kwargs):
    """Kompres avatar ke <=35% dari ukuran asli sebelum disimpan ke storage.

    Jalan di semua jalur tulis (profile, create/edit agent, admin), jadi
    serializer tidak perlu tahu soal kompresi. Hanya kalau file avatar benar
    baru/diubah, supaya save data lain tidak mengompres ulang file lama.
    """
    compress_avatar_on_save(instance)
