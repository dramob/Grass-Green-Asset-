import { Globe, Github, Twitter } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const Footer = () => {
  const { t, i18n } = useTranslation()
  const year = new Date().getFullYear()

  const changeLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'fr' : 'en')
  }

  return (
    <footer className="backdrop-blur-md bg-emerald-950/30 border-t border-emerald-800/30 text-emerald-300">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center">
              <img 
                src="/grass-icon.svg" 
                alt="Grass Green Asset" 
                className="h-8 w-8 mr-2" 
              />
              <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-400">
                GreenAsset
              </span>
            </Link>
            <p className="mt-2 text-sm text-emerald-200/70">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              {t('footer.resources')}
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/learn" className="text-sm text-emerald-200/70 hover:text-emerald-300">
                  {t('footer.documentation')}
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="text-sm text-emerald-200/70 hover:text-emerald-300">
                  {t('footer.analytics')}
                </Link>
              </li>
              <li>
                <Link to="/sustainability" className="text-sm text-emerald-200/70 hover:text-emerald-300">
                  {t('footer.sustainability')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              {t('footer.company')}
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/about" className="text-sm text-emerald-200/70 hover:text-emerald-300">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-emerald-200/70 hover:text-emerald-300">
                  {t('footer.contact')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-emerald-200/70 hover:text-emerald-300">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-emerald-200/70 hover:text-emerald-300">
                  {t('footer.terms')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              {t('footer.connect')}
            </h3>
            <div className="mt-4 flex space-x-6">
              <a href="#" className="text-emerald-200 hover:text-emerald-400">
                <span className="sr-only">Twitter</span>
                <Twitter size={20} />
              </a>
              <a href="#" className="text-emerald-200 hover:text-emerald-400">
                <span className="sr-only">GitHub</span>
                <Github size={20} />
              </a>
              <button 
                onClick={changeLanguage} 
                className="text-emerald-200 hover:text-emerald-400 flex items-center"
              >
                <Globe size={20} />
                <span className="ml-2 text-sm">
                  {i18n.language === 'en' ? 'FR' : 'EN'}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-emerald-800/30 pt-8 md:flex md:items-center md:justify-between">
          <div className="text-xs text-emerald-200/50">
            © {year} GreenAsset. {t('footer.rights')}
          </div>
          <div className="mt-4 md:mt-0">
            <div className="flex space-x-4 text-xs text-emerald-200/50">
              <span>{t('footer.blockchain')}: XRP Ledger</span>
              <span>{t('footer.poweredBy')}: Vite + React</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer