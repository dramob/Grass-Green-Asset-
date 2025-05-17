import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Wallet, Bell, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ConnectWalletButton from '../ui/ConnectWalletButton'
import WalletInfo from '../ui/WalletInfo'
import { useAuthStore } from '../../store/useAuthStore'

const Header = () => {
  const { t } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { isConnected } = useAuthStore()

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <header className="backdrop-blur-md bg-emerald-950/30 border-b border-emerald-700/30 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
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
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              to="/" 
              className={`px-3 py-2 text-sm font-medium hover:text-emerald-400 ${
                location.pathname === '/' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-emerald-100'
              }`}
            >
              {t('nav.home')}
            </Link>
            <Link 
              to="/buy" 
              className={`px-3 py-2 text-sm font-medium hover:text-emerald-400 ${
                location.pathname === '/buy' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-emerald-100'
              }`}
            >
              {t('nav.buy')}
            </Link>
            <Link 
              to="/sell" 
              className={`px-3 py-2 text-sm font-medium hover:text-emerald-400 ${
                location.pathname === '/sell' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-emerald-100'
              }`}
            >
              {t('nav.sell')}
            </Link>
          </nav>

          {/* Right buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isConnected() ? (
              <>
                <button className="p-2 rounded-full text-emerald-200 hover:bg-emerald-800/50">
                  <Bell size={20} />
                </button>
                <Link 
                  to="/profile" 
                  className="p-2 rounded-full text-emerald-200 hover:bg-emerald-800/50"
                >
                  <User size={20} />
                </Link>
                <div className="flex items-center">
                  <Wallet size={16} className="text-emerald-400 mr-2" />
                  <WalletInfo condensed={true} />
                </div>
              </>
            ) : (
              <ConnectWalletButton />
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="p-2 rounded-md text-emerald-200 hover:bg-emerald-800/50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open menu</span>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-emerald-900/90 backdrop-blur-lg border-b border-emerald-700/30">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === '/' 
                  ? 'bg-emerald-800/50 text-emerald-400' 
                  : 'text-emerald-100 hover:bg-emerald-800/30 hover:text-emerald-400'
              }`}
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/buy"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === '/buy' 
                  ? 'bg-emerald-800/50 text-emerald-400' 
                  : 'text-emerald-100 hover:bg-emerald-800/30 hover:text-emerald-400'
              }`}
            >
              {t('nav.buy')}
            </Link>
            <Link
              to="/sell"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === '/sell' 
                  ? 'bg-emerald-800/50 text-emerald-400' 
                  : 'text-emerald-100 hover:bg-emerald-800/30 hover:text-emerald-400'
              }`}
            >
              {t('nav.sell')}
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-emerald-700/30">
            {isConnected() ? (
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <User size={36} className="p-1 rounded-full bg-emerald-800/50 text-emerald-200" />
                </div>
                <div className="ml-3">
                  <WalletInfo condensed={true} />
                  <Link
                    to="/profile"
                    className="text-xs text-emerald-400 hover:text-emerald-300 mt-1 block"
                  >
                    {t('nav.viewProfile')}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="px-4">
                <ConnectWalletButton fullWidth />
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default Header