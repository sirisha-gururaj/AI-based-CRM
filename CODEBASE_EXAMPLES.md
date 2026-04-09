# Important Code Snippets & Examples

## Database Layer (Django Models)

### Lead Model – Core CRM Entity
Represents a prospective customer with contact info and lifecycle status.

```python
class Lead(models.Model):
    STATUS_CHOICES = [
        ("NEW", "New"),
        ("CONTACTED", "Contacted"),
        ("QUALIFIED", "Qualified"),
        ("CONVERTED", "Converted"),
        ("LOST", "Lost"),
    ]

    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    company = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="NEW")
    rating = models.CharField(max_length=20, choices=RATING_CHOICES, default="warm")
    offer = models.ForeignKey(Offer, on_delete=models.SET_NULL, null=True, blank=True)
    score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
```

**Why:** Tracks prospect journey from discovery to conversion.

---

### Campaign Model – Marketing Execution
Represents a marketing campaign tied to an offer and treatment.

```python
class Campaign(models.Model):
    CAMPAIGN_STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("PLANNED", "Planned"),
        ("ACTIVE", "Active"),
        ("COMPLETED", "Completed"),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=CAMPAIGN_STATUS_CHOICES, default="DRAFT")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    offer = models.ForeignKey(Offer, on_delete=models.SET_NULL, null=True, blank=True)
    treatment = models.ForeignKey(Treatment, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def response_count(self):
        return self.responses.count()

    @property
    def accepted_count(self):
        return self.responses.filter(status="ACCEPTED").count()
```

**Why:** Organizes marketing execution with offer + treatment combo tracking.

---

### Plan Model – Budget & Strategic Planning
Represents a marketing plan with budget allocation.

```python
class Plan(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=PLAN_STATUS_CHOICES, default="DRAFT")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    total_budget = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def initiatives_planned_total(self):
        return self.initiatives.aggregate(total=models.Sum("planned_amount"))["total"] or 0

    @property
    def initiatives_variance(self):
        return self.initiatives_planned_total - self.initiatives_actual_total
```

**Why:** Tracks plan budget vs actual spend across initiatives.

---

## API Layer (Django REST Framework)

### Authentication – Token Login
Issues a token after username/password validation.

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate

@api_view(["POST"])
@permission_classes([AllowAny])
def api_login(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "").strip()

    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response(
            {"error": "Invalid credentials"}, 
            status=status.HTTP_401_UNAUTHORIZED
        )

    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {"token": token.key, "username": user.username}, 
        status=status.HTTP_200_OK
    )
```

**What to say:** "Users send username+password to /api/auth/login/ and get a token back. That token is stored in localStorage and sent with every request."

---

### Serializer – API Data Transformation
Converts Lead model to JSON with computed fields.

```python
from rest_framework import serializers

class LeadSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    source_label = serializers.CharField(source='get_source_display', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    offer_name = serializers.SerializerMethodField()
    rating_label = serializers.CharField(source='get_rating_display', read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email', 'phone',
            'company', 'status', 'status_label', 'source', 'source_label',
            'rating', 'rating_label', 'offer_name', 'score', 'created_at'
        ]

    def get_full_name(self, lead):
        return lead.full_name()

    def get_offer_name(self, lead):
        return lead.offer.name if lead.offer else None
```

**What to say:** "Serializer transforms DB data to API-friendly JSON and adds human-readable labels."

---

### API View – List & CRUD Operations
Handles GET (list/filter) and POST (create) for leads.

```python
from rest_framework.views import APIView
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated

class LeadListCreateAPIView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        leads = Lead.objects.select_related("offer").all()

        # Filtering
        search = request.query_params.get("search", "").strip()
        status_filter = request.query_params.get("status", "").strip()

        if search:
            leads = leads.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
            )

        if status_filter:
            leads = leads.filter(status=status_filter)

        leads = leads.order_by("-created_at")
        serializer = LeadSerializer(leads, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = LeadSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

**What to say:** "This view handles GET (with search/filter) and POST. Token required on every request."

---

### Dashboard Aggregation API
Computes KPIs from multiple models for dashboard cards.

```python
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
        new=Count("id", filter=Q(status="NEW")),
        contacted=Count("id", filter=Q(status="CONTACTED")),
        qualified=Count("id", filter=Q(status="QUALIFIED")),
        converted=Count("id", filter=Q(status="CONVERTED")),
        lost=Count("id", filter=Q(status="LOST")),
    )

    lead_funnel = [
        {"stage": "New", "count": lead_counts.get("new", 0)},
        {"stage": "Contacted", "count": lead_counts.get("contacted", 0)},
        {"stage": "Qualified", "count": lead_counts.get("qualified", 0)},
        {"stage": "Converted", "count": lead_counts.get("converted", 0)},
        {"stage": "Lost", "count": lead_counts.get("lost", 0)},
    ]

    return Response({
        "total_plans": total_plans,
        "total_campaigns": total_campaigns,
        "total_leads": total_leads,
        "total_budget": total_budget,
        "total_offers": total_offers,
        "lead_funnel": lead_funnel,
    })
```

**What to say:** "Single API call feeds all dashboard cards with KPIs and lead funnel breakdown."

---

## Frontend Layer (React + TypeScript)

### Axios Client with Token Interceptor
Every request auto-attaches token from localStorage.

```typescript
import axios, { InternalAxiosRequestConfig } from 'axios'

const client = axios.create({
  baseURL: '/api',
})

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('crm_token')
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

export default client
```

**What to say:** "Axios instance auto-adds token to Authorization header on every request."

---

### API Call – Fetch Dashboard
React hook fetches dashboard data on component mount.

```typescript
import { useEffect, useState } from 'react'
import * as api from '../api'

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await api.getDashboard()
        setDashboardData(data)
      } catch (err: any) {
        if (err.response?.status === 401) {
          window.location.href = '/login'
        } else {
          setError('Failed to load dashboard')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {/* Render dashboardData */}
    </div>
  )
}
```

**What to say:** "React fetches dashboard data on mount, handles Loading/Error states, redirects to login if 401."

---

### API Service Layer – Caching
Custom hook caches API responses to reduce network calls.

```typescript
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCached<T>(key: string, fetcher: () => Promise<T>, params?: any): Promise<T> {
  const cacheKey = params ? `${key}:${JSON.stringify(params)}` : key
  const cached = cache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return Promise.resolve(cached.data)
  }

  return fetcher().then((data) => {
    cache.set(cacheKey, { data, timestamp: Date.now() })
    return data
  })
}

export async function getDashboard() {
  return getCached('dashboard', async () => {
    const response = await client.get('/dashboard/')
    return response.data
  })
}

export async function getLeads(params?: { search?: string; status?: string }) {
  return getCached('leads', async () => {
    const response = await client.get('/leads/', { params })
    return response.data
  }, params)
}
```

**What to say:** "API calls are cached for 5 minutes. Same request returns cached data instead of hitting server."

---

### Protected Route – Auth Guard
Redirects unauthenticated users to login.

```typescript
import { Navigate } from 'react-router-dom'
import { getToken } from '../auth'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = getToken()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
```

**What to say:** "Route componenthelps check if user has token. If no token, redirect to login."

---

### Vite Dev Proxy Config
Routes /api requests to Django backend during development.

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        credentials: true,
      },
    },
  },
})
```

**What to say:** "Dev proxy forwards all /api calls from React (5173) to Django (8000)."

---

## Machine Learning Layer

### Rebate Prediction – XGBoost Training
Trains model on historical 2022-2024 data.

```python
from xgboost import XGBRegressor
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
import joblib

def train_rebate_model(X_train, y_train):
    X_tr, X_val, y_tr, y_val = train_test_split(
        X_train, y_train, test_size=0.1, random_state=42
    )

    imputer = SimpleImputer(strategy="median")
    X_tr_imp = imputer.fit_transform(X_tr)
    X_val_imp = imputer.transform(X_val)

    model = XGBRegressor(
        tree_method="hist",
        n_estimators=1200,
        learning_rate=0.03,
        max_depth=6,
        min_child_weight=8,
        subsample=0.9,
        colsample_bytree=0.9,
        reg_lambda=6.0,
        reg_alpha=0.7,
        objective="reg:pseudohubererror",
        n_jobs=-1,
        random_state=42,
    )

    model.fit(X_tr_imp, y_tr, eval_set=[(X_val_imp, y_val)], verbose=False)

    joblib.dump(model, "models/xgboost_model.pkl")
    joblib.dump(imputer, "models/feature_imputer.pkl")

    return model, imputer
