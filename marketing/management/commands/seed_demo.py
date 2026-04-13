from django.core.management.base import BaseCommand

from marketing.models import (
    Campaign,
    CampaignResponse,
    Expense,
    Initiative,
    Lead,
    Offer,
    Plan,
    Tactic,
    Treatment,
)


class Command(BaseCommand):
    help = "Seed fresh demo data for project demonstration"

    def handle(self, *args, **options):
        self.stdout.write("Deleting existing data...")
        CampaignResponse.objects.all().delete()
        Campaign.objects.all().delete()
        Expense.objects.all().delete()
        Tactic.objects.all().delete()
        Initiative.objects.all().delete()
        Plan.objects.all().delete()
        Treatment.objects.all().delete()
        Lead.objects.all().delete()
        Offer.objects.all().delete()

        self.stdout.write("Creating offers and treatments...")
        offers = {}
        offers["OFF-001"], _ = Offer.objects.update_or_create(
            code="OFF-001",
            defaults={
                "name": "Summer Discount Blitz",
                "description": "",
                "is_active": True,
                "status": "ACTIVE",
                "start_date": "2026-01-01",
                "end_date": "2026-06-30",
            },
        )
        offers["OFF-002"], _ = Offer.objects.update_or_create(
            code="OFF-002",
            defaults={
                "name": "SMS Flash Outreach",
                "description": "",
                "is_active": True,
                "status": "ACTIVE",
                "start_date": "2026-02-01",
                "end_date": "2026-05-31",
            },
        )
        offers["OFF-003"], _ = Offer.objects.update_or_create(
            code="OFF-003",
            defaults={
                "name": "Web Lead Capture Pro",
                "description": "",
                "is_active": True,
                "status": "DRAFT",
                "start_date": "2026-03-01",
                "end_date": "2026-08-31",
            },
        )
        offers["OFF-004"], _ = Offer.objects.update_or_create(
            code="OFF-004",
            defaults={
                "name": "Direct Mail Reactivation",
                "description": "",
                "is_active": True,
                "status": "RETIRED",
                "start_date": "2025-01-01",
                "end_date": "2025-12-31",
            },
        )

        treatments = {}
        treatments["OFF-001"] = Treatment.objects.update_or_create(
            offer=offers["OFF-001"],
            name="Summer Email Blast",
            defaults={
                "channel": "EMAIL",
                "subject": "Don't Miss Our Summer Sale — Up to 40% Off!",
                "body": "Hi there, our biggest summer sale is here. Shop now and save up to 40% across all categories. Limited time only.",
                "is_active": True,
            },
        )[0]
        treatments["OFF-002"] = Treatment.objects.update_or_create(
            offer=offers["OFF-002"],
            name="Flash SMS Alert",
            defaults={
                "channel": "SMS",
                "subject": "",
                "body": "FLASH SALE: 30% off today only! Use code FLASH30 at checkout. Reply STOP to opt out.",
                "is_active": True,
            },
        )[0]
        treatments["OFF-003"] = Treatment.objects.update_or_create(
            offer=offers["OFF-003"],
            name="Web Landing Banner",
            defaults={
                "channel": "WEB",
                "subject": "Start Your Free Trial Today",
                "body": "Discover how our platform helps B2B teams close deals faster. Sign up free — no credit card needed.",
                "is_active": True,
            },
        )[0]
        treatments["OFF-004"] = Treatment.objects.update_or_create(
            offer=offers["OFF-004"],
            name="Reactivation Mailer",
            defaults={
                "channel": "DIRECT_MAIL",
                "subject": "We Miss You — Here's 20% Off",
                "body": "It's been a while! Come back and enjoy 20% off your next purchase. Offer valid until 31st March 2026.",
                "is_active": True,
            },
        )[0]

        self.stdout.write("Creating leads...")
        leads = {}
        leads["Priya Sharma"], _ = Lead.objects.update_or_create(
            email="priya.sharma@techcorp.in",
            defaults={
                "first_name": "Priya",
                "last_name": "Sharma",
                "company": "TechCorp India",
                "job_title": "Marketing Manager",
                "status": "NEW",
                "rating": "hot",
                "source": "campaign",
                "owner": "Sirisha",
                "offer": offers["OFF-001"],
            },
        )
        leads["Rahul Mehta"], _ = Lead.objects.update_or_create(
            email="rahul.mehta@finzone.com",
            defaults={
                "first_name": "Rahul",
                "last_name": "Mehta",
                "company": "FinZone",
                "job_title": "CFO",
                "status": "CONTACTED",
                "rating": "warm",
                "source": "web",
                "owner": "Sirisha",
                "offer": offers["OFF-001"],
            },
        )
        leads["Ananya Iyer"], _ = Lead.objects.update_or_create(
            email="ananya.iyer@retailplus.com",
            defaults={
                "first_name": "Ananya",
                "last_name": "Iyer",
                "company": "RetailPlus",
                "job_title": "Operations Head",
                "status": "QUALIFIED",
                "rating": "hot",
                "source": "referral",
                "owner": "Sirisha",
                "offer": offers["OFF-001"],
            },
        )
        leads["Karthik Nair"], _ = Lead.objects.update_or_create(
            email="karthik.nair@cloudsync.io",
            defaults={
                "first_name": "Karthik",
                "last_name": "Nair",
                "company": "CloudSync",
                "job_title": "CTO",
                "status": "CONVERTED",
                "rating": "hot",
                "source": "partner",
                "owner": "Sirisha",
            },
        )
        leads["Divya Reddy"], _ = Lead.objects.update_or_create(
            email="divya.reddy@mediahub.co",
            defaults={
                "first_name": "Divya",
                "last_name": "Reddy",
                "company": "MediaHub",
                "job_title": "Brand Manager",
                "status": "LOST",
                "rating": "cold",
                "source": "web",
                "owner": "Sirisha",
            },
        )
        leads["Suresh Patel"], _ = Lead.objects.update_or_create(
            email="suresh.patel@logipro.com",
            defaults={
                "first_name": "Suresh",
                "last_name": "Patel",
                "company": "LogiPro",
                "job_title": "Supply Chain Lead",
                "status": "NEW",
                "rating": "warm",
                "source": "campaign",
                "owner": "Sirisha",
                "offer": offers["OFF-002"],
            },
        )
        leads["Meera Joshi"], _ = Lead.objects.update_or_create(
            email="meera.joshi@eduspark.in",
            defaults={
                "first_name": "Meera",
                "last_name": "Joshi",
                "company": "EduSpark",
                "job_title": "Director",
                "status": "CONTACTED",
                "rating": "warm",
                "source": "referral",
                "owner": "Sirisha",
            },
        )
        leads["Arun Kumar"], _ = Lead.objects.update_or_create(
            email="arun.kumar@healthnet.com",
            defaults={
                "first_name": "Arun",
                "last_name": "Kumar",
                "company": "HealthNet",
                "job_title": "CEO",
                "status": "QUALIFIED",
                "rating": "hot",
                "source": "web",
                "owner": "Sirisha",
            },
        )
        leads["Sneha Bhat"], _ = Lead.objects.update_or_create(
            email="sneha.bhat@designco.in",
            defaults={
                "first_name": "Sneha",
                "last_name": "Bhat",
                "company": "DesignCo",
                "job_title": "Creative Head",
                "status": "NEW",
                "rating": "cold",
                "source": "other",
                "owner": "Sirisha",
            },
        )
        leads["Vikram Singh"], _ = Lead.objects.update_or_create(
            email="vikram.singh@saaspro.com",
            defaults={
                "first_name": "Vikram",
                "last_name": "Singh",
                "company": "SaaSPro",
                "job_title": "Product Manager",
                "status": "CONVERTED",
                "rating": "warm",
                "source": "campaign",
                "owner": "Sirisha",
            },
        )

        self.stdout.write("Creating plans, initiatives, tactics...")
        plans = {}
        plans["Q1 2026 Marketing Plan"], _ = Plan.objects.update_or_create(
            name="Q1 2026 Marketing Plan",
            defaults={
                "status": "ACTIVE",
                "total_budget": 500000,
                "start_date": "2026-01-01",
                "end_date": "2026-03-31",
            },
        )
        plans["Q2 2026 Growth Plan"], _ = Plan.objects.update_or_create(
            name="Q2 2026 Growth Plan",
            defaults={
                "status": "PLANNED",
                "total_budget": 750000,
                "start_date": "2026-04-01",
                "end_date": "2026-06-30",
            },
        )
        plans["2025 Annual Reactivation"], _ = Plan.objects.update_or_create(
            name="2025 Annual Reactivation",
            defaults={
                "status": "COMPLETED",
                "total_budget": 300000,
                "start_date": "2025-01-01",
                "end_date": "2025-12-31",
            },
        )

        initiatives = {}
        initiatives["Email Acquisition Drive"], _ = Initiative.objects.update_or_create(
            plan=plans["Q1 2026 Marketing Plan"],
            name="Email Acquisition Drive",
            defaults={
                "status": "ACTIVE",
                "planned_amount": 200000,
                "actual_amount": 185000,
                "start_date": "2026-01-01",
                "end_date": "2026-02-28",
            },
        )
        initiatives["Social Media Push"], _ = Initiative.objects.update_or_create(
            plan=plans["Q1 2026 Marketing Plan"],
            name="Social Media Push",
            defaults={
                "status": "ACTIVE",
                "planned_amount": 150000,
                "actual_amount": 162000,
                "start_date": "2026-02-01",
                "end_date": "2026-03-31",
            },
        )
        initiatives["Partner Channel Expansion"], _ = Initiative.objects.update_or_create(
            plan=plans["Q2 2026 Growth Plan"],
            name="Partner Channel Expansion",
            defaults={
                "status": "PLANNED",
                "planned_amount": 300000,
                "actual_amount": 0,
                "start_date": "2026-04-01",
                "end_date": "2026-05-31",
            },
        )
        initiatives["Product Launch Campaign"], _ = Initiative.objects.update_or_create(
            plan=plans["Q2 2026 Growth Plan"],
            name="Product Launch Campaign",
            defaults={
                "status": "PLANNED",
                "planned_amount": 250000,
                "actual_amount": 0,
                "start_date": "2026-05-01",
                "end_date": "2026-06-30",
            },
        )
        initiatives["Lapsed Customer Win-back"], _ = Initiative.objects.update_or_create(
            plan=plans["2025 Annual Reactivation"],
            name="Lapsed Customer Win-back",
            defaults={
                "status": "COMPLETED",
                "planned_amount": 150000,
                "actual_amount": 148000,
                "start_date": "2025-03-01",
                "end_date": "2025-06-30",
            },
        )
        initiatives["Brand Awareness Blitz"], _ = Initiative.objects.update_or_create(
            plan=plans["2025 Annual Reactivation"],
            name="Brand Awareness Blitz",
            defaults={
                "status": "COMPLETED",
                "planned_amount": 120000,
                "actual_amount": 125000,
                "start_date": "2025-07-01",
                "end_date": "2025-09-30",
            },
        )

        tactics = {}
        tactics["Welcome Email Series"], _ = Tactic.objects.update_or_create(
            initiative=initiatives["Email Acquisition Drive"],
            name="Welcome Email Series",
            defaults={
                "status": "ACTIVE",
                "planned_amount": 80000,
                "actual_amount": 75000,
                "start_date": "2026-01-01",
                "end_date": "2026-01-31",
            },
        )
        tactics["Re-engagement Drip"], _ = Tactic.objects.update_or_create(
            initiative=initiatives["Email Acquisition Drive"],
            name="Re-engagement Drip",
            defaults={
                "status": "ACTIVE",
                "planned_amount": 70000,
                "actual_amount": 68000,
                "start_date": "2026-02-01",
                "end_date": "2026-02-28",
            },
        )
        tactics["LinkedIn Sponsored Posts"], _ = Tactic.objects.update_or_create(
            initiative=initiatives["Social Media Push"],
            name="LinkedIn Sponsored Posts",
            defaults={
                "status": "ACTIVE",
                "planned_amount": 80000,
                "actual_amount": 90000,
                "start_date": "2026-02-01",
                "end_date": "2026-02-28",
            },
        )
        tactics["Instagram Story Ads"], _ = Tactic.objects.update_or_create(
            initiative=initiatives["Social Media Push"],
            name="Instagram Story Ads",
            defaults={
                "status": "DRAFT",
                "planned_amount": 50000,
                "actual_amount": 0,
                "start_date": "2026-03-01",
                "end_date": "2026-03-31",
            },
        )
        tactics["Partner Onboarding Webinar"], _ = Tactic.objects.update_or_create(
            initiative=initiatives["Partner Channel Expansion"],
            name="Partner Onboarding Webinar",
            defaults={
                "status": "PLANNED",
                "planned_amount": 100000,
                "actual_amount": 0,
                "start_date": "2026-04-01",
                "end_date": "2026-04-30",
            },
        )
        tactics["Co-marketing Collateral"], _ = Tactic.objects.update_or_create(
            initiative=initiatives["Partner Channel Expansion"],
            name="Co-marketing Collateral",
            defaults={
                "status": "PLANNED",
                "planned_amount": 80000,
                "actual_amount": 0,
                "start_date": "2026-04-15",
                "end_date": "2026-05-15",
            },
        )
        tactics["Press Release & PR Outreach"], _ = Tactic.objects.update_or_create(
            initiative=initiatives["Product Launch Campaign"],
            name="Press Release & PR Outreach",
            defaults={
                "status": "PLANNED",
                "planned_amount": 100000,
                "actual_amount": 0,
                "start_date": "2026-05-01",
                "end_date": "2026-05-15",
            },
        )
        tactics["Launch Event Sponsorship"], _ = Tactic.objects.update_or_create(
            initiative=initiatives["Product Launch Campaign"],
            name="Launch Event Sponsorship",
            defaults={
                "status": "PLANNED",
                "planned_amount": 120000,
                "actual_amount": 0,
                "start_date": "2026-05-20",
                "end_date": "2026-06-01",
            },
        )
        tactics["Win-back Email Sequence"], _ = Tactic.objects.update_or_create(
            initiative=initiatives["Lapsed Customer Win-back"],
            name="Win-back Email Sequence",
            defaults={
                "status": "COMPLETED",
                "planned_amount": 70000,
                "actual_amount": 69000,
                "start_date": "2025-03-01",
                "end_date": "2025-04-30",
            },
        )
        tactics["Discount Coupon Mailer"], _ = Tactic.objects.update_or_create(
            initiative=initiatives["Lapsed Customer Win-back"],
            name="Discount Coupon Mailer",
            defaults={
                "status": "COMPLETED",
                "planned_amount": 60000,
                "actual_amount": 58000,
                "start_date": "2025-05-01",
                "end_date": "2025-06-30",
            },
        )
        tactics["YouTube Pre-roll Ads"], _ = Tactic.objects.update_or_create(
            initiative=initiatives["Brand Awareness Blitz"],
            name="YouTube Pre-roll Ads",
            defaults={
                "status": "COMPLETED",
                "planned_amount": 60000,
                "actual_amount": 65000,
                "start_date": "2025-07-01",
                "end_date": "2025-08-31",
            },
        )
        tactics["Display Banner Network"], _ = Tactic.objects.update_or_create(
            initiative=initiatives["Brand Awareness Blitz"],
            name="Display Banner Network",
            defaults={
                "status": "COMPLETED",
                "planned_amount": 50000,
                "actual_amount": 48000,
                "start_date": "2025-08-01",
                "end_date": "2025-09-30",
            },
        )

        self.stdout.write("Creating campaigns and responses...")
        campaigns = {}
        campaigns["Summer Email Campaign"], _ = Campaign.objects.update_or_create(
            name="Summer Email Campaign",
            defaults={
                "status": "ACTIVE",
                "offer": offers["OFF-001"],
                "treatment": treatments["OFF-001"],
                "target_list": "Leads: New",
                "start_date": "2026-02-01",
                "end_date": "2026-04-30",
                "description": "Email campaign targeting new leads with summer discount offer",
            },
        )
        campaigns["SMS Flash Campaign"], _ = Campaign.objects.update_or_create(
            name="SMS Flash Campaign",
            defaults={
                "status": "ACTIVE",
                "offer": offers["OFF-002"],
                "treatment": treatments["OFF-002"],
                "target_list": "Leads: All",
                "start_date": "2026-03-01",
                "end_date": "2026-03-31",
                "description": "Flash SMS blast to entire lead base for one-day sale",
            },
        )
        campaigns["Web Capture Draft"], _ = Campaign.objects.update_or_create(
            name="Web Capture Draft",
            defaults={
                "status": "DRAFT",
                "offer": offers["OFF-003"],
                "treatment": treatments["OFF-003"],
                "target_list": "Leads: Qualified",
                "start_date": "2026-05-01",
                "end_date": "2026-07-31",
                "description": "Web-based lead capture campaign for free trial signups",
            },
        )
        campaigns["Reactivation Planned"], _ = Campaign.objects.update_or_create(
            name="Reactivation Planned",
            defaults={
                "status": "PLANNED",
                "offer": offers["OFF-004"],
                "treatment": treatments["OFF-004"],
                "target_list": "Leads: Lost",
                "start_date": "2026-06-01",
                "end_date": "2026-08-31",
                "description": "Direct mail campaign targeting lapsed and lost customers",
            },
        )

        CampaignResponse.objects.create(
            campaign=campaigns["Summer Email Campaign"],
            contact_name="Priya Sharma",
            contact_email="priya.sharma@techcorp.in",
            status="ACCEPTED",
        )
        CampaignResponse.objects.create(
            campaign=campaigns["Summer Email Campaign"],
            contact_name="Rahul Mehta",
            contact_email="rahul.mehta@finzone.com",
            status="ACCEPTED",
        )
        CampaignResponse.objects.create(
            campaign=campaigns["Summer Email Campaign"],
            contact_name="Ananya Iyer",
            contact_email="ananya.iyer@retailplus.com",
            status="PENDING",
        )
        CampaignResponse.objects.create(
            campaign=campaigns["Summer Email Campaign"],
            contact_name="Karthik Nair",
            contact_email="karthik.nair@cloudsync.io",
            status="ACCEPTED",
        )
        CampaignResponse.objects.create(
            campaign=campaigns["Summer Email Campaign"],
            contact_name="Divya Reddy",
            contact_email="divya.reddy@mediahub.co",
            status="REJECTED",
        )
        CampaignResponse.objects.create(
            campaign=campaigns["Summer Email Campaign"],
            contact_name="Suresh Patel",
            contact_email="suresh.patel@logipro.com",
            status="PENDING",
        )

        CampaignResponse.objects.create(
            campaign=campaigns["SMS Flash Campaign"],
            contact_name="Meera Joshi",
            contact_email="meera.joshi@eduspark.in",
            status="ACCEPTED",
        )
        CampaignResponse.objects.create(
            campaign=campaigns["SMS Flash Campaign"],
            contact_name="Arun Kumar",
            contact_email="arun.kumar@healthnet.com",
            status="ACCEPTED",
        )
        CampaignResponse.objects.create(
            campaign=campaigns["SMS Flash Campaign"],
            contact_name="Sneha Bhat",
            contact_email="sneha.bhat@designco.in",
            status="REJECTED",
        )
        CampaignResponse.objects.create(
            campaign=campaigns["SMS Flash Campaign"],
            contact_name="Vikram Singh",
            contact_email="vikram.singh@saaspro.com",
            status="PENDING",
        )

        self.stdout.write("Done! Demo data seeded successfully.")
