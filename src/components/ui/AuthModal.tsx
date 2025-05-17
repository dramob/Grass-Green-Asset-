import { useState, useEffect } from 'react'
import { X, Wallet, ChevronRight, ExternalLink, Info, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useWallet, useWallets, useConnect } from '@xrpl-wallet-standard/react'
import { useAuthStore } from '../../store/useAuthStore'
import WalletConnectorFactory from '../../services/walletConnectors'
import WalletCreatedModal from './WalletCreatedModal'
import Button from './Button'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'wallet' | 'email'>('wallet')
  const [isConnecting, setIsConnecting] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [newWalletAddress, setNewWalletAddress] = useState<string | null>(null)
  const [showWalletCreatedModal, setShowWalletCreatedModal] = useState(false)
  const { connect } = useConnect()
  const { wallet, status } = useWallet()
  const wallets = useWallets()
  const { connectWallet } = useAuthStore()

  // If wallet gets connected, close the modal
  useEffect(() => {
    if (wallet && status === 'connected') {
      onClose()
    }
  }, [wallet, status, onClose])

  const handleWalletConnect = async (walletName: string) => {
    setIsConnecting(true)
    setError(null)
    
    try {
      // Get the appropriate wallet connector for this wallet type
      const connector = WalletConnectorFactory.getConnector(walletName)
      
      // Connect using the connector
      const { address, provider } = await connector.connect()
      
      // For Google or other OAuth methods, show the wallet created modal if this appears to be a new wallet 
      // (in this demo, we're guessing based on the address format from wallet connectors)
      const isNewWallet = (
        walletName.toLowerCase() === 'google' && 
        !address.startsWith('rG') && 
        address.length > 25
      )
      
      if (isNewWallet) {
        setNewWalletAddress(address)
        setShowWalletCreatedModal(true)
      }
      
      // Update our auth store
      await connectWallet(address, provider)
      
      // Don't close the modal if we're showing the wallet created modal
      if (!isNewWallet) {
        onClose()
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error)
      setError(error.message || 'Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsConnecting(true)
    setError(null)
    
    try {
      // In a real implementation, we would:
      // 1. Send a request to our backend to generate a one-time login link
      // 2. Email the link to the user
      // 3. Notify the user to check their email
      // 4. Once they click the link, they would be authenticated and redirected back
      
      // For demo purposes, we'll simulate the process
      console.log('Starting email authentication for:', email)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Simulate checking if user already has an XRPL wallet associated
      // In a real app, this would be handled by the server
      const hasExistingWallet = email.includes('@example.com') 
      
      let address
      let isNewWallet = false
      
      if (hasExistingWallet) {
        // Simulate retrieving existing wallet for returning user
        const emailHash = Array.from(email).reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000000
        const paddedHash = emailHash.toString().padStart(6, '0')
        address = `rE${paddedHash}XRPLdemo${paddedHash.split('').reverse().join('')}`
        console.log('Retrieved existing wallet for email user:', address)
      } else {
        // Simulate creating a new wallet for first-time user
        // In a real app, this would be done on the server to keep the seed secure
        console.log('Creating new XRPL wallet for email user...')
        
        try {
          // In a real implementation, we would do this server-side
          // and associate the wallet with the email in our database
          
          // For demo purposes, we'll simulate wallet creation
          // This is just for demonstration - in a real app, wallet creation would happen on the server
          address = `rEmailNew${Date.now().toString().slice(-8)}XRPLWallet`
          isNewWallet = true
          
          console.log('Created new wallet for email user:', address)
        } catch (creationError) {
          console.error('Failed to create wallet:', creationError)
          throw new Error('Could not create a new wallet for your account')
        }
      }
      
      // Connect the wallet
      await connectWallet(address, 'Email')
      
      // Show the wallet created modal if this is a new wallet
      if (isNewWallet) {
        setNewWalletAddress(address)
        setShowWalletCreatedModal(true)
      } else {
        onClose()
      }
    } catch (error: any) {
      console.error('Failed to login with email:', error)
      setError(error.message || 'Failed to login with email')
    } finally {
      setIsConnecting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
        <div className="bg-emerald-950 rounded-xl shadow-xl border border-emerald-800/50 w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-emerald-800/30">
            <h2 className="text-lg font-medium text-emerald-100">{t('auth.connectWallet')}</h2>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full text-emerald-200 hover:bg-emerald-800/30"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-emerald-800/30">
            <button
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === 'wallet'
                  ? 'text-emerald-400 border-b-2 border-emerald-500'
                  : 'text-emerald-200 hover:text-emerald-300'
              }`}
              onClick={() => setActiveTab('wallet')}
            >
              <Wallet size={16} className="inline mr-2" />
              {t('auth.walletOptions')}
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === 'email'
                  ? 'text-emerald-400 border-b-2 border-emerald-500'
                  : 'text-emerald-200 hover:text-emerald-300'
              }`}
              onClick={() => setActiveTab('email')}
            >
              <Mail size={16} className="inline mr-2" />
              {t('auth.emailLogin')}
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4">
            {/* Display error message if there is one */}
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-md text-red-200 text-sm">
                {error}
              </div>
            )}
            
            {activeTab === 'wallet' ? (
              <div className="space-y-3">
                <p className="text-sm text-emerald-200/70 mb-4">
                  {t('auth.connectWalletDescription')}
                </p>
                
                {/* Wallet list */}
                <div className="space-y-2">
                  <WalletOption 
                    name="XUMM" 
                    iconUrl="/wallet-icons/xumm.svg"
                    description={t('auth.wallets.xumm')}
                    onClick={() => handleWalletConnect('XUMM')}
                    isConnecting={isConnecting}
                  />
                  
                  <WalletOption 
                    name="GemWallet" 
                    iconUrl="/wallet-icons/gem.svg"
                    description={t('auth.wallets.gemwallet')}
                    onClick={() => handleWalletConnect('GemWallet')}
                    isConnecting={isConnecting}
                  />
                  
                  <WalletOption 
                    name="Crossmark" 
                    iconUrl="/wallet-icons/crossmark.svg"
                    description={t('auth.wallets.crossmark')}
                    onClick={() => handleWalletConnect('Crossmark')}
                    isConnecting={isConnecting}
                  />

                  <div className="mt-4 flex items-center">
                    <div className="flex-grow border-t border-emerald-800/30"></div>
                    <span className="mx-2 text-xs text-emerald-200/50">{t('common.or')}</span>
                    <div className="flex-grow border-t border-emerald-800/30"></div>
                  </div>

                  <WalletOption 
                    name="Google" 
                    iconUrl="/wallet-icons/google.svg"
                    description={t('auth.wallets.google')}
                    onClick={() => handleWalletConnect('Google')}
                    isConnecting={isConnecting}
                    isOAuth={true}
                  />
                </div>
                
                <div className="mt-4 text-xs text-emerald-200/50 flex items-start">
                  <Info size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                  <p>{t('auth.walletDisclaimer')}</p>
                </div>
                
                {/* Help about wallet creation */}
                <div className="mt-4 pt-4 border-t border-emerald-800/30">
                  <p className="text-sm font-medium text-emerald-300 mb-1">
                    {t('auth.createWalletHelp')}
                  </p>
                  <p className="text-xs text-emerald-200/70">
                    {t('auth.createWalletDescription')}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-emerald-200/70 mb-4">
                  {t('auth.emailLoginDescription')}
                </p>
                
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-emerald-200 mb-1">
                      {t('auth.emailAddress')}
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="your@email.com"
                      className="w-full px-3 py-2 bg-emerald-900/50 border border-emerald-700/50 rounded-md 
                              text-emerald-100 placeholder-emerald-200/30 focus:outline-none focus:ring-2 
                              focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isConnecting || !email} 
                    className="w-full"
                  >
                    {isConnecting ? t('common.loading') : t('auth.continueWithEmail')}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Wallet Created Modal */}
      {newWalletAddress && (
        <WalletCreatedModal
          isOpen={showWalletCreatedModal}
          onClose={() => {
            setShowWalletCreatedModal(false)
            onClose()
          }}
          address={newWalletAddress}
        />
      )}
    </>
  )
}

