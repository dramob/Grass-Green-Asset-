import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, ClipboardList, Search, Globe2 } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import useAuthStore from '../store/useAuthStore'
import SDGIcon from '../components/ui/SDGIcon'
import { SDGGoal } from '../types/sdg'

const SellPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isConnected = useAuthStore(state => state.isConnected)

  const handleCreateListing = () => {
    navigate('/sell/new')
  }
  
  // Featured SDGs to highlight in the UI
  const featuredSDGs = [
    SDGGoal.ClimateAction,
    SDGGoal.LifeOnLand,
    SDGGoal.CleanWater,
    SDGGoal.CleanEnergy
  ]

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h1 className="gradient-text">{t('sell.title')}</h1>
        <p className="text-emerald-300/70 mt-2 max-w-3xl mx-auto">
          {t('sell.subtitle')}
        </p>
      </div>
      
      {isConnected() ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-8 hover:border-emerald-400/50 transition-colors cursor-pointer">
              <div
                className="flex flex-col items-center justify-center h-full space-y-4 cursor-pointer"
                onClick={handleCreateListing}
                role="button"
                tabIndex={0}
                onKeyPress={e => {
                  if (e.key === 'Enter' || e.key === ' ') handleCreateListing()
                }}
              >
                <PlusCircle className="h-16 w-16 text-emerald-400" />
                <h2 className="text-xl font-medium text-emerald-300">{t('sell.newListing')}</h2>
                <p className="text-center text-gray-300">
                  Create a new green asset listing and get your project scored
                </p>
                <Button className="mt-4" onClick={handleCreateListing}>
                  {t('sell.newListing')}
                </Button>
              </div>
            </Card>
            
            <Card className="p-8 hover:border-emerald-400/50 transition-colors cursor-pointer">
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <ClipboardList className="h-16 w-16 text-emerald-400" />
                <h2 className="text-xl font-medium text-emerald-300">{t('sell.myListings')}</h2>
                <p className="text-center text-gray-300">
                  View and manage your green asset listings
                </p>
                <Button className="mt-4" variant="secondary">
                  {t('sell.myListings')}
                </Button>
              </div>
            </Card>
          </div>
          
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-center text-emerald-300 mb-6">
              {t('sell.sdg.title')}
            </h2>
            
            <div className="flex justify-center mb-8">
              <div className="flex flex-wrap justify-center gap-4">
                {featuredSDGs.map(sdgId => (
                  <SDGIcon key={sdgId} sdgId={sdgId} size="lg" />
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <Card className="p-6 border-emerald-400/20 bg-emerald-900/10">
                <div className="flex items-start">
                  <div className="mr-4 p-2 bg-emerald-900/40 rounded-full">
                    <Search className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-emerald-300 mb-2">Web Verification</h3>
                    <p className="text-gray-300">
                      Our platform uses advanced AI with web search to verify your SDG claims by checking publicly available information about your company.
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6 border-emerald-400/20 bg-emerald-900/10">
                <div className="flex items-start">
                  <div className="mr-4 p-2 bg-emerald-900/40 rounded-full">
                    <Globe2 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-emerald-300 mb-2">Impact Transparency</h3>
                    <p className="text-gray-300">
                      Provide detailed justifications for your SDG contributions and receive objective verification scores that build trust with investors.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <p className="text-emerald-300 mb-4">{t('sell.login')}</p>
            <Button onClick={() => navigate('/sell/new')}>{t('wallet.connect')}</Button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default SellPage