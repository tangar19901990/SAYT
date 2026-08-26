import { Layout } from './components/Layout'
import { ListingPreview } from './components/ListingPreview'
import { TireModal } from './components/TireModal'
import { Toasts } from './components/Toasts'
import { AgentPage } from './pages/Agent'
import { AnalyticsPage } from './pages/Analytics'
import { Dashboard } from './pages/Dashboard'
import { DealsPage } from './pages/Deals'
import { ProfitPage } from './pages/Profit'
import { SavedPage } from './pages/Saved'
import { SearchPage } from './pages/Search'
import { SettingsPage } from './pages/Settings'
import { SuppliersPage } from './pages/Suppliers'
import { TiresPage } from './pages/Tires'
import { StoreProvider, useHunter } from './store'

function Screen() {
  const { page } = useHunter()
  switch (page) {
    case 'search':
      return <SearchPage />
    case 'tires':
      return <TiresPage />
    case 'deals':
      return <DealsPage />
    case 'agent':
      return <AgentPage />
    case 'analytics':
      return <AnalyticsPage />
    case 'profit':
      return <ProfitPage />
    case 'saved':
      return <SavedPage />
    case 'suppliers':
      return <SuppliersPage />
    case 'settings':
      return <SettingsPage />
    default:
      return <Dashboard />
  }
}

export default function App() {
  return (
    <StoreProvider>
      <Layout>
        <Screen />
      </Layout>
      <TireModal />
      <ListingPreview />
      <Toasts />
    </StoreProvider>
  )
}
