from rest_framework.routers import DefaultRouter

from .views import COAViewSet

router = DefaultRouter()
router.register('coa', COAViewSet, basename='coa')
urlpatterns = router.urls
