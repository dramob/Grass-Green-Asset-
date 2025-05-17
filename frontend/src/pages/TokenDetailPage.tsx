import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

const TokenDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h1 className="gradient-text">{t('token.details')}</h1>
        <p className="text-emerald-300/70 mt-2">
          Token ID: {id}
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

export default TokenDetailPage