from django.db import models

from qontak_sales.apps.accounts.models import Company, CustomUser


class Customer(models.Model):
    STATUS_CHOICES = [
        ("PROSPECT", "prospect"),
        ("CUSTOMER", "customer"),
        ("INACTIVE", "inactive"),
    ]

    # customer nempel ke satu perusahaan, agent nyusul lewat FK agent
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="customers",
        null=True,
        blank=True,
    )

    name = models.CharField(max_length=150)
    company_name = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