interface WalletOptionProps {
  name: string
  iconUrl: string
  description: string
  onClick: () => void
  isConnecting: boolean
  isOAuth?: boolean
}

const WalletOption = ({ 
  name, 
  iconUrl, 
  description, 
  onClick, 
  isConnecting,
  isOAuth = false
}: WalletOptionProps) => {
  return (
    <button
      className="w-full flex items-center justify-between p-3 rounded-lg border border-emerald-800/30
                hover:bg-emerald-900/50 transition-colors"
      onClick={onClick}
      disabled={isConnecting}
    >
      <div className="flex items-center">
        <div className="w-10 h-10 mr-3 rounded-full bg-emerald-900 flex items-center justify-center overflow-hidden">
          <img src={iconUrl} alt={name} className="w-6 h-6" onError={(e) => {
            // If image fails to load, show the wallet name's first letter
            (e.target as HTMLImageElement).style.display = 'none'
            ;(e.target as HTMLImageElement).parentElement!.textContent = name[0]
          }} />
        </div>
        <div className="text-left">
          <div className="text-sm font-medium text-emerald-100">{name}</div>
          <div className="text-xs text-emerald-200/70">{description}</div>
        </div>
      </div>
      
      <div className="flex items-center">
        {isOAuth && (
          <span className="mr-2 px-2 py-0.5 text-xs bg-emerald-800/50 text-emerald-300 rounded">
            OAuth
          </span>
        )}
        {isConnecting ? (
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <ChevronRight size={16} className="text-emerald-400" />
        )}
      </div>
    </button>
  )
}

export default AuthModal