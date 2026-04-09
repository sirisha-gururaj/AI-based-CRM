import calendar
from datetime import date, datetime
from random import random

from django.db.models import Sum
from django.shortcuts import render, get_object_or_404, redirect
#  usha block
from django.urls import reverse
from django.contrib import messages
#------
from .forms import PlanForm, InitiativeForm, TacticForm, OfferForm, TreatmentForm, LeadForm, CampaignForm
from .models import Offer, Plan, Initiative, Tactic, PLAN_STATUS_CHOICES, Treatment, Lead

#---- usha block------------
def offer_list(request):
    offers = Offer.objects.all().order_by("-created_at")
    context = {"offers": offers}
    return render(request, "marketing/offer_list.html", context)


def offer_detail(request, pk):
    offer = get_object_or_404(Offer, pk=pk)
    treatments = offer.treatments.filter(is_active=True).order_by("-created_at")
    context = {
        "offer": offer,
        "treatments": treatments,
    }
    return render(request, "marketing/offer_detail.html", context)

def offer_create(request):
    if request.method == "POST":
        form = OfferForm(request.POST)
        if form.is_valid():
            offer = form.save()
            messages.success(request, "Offer created successfully.")
            return redirect("marketing:offer_detail", pk=offer.pk)
    else:
        form = OfferForm()

    context = {"form": form}
    return render(request, "marketing/offer_form.html", context)


def offer_update(request, pk):
    offer = get_object_or_404(Offer, pk=pk)
    if request.method == "POST":
        form = OfferForm(request.POST, instance=offer)
        if form.is_valid():
            form.save()
            messages.success(request, "Offer updated successfully.")
            return redirect("marketing:offer_detail", pk=offer.pk)
    else:
        form = OfferForm(instance=offer)

    context = {"form": form, "offer": offer}
    return render(request, "marketing/offer_form.html", context)


def treatment_create(request, offer_pk):
    offer = get_object_or_404(Offer, pk=offer_pk)
    if request.method == "POST":
        form = TreatmentForm(request.POST)
        if form.is_valid():
            treatment = form.save(commit=False)
            treatment.offer = offer
            treatment.save()
            messages.success(request, "Treatment created successfully.")
            return redirect("marketing:offer_detail", pk=offer.pk)
    else:
        form = TreatmentForm()

    context = {"form": form, "offer": offer}
    return render(request, "marketing/treatment_form.html", context)


def treatment_preview(request, pk):
    treatment = get_object_or_404(Treatment, pk=pk)

    # Fake contact data for preview (no DB dependency)
    sample_contact = {
        "first_name": "Asha",
        "last_name": "Nair",
        "email": "asha@example.com",
        "city": "Bengaluru",
    }

    # Naive placeholder replacement for now
    body_preview = treatment.body
    for key, value in sample_contact.items():
        body_preview = body_preview.replace(f"{{{{{key}}}}}", value)

    context = {
        "treatment": treatment,
        "body_preview": body_preview,
        "sample_contact": sample_contact,
    }
    return render(request, "marketing/treatment_preview.html", context)

def lead_list(request):
    leads = Lead.objects.order_by("-created_at")

    context = {
        "leads": leads,
    }
    return render(request, "marketing/lead_list.html", context)


def lead_detail(request, pk):
    lead = get_object_or_404(Lead, pk=pk)
    context = {
        "lead": lead,
    }
    return render(request, "marketing/lead_detail.html", context)


def lead_create(request):
    if request.method == "POST":
        form = LeadForm(request.POST)
        if form.is_valid():
            lead = form.save()
            messages.success(request, "Lead created successfully.")
            return redirect("marketing:lead_detail", pk=lead.pk)
    else:
        form = LeadForm(initial={"owner": "Unassigned"})

    context = {"form": form}
    return render(request, "marketing/lead_form.html", context)


def lead_update(request, pk):
    lead = get_object_or_404(Lead, pk=pk)
    if request.method == "POST":
        form = LeadForm(request.POST, instance=lead)
        if form.is_valid():
            form.save()
            messages.success(request, "Lead updated successfully.")
            return redirect("marketing:lead_detail", pk=lead.pk)
    else:
        form = LeadForm(instance=lead)

    context = {"form": form, "lead": lead}
    return render(request, "marketing/lead_form.html", context)


def lead_delete(request, pk):
    lead = get_object_or_404(Lead, pk=pk)
    if request.method == "POST":
        lead.delete()
        messages.success(request, "Lead deleted.")
        return redirect("marketing:lead_list")
    context = {"lead": lead}
    return render(request, "marketing/lead_confirm_delete.html", context)



#----------------------------

def plan_list(request):
    plans = Plan.objects.order_by("-created_at")

    # Search filter
    search_query = request.GET.get("search", "").strip()
    if search_query:
        plans = plans.filter(name__icontains=search_query)

    # Status filter
    status_filter = request.GET.get("status", "").strip()
    if status_filter:
        plans = plans.filter(status=status_filter)

    context = {
        "plans": plans,
        "search_query": search_query,
        "status_filter": status_filter,
        "status_choices": PLAN_STATUS_CHOICES,
    }
    return render(request, "marketing/plan_list.html", context)


