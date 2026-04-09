import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Dashboard from './pages/dashboard/Dashboard'
import Plans from './pages/plans/Plans'
import PlanDetail from './pages/plans/PlanDetail'
import Campaigns from './pages/campaigns/Campaigns'
import CampaignDetail from './pages/campaigns/CampaignDetail'
import Offers from './pages/offers/Offers'
import OfferDetail from './pages/offers/OfferDetail'
import OfferForm from './pages/offers/OfferForm'
import TreatmentForm from './pages/offers/TreatmentForm'
import TreatmentPreview from './pages/offers/TreatmentPreview'
import Leads from './pages/leads/Leads'
import LeadDetail from './pages/leads/LeadDetail'
import LeadForm from './pages/leads/LeadForm'
import Users from './pages/users/Users'
import Predictions from './pages/predictions/Predictions'

export default function App() {
  return (
    <Routes>
      {/* Full-page route — no sidebar */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* App shell routes — wrapped in Layout (sidebar) + auth guard */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
            <Routes>
              {/* index = matches the bare "/" after the parent consumed it */}
              <Route index                element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"     element={<Dashboard />} />
              <Route path="plans"         element={<Plans />} />
              <Route path="plans/:id"     element={<PlanDetail />} />
              <Route path="campaigns"      element={<Campaigns />} />
              <Route path="campaigns/:id"  element={<CampaignDetail />} />
              <Route path="offers"         element={<Offers />} />
              <Route path="offers/new"     element={<OfferForm />} />
              <Route path="offers/:id"     element={<OfferDetail />} />
              <Route path="offers/:id/edit" element={<OfferForm />} />
              <Route path="offers/:offerId/treatments/new" element={<TreatmentForm />} />
              <Route path="offers/:offerId/treatments/:treatmentId" element={<TreatmentPreview />} />
              <Route path="leads"         element={<Leads />} />
              <Route path="leads/new"      element={<LeadForm />} />
              <Route path="leads/:id"     element={<LeadDetail />} />
              <Route path="leads/:id/edit" element={<LeadForm />} />
              <Route path="users"         element={<Users />} />
              <Route path="predictions"   element={<Predictions />} />
              <Route path="*"             element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
