# AI-Enabled Sales & Marketing Management Platform

A full-stack CRM platform for sales and marketing planning, campaign execution, lead tracking, and AI-powered forecasting.

Built by **Sirisha G** (MCA Intern at **BlueRose Technologies Pvt. Ltd.**).

## Overview

This project combines a Django REST backend with a React frontend to manage the full marketing lifecycle:

- Strategic planning with Plans, Initiatives, and Tactics
- Offer and Treatment management for channel-based communication
- Lead management with lifecycle tracking and rating signals
- Campaign management with launch workflow and response analytics
- Executive dashboard with live business KPIs and charts
- Dedicated Predictions and Analytics page to launch ML dashboards

The repository also includes three Streamlit model dashboards for claim cost forecasting, rebate prediction, and tactic efficiency insights.

## Tech Stack

### Backend
- Django 5.2
- Django REST Framework
- Token Authentication (DRF authtoken)

### Database
- PostgreSQL (local/production-style setup)
- SQLite (development convenience)

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts

### ML and Analytics
- Streamlit dashboards
- Random Forest models
- XGBoost model

## Project Structure

```text
AI-based-CRM/
├── core/              Django settings, auth, prediction launchers
├── marketing/         Models, API views, serializers, URLs
├── templates/         Old Bootstrap UI (kept but disconnected)
├── frontend/          React + TypeScript + Tailwind CSS (main UI)
│   └── src/
│       ├── pages/     Login, Signup, Dashboard, Plans, PlanDetail,
│       │              Offers, Leads, LeadDetail, Campaigns,
│       │              CampaignDetail, Users, Predictions
│       ├── components/ Sidebar, Layout
│       ├── api/       Axios client + all API functions
│       └── contexts/  AuthContext
├── prediction models/
│   ├── claim_cost_prediction/     Streamlit app (port 8501)
│   ├── rebate_prediction/         Streamlit app (port 8502)
│   └── tactic_efficiency_project/ Streamlit app (port 8503)
├── manage.py
└── requirements.txt
```

## Features

1. Authentication
- Token-based login, signup, and logout flows
- Protected routes in frontend and authenticated API access in backend

2. Marketing Plans and Execution
- Plans with budget, status, and timeline
- Initiatives and Tactics with planned vs actual tracking
- Full CRUD for plan hierarchy

3. Offers and Treatments
- Offer creation and lifecycle management
- Treatment management by communication channel
- Treatment preview support

4. Lead Management
- Full lead CRUD
- Lead ratings (Hot/Warm/Cold)
- Lead statuses for pipeline progression

5. Campaign Management
- Campaign CRUD
- Campaign launch workflow
- Campaign response capture and status metrics

6. Dashboard and Analytics
- CXO-level summary metrics from live database
- Recharts visualizations for trends and funnel insights
- Recent campaign monitoring

7. Predictions and AI Models
- Dedicated Predictions and Analytics page in frontend
- One-click launch to Streamlit dashboards
- Integrated support for three model pipelines

## Setup and Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm
- PostgreSQL (optional if using SQLite for development)

### Backend Setup

```bash
cd AI-based-CRM
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Backend API runs at:

```text
http://localhost:8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## Running the Application

Run backend and frontend in separate terminals.

1. Start Django server
```bash
python manage.py runserver
```

2. Start React app
```bash
cd frontend
npm run dev
```

3. Login from frontend and use the sidebar to navigate modules.

4. To use ML dashboards, launch them from the Predictions page, or run manually using the commands below.

## Prediction Models Summary

### 1) Claim Cost Forecasting
- Approach: Random Forest with engineered features and rolling median strategy
- Performance: R^2 = 0.9991, MAPE = 9.62%, MAE = $8,672
- Port: 8501
- Manual run:

```bash
cd "prediction models/claim_cost_prediction"
streamlit run app.py --server.port 8501
```

### 2) Rebate Prediction
- Approach: XGBoost trained on 2022-2024 contract history
- Use case: Forecast 2025 customer rebate amounts
- Port: 8502
- Manual run:

```bash
cd "prediction models/rebate_prediction/dashboard"
streamlit run app.py --server.port 8502
```

### 3) Tactic Efficiency Prediction
- Approach: Random Forest ranking of tactic types by product group
- Performance: R^2 = 0.74, 100% plan coverage in prepared dataset
- Port: 8503
- Manual run:

```bash
cd "prediction models/tactic_efficiency_project"
streamlit run app.py --server.port 8503
```

## API Endpoints Summary

Base prefix: `/api/`

### Auth and Dashboard
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `GET /api/dashboard/`

### Prediction Launchers
- `POST /api/prediction/claim-cost/`
- `POST /api/prediction/rebate/`
- `POST /api/prediction/tactic-efficiency/`

### Offers and Treatments
- `GET, POST /api/offers/`
- `GET, PUT /api/offers/<id>/`
- `GET, POST /api/offers/<id>/treatments/`
- `GET /api/treatments/<id>/preview/`

### Leads
- `GET, POST /api/leads/`
- `GET, PUT, DELETE /api/leads/<id>/`

### Plans, Initiatives, Tactics
- `GET, POST /api/plans/`
- `GET, PUT /api/plans/<id>/`
- `POST /api/initiatives/`
- `PUT, DELETE /api/initiatives/<id>/`
- `POST /api/tactics/`
- `PUT, DELETE /api/tactics/<id>/`

### Campaigns
- `GET, POST /api/campaigns/`
- `GET, PUT /api/campaigns/<id>/`
- `POST /api/campaigns/<id>/launch/`

## Notes

- The `templates/` folder contains legacy Bootstrap templates retained for reference.
- Main active UI is the React frontend in `frontend/`.
- Use environment-specific settings for production deployment (secrets, hosts, CORS, and database credentials).