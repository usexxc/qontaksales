from rest_framework import serializers

from .models import COA


class COASerializer(serializers.ModelSerializer):
    class Meta:
        model = COA
        fields = ['id', 'kode', 'nama', 'kategori', 'saldo', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        kode = attrs.get('kode', getattr(self.instance, 'kode', None))
        qs = COA.objects.filter(kode=kode)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError({'kode': 'Kode sudah dipakai.'})
        return attrs
