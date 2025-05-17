import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LoadingSpinner from './components/ui/LoadingSpinner'

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'))
const BuyPage = lazy(() => import('./pages/BuyPage'))
const TokenDetailPage = lazy(() => import('./pages/TokenDetailPage'))
const SellPage = lazy(() => import('./pages/SellPage'))
const ListingFormPage = lazy(() => import('./pages/ListingFormPage/index'))
const ScoreResultPage = lazy(() => import('./pages/ScoreResultPage/index'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function App() {
  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/buy" element={<BuyPage />} />
          <Route path="/token/:id" element={<TokenDetailPage />} />
          <Route path="/sell" element={<SellPage />} />
          <Route path="/sell/new" element={<ListingFormPage />} />
          <Route path="/sell/score/:draftId" element={<ScoreResultPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default App