```

**What to say:** "XGBoost learns rebate patterns from 2022-2024 data. Model saved for inference."

---

### Claim Cost Prediction – LightGBM Per-Product Training
Trains per-product models with volatility-aware hyperparameters and recency weighting.

```python
import lightgbm as lgb
import numpy as np
import pandas as pd
import pickle
from pathlib import Path

def get_optimized_params(cv):
    """Adjust hyperparameters based on product volatility coefficient."""
    if cv < 0.15:  # Low volatility
        return {
            "objective": "regression",
            "metric": "mae",
            "num_leaves": 63,
            "n_estimators": 3000,
            "learning_rate": 0.015,
            "reg_alpha": 0.05,
            "reg_lambda": 0.05,
            "subsample": 0.85,
            "colsample_bytree": 0.85,
        }
    elif cv < 0.3:  # Medium volatility
        return {
            "objective": "regression",
            "metric": "mae",
            "num_leaves": 31,
            "n_estimators": 2500,
            "learning_rate": 0.02,
            "reg_alpha": 0.1,
            "reg_lambda": 0.1,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
        }
    else:  # High volatility
        return {
            "objective": "regression",
            "metric": "mae",
            "num_leaves": 15,
            "n_estimators": 2000,
            "learning_rate": 0.03,
            "reg_alpha": 0.15,
            "reg_lambda": 0.15,
            "subsample": 0.7,
            "colsample_bytree": 0.7,
        }

def get_sample_weights(product_df):
    """Recent data gets higher weight via exponential decay."""
    dates = pd.to_datetime(
        product_df["YEAR"].astype(str) + "-" + 
        product_df["MONTH_NUM"].astype(str).str.zfill(2) + "-01"
    )
    months_ago = (dates.max() - dates).dt.days / 30.0
    weights = np.exp(-months_ago / 10.0)  # Decays over 10 months
    return (weights / weights.mean()).values

def train_claim_cost_models(train_df, feature_cols):
    """Train per-product LightGBM models on aggregated features."""
    models = {}
    products = sorted(train_df["PRODUCT_GROUP"].unique())

    for product in products:
        product_df = train_df[train_df["PRODUCT_GROUP"] == product].copy()
        if len(product_df) < 12:  # Skip if insufficient data
            continue

        X = product_df[feature_cols]
        y = product_df["LOG_TOTAL_AMOUNT"]

        # Calculate volatility coefficient
        cv = product_df["TOTAL_QUANTITY"].std() / product_df["TOTAL_QUANTITY"].mean()
        params = get_optimized_params(cv)
        
        # Weight recent data higher
        weights = get_sample_weights(product_df)

        model = lgb.LGBMRegressor(**params)
        model.fit(X, y, sample_weight=weights)
        models[product] = model

    # Save all product models
    with open(Path("models/lightgbm_models.pkl"), "wb") as f:
        pickle.dump(models, f)

    return models
```

**What to say:** "LightGBM trained per-product. Uses volatility-aware hyperparams and weights recent months higher for recency bias."

---

### Tactic Efficiency – Random Forest Pipeline Training
Trains a unified model combining categorical features with continuous deal amounts.

```python
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error
import joblib

