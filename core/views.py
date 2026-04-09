import subprocess
import os
import json
import requests
from pathlib import Path
from django.conf import settings
from marketing.models import Plan, Campaign, Lead, Offer, CampaignResponse
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework import status



def home(request):
    if request.user.is_authenticated:
        return redirect("dashboard")
    return redirect("login")


@require_http_methods(["GET", "POST"])
def login_view(request):
    if request.user.is_authenticated:
        return redirect("dashboard")
    
    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "").strip()
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect("dashboard")
        else:
            error = "Invalid username or password"
            return render(request, "auth/login.html", {"error": error})
    
    return render(request, "auth/login.html")


@require_http_methods(["GET", "POST"])
def signup_view(request):
    if request.user.is_authenticated:
        return redirect("dashboard")
    
    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "").strip()
        password_confirm = request.POST.get("password_confirm", "").strip()
        
        error = None
        
        if not username or not email or not password:
            error = "All fields are required"
        elif len(password) < 6:
            error = "Password must be at least 6 characters"
        elif password != password_confirm:
            error = "Passwords do not match"
        elif User.objects.filter(username=username).exists():
            error = "Username already exists"
        elif User.objects.filter(email=email).exists():
            error = "Email already exists"
        
        if error:
            return render(request, "auth/signup.html", {"error": error})
        
        user = User.objects.create_user(username=username, email=email, password=password)
        login(request, user)
        return redirect("dashboard")
    
    return render(request, "auth/signup.html")

@login_required
def dashboard(request):
    total_plans = Plan.objects.filter(status="ACTIVE").count()
    total_campaigns = Campaign.objects.filter(status="ACTIVE").count()
    total_leads = Lead.objects.count()
    total_budget = (
    Plan.objects.aggregate(Sum("total_budget"))["total_budget__sum"] or 0
)


    context = {
        "total_plans": total_plans,
        "total_campaigns": total_campaigns,
        "total_leads": total_leads,
        "total_budget": total_budget,
    }
    return render(request, "dashboard.html", context)


@require_http_methods(["POST"])
def logout_view(request):
    logout(request)
    return redirect("login")


@login_required(login_url="login")
def launch_claim_cost_prediction(request):
    """Launch Claim Cost Prediction Streamlit dashboard"""
    base_dir = Path(__file__).resolve().parent.parent
    model_dir = base_dir / "prediction models" / "claim_cost_prediction"
    
    try:
        # Launch Streamlit app in background
        subprocess.Popen(
            ["streamlit", "run", "app.py", "--server.port", "8501"],
            cwd=str(model_dir),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        return JsonResponse({
            "success": True,
            "url": "http://localhost:8501",
            "message": "Claim Cost Prediction dashboard is starting..."
        })
    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)


@login_required(login_url="login")
def launch_rebate_prediction(request):
    """Launch Rebate Prediction Streamlit dashboard"""
    base_dir = Path(__file__).resolve().parent.parent
    model_dir = base_dir / "prediction models" / "rebate_prediction" / "dashboard"
    
    try:
        # Launch Streamlit app in background
        subprocess.Popen(
            ["streamlit", "run", "app.py", "--server.port", "8502"],
            cwd=str(model_dir),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        return JsonResponse({
            "success": True,
            "url": "http://localhost:8502",
            "message": "Rebate Prediction dashboard is starting..."
        })
    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)


@login_required(login_url="login")
def launch_tactic_efficiency(request):
    """Launch Tactic Efficiency Streamlit dashboard"""
    base_dir = Path(__file__).resolve().parent.parent
    model_dir = base_dir / "prediction models" / "tactic_efficiency_project"
    
    try:
        # Launch Streamlit app in background
        subprocess.Popen(
            ["streamlit", "run", "app.py", "--server.port", "8503"],
            cwd=str(model_dir),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        return JsonResponse({
            "success": True,
            "url": "http://localhost:8503",
            "message": "Tactic Efficiency dashboard is starting..."
        })
    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=500)


