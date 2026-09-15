from rest_framework import serializers

from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    province_name = serializers.CharField(source="province.name", read_only=True, default=None)
    regency_name = serializers.CharField(source="regency.name", read_only=True, default=None)
    district_name = serializers.CharField(source="district.name", read_only=True, default=None)
    village_name = serializers.CharField(source="village.name", read_only=True, default=None)

    class Meta:
        model = Customer
        fields = [
            "id",
            "company",
            "name",
            "company_name",
            "email",
            "phone",
            "address",
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
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "company",
            "agent_name",
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

    def validate_agent(self, value):
        """Cegah agent nitip ke perusahaan sebelah."""
        user = self.context["request"].user
        if value and user.company_id and value.company_id != user.company_id:
            raise serializers.ValidationError(
                "Agent tidak terdaftar di perusahaan ini."
            )
        return value

    def validate(self, attrs):
        """Cuma boleh milih wilayah yang beneran satu induk."""
        province = attrs.get("province")
        regency = attrs.get("regency")
        district = attrs.get("district")
        village = attrs.get("village")

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
