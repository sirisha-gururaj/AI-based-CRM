import client from './client'

type CacheEntry = {
  data: any
  timestamp: number
}

const apiCache = new Map<string, CacheEntry>()
const DEFAULT_CACHE_TTL_MS = 30_000

function buildCacheKey(key: string, params?: any) {
  return `${key}:${JSON.stringify(params || {})}`
}

async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  params?: any,
  ttlMs: number = DEFAULT_CACHE_TTL_MS
): Promise<T> {
  const cacheKey = buildCacheKey(key, params)
  const now = Date.now()
  const hit = apiCache.get(cacheKey)
  if (hit && now - hit.timestamp < ttlMs) {
    return hit.data as T
  }

  const data = await fetcher()
  apiCache.set(cacheKey, { data, timestamp: now })
  return data
}

function invalidateCacheByPrefix(prefix: string) {
  for (const key of apiCache.keys()) {
    if (key.startsWith(`${prefix}:`)) {
      apiCache.delete(key)
    }
  }
}

function invalidateDashboardCaches() {
  invalidateCacheByPrefix('dashboard')
}

// ============ Auth ============
export async function login(username: string, password: string) {
  const response = await client.post('/auth/login/', { username, password })
  return response.data
}

export async function logout() {
  const response = await client.post('/auth/logout/')
  return response.data
}

// ============ Dashboard ============
export async function getDashboard() {
  return getCached('dashboard', async () => {
    const response = await client.get('/dashboard/')
    return response.data
  })
}

// ============ Plans ============
export async function getPlans(params?: { search?: string; status?: string }) {
  return getCached(
    'plans',
    async () => {
      const response = await client.get('/plans/', { params })
      return response.data
    },
    params
  )
}

export async function getPlan(id: number) {
  const response = await client.get(`/plans/${id}/`)
  return response.data
}

export async function createPlan(data: any) {
  const response = await client.post('/plans/', data)
  invalidateCacheByPrefix('plans')
  invalidateDashboardCaches()
  return response.data
}

export async function updatePlan(id: number, data: any) {
  const response = await client.put(`/plans/${id}/`, data)
  invalidateCacheByPrefix('plans')
  invalidateDashboardCaches()
  return response.data
}

export async function deletePlan(id: number) {
  const response = await client.delete(`/plans/${id}/`)
  invalidateCacheByPrefix('plans')
  invalidateDashboardCaches()
  return response.data
}

// ============ Initiatives ============
export async function createInitiative(data: any) {
  const response = await client.post('/initiatives/', data)
  invalidateCacheByPrefix('plans')
  return response.data
}

export async function updateInitiative(id: number, data: any) {
  const response = await client.put(`/initiatives/${id}/`, data)
  invalidateCacheByPrefix('plans')
  return response.data
}

export async function deleteInitiative(id: number) {
  const response = await client.delete(`/initiatives/${id}/`)
  invalidateCacheByPrefix('plans')
  return response.data
}

// ============ Tactics ============
export async function createTactic(data: any) {
  const response = await client.post('/tactics/', data)
  invalidateCacheByPrefix('plans')
  return response.data
}

export async function updateTactic(id: number, data: any) {
  const response = await client.put(`/tactics/${id}/`, data)
  invalidateCacheByPrefix('plans')
  return response.data
}

export async function deleteTactic(id: number) {
  const response = await client.delete(`/tactics/${id}/`)
  invalidateCacheByPrefix('plans')
  return response.data
}

// ============ Offers ============
export async function getOffers(params?: { search?: string; status?: string; is_active?: string }) {
  return getCached(
    'offers',
    async () => {
      const response = await client.get('/offers/', { params })
      return response.data
    },
    params
  )
}

export async function getOffer(id: number) {
  const response = await client.get(`/offers/${id}/`)
  return response.data
}

export async function createOffer(data: any) {
  const response = await client.post('/offers/', data)
  invalidateCacheByPrefix('offers')
  invalidateDashboardCaches()
  return response.data
}

export async function updateOffer(id: number, data: any) {
  const response = await client.put(`/offers/${id}/`, data)
  invalidateCacheByPrefix('offers')
  invalidateCacheByPrefix('leads')
  invalidateCacheByPrefix('campaigns')
  invalidateDashboardCaches()
  return response.data
}

export async function getOfferTreatments(offerId: number) {
  const response = await client.get(`/offers/${offerId}/treatments/`)
  return response.data
}

export async function createTreatment(offerId: number, data: any) {
  const response = await client.post(`/offers/${offerId}/treatments/`, data)
  invalidateCacheByPrefix('offers')
  invalidateCacheByPrefix('campaigns')
  return response.data
}

export async function previewTreatment(treatmentId: number) {
  const response = await client.get(`/treatments/${treatmentId}/preview/`)
  return response.data
}

// ============ Leads ============
export async function getLeads(params?: { search?: string; status?: string; source?: string; owner?: string }) {
  return getCached(
    'leads',
    async () => {
      const response = await client.get('/leads/', { params })
      return response.data
    },
    params
  )
}

export async function getLead(id: number) {
  const response = await client.get(`/leads/${id}/`)
  return response.data
}

export async function createLead(data: any) {
  const response = await client.post('/leads/', data)
  invalidateCacheByPrefix('leads')
  invalidateDashboardCaches()
  return response.data
}

export async function updateLead(id: number, data: any) {
  const response = await client.put(`/leads/${id}/`, data)
  invalidateCacheByPrefix('leads')
  invalidateDashboardCaches()
  return response.data
}

export async function deleteLead(id: number) {
  const response = await client.delete(`/leads/${id}/`)
  invalidateCacheByPrefix('leads')
  invalidateDashboardCaches()
  return response.data
}

// ============ Campaigns ============
export async function getCampaigns(params?: { search?: string; status?: string }) {
  return getCached(
    'campaigns',
    async () => {
      const response = await client.get('/campaigns/', { params })
      return response.data
    },
    params
  )
}

export async function getCampaign(id: number) {
  const response = await client.get(`/campaigns/${id}/`)
  return response.data
}

export async function createCampaign(data: any) {
  const response = await client.post('/campaigns/', data)
  invalidateCacheByPrefix('campaigns')
  invalidateCacheByPrefix('leads')
  invalidateDashboardCaches()
  return response.data
}

export async function updateCampaign(id: number, data: any) {
  const response = await client.put(`/campaigns/${id}/`, data)
  invalidateCacheByPrefix('campaigns')
  invalidateCacheByPrefix('leads')
  invalidateDashboardCaches()
  return response.data
}

export async function deleteCampaign(id: number) {
  const response = await client.delete(`/campaigns/${id}/`)
  invalidateCacheByPrefix('campaigns')
  invalidateDashboardCaches()
  return response.data
}

export async function launchCampaign(id: number) {
  const response = await client.post(`/campaigns/${id}/launch/`)
  invalidateCacheByPrefix('campaigns')
  invalidateCacheByPrefix('leads')
  invalidateDashboardCaches()
  return response.data
}

// ============ Predictions ============
export async function launchClaimCost() {
  const response = await client.post('/prediction/claim-cost/')
  return response.data
}

export async function launchRebate() {
  const response = await client.post('/prediction/rebate/')
  return response.data
}

export async function launchTacticEfficiency() {
  const response = await client.post('/prediction/tactic-efficiency/')
  return response.data
}

export async function generateSubjectLines(
  campaignName: string,
  description: string,
  channel?: string
): Promise<string[]> {
  const response = await client.post('/ai/subject-lines/', {
    campaign_name: campaignName,
    description,
    channel,
  })
  return response.data.subject_lines as string[]
}