@login_required(login_url="login")
def analytics(request):
    """Render Analytics & Predictions page which lists available prediction models."""
    return render(request, "analytics.html")


@api_view(["POST"])
@permission_classes([AllowAny])
def api_login(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "").strip()

    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "username": user.username}, status=status.HTTP_200_OK)


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def api_logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response({"message": "Logged out"}, status=status.HTTP_200_OK)


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def api_dashboard(request):
    total_plans = Plan.objects.count()
    total_campaigns = Campaign.objects.count()
    total_leads = Lead.objects.count()
    total_budget = Plan.objects.aggregate(Sum("total_budget"))["total_budget__sum"] or 0
    total_offers = Offer.objects.count()

    lead_counts = Lead.objects.aggregate(
        new_count=Count("id", filter=Q(status="NEW")),
        contacted_count=Count("id", filter=Q(status="CONTACTED")),
        qualified_count=Count("id", filter=Q(status="QUALIFIED")),
        converted_count=Count("id", filter=Q(status="CONVERTED")),
        lost_count=Count("id", filter=Q(status="LOST")),
    )
    lead_funnel = [
        {"stage": "New", "count": lead_counts.get("new_count", 0)},
        {"stage": "Contacted", "count": lead_counts.get("contacted_count", 0)},
        {"stage": "Qualified", "count": lead_counts.get("qualified_count", 0)},
        {"stage": "Converted", "count": lead_counts.get("converted_count", 0)},
        {"stage": "Lost", "count": lead_counts.get("lost_count", 0)},
    ]

    now = timezone.now()

    def month_start_shift(base_dt, months_back):
        year = base_dt.year
        month = base_dt.month - months_back
        while month <= 0:
            month += 12
            year -= 1
        return base_dt.replace(year=year, month=month, day=1, hour=0, minute=0, second=0, microsecond=0)

    month_starts = [month_start_shift(now, i) for i in range(6, -1, -1)]
    month_index = {m.strftime("%Y-%m"): m for m in month_starts}

    grouped = (
        CampaignResponse.objects.annotate(month=TruncMonth("response_date"))
        .values("month")
        .annotate(
            total=Count("id"),
            accepted=Count("id", filter=Q(status="ACCEPTED")),
        )
        .order_by("month")
    )

    grouped_map = {
        row["month"].strftime("%Y-%m"): row
        for row in grouped
        if row.get("month") is not None
    }

    response_trend = []
    for month_key in [m.strftime("%Y-%m") for m in month_starts]:
        month_start = month_index[month_key]
        row = grouped_map.get(month_key)
        total_month_responses = row["total"] if row else 0
        accepted_month_responses = row["accepted"] if row else 0
        rate = round((accepted_month_responses / total_month_responses) * 100, 1) if total_month_responses else 0
        response_trend.append({"month": month_start.strftime("%b"), "rate": rate})

    recent_campaigns_qs = Campaign.objects.annotate(
        response_count_anno=Count("responses")
    ).order_by("-created_at")[:4]
    recent_campaigns = [
        {
            "id": campaign.id,
            "name": campaign.name,
            "status": campaign.status,
            "start_date": campaign.start_date,
            "response_count": getattr(campaign, "response_count_anno", 0),
        }
        for campaign in recent_campaigns_qs
    ]

    return Response(
        {
            "total_plans": total_plans,
            "total_campaigns": total_campaigns,
            "total_leads": total_leads,
            "total_budget": total_budget,
            "total_offers": total_offers,
            "lead_funnel": lead_funnel,
            "response_trend": response_trend,
            "recent_campaigns": recent_campaigns,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def api_launch_claim_cost(request):
    base_dir = Path(__file__).resolve().parent.parent
    model_dir = base_dir / "prediction models" / "claim_cost_prediction"

    try:
        subprocess.Popen(
            ["streamlit", "run", "app.py", "--server.port", "8501"],
            cwd=str(model_dir),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return Response(
            {
                "success": True,
                "url": "http://localhost:8501",
                "message": "Claim Cost Prediction dashboard is starting...",
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def api_launch_rebate(request):
    base_dir = Path(__file__).resolve().parent.parent
    model_dir = base_dir / "prediction models" / "rebate_prediction" / "dashboard"

    try:
        subprocess.Popen(
            ["streamlit", "run", "app.py", "--server.port", "8502"],
            cwd=str(model_dir),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return Response(
            {
                "success": True,
                "url": "http://localhost:8502",
                "message": "Rebate Prediction dashboard is starting...",
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def api_launch_tactic_efficiency(request):
    base_dir = Path(__file__).resolve().parent.parent
    model_dir = base_dir / "prediction models" / "tactic_efficiency_project"

    try:
        subprocess.Popen(
            ["streamlit", "run", "app.py", "--server.port", "8503"],
            cwd=str(model_dir),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return Response(
            {
                "success": True,
                "url": "http://localhost:8503",
                "message": "Tactic Efficiency dashboard is starting...",
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def api_generate_subject_lines(request):
    campaign_name = (request.data.get("campaign_name") or "").strip()
    description = (request.data.get("description") or "").strip()
    channel = (request.data.get("channel") or "EMAIL").strip() or "EMAIL"

    if not campaign_name:
        return Response({"error": "campaign_name is required."}, status=status.HTTP_400_BAD_REQUEST)
    if not description:
        return Response({"error": "description is required."}, status=status.HTTP_400_BAD_REQUEST)

    api_key = getattr(settings, "GROQ_API_KEY", "")
    if not api_key:
        return Response({"error": "GROQ_API_KEY is not configured."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    normalized_channel = channel.upper()
    channel_instructions = {
        "EMAIL": "Generate 3 email subject lines.",
        "SMS": "Generate 3 short SMS message texts under 160 characters each.",
        "WEB": "Generate 3 web page headline/CTA copy options.",
        "PHONE": "Generate 3 call opening script starters.",
        "DIRECT_MAIL": "Generate 3 direct mail headline options.",
    }
    selected_instruction = channel_instructions.get(normalized_channel, channel_instructions["EMAIL"])

    system_prompt = (
        "You are a marketing copy assistant. Based on the channel type, return exactly 3 copy suggestions as a JSON array of strings and nothing else. No explanation, no markdown, just the JSON array."
    )
    user_prompt = (
        f"Campaign name: {campaign_name}\n"
        f"Description: {description}\n"
        f"Channel: {normalized_channel}\n\n"
        "Constraints:\n"
        f"- {selected_instruction}\n"
        "- Return exactly 3 suggestions\n"
        "- Keep each line concise\n"
        "- Output must be valid JSON array only"
    )

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.7,
    }

    try:
        groq_response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=30,
        )
    except requests.RequestException:
        return Response(
            {"error": "Failed to connect to Groq API."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    if groq_response.status_code >= 400:
        return Response(
            {
                "error": "Groq API error.",
                "details": groq_response.text[:500],
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )

    try:
        data = groq_response.json()
        content = data["choices"][0]["message"]["content"]
    except (ValueError, KeyError, IndexError, TypeError):
        return Response(
            {"error": "Invalid response format from Groq API."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    try:
        subject_lines = json.loads(content)
        if not isinstance(subject_lines, list):
            raise ValueError("Expected JSON array")
        subject_lines = [str(item).strip() for item in subject_lines if str(item).strip()]
    except (json.JSONDecodeError, ValueError, TypeError):
        lines = [line.strip(" -\t\n\r") for line in str(content).splitlines() if line.strip()]
        subject_lines = lines

    subject_lines = subject_lines[:3]
    if len(subject_lines) < 3:
        return Response(
            {"error": "Could not parse exactly 3 copy suggestions from Groq response."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response({"subject_lines": subject_lines}, status=status.HTTP_200_OK)
