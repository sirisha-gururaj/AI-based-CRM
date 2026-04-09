from django.db import transaction
from django.db.models import Q, Count, Sum, OuterRef, Subquery, DateTimeField, CharField
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Campaign,
    CampaignResponse,
    Initiative,
    Lead,
    Offer,
    Plan,
    Tactic,
    Treatment,
)
from .serializers import (
    CampaignResponseSerializer,
    CampaignSerializer,
    InitiativeSerializer,
    LeadSerializer,
    OfferSerializer,
    PlanSerializer,
    TacticSerializer,
    TreatmentSerializer,
)


class AuthenticatedAPIView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]


class OfferListCreateAPIView(AuthenticatedAPIView):
    def get(self, request):
        offers = Offer.objects.all().annotate(
            treatments_count_anno=Count("treatments", distinct=True),
            leads_count_anno=Count("leads", distinct=True),
        )

        search = request.query_params.get("search", "").strip()
        status_filter = request.query_params.get("status", "").strip()
        is_active_filter = request.query_params.get("is_active", "").strip().lower()

        if search:
            offers = offers.filter(
                Q(name__icontains=search)
                | Q(code__icontains=search)
                | Q(description__icontains=search)
            )

        if status_filter:
            offers = offers.filter(status=status_filter)

        if is_active_filter in {"true", "false"}:
            offers = offers.filter(is_active=is_active_filter == "true")

        offers = offers.order_by("-created_at")
        serializer = OfferSerializer(offers, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = OfferSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OfferDetailAPIView(AuthenticatedAPIView):
    def get(self, request, pk):
        try:
            offer = Offer.objects.get(pk=pk)
        except Offer.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        offer_data = OfferSerializer(offer).data
        treatments = offer.treatments.all().order_by("-created_at")
        offer_data["treatments"] = TreatmentSerializer(treatments, many=True).data
        return Response(offer_data)

    def put(self, request, pk):
        try:
            offer = Offer.objects.get(pk=pk)
        except Offer.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = OfferSerializer(offer, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OfferTreatmentsListCreateAPIView(AuthenticatedAPIView):
    def get(self, request, pk):
        try:
            offer = Offer.objects.get(pk=pk)
        except Offer.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        treatments = Treatment.objects.filter(offer=offer).order_by("-created_at")
        serializer = TreatmentSerializer(treatments, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        try:
            offer = Offer.objects.get(pk=pk)
        except Offer.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        payload = dict(request.data)
        payload["offer"] = offer.id
        serializer = TreatmentSerializer(data=payload)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LeadListCreateAPIView(AuthenticatedAPIView):
    def get(self, request):
        latest_response_qs = CampaignResponse.objects.filter(
            contact_email__iexact=OuterRef("email")
        ).order_by("-response_date")

        leads = Lead.objects.select_related("offer").annotate(
            last_campaign_name_anno=Subquery(
                latest_response_qs.values("campaign__name")[:1],
                output_field=CharField(),
            ),
            last_campaign_response_status_anno=Subquery(
                latest_response_qs.values("status")[:1],
                output_field=CharField(),
            ),
            last_campaign_response_date_anno=Subquery(
                latest_response_qs.values("response_date")[:1],
                output_field=DateTimeField(),
            ),
        )

        search = request.query_params.get("search", "").strip()
        status_filter = request.query_params.get("status", "").strip()
        source_filter = request.query_params.get("source", "").strip()
        owner_filter = request.query_params.get("owner", "").strip()

        if search:
            leads = leads.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(company__icontains=search)
                | Q(email__icontains=search)
                | Q(job_title__icontains=search)
            )

        if status_filter:
            leads = leads.filter(status=status_filter)

        if source_filter:
            leads = leads.filter(source=source_filter)

        if owner_filter:
            leads = leads.filter(owner__icontains=owner_filter)

        leads = leads.order_by("-created_at")
        serializer = LeadSerializer(leads, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = LeadSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LeadDetailAPIView(AuthenticatedAPIView):
    def get(self, request, pk):
        try:
            lead = Lead.objects.get(pk=pk)
        except Lead.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = LeadSerializer(lead)
        return Response(serializer.data)

    def put(self, request, pk):
        try:
            lead = Lead.objects.get(pk=pk)
        except Lead.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = LeadSerializer(lead, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            lead = Lead.objects.get(pk=pk)
        except Lead.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        lead.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlanListCreateAPIView(AuthenticatedAPIView):
    def get(self, request):
        plans = Plan.objects.all().annotate(
            initiatives_planned_total_anno=Sum("initiatives__planned_amount"),
            initiatives_actual_total_anno=Sum("initiatives__actual_amount"),
        )

        search = request.query_params.get("search")
        status_filter = request.query_params.get("status")

        if search:
            plans = plans.filter(name__icontains=search)

        if status_filter:
            plans = plans.filter(status=status_filter)

        plans = plans.order_by("-created_at")
        serializer = PlanSerializer(plans, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PlanSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PlanDetailAPIView(AuthenticatedAPIView):
    def get(self, request, pk):
        try:
            plan = Plan.objects.get(pk=pk)
        except Plan.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        plan_data = PlanSerializer(plan).data
        initiatives_data = []

        initiatives = Initiative.objects.filter(plan=plan).order_by("-created_at")
        for initiative in initiatives:
            initiative_data = InitiativeSerializer(initiative).data
            tactics = Tactic.objects.filter(initiative=initiative).order_by("-created_at")
            initiative_data["tactics"] = TacticSerializer(tactics, many=True).data
            initiatives_data.append(initiative_data)

        plan_data["initiatives"] = initiatives_data
        return Response(plan_data)

    def put(self, request, pk):
        try:
            plan = Plan.objects.get(pk=pk)
        except Plan.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = PlanSerializer(plan, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            plan = Plan.objects.get(pk=pk)
        except Plan.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        plan.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InitiativeCreateAPIView(AuthenticatedAPIView):
    def post(self, request):
        serializer = InitiativeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InitiativeDetailAPIView(AuthenticatedAPIView):
    def put(self, request, pk):
        try:
            initiative = Initiative.objects.get(pk=pk)
        except Initiative.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = InitiativeSerializer(initiative, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            initiative = Initiative.objects.get(pk=pk)
        except Initiative.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        plan_id = initiative.plan_id
        initiative.delete()
        return Response(
            {"detail": "Initiative deleted.", "redirect_to_plan": plan_id},
            status=status.HTTP_200_OK,
        )


class TacticCreateAPIView(AuthenticatedAPIView):
    def post(self, request):
        serializer = TacticSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TacticDetailAPIView(AuthenticatedAPIView):
    def put(self, request, pk):
        try:
            tactic = Tactic.objects.get(pk=pk)
        except Tactic.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = TacticSerializer(tactic, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            tactic = Tactic.objects.get(pk=pk)
        except Tactic.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        tactic.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CampaignListCreateAPIView(AuthenticatedAPIView):
    def get(self, request):
        campaigns = Campaign.objects.select_related("offer", "treatment").annotate(
            response_count_anno=Count("responses"),
        )

        search = request.query_params.get("search")
        status_filter = request.query_params.get("status")

        if search:
            campaigns = campaigns.filter(name__icontains=search)

        if status_filter:
            campaigns = campaigns.filter(status=status_filter)

        campaigns = campaigns.order_by("-created_at")
        serializer = CampaignSerializer(
            campaigns,
            many=True,
            context={"skip_expensive_counts": True},
        )
        return Response(serializer.data)

    def post(self, request):
        serializer = CampaignSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CampaignDetailAPIView(AuthenticatedAPIView):
    def get(self, request, pk):
        try:
            campaign = Campaign.objects.get(pk=pk)
        except Campaign.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        campaign_data = CampaignSerializer(campaign).data
        responses = campaign.responses.all().order_by("-response_date")
        campaign_data["responses"] = CampaignResponseSerializer(responses, many=True).data
        return Response(campaign_data)

    def put(self, request, pk):
        try:
            campaign = Campaign.objects.get(pk=pk)
        except Campaign.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if campaign.status in {"ACTIVE", "COMPLETED"} or campaign.responses.exists():
            return Response(
                {"detail": "Launched campaigns are view-only and cannot be edited."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CampaignSerializer(campaign, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            campaign = Campaign.objects.get(pk=pk)
        except Campaign.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if campaign.status in {"ACTIVE", "COMPLETED"} or campaign.responses.exists():
            return Response(
                {"detail": "Launched campaigns are view-only and cannot be deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        campaign.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CampaignLaunchAPIView(AuthenticatedAPIView):
    def post(self, request, pk):
        try:
            campaign = Campaign.objects.get(pk=pk)
        except Campaign.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        contacts = []
        required_count = 5

        target_list = campaign.target_list or ""
        if target_list.startswith("STATUS:"):
            target_status = target_list.split(":", 1)[1]
            leads = Lead.objects.filter(status=target_status).order_by("-created_at")[:500]
            for lead in leads:
                contact_name = lead.full_name()
                contact_email = lead.email or f"lead{lead.id}@example.com"
                contacts.append((contact_name, contact_email, lead))
        elif target_list.startswith("IMPORT:") and campaign.import_contacts:
            for item in campaign.import_contacts:
                if not isinstance(item, dict):
                    continue
                contact_name = item.get("name") or "Imported Contact"
                contact_email = item.get("email")
                if contact_email:
                    contacts.append((contact_name, contact_email, None))

        contacts = contacts[:required_count]
        if len(contacts) < required_count:
            fallback_contacts = [
                ("Asha Nair", "asha.nair@example.com", None),
                ("Rahul Verma", "rahul.verma@example.com", None),
                ("Meera Iyer", "meera.iyer@example.com", None),
                ("Kiran Rao", "kiran.rao@example.com", None),
                ("Neha Singh", "neha.singh@example.com", None),
            ]
            for fallback in fallback_contacts:
                if len(contacts) >= required_count:
                    break
                fallback_email = fallback[1].lower()
                if any(str(c[1]).lower() == fallback_email for c in contacts):
                    continue
                contacts.append(fallback)

        def split_name(name):
            parts = (name or "").strip().split()
            if len(parts) <= 1:
                return "", parts[0] if parts else "Contact"
            return " ".join(parts[:-1]), parts[-1]

        def map_response_to_lead_status(response_status):
            if response_status == "ACCEPTED":
                return "CONVERTED"
            if response_status == "REJECTED":
                return "LOST"
            return "CONTACTED"

        with transaction.atomic():
            campaign.status = "ACTIVE"
            campaign.save(update_fields=["status", "updated_at"])

            campaign.responses.all().delete()

            for index, (contact_name, contact_email, lead_obj) in enumerate(contacts[:required_count]):
                response_status = ["PENDING", "ACCEPTED", "REJECTED"][index % 3]
                CampaignResponse.objects.create(
                    campaign=campaign,
                    contact_name=contact_name,
                    contact_email=contact_email,
                    status=response_status,
                    notes=f"Response from {contact_name}",
                )

                first_name, last_name = split_name(contact_name)
                lead = lead_obj
                if not lead:
                    lead = Lead.objects.filter(email__iexact=contact_email).first()

                if not lead:
                    lead = Lead.objects.create(
                        first_name=first_name,
                        last_name=last_name,
                        email=contact_email,
                        source="campaign",
                        status=map_response_to_lead_status(response_status),
                        offer=campaign.offer,
                        notes=f"Imported from campaign: {campaign.name}",
                    )
                else:
                    lead.status = map_response_to_lead_status(response_status)
                    lead.source = "campaign"
                    if campaign.offer and not lead.offer:
                        lead.offer = campaign.offer
                    lead.save()

        campaign_data = CampaignSerializer(campaign).data
        responses = campaign.responses.all().order_by("-response_date")
        campaign_data["responses"] = CampaignResponseSerializer(responses, many=True).data
        return Response(campaign_data)


class TreatmentPreviewAPIView(AuthenticatedAPIView):
    def get(self, request, pk):
        try:
            treatment = Treatment.objects.get(pk=pk)
        except Treatment.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = TreatmentSerializer(treatment)
        data = serializer.data

        body = data.get("body") or ""
        data["body"] = (
            body.replace("{{first_name}}", "Asha")
            .replace("{{last_name}}", "Nair")
            .replace("{{email}}", "asha@example.com")
            .replace("{{city}}", "Bengaluru")
        )

        return Response(data)
