from rest_framework import serializers

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


class OfferSerializer(serializers.ModelSerializer):
    treatments_count = serializers.SerializerMethodField()
    leads_count = serializers.SerializerMethodField()

    class Meta:
        model = Offer
        fields = '__all__'

    def get_treatments_count(self, offer):
        return getattr(offer, 'treatments_count_anno', offer.treatments.count())

    def get_leads_count(self, offer):
        return getattr(offer, 'leads_count_anno', offer.leads.count())


class TreatmentSerializer(serializers.ModelSerializer):
    offer_name = serializers.CharField(source='offer.name', read_only=True)
    channel_label = serializers.CharField(source='get_channel_display', read_only=True)

    class Meta:
        model = Treatment
        fields = '__all__'


class LeadSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    source_label = serializers.CharField(source='get_source_display', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)
    rating_label = serializers.CharField(source='get_rating_display', read_only=True)
    offer_name = serializers.SerializerMethodField()
    offer_code = serializers.SerializerMethodField()
    last_campaign_name = serializers.SerializerMethodField()
    last_campaign_response_status = serializers.SerializerMethodField()
    last_campaign_response_date = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = '__all__'

    def get_full_name(self, lead):
        return lead.full_name()

    def get_offer_name(self, lead):
        return lead.offer.name if lead.offer else None

    def get_offer_code(self, lead):
        return lead.offer.code if lead.offer else None

    def get_last_campaign_name(self, lead):
        annotated = getattr(lead, 'last_campaign_name_anno', None)
        if annotated is not None:
            return annotated
        if not lead.email:
            return None
        response = (
            CampaignResponse.objects.filter(contact_email__iexact=lead.email)
            .select_related('campaign')
            .order_by('-response_date')
            .first()
        )
        return response.campaign.name if response and response.campaign else None

    def get_last_campaign_response_status(self, lead):
        annotated = getattr(lead, 'last_campaign_response_status_anno', None)
        if annotated is not None:
            return annotated
        if not lead.email:
            return None
        response = CampaignResponse.objects.filter(contact_email__iexact=lead.email).order_by('-response_date').first()
        return response.status if response else None

    def get_last_campaign_response_date(self, lead):
        annotated = getattr(lead, 'last_campaign_response_date_anno', None)
        if annotated is not None:
            return annotated
        if not lead.email:
            return None
        response = CampaignResponse.objects.filter(contact_email__iexact=lead.email).order_by('-response_date').first()
        return response.response_date if response else None


class PlanSerializer(serializers.ModelSerializer):
    initiatives_planned_total = serializers.SerializerMethodField()
    initiatives_actual_total = serializers.SerializerMethodField()
    initiatives_variance = serializers.SerializerMethodField()

    class Meta:
        model = Plan
        fields = '__all__'

    def get_initiatives_planned_total(self, plan):
        annotated = getattr(plan, 'initiatives_planned_total_anno', None)
        return annotated if annotated is not None else plan.initiatives_planned_total

    def get_initiatives_actual_total(self, plan):
        annotated = getattr(plan, 'initiatives_actual_total_anno', None)
        return annotated if annotated is not None else plan.initiatives_actual_total

    def get_initiatives_variance(self, plan):
        planned = getattr(plan, 'initiatives_planned_total_anno', None)
        actual = getattr(plan, 'initiatives_actual_total_anno', None)
        if planned is not None or actual is not None:
            return (planned or 0) - (actual or 0)
        return plan.initiatives_variance


class InitiativeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Initiative
        fields = '__all__'


class TacticSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tactic
        fields = '__all__'


class CampaignSerializer(serializers.ModelSerializer):
    response_count = serializers.SerializerMethodField()
    accepted_count = serializers.SerializerMethodField()
    rejected_count = serializers.SerializerMethodField()
    pending_count = serializers.SerializerMethodField()
    offer_name = serializers.SerializerMethodField()
    offer_code = serializers.SerializerMethodField()
    treatment_name = serializers.SerializerMethodField()
    treatment_channel = serializers.SerializerMethodField()
    treatment_channel_label = serializers.SerializerMethodField()
    target_list_label = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = '__all__'

    def get_response_count(self, campaign):
        return getattr(campaign, 'response_count_anno', campaign.response_count)

    def get_accepted_count(self, campaign):
        annotated = getattr(campaign, 'accepted_count_anno', None)
        if annotated is not None:
            return annotated
        if self.context.get('skip_expensive_counts'):
            return 0
        return campaign.accepted_count

    def get_rejected_count(self, campaign):
        annotated = getattr(campaign, 'rejected_count_anno', None)
        if annotated is not None:
            return annotated
        if self.context.get('skip_expensive_counts'):
            return 0
        return campaign.rejected_count

    def get_pending_count(self, campaign):
        annotated = getattr(campaign, 'pending_count_anno', None)
        if annotated is not None:
            return annotated
        if self.context.get('skip_expensive_counts'):
            return 0
        return campaign.pending_count

    def get_offer_name(self, campaign):
        return campaign.offer.name if campaign.offer else None

    def get_offer_code(self, campaign):
        return campaign.offer.code if campaign.offer else None

    def get_treatment_name(self, campaign):
        return campaign.treatment.name if campaign.treatment else None

    def get_treatment_channel(self, campaign):
        return campaign.treatment.channel if campaign.treatment else None

    def get_treatment_channel_label(self, campaign):
        return campaign.treatment.get_channel_display() if campaign.treatment else None

    def get_target_list_label(self, campaign):
        value = campaign.target_list or ''
        if value.startswith('STATUS:'):
            status = value.split(':', 1)[1]
            labels = {
                'NEW': 'Leads: New',
                'CONTACTED': 'Leads: Contacted',
                'QUALIFIED': 'Leads: Qualified',
                'CONVERTED': 'Leads: Converted',
                'LOST': 'Leads: Lost',
            }
            return labels.get(status, value)
        if value.startswith('IMPORT:'):
            return f"Imported: {value.split(':', 1)[1]}"
        return value or 'No target list linked'

    def validate(self, attrs):
        # For updates, fall back to instance values when field is omitted.
        offer = attrs.get('offer', getattr(self.instance, 'offer', None))
        treatment = attrs.get('treatment', getattr(self.instance, 'treatment', None))

        if treatment and not offer:
            raise serializers.ValidationError({'treatment': 'Select offer first.'})

        if treatment and offer and treatment.offer_id != offer.id:
            raise serializers.ValidationError({'treatment': 'Selected treatment does not belong to selected offer.'})

        return attrs


class CampaignResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignResponse
        fields = '__all__'
