import { useState, useEffect } from 'react'
import { Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useWallet, useConnect, useDisconnect } from '@xrpl-wallet-standard/react'
import { useAuthStore } from '../../store/useAuthStore'
import AuthModal from './AuthModal'

interface ConnectWalletButtonProps {
  fullWidth?: boolean
}

const ConnectWalletButton = ({ fullWidth = false }: ConnectWalletButtonProps) => {
  const { t } = useTranslation()
  const [localIsConnecting, setLocalIsConnecting] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { wallet, status } = useWallet()
  const { connect } = useConnect()
  const disconnect = useDisconnect()
  const { connectWallet, disconnectWallet, isConnected } = useAuthStore()

  // Track actual connecting state combining local and wallet connection status
  const isConnecting = localIsConnecting || status === 'connecting'

  useEffect(() => {
    // Sync the wallet state with our store when wallet changes
    if (wallet && status === 'connected' && !isConnected) {
      handleWalletConnected();
    } else if ((!wallet || status === 'disconnected') && isConnected) {
      disconnectWallet();
    }
  }, [wallet, status, isConnected]);

  const handleConnect = () => {
    // Show the auth modal with wallet options
    setShowAuthModal(true);
  };

  const handleDisconnect = async () => {
    setLocalIsConnecting(true);
    try {
      await disconnect();
      disconnectWallet();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    } finally {
      setLocalIsConnecting(false);
    }
  };

  const handleWalletConnected = async () => {
    if (wallet) {
      const account = wallet.accounts[0];
      if (account) {
        await connectWallet(account.address, wallet.name);
      }
    }
  };

  return (
    <>
      <button
        onClick={isConnected ? handleDisconnect : handleConnect}
        disabled={isConnecting}
        className={`
          ${fullWidth ? 'w-full' : ''}
          inline-flex items-center justify-center px-4 py-2 border border-transparent 
          rounded-lg shadow-sm text-sm font-medium text-white
          bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500
          transition-all duration-150 ease-in-out
          disabled:opacity-70 disabled:cursor-not-allowed
        `}
      >
        <Wallet size={18} className="mr-2" />
        {isConnecting ? t('wallet.connecting') : 
          isConnected ? `${t('wallet.disconnect')} (${wallet?.name || 'XRPL'})` : t('wallet.connect')}
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