from django.urls import path

from .api_views import (
    CampaignDetailAPIView,
    CampaignLaunchAPIView,
    CampaignListCreateAPIView,
    InitiativeCreateAPIView,
    InitiativeDetailAPIView,
    LeadDetailAPIView,
    LeadListCreateAPIView,
    OfferDetailAPIView,
    OfferListCreateAPIView,
    OfferTreatmentsListCreateAPIView,
    PlanDetailAPIView,
    PlanListCreateAPIView,
    TacticCreateAPIView,
    TacticDetailAPIView,
    TreatmentPreviewAPIView,
)

urlpatterns = [
    path('offers/', OfferListCreateAPIView.as_view()),
    path('offers/<int:pk>/', OfferDetailAPIView.as_view()),
    path('offers/<int:pk>/treatments/', OfferTreatmentsListCreateAPIView.as_view()),
    path('leads/', LeadListCreateAPIView.as_view()),
    path('leads/<int:pk>/', LeadDetailAPIView.as_view()),
    path('plans/', PlanListCreateAPIView.as_view()),
    path('plans/<int:pk>/', PlanDetailAPIView.as_view()),
    path('initiatives/', InitiativeCreateAPIView.as_view()),
    path('initiatives/<int:pk>/', InitiativeDetailAPIView.as_view()),
    path('tactics/', TacticCreateAPIView.as_view()),
    path('tactics/<int:pk>/', TacticDetailAPIView.as_view()),
    path('campaigns/', CampaignListCreateAPIView.as_view()),
    path('campaigns/<int:pk>/', CampaignDetailAPIView.as_view()),
    path('campaigns/<int:pk>/launch/', CampaignLaunchAPIView.as_view()),
    path('treatments/<int:pk>/preview/', TreatmentPreviewAPIView.as_view()),
]
