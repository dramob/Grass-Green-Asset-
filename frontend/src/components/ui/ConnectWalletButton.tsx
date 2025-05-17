import { useState } from 'react'
import { Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/useAuthStore'
import AuthModal from './AuthModal'

interface ConnectWalletButtonProps {
  fullWidth?: boolean;
  className?: string;
}

const ConnectWalletButton = ({ 
  fullWidth = false,
  className = ''
}: ConnectWalletButtonProps) => {
  const { t } = useTranslation()
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  const { 
    disconnectWallet, 
    walletProvider,
    isConnected,
    isConnecting
  } = useAuthStore()

  const handleConnect = () => {
    // Show the auth modal with wallet options
    setShowAuthModal(true);
  };

  const handleDisconnect = async () => {
    try {
      disconnectWallet();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  // Combine the passed className with our default classes
  const buttonClasses = `
    ${fullWidth ? 'w-full' : ''}
    ${className}
    inline-flex items-center justify-center px-4 py-2 border border-transparent 
    rounded-lg shadow-sm text-sm font-medium text-white
    bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500
    transition-all duration-150 ease-in-out
    disabled:opacity-70 disabled:cursor-not-allowed
  `;

  return (
    <>
      <button
        onClick={isConnected() ? handleDisconnect : handleConnect}
        disabled={isConnecting()}
        className={buttonClasses}
      >
        <Wallet size={18} className="mr-2" />
        {isConnecting() ? t('wallet.connecting') : 
          isConnected() ? `${t('wallet.disconnect')} (${walletProvider || 'XRPL'})` : t('wallet.connect')}
      </button>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  )
}

export default ConnectWalletButton