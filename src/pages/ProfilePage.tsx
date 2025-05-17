import { useTranslation } from 'react-i18next'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import WalletInfo from '../components/ui/WalletInfo'
import { useAuthStore } from '../store/useAuthStore'

const ProfilePage = () => {
  const { t } = useTranslation()
  const { user, isConnected } = useAuthStore()

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="gradient-text">{t('profile.title')}</h1>
      </div>
      
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-medium text-emerald-200 mb-4">
          {t('wallet.connected')}
        </h2>
        <div className="mb-4">
          <WalletInfo showFullInfo={true} />
        </div>
      </Card>
      
      <Card className="p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-emerald-300 mb-4">Coming soon!</p>
          <Button>{t('common.learnMore')}</Button>
        </div>
      </Card>
    </div>
  )
}

export default ProfilePage