def train_tactic_efficiency_model(train_df):
    """Train Random Forest to predict efficiency = claim/deal ratio."""
    
    # Calculate efficiency metric
    train_df = train_df[train_df["DEAL_AMOUNT"] > 0].copy()
    train_df["EFFICIENCY"] = train_df["CLAIM_AMOUNT"] / train_df["DEAL_AMOUNT"]

    # Define features
    CATEGORICAL_FEATURES = [
        "PRODUCT_GROUP",
        "TACTIC_TYPE",
        "BRAND",
        "CHANNEL",
        "COUNTRY"
    ]
    NUMERICAL_FEATURES = ["DEAL_AMOUNT"]
    
    ALL_FEATURES = CATEGORICAL_FEATURES + NUMERICAL_FEATURES

    X = train_df[ALL_FEATURES]
    y = train_df["EFFICIENCY"]

    # Preprocessing pipeline: one-hot encode categories, passthrough numerics
    preprocessor = ColumnTransformer([
        ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ("num", "passthrough", NUMERICAL_FEATURES),
    ])

    # Full pipeline: preprocess + Random Forest
    pipeline = Pipeline([
        ("prep", preprocessor),
        ("model", RandomForestRegressor(
            n_estimators=200,
            max_depth=10,
            random_state=42,
            n_jobs=-1,
        ))
    ])

    # Train/test split and fit
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    pipeline.fit(X_train, y_train)
    
    # Evaluate and save
    y_pred = pipeline.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)

    joblib.dump(pipeline, "models/tactic_efficiency_model.pkl")

    return {
        "R2": r2,
        "MAE": mae,
        "model": pipeline,
    }
```

**What to say:** "Random Forest predicts tactic efficiency. Pipeline auto one-hot encodes 5 categorical features + deal amount."

---

### Prediction – Apply Trained Model (Rebate)
Generates rebate predictions for 2025 contracts.

```python
import pandas as pd
import numpy as np
import joblib

def predict_rebates_2025(features_df):
    model = joblib.load("models/xgboost_model.pkl")
    imputer = joblib.load("models/feature_imputer.pkl")

    # Drop non-feature columns
    feature_cols = [col for col in features_df.columns if col not in ["CHANNEL_ORIG", "REBATE_RATE"]]
    X = features_df[feature_cols]

    # Apply imputation and prediction
    X_imp = imputer.transform(X)
    y_pred_log = model.predict(X_imp)
    predicted_rebate = np.expm1(y_pred_log)  # Reverse log1p transformation

    return predicted_rebate

# Merge fixed rebates + predictions
final_df = original_df.copy()
final_df["FINAL_REBATE"] = final_df["FIXED_REBATE_AMOUNT"]

mask = final_df["FINAL_REBATE"].isna()
final_df.loc[mask, "FINAL_REBATE"] = predicted_rebates[mask.sum():]

final_df.to_csv("outputs/predicted_rebates_2025.csv", index=False)
```

**What to say:** "Load trained model. For each 2025 contract: keep fixed rebates as-is, predict only missing values."

---

### Prediction – Apply Trained Models (Claim Cost)
Generates per-product claim cost predictions for 2025.

```python
import pandas as pd
import numpy as np
import pickle
from pathlib import Path

def predict_claim_costs_2025(predict_df, feature_cols):
    """Apply per-product LightGBM models to predict claim costs."""
    
    # Load all trained product models
    with open(Path("models/lightgbm_models.pkl"), "rb") as f:
        models = pickle.load(f)

    predictions = []

    for product in predict_df["PRODUCT_GROUP"].unique():
        product_data = predict_df[predict_df["PRODUCT_GROUP"] == product].copy()
        
        if product not in models:
            # Fallback: use population mean
            product_data["PREDICTED_LOG_AMOUNT"] = np.log1p(predict_df["TOTAL_AMOUNT"].mean())
        else:
            X = product_data[feature_cols]
            product_data["PREDICTED_LOG_AMOUNT"] = models[product].predict(X)

        predictions.append(product_data)

    result = pd.concat(predictions, ignore_index=True)
    
    # Convert back from log scale
    result["PREDICTED_CLAIM_COST"] = np.expm1(result["PREDICTED_LOG_AMOUNT"])
    result.to_csv("outputs/predicted_claim_costs_2025.csv", index=False)

    return result
```

**What to say:** "Use per-product models. Each product gets its own optimized LightGBM. Fallback to mean if model missing."

---

### Prediction – Apply Trained Model (Tactic Efficiency)
Predicts efficiency ratio for 2025-2026 tactics.

```python
import pandas as pd
import joblib

