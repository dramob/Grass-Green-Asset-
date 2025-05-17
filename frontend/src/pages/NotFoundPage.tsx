import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Button from '../components/ui/Button'

const NotFoundPage = () => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-9xl font-bold text-emerald-700/30">404</div>
      <h1 className="mt-4 text-2xl font-bold text-emerald-200">
        {t('notFound.title')}
      </h1>
      <p className="mt-2 text-emerald-300/70 max-w-md">
        {t('notFound.message')}
      </p>
      <div className="mt-8 flex space-x-4">
        <Button 
          leftIcon={<ArrowLeft size={16} />}
          onClick={() => window.history.back()}
          variant="secondary"
        >
          {t('notFound.back')}
        </Button>
        <Link to="/">
          <Button leftIcon={<Home size={16} />}>
            {t('notFound.home')}
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage