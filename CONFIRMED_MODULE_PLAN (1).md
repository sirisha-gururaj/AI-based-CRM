# AI Sales & Marketing CRM — Confirmed MVP Module Plan
**For College Evaluation | Timeline: < 1 Week**
**Stack: Django 5 · PostgreSQL · React + Tailwind (new modules) · Bootstrap 5 (existing)**

---

## Strategic Framing (What You Tell Evaluators)

> "This is a multi-tenant, AI-augmented B2B Sales & Marketing Platform built
> with industry-grade architecture — Row Level Security, RBAC, an AI Copilot
> powered by LLM, predictive lead scoring via ML, and real-time CXO dashboards.
> The architecture follows the same patterns used at Oracle CRM, Salesforce
> Marketing Cloud, and HubSpot — designed to scale to multiple tenants and
> business units."

The key differentiators evaluators will see:
1. **Multi-tenancy with PostgreSQL RLS** — not toy-level auth, database-enforced isolation
2. **AI Copilot panel** — LLM generates campaign copy, subject lines, offer briefs live
3. **Predictive Lead Scoring** — ML model (logistic regression or sklearn) scoring leads
4. **CXO Dashboard** — real metrics, charts, drilldowns — not placeholder graphs
5. **RBAC** — role-based access (Admin, Marketing Manager, Sales Rep, CXO)

---

## What We Are NOT Building (Explicitly Descoped)

| Descoped | Reason |
|----------|--------|
| Programs / Stage / Wave full execution engine | Too complex for 1 week |
| List import / CSV pipeline | Background job complexity |
| Web Marketing module (surveys, landing sites) | Later phase |
| Multi-language support | Not needed for demo |
| Fax / Direct Mail treatments | Legacy channel |
| Full approval workflow engine | Simplified to status flags |
| Real email delivery (SMTP/SendGrid) | Mocked for demo |

---

## CONFIRMED MODULE LIST (7 Modules)

---

### MODULE 1 — Accounts & Tenancy
**App:** `accounts` (new)
**Priority:** BUILD FIRST — everything depends on this

#### What we build:
| Model | Key Fields |
|-------|-----------|
| `Tenant` | id (UUID), name, slug, is_active, created_at |
| `OrgUnit` | tenant, name, type (BU/Region/Team), parent |
| `AppUser` | extends User, tenant, org_unit, avatar |
| `Role` | tenant, name, description |
| `UserRole` | user, role, org_unit_scope |

#### Permissions (RBAC Matrix):
| Role | Plans | Campaigns | Leads | AI Copilot | CXO Dashboard |
|------|-------|-----------|-------|-----------|---------------|
| Admin | Full | Full | Full | Yes | Yes |
| Marketing Manager | Full | Full | View | Yes | Yes |
| Marketing Ops | View/Edit | Full | View | Yes | No |
| Sales Rep | No | View | Full | Yes | No |
| CXO | View | View | View | No | Yes |

#### UI:
- Login page (React + Tailwind — new design replacing existing Bootstrap login)
- User management page (Admin only)
- Role assignment UI
- Tenant switcher in topbar (for admin)

#### "Impressive factor" to mention:
> "Tenant context is set as a PostgreSQL session variable per request via
> Django middleware — RLS policies at the database level enforce isolation
> so even a miscoded query cannot leak cross-tenant data."

---

### MODULE 2 — Planning & Budgeting (Expand existing)
**App:** `marketing` (existing, expanded)
**Priority:** Phase 1

#### What we ADD to existing:
| New Model | Key Fields | User Story |
|-----------|-----------|------------|
| `Fund` | tenant, name, fiscal_year, currency, total_amount, balance | US-MKTG-013 |
| `FundAllocation` | fund, plan/initiative/tactic, amount, allocated_by | US-MKTG-014 |
| `BudgetRequest` | fund, plan, amount, justification, status (draft/submitted/approved/rejected) | US-MKTG-016 |

#### What we ADD to existing models:
- `Plan.owner` (FK to AppUser)
- `Plan.tenant` (FK to Tenant)
- `Plan.objectives` (TextField)
- `Initiative.owner`, `Initiative.tenant`
- `Tactic.owner`, `Tactic.tenant`, `Tactic.type`

#### UI additions:
- Budget tracker card on Plan detail (planned vs actual vs variance)
- Fund management page
- Budget request form with approval status badge

---

### MODULE 3 — Offers & Treatments (Extract + Expand)
**App:** `offers` (new app, models moved from `marketing`)
**Priority:** Phase 1

#### Models (moved + expanded):
| Model | Additions vs current |
|-------|---------------------|
| `Offer` | + tenant, owner, version, clone support |
| `Treatment` | + template_ref, activation_date, expiration_date, language |
| `TreatmentTemplate` | NEW: channel, content, version, approval_status, is_approved |
| `PersonalizationToken` | NEW: name, data_source, fallback_value |

#### UI:
- Offer library with status badges (Draft / Active / Retired)
- Treatment preview with real personalization token substitution
- Template library page (centralized, filterable by channel)
- Clone offer button

---

### MODULE 4 — Campaigns (Extract + Expand)
**App:** `campaigns` (new app, models moved from `marketing`)
**Priority:** Phase 1

#### Models (moved + expanded):
| Model | Additions vs current |
|-------|---------------------|
| `Campaign` | + tenant, owner, campaign_type (direct/indirect), channel, approval_status, version |
| `CampaignOffer` | NEW: campaign ↔ offer/treatment M2M |
| `CampaignTeam` | NEW: campaign, user, role |
| `Wave` | NEW: campaign, batch_size, schedule_start, status |
| `CampaignResponse` | REPLACED: real fields — contact, channel, response_code, captured_at, status |
| `CampaignRun` | NEW: campaign, initiated_by, started_at, status, wave_count |

#### UI:
- Campaign lifecycle status stepper (Draft → Planned → Active → Completed)
- Wave configuration panel
- Response tracker with real counts
- Campaign ROI fields (cost, expected_revenue, actual_revenue)

---

### MODULE 5 — Leads (Extract + Expand)
**App:** `leads` (new app, models moved from `marketing`)
**Priority:** Phase 1

#### Models (moved + expanded):
| Model | Additions vs current |
|-------|---------------------|
| `Lead` | + tenant, campaign (FK), response (FK), assignment_rule_used, score (float, from ML) |
| `LeadActivity` | NEW: lead, activity_type, notes, created_by, created_at |
| `Opportunity` | NEW: lead (FK), name, value, stage, owner, expected_close |

#### UI:
- Lead list with AI score badge (color-coded: Hot/Warm/Cold driven by ML score)
- Lead detail with activity timeline
- One-click "Convert to Opportunity"
- Lead qualification workflow (Accept / Reject / Retire with reason)

---

### MODULE 6 — AI Copilot Panel ⭐ (NEW — Biggest Wow Factor)
**App:** `ai_copilot` (new app)
**Priority:** Phase 1 — demo centerpiece

#### What it does:
A floating side panel available on Campaign, Offer, and Lead pages that uses an LLM API (Claude/OpenAI) to:

| Feature | Input | Output |
|---------|-------|--------|
| Campaign Brief Generator | Campaign name, product, target audience | Full campaign brief with objectives, messaging, CTAs |
| Subject Line Generator | Offer description, channel (email) | 5 subject line variants with tone options |
| Offer Copy Writer | Product name, offer type, audience | Headline, body copy, CTA text |
| Lead Insight | Lead's data (company, industry, behavior) | Why this lead is scored high/low, suggested next action |
| Segment Suggestion | Campaign context | 3 suggested audience segments with rationale |

#### Models:
| Model | Key Fields |
|-------|-----------|
| `AICopilotRun` | user, tenant, context_type (campaign/offer/lead), prompt_used, response_text, tokens_used, created_at |
| `AIPromptTemplate` | name, context_type, system_prompt, user_prompt_template, is_active |

#### UI (React + Tailwind):
- Collapsible AI panel on the right side of Campaign/Offer/Lead pages
- Feature tabs: Brief / Subject Lines / Copy / Insights
- "Generate" button with loading spinner
- Copy-to-clipboard button on each output
- Run history (last 5 generations)

#### "Impressive factor" to mention:
> "All AI runs are logged with prompt used, token count, context, and user —
> enabling auditability of AI-generated content before it goes into campaigns.
> This follows responsible AI practices required in enterprise marketing systems."

---

### MODULE 7 — CXO Dashboard + Predictive Lead Scoring ⭐
**App:** `dashboards` (new app)
**Priority:** Phase 1 — second biggest wow factor

