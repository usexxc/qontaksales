from django.db import models


class Country(models.Model):
    code = models.CharField(max_length=2, unique=True)
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "countries"

    def __str__(self):
        return self.name


class Province(models.Model):
    code = models.CharField(max_length=2, unique=True)
    country = models.ForeignKey(
        Country,
        on_delete=models.CASCADE,
        related_name="provinces",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name.title()


class Regency(models.Model):
    code = models.CharField(max_length=5, unique=True)
    province = models.ForeignKey(
        Province,
        on_delete=models.CASCADE,
        related_name="regencies",
    )
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "regencies"

    def __str__(self):
        return self.name.title()


class District(models.Model):
    code = models.CharField(max_length=8, unique=True)
    regency = models.ForeignKey(
        Regency,
        on_delete=models.CASCADE,
        related_name="districts",
    )
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name.title()


class Village(models.Model):
    code = models.CharField(max_length=13, unique=True)
    district = models.ForeignKey(
        District,
        on_delete=models.CASCADE,
        related_name="villages",
    )
    name = models.CharField(max_length=150)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name.title()