def predict_tactic_efficiency_2025_26(predict_df):
    """Load pipeline and predict efficiency for 2025-2026 period."""
    
    pipeline = joblib.load("models/tactic_efficiency_model.pkl")

    # Model expects these features
    FEATURES = [
        "PRODUCT_GROUP",
        "TACTIC_TYPE",
        "BRAND",
        "CHANNEL",
        "COUNTRY",
        "DEAL_AMOUNT"
    ]

    X = predict_df[FEATURES]
    
    # Pipeline auto one-hot encodes + fits Random Forest
    y_predicted_efficiency = pipeline.predict(X)

    # Convert efficiency back to claim amount (efficiency * deal_amount)
    result = predict_df.copy()
    result["PREDICTED_EFFICIENCY"] = y_predicted_efficiency
    result["PREDICTED_CLAIM_AMOUNT"] = result["PREDICTED_EFFICIENCY"] * result["DEAL_AMOUNT"]
    result.to_csv("outputs/predicted_efficiency_25_26.csv", index=False)

    return result
```

**What to say:** "Pipeline prediction auto one-hot encodes categories. Returns efficiency ratio; multiply by deal amount for claim prediction."

---

## Prediction – Apply Trained Model

## Backend Infrastructure

### URL Routing – API Endpoints Map
Central routing for all API endpoints.

```python
from django.urls import path, include
from . import views

urlpatterns = [
    # Auth
    path('api/auth/login/', views.api_login, name='api_login'),
    path('api/auth/logout/', views.api_logout, name='api_logout'),

    # Dashboard
    path('api/dashboard/', views.api_dashboard, name='api_dashboard'),

    # ML Predictions
    path('api/prediction/claim-cost/', views.api_launch_claim_cost),
    path('api/prediction/rebate/', views.api_launch_rebate),
    path('api/prediction/tactic-efficiency/', views.api_launch_tactic_efficiency),

    # Marketing module
    path('api/', include('marketing.api_urls')),

    # Django admin
    path('admin/', admin.site.urls),
]
```

**What to say:** "Main URL config shows all API routes: auth, dashboard, predictions, and marketing CRUD endpoints."

---

### Streamlit Dashboard Launch
Django spawns Streamlit apps in background.

```python
import subprocess
from pathlib import Path

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
        return Response({
            "success": True,
            "url": "http://localhost:8502",
            "message": "Rebate Prediction dashboard is starting..."
        })
    except Exception as e:
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

**What to say:** "User clicks 'Launch Predictions'. Django starts Streamlit on port 8502 and returns URL to frontend."

---

## Django Settings & Configuration

### REST Framework + CORS Setup
Token auth and CORS settings for API.

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # React dev server
]

CORS_ALLOW_CREDENTIALS = True

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'marketing',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # Must be near top
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
]
```

**What to say:** "Token auth enabled. CORS allows React frontend on 5173 to call Django on 8000."

---

## Summary Table

| Layer | Technology | Key File | What It Does |
|-------|-----------|----------|-------------|
| Database | Django ORM | `marketing/models.py` | Defines Lead, Campaign, Plan, Offer entities |
| API | Django REST | `marketing/api_views.py` | CRUD endpoints with filtering & search |
| Auth | DRF Tokens | `core/views.py` | Login returns token; token required on all requests |
| Frontend | React + TypeScript | `frontend/src/` | React SPA fetches API data, caches, renders dashboard |
| **ML: Rebate** | XGBoost | `rebate_prediction/src/04_train_model.py` | Predicts customer rebate amounts from 2022-2024 history |
| **ML: Claim Cost** | LightGBM (per-product) | `claim_cost_prediction/src/06_train_models.py` | Per-product models with volatility-aware hyperparams |
| **ML: Tactic Efficiency** | Random Forest + Pipeline | `tactic_efficiency_project/src/train_ml_model_04.py` | Predicts claim/deal ratio; auto one-hot encodes categories |
| Dashboards | Streamlit | `**/app.py` | Interactive data viz for ML outputs |
| Dev Setup | Vite Proxy | `frontend/vite.config.ts` | Routes /api to Django backend locally |

