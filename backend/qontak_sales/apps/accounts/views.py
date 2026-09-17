from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Company
from .permissions import IsManager
from .serializers import (
    AgentCreateSerializer,
    EmailTokenObtainPairSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()


class EmailTokenObtainPairView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = EmailTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Registration successful."}, status=status.HTTP_201_CREATED
        )


class ProfileView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user, context={"request": request}).data)

    def put(self, request):
        serializer = UserSerializer(
            request.user, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    patch = put  # upload avatar via multipart: PUT/PATCH sama saja (partial)


class DashboardStatsView(APIView):
    def get(self, request):
        # import lokal: hindari circular import (customers/coa import accounts)
        from qontak_sales.apps.coa.models import COA
        from qontak_sales.apps.customers.models import Customer

        users = User.objects.all()
        customers = Customer.objects.all()
        status_counts = {
            row["status"]: row["n"]
            for row in customers.values("status").annotate(n=Count("id"))
        }
        top_agents = [
            {"username": r["agent__username"], "customers": r["n"]}
            for r in customers.exclude(agent__isnull=True)
            .values("agent__username")
            .annotate(n=Count("id"))
            .order_by("-n")[:5]
        ]
        coa_total = COA.objects.aggregate(s=Sum("saldo"))["s"] or 0
        company = Company.get()

        return Response({
            "company_name": company.name if company else "",
            "total_users": users.count(),
            "total_agents": users.filter(role="AGENT").count(),
            "total_managers": users.filter(role="MANAGER").count(),
            "total_customers": customers.count(),
            "total_prospects": status_counts.get("PROSPECT", 0),
            "customers_by_status": status_counts,
            "top_agents": top_agents,
            "coa_total_saldo": str(coa_total),
        })


class AgentViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsManager]

    def get_queryset(self):
        return User.objects.filter(
            role="AGENT", is_active=True
        ).order_by("first_name", "last_name")

    def create(self, request, *args, **kwargs):
        serializer = AgentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        agent = User.objects.create_user(
            username=data["username"],
            email=data["email"],
            password=data["password"],
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
            phone=data.get("phone", ""),
            role="AGENT",
        )
        if data.get("avatar"):
            agent.avatar = data["avatar"]
            agent.save(update_fields=["avatar"])
        return Response(
            UserSerializer(agent, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        agent = self.get_object()
        serializer = UserSerializer(
            agent, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        agent = self.get_object()
        agent.is_active = False
        agent.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)
