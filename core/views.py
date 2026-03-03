import subprocess
import os
from pathlib import Path
from marketing.models import Plan, Campaign, Lead
from django.db.models import Sum
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse


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
