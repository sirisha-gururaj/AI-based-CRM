from django.db import models


PLAN_STATUS_CHOICES = [
    ("DRAFT", "Draft"),
    ("PLANNED", "Planned"),
    ("ACTIVE", "Active"),
    ("COMPLETED", "Completed"),
]

#------------------- usha block -------------------
class Offer(models.Model):
    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("ACTIVE", "Active"),
        ("RETIRED", "Retired"),
    ]

    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="DRAFT")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class Treatment(models.Model):
    CHANNEL_CHOICES = [
        ("EMAIL", "Email"),
        ("WEB", "Web"),
        ("SMS", "SMS"),
        ("PHONE", "Phone"),
        ("DIRECT_MAIL", "Direct Mail"),
    ]

    offer = models.ForeignKey(Offer, on_delete=models.CASCADE, related_name="treatments")
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    name = models.CharField(max_length=255)
    subject = models.CharField(max_length=255, blank=True)
    body = models.TextField(blank=True)  # will be edited with rich-text editor later
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.offer.code} - {self.name} ({self.channel})"

class Lead(models.Model):
    STATUS_CHOICES = [
    ("NEW", "New"),
    ("CONTACTED", "Contacted"),
    ("QUALIFIED", "Qualified"),
    ("CONVERTED", "Converted"),
    ("LOST", "Lost"),
]

    SOURCE_CHOICES = [
        ("web", "Web form"),
        ("campaign", "Campaign"),
        ("referral", "Referral"),
        ("partner", "Partner"),
        ("other", "Other"),
    ]

    RATING_CHOICES = [
        ("hot", "Hot"),
        ("warm", "Warm"),
        ("cold", "Cold"),
    ]

    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)
    job_title = models.CharField(max_length=150, blank=True)

    company = models.CharField(max_length=200, blank=True)
    industry = models.CharField(max_length=150, blank=True)
    company_size = models.CharField(
        max_length=50,
        blank=True,
        help_text="e.g. 1-10, 11-50, 51-200",
    )

    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)

    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="NEW")
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default="web")
    rating = models.CharField(max_length=20, choices=RATING_CHOICES, default="warm")

    owner = models.CharField(
        max_length=100,
        blank=True,
        help_text="Sales owner, e.g. Usha or team name",
    )

    offer = models.ForeignKey(
        Offer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="leads",
    )

    notes = models.TextField(blank=True)

    score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def full_name(self):
        if self.first_name:
            return f"{self.first_name} {self.last_name}"
        return self.last_name

    def __str__(self):
        return self.full_name()
#------------------- usha block ends -------------------




class Plan(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=PLAN_STATUS_CHOICES, default="DRAFT")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    total_budget = models.DecimalField(max_digits=10, decimal_places=2, default=0, blank=True)

    def __str__(self):
        return self.name

    @property
    def initiatives_planned_total(self):
        return self.initiatives.aggregate(total=models.Sum("planned_amount"))["total"] or 0

    @property
    def initiatives_actual_total(self):
        return self.initiatives.aggregate(total=models.Sum("actual_amount"))["total"] or 0

    @property
    def initiatives_variance(self):
        return self.initiatives_planned_total - self.initiatives_actual_total


class Initiative(models.Model):
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name="initiatives")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=PLAN_STATUS_CHOICES, default="DRAFT")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    planned_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    actual_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.plan.name} - {self.name}"

    @property
    def tactics_planned_total(self):
        return self.tactics.aggregate(total=models.Sum("planned_amount"))["total"] or 0

    @property
    def tactics_actual_total(self):
        return self.tactics.aggregate(total=models.Sum("actual_amount"))["total"] or 0

    @property
    def tactics_variance(self):
        return self.tactics_planned_total - self.tactics_actual_total


class Tactic(models.Model):
    initiative = models.ForeignKey(Initiative, on_delete=models.CASCADE, related_name="tactics")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=PLAN_STATUS_CHOICES, default="DRAFT")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    planned_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    actual_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.initiative.name} - {self.name}"


class Expense(models.Model):
    tactic = models.ForeignKey(Tactic, on_delete=models.CASCADE, related_name="expenses")
    name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    spent_on = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tactic.name} - {self.name}"


#------------------- Campaign block -------------------
CAMPAIGN_STATUS_CHOICES = [
    ("DRAFT", "Draft"),
    ("PLANNED", "Planned"),
    ("ACTIVE", "Active"),
    ("COMPLETED", "Completed"),
]


class Campaign(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=CAMPAIGN_STATUS_CHOICES, default="DRAFT")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    target_list = models.CharField(max_length=255, blank=True, help_text="Name or reference to target list")
    offer = models.ForeignKey(Offer, on_delete=models.SET_NULL, null=True, blank=True, related_name="campaigns")
    treatment = models.ForeignKey(Treatment, on_delete=models.SET_NULL, null=True, blank=True, related_name="campaigns")
    import_contacts = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def response_count(self):
        return self.responses.count()

    @property
    def accepted_count(self):
        return self.responses.filter(status="ACCEPTED").count()

    @property
    def rejected_count(self):
        return self.responses.filter(status="REJECTED").count()

    @property
    def pending_count(self):
        return self.responses.filter(status="PENDING").count()


class CampaignResponse(models.Model):
    RESPONSE_STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("ACCEPTED", "Accepted"),
        ("REJECTED", "Rejected"),
    ]

    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name="responses")
    contact_name = models.CharField(max_length=255)
    contact_email = models.EmailField()
    status = models.CharField(max_length=20, choices=RESPONSE_STATUS_CHOICES, default="PENDING")
    response_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.campaign.name} - {self.contact_name} ({self.status})"
