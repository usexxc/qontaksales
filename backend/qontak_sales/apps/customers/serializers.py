from rest_framework import serializers

from qontak_sales.apps.accounts.models import CustomUser

from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    province_name = serializers.CharField(source="province.name", read_only=True, default=None)
    regency_name = serializers.CharField(source="regency.name", read_only=True, default=None)
    district_name = serializers.CharField(source="district.name", read_only=True, default=None)
    village_name = serializers.CharField(source="village.name", read_only=True, default=None)
    country_name = serializers.CharField(source="country.name", read_only=True, default=None)

    class Meta:
        model = Customer
        fields = [
            "id",
            "name",
            "company_name",
            "email",
            "phone",
            "address",
            "country",
            "country_name",
            "province",
            "province_name",
            "regency",
            "regency_name",
            "district",
            "district_name",
            "village",
            "village_name",
            "status",
            "agent",
            "agent_name",
            "avatar",
            "avatar_url",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "agent_name",
            "avatar_url",
            "country_name",
            "province_name",
            "regency_name",
            "district_name",
            "village_name",
            "created_at",
            "updated_at",
        ]

    def get_agent_name(self, obj):
        if obj.agent:
            return f"{obj.agent.first_name} {obj.agent.last_name}".strip()
        return None

    def get_avatar_url(self, obj):
        request = self.context.get("request")
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None

    def validate_avatar(self, value):
        if value is None:
            return value
        if value.size > 1 * 1024 * 1024:
            raise serializers.ValidationError("Ukuran foto maksimal 1 MB.")
        return value

    def validate_agent(self, value):
        """Pastikan agent yang dipilih memang terdaftar."""
        if value and not CustomUser.objects.filter(id=value.id, role="AGENT").exists():
            raise serializers.ValidationError(
                "Agent tidak ditemukan."
            )
        return value

    def validate(self, attrs):
        """Cuma boleh milih wilayah yang beneran satu induk."""
        country = attrs.get("country")
        province = attrs.get("province")
        regency = attrs.get("regency")
        district = attrs.get("district")
        village = attrs.get("village")

        if province and country and province.country_id != country.id:
            raise serializers.ValidationError(
                {"province": "Provinsi tidak sesuai dengan negara yang dipilih."}
            )
        if regency and province and regency.province_id != province.id:
            raise serializers.ValidationError(
                {"regency": "Kabupaten/Kota tidak sesuai dengan provinsi yang dipilih."}
            )
        if district and regency and district.regency_id != regency.id:
            raise serializers.ValidationError(
                {"district": "Kecamatan tidak sesuai dengan kabupaten/kota yang dipilih."}
            )
        if village and district and village.district_id != district.id:
            raise serializers.ValidationError(
                {"village": "Kelurahan/Desa tidak sesuai dengan kecamatan yang dipilih."}
            )
        return attrs