def plan_create(request):
    if request.method == "POST":
        form = PlanForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("marketing:plan_list")
    else:
        form = PlanForm()

    return render(request, "marketing/plan_form.html", {"form": form})


def plan_update(request, pk):
    plan = get_object_or_404(Plan, pk=pk)
    if request.method == "POST":
        form = PlanForm(request.POST, instance=plan)
        if form.is_valid():
            form.save()
            return redirect("marketing:plan_detail", pk=plan.pk)
    else:
        form = PlanForm(instance=plan)
    return render(request, "marketing/plan_form.html", {"form": form, "form_title": "Edit Plan"})


def plan_detail(request, pk):
    plan = get_object_or_404(Plan, pk=pk)
    tab = request.GET.get("tab", "overview")
    initiatives = plan.initiatives.order_by("-created_at")
    tactics = Tactic.objects.filter(initiative__plan=plan).order_by("-created_at")

    totals = initiatives.aggregate(
        planned_total=Sum("planned_amount"),
        actual_total=Sum("actual_amount"),
    )
    planned_total = totals["planned_total"] or 0
    actual_total = totals["actual_total"] or 0

    calendar_weeks = []
    calendar_month = None
    day_tactics = {}
    if tab == "calendar":
        month_param = request.GET.get("month")
        if month_param:
            try:
                calendar_month = datetime.strptime(month_param, "%Y-%m").date()
            except ValueError:
                calendar_month = date.today().replace(day=1)
        else:
            calendar_month = date.today().replace(day=1)

        cal = calendar.Calendar(firstweekday=6)
        calendar_weeks = cal.monthdatescalendar(calendar_month.year, calendar_month.month)

        for tactic in tactics:
            if not tactic.start_date or not tactic.end_date:
                continue
            start = tactic.start_date
            end = tactic.end_date
            for week in calendar_weeks:
                for day in week:
                    if start <= day <= end:
                        day_tactics.setdefault(day, []).append(tactic)

    context = {
        "plan": plan,
        "tab": tab,
        "initiatives": initiatives,
        "tactics": tactics,
        "planned_total": planned_total,
        "actual_total": actual_total,
        "variance_total": planned_total - actual_total,
        "calendar_month": calendar_month,
        "calendar_weeks": calendar_weeks,
        "day_tactics": day_tactics,
    }
    return render(request, "marketing/plan_detail.html", context)


def initiative_create(request, plan_id=None):
    initial = {}
    if plan_id:
        initial["plan"] = get_object_or_404(Plan, pk=plan_id)

    if request.method == "POST":
        form = InitiativeForm(request.POST)
        if form.is_valid():
            initiative = form.save()
            return redirect("marketing:plan_detail", pk=initiative.plan.pk)
    else:
        form = InitiativeForm(initial=initial)

    return render(
        request,
        "marketing/initiative_form.html",
        {"form": form, "form_title": "Create Initiative"},
    )


def initiative_update(request, pk):
    initiative = get_object_or_404(Initiative, pk=pk)
    if request.method == "POST":
        form = InitiativeForm(request.POST, instance=initiative)
        if form.is_valid():
            form.save()
            return redirect("marketing:plan_detail", pk=initiative.plan.pk)
    else:
        form = InitiativeForm(instance=initiative)

    return render(
        request,
        "marketing/initiative_form.html",
        {"form": form, "form_title": "Edit Initiative"},
    )


def initiative_delete(request, pk):
    initiative = get_object_or_404(Initiative, pk=pk)
    plan_id = initiative.plan.pk
    if request.method == "POST":
        initiative.delete()
        return redirect("marketing:plan_detail", pk=plan_id)

    return render(
        request,
        "marketing/confirm_delete.html",
        {
            "object_name": initiative.name,
            "cancel_url": "marketing:plan_detail",
            "cancel_kwargs": {"pk": plan_id},
        },
    )


def tactic_create(request, initiative_id=None):
    initial = {}
    if initiative_id:
        initial["initiative"] = get_object_or_404(Initiative, pk=initiative_id)

    if request.method == "POST":
        form = TacticForm(request.POST)
        if form.is_valid():
            tactic = form.save()
            return redirect("marketing:plan_detail", pk=tactic.initiative.plan.pk)
    else:
        form = TacticForm(initial=initial)

    return render(
        request,
        "marketing/tactic_form.html",
        {"form": form, "form_title": "Create Tactic"},
    )


def tactic_update(request, pk):
    tactic = get_object_or_404(Tactic, pk=pk)
    if request.method == "POST":
        form = TacticForm(request.POST, instance=tactic)
        if form.is_valid():
            form.save()
            return redirect("marketing:plan_detail", pk=tactic.initiative.plan.pk)
    else:
        form = TacticForm(instance=tactic)

    return render(
        request,
        "marketing/tactic_form.html",
        {"form": form, "form_title": "Edit Tactic"},
    )


def tactic_delete(request, pk):
    tactic = get_object_or_404(Tactic, pk=pk)
    plan_id = tactic.initiative.plan.pk
    if request.method == "POST":
        tactic.delete()
        return redirect("marketing:plan_detail", pk=plan_id)

    return render(
        request,
        "marketing/confirm_delete.html",
        {
            "object_name": tactic.name,
            "cancel_url": "marketing:plan_detail",
            "cancel_kwargs": {"pk": plan_id},
        },
    )


#------------------- Campaign views -------------------
from .models import Campaign, CampaignResponse


def campaign_list(request):
    search_query = request.GET.get("search", "")
    status_filter = request.GET.get("status", "")
    
    campaigns = Campaign.objects.all().order_by("-created_at")
    
    if search_query:
        campaigns = campaigns.filter(name__icontains=search_query)
    
    if status_filter:
        campaigns = campaigns.filter(status=status_filter)
    
    context = {
        "campaigns": campaigns,
        "search_query": search_query,
        "status_filter": status_filter,
        "status_choices": [("DRAFT", "Draft"), ("PLANNED", "Planned"), ("ACTIVE", "Active"), ("COMPLETED", "Completed")],
    }
    return render(request, "marketing/campaign_list.html", context)


def campaign_detail(request, pk):
    campaign = get_object_or_404(Campaign, pk=pk)
    responses = campaign.responses.all().order_by("-response_date")
    
    # Calculate response stats
    total_responses = responses.count()
    accepted_responses = responses.filter(status="ACCEPTED").count()
    rejected_responses = responses.filter(status="REJECTED").count()
    pending_responses = responses.filter(status="PENDING").count()
    
    context = {
        "campaign": campaign,
        "responses": responses,
        "total_responses": total_responses,
        "accepted_responses": accepted_responses,
        "rejected_responses": rejected_responses,
        "pending_responses": pending_responses,
    }
    return render(request, "marketing/campaign_detail.html", context)


def campaign_create(request):
    if request.method == "POST":
        form = CampaignForm(request.POST)
        if form.is_valid():
            campaign = form.save()
            messages.success(request, "Campaign created successfully.")
            return redirect("marketing:campaign_detail", pk=campaign.pk)
    else:
        form = CampaignForm()
    
    context = {"form": form}
    return render(request, "marketing/campaign_form.html", context)


def campaign_update(request, pk):
    campaign = get_object_or_404(Campaign, pk=pk)
    if request.method == "POST":
        form = CampaignForm(request.POST, instance=campaign)
        if form.is_valid():
            campaign = form.save()
            messages.success(request, "Campaign updated successfully.")
            return redirect("marketing:campaign_detail", pk=campaign.pk)
    else:
        form = CampaignForm(instance=campaign)
    
    context = {"form": form, "campaign": campaign}
    return render(request, "marketing/campaign_form.html", context)


def campaign_launch(request, pk):
    campaign = get_object_or_404(Campaign, pk=pk)
    
    if request.method == "POST":
        # Set status to Active
        campaign.status = "ACTIVE"
        campaign.save()
        
        # Automatically update leads to CONTACTED
        if campaign.offer:
            related_leads = Lead.objects.filter(
                offer=campaign.offer,
                status="NEW"
            )

            for lead in related_leads:
                lead.status = "CONTACTED"
                lead.save()

        '''# Generate dummy response data
        dummy_names = ["John Smith", "Sarah Johnson", "Michael Brown", "Emily Davis", "Robert Wilson"]
        dummy_emails = ["john@example.com", "sarah@example.com", "michael@example.com", "emily@example.com", "robert@example.com"]
        dummy_statuses = ["ACCEPTED", "REJECTED", "PENDING", "ACCEPTED"]
        
        # Clear existing responses if any
        campaign.responses.all().delete()
        
        # Create 5 dummy responses
        for i in range(5):
            CampaignResponse.objects.create(
                campaign=campaign,
                contact_name=dummy_names[i],
                contact_email=dummy_emails[i],
                status=dummy_statuses[i % len(dummy_statuses)],
                notes=f"Response from {dummy_names[i]}"
            )
        '''
        
        # Get leads linked to this campaign's offer
    if campaign.offer:
        leads = Lead.objects.filter(
        offer=campaign.offer,
        status__in=["NEW", "CONTACTED"]
    )

    # Clear existing responses
    campaign.responses.all().delete()

    for lead in leads:
        response_status = random.choice(["ACCEPTED", "REJECTED", "PENDING"])

        # Create campaign response from real lead
        CampaignResponse.objects.create(
            campaign=campaign,
            contact_name=lead.full_name(),
            contact_email=lead.email if lead.email else "noemail@example.com",
            status=response_status,
            notes=f"Auto-generated response for {lead.full_name()}"
        )

        # Update lead status based on response
        if response_status == "ACCEPTED":
            lead.status = "QUALIFIED"
        elif response_status == "REJECTED":
            lead.status = "LOST"
        else:
            lead.status = "CONTACTED"

        lead.save()

        messages.success(request, f"Campaign '{campaign.name}' launched successfully with 5 sample responses.")
        return redirect("marketing:campaign_detail", pk=campaign.pk)
    
    context = {"campaign": campaign}
    return render(request, "marketing/campaign_confirm_launch.html", context)