#### CXO Dashboard:
| Metric / Chart | Data Source |
|---------------|-------------|
| Total Campaigns (Active / Completed) | `Campaign` table |
| Campaign Response Rate (%) | `CampaignResponse` / `Wave` |
| Lead Funnel (New → Qualified → Converted) | `Lead` status counts |
| Budget Utilization (Planned vs Actual) | `Fund` + `FundAllocation` |
| Top Performing Campaigns (by response rate) | Computed |
| Lead Score Distribution (histogram) | `Lead.score` |
| Recent AI Copilot Activity | `AICopilotRun` count |

#### Predictive Lead Scoring:
A lightweight ML pipeline using `scikit-learn`:

| Step | Detail |
|------|--------|
| Features | industry, company_size, source, campaign_type, response_count, days_since_created |
| Model | Logistic Regression (fast, explainable — perfect for demo) |
| Training data | Seed 200–500 synthetic leads with outcomes |
| Output | `score` (0.0–1.0) stored on Lead model, auto-refreshed on save |
| Display | Score badge on lead list (🔴 Hot >0.7 / 🟡 Warm 0.4–0.7 / 🔵 Cold <0.4) |

#### Models:
| Model | Key Fields |
|-------|-----------|
| `MetricSnapshot` | tenant, period, metric_name, value, computed_at |
| `LeadScoringModel` | version, algorithm, accuracy, trained_at, is_active, feature_weights_json |

#### UI (React + Tailwind):
- Full-page CXO dashboard with card grid + charts (using Recharts)
- Animated number counters on KPI cards
- Lead funnel visualization
- Lead score distribution bar chart

#### "Impressive factor" to mention:
> "Lead scoring uses a trained logistic regression model with 6 engineered
> features. The model is versioned — each retrain creates a new model record
> with accuracy metrics, allowing rollback. Scores auto-update when lead data
> changes via Django signals."

---

## Build Order (Day-by-Day Plan)

| Day | Work |
|-----|------|
| **Day 1** | Accounts app (Tenant, User, Role, RBAC middleware) + PostgreSQL RLS setup + new React login page |
| **Day 2** | Extract Offers → `offers` app, Campaigns → `campaigns` app, Leads → `leads` app. Add tenant_id migrations. Expand models. |
| **Day 3** | AI Copilot app — models, API integration (Anthropic/OpenAI), React panel component |
| **Day 4** | Lead Scoring — sklearn model, seed data, scoring pipeline, score display on Lead list |
| **Day 5** | CXO Dashboard — React page, charts, metric computation, fund/budget tracker |
| **Day 6** | Polish — fix UI inconsistencies, add demo seed data, test all flows end-to-end |
| **Day 7 (buffer)** | Documentation prep, bug fixes, presentation rehearsal |

---

## Architecture Diagram (Describe This to Evaluators)

```
┌─────────────────────────────────────────────────────┐
│                   Browser (React + Tailwind)         │
│   Login │ Dashboard │ Campaigns │ AI Copilot Panel   │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP / JSON
┌──────────────────────▼──────────────────────────────┐
│              Django 5 (Modular Monolith)             │
│  accounts │ marketing │ offers │ campaigns │ leads   │
│  ai_copilot │ dashboards                            │
│                                                      │
│  Middleware: TenantMiddleware → sets app.tenant_id   │
│  RBAC: Permission checks per view                    │
└──────────────────────┬──────────────────────────────┘
                       │
       ┌───────────────┼──────────────────┐
       │               │                  │
┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
│ PostgreSQL  │  │  Redis      │  │  LLM API    │
│ + RLS       │  │  (cache)    │  │  (Anthropic │
│ policies    │  │             │  │  / OpenAI)  │
└─────────────┘  └─────────────┘  └─────────────┘
                                         │
                              ┌──────────▼──────────┐
                              │  scikit-learn        │
                              │  Lead Scoring Model  │
                              └─────────────────────┘
```

---

## What Makes This "Industry Level" (Talking Points)

1. **Multi-tenancy with DB-level RLS** — same pattern as Salesforce's shared-schema multi-tenancy
2. **RBAC with org-unit scoping** — role permissions scoped to business units, not just global
3. **AI Copilot with audit logging** — responsible AI, every generation is traceable
4. **Versioned models** — Campaigns have version numbers, supports rollback
5. **Predictive scoring with model versioning** — ML pipeline with reproducibility
6. **Modular monolith** — not microservices (too complex), but clean app boundaries that can be extracted to services
7. **Soft deletes** — no data is hard-deleted, audit trail preserved
8. **Django signals** — lead scoring auto-triggers on model save (reactive architecture)

---

*Confirm this plan → we start building Day 1 immediately.*
