# AI-Based CRM

A full-stack customer relationship management platform for sales and marketing operations, campaign execution, lead tracking, and AI-backed business insights.

## Overview

This repository is built as a hybrid application with:
- Django + Django REST Framework backend
- React + TypeScript + Vite frontend
- Streamlit prediction dashboards for advanced analytics

The application supports marketing planning, offer/treatment management, lead and campaign workflows, and a dedicated predictions/analytics section.

## What Is Included

- `core/` – Django project settings, URL routing, ASGI/WGI entrypoints
- `marketing/` – app models, serializers, API views, forms, templates, and tests
- `frontend/` – React UI with pages for login, dashboard, plans, offers, leads, campaigns, and predictions
- `prediction models/` – three prediction dashboard projects for claim cost, rebate forecasting, and tactic efficiency
- `templates/` – legacy Django server-rendered pages and base layout
- `requirements.txt` – Python backend dependencies
- `frontend/package.json` – frontend dependencies and build scripts

## Key Features

- Authentication and user management
- Marketing plans with initiatives and tactics
- Offer and treatment lifecycle management
- Lead CRUD and pipeline tracking
- Campaign creation, launch workflow, and response analytics
- Dashboard charts and summary metrics
- AI/ML prediction dashboards for model-driven insights

## Tech Stack

Backend:
- Python 3.10+
- Django 5.2
- Django REST Framework
- django-cors-headers
- SQLite for development (PostgreSQL compatible)

Frontend:
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts

Prediction Models:
- Streamlit
- Random Forest
- XGBoost

## Installation

### Backend Setup

```bash
cd /home/sirisha_s/Desktop/AI-based-CRM/AI-based-CRM
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
```

### Frontend Setup

```bash
cd frontend
npm install
```

## Running the App

### Start the backend

```bash
cd /home/sirisha_s/Desktop/AI-based-CRM/AI-based-CRM
source venv/bin/activate
python manage.py runserver
```

### Start the frontend

```bash
cd frontend
npm run dev
```

### Access the app

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

## Prediction Dashboards

The repository contains three prediction model projects in `prediction models/`.

### Claim Cost Prediction

```bash
cd "prediction models/claim_cost_prediction"
streamlit run app.py --server.port 8501
```

### Rebate Prediction

```bash
cd "prediction models/rebate_prediction"
streamlit run app.py --server.port 8502
```

### Tactic Efficiency Prediction

```bash
cd "prediction models/tactic_efficiency_project"
streamlit run app.py --server.port 8503
```

## Project Structure

```text
AI-based-CRM/
├── core/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── contexts/
│   │   └── pages/
│   └── package.json
├── marketing/
├── prediction models/
│   ├── claim_cost_prediction/
│   ├── rebate_prediction/
│   └── tactic_efficiency_project/
├── templates/
├── requirements.txt
└── manage.py
```

## Notes

- The React frontend is the primary UI for users.
- Legacy Django templates exist but are not the main application surface.
- SQLite is sufficient for local development; PostgreSQL is recommended for production.

## License

This project is under the terms of the existing repository license.


## Notes

- The `templates/` folder contains legacy Bootstrap templates retained for reference.
- Main active UI is the React frontend in `frontend/`.
- Use environment-specific settings for production deployment (secrets, hosts, CORS, and database credentials).