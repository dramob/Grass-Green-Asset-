import { useTranslation } from 'react-i18next'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

const BuyPage = () => {
  const { t } = useTranslation()

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h1 className="gradient-text">{t('buy.title')}</h1>
        <p className="text-emerald-300/70 mt-2 max-w-3xl mx-auto">
          {t('buy.subtitle')}
        </p>
      </div>
      
      <Card className="p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-emerald-300 mb-4">Coming soon!</p>
          <Button>{t('common.learnMore')}</Button>
        </div>
      </Card>
    </div>
  )
}

export default BuyPage