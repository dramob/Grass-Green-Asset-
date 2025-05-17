import { useState, useEffect, useRef } from 'react'
import { X, Wallet, ChevronRight, Info, Mail, QrCode, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/useAuthStore'
import WalletConnectorRegistry from '../../services/walletConnectors'
import WalletCreatedModal from './WalletCreatedModal'
import QRCode from './QRCode'
import Button from './Button'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'wallet' | 'email'>('wallet')
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [newWalletAddress, setNewWalletAddress] = useState<string | null>(null)
  const [showWalletCreatedModal, setShowWalletCreatedModal] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  
  // Get wallet connectors
  const walletConnectors = WalletConnectorRegistry.getAll()
  
  // Auth store
  const { connectWallet, status, error: storeError, isConnecting, isConnected } = useAuthStore()
  
  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        // Only close if we're not in the QR code flow or connecting
        if (!qrCodeUrl && !isConnecting()) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, qrCodeUrl, isConnecting, onClose]);

  // If wallet gets connected, close the modal
  useEffect(() => {
    if (isConnected() && !showWalletCreatedModal) {
      onClose()
    }
  }, [isConnected, showWalletCreatedModal, onClose])

  // On escape key press, close the modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !qrCodeUrl && !isConnecting()) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, qrCodeUrl, isConnecting, onClose]);
  
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save the current overflow style to restore later
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Prevent scrolling on the body while modal is open
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scrolling when modal closes
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Combine errors from store and local
  const error = localError || storeError;

  const handleWalletConnect = async (walletType: string) => {
    setConnectingWallet(walletType)
    setLocalError(null)
    setQrCodeUrl(null)
    
    try {
      // Get the appropriate wallet connector for this wallet type
      const connector = WalletConnectorRegistry.getConnector(walletType)
      
      // Connect using the connector
      const result = await connector.connect()
      const { address, provider, qrCodeUrl: resultQrCode } = result
      
      // If we got a QR code URL, show it
      if (resultQrCode) {
        setQrCodeUrl(resultQrCode)
        // Do not continue with wallet connection yet - wait for QR scan completion
        return
      }
      
      // For Google or other OAuth methods, show the wallet created modal if this appears to be a new wallet 
      const isNewWallet = (
        walletType.toLowerCase() === 'google' && 
        address.startsWith('r') && 
        // Some heuristic to detect if this is a new wallet - this is just for demo
        address.includes('new') || address.includes('User') || address.includes('CreateTest')
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
      setLocalError(error.message || 'Failed to connect wallet')
    } finally {
      if (!qrCodeUrl) { // Only reset connecting state if not showing QR code
        setConnectingWallet(null)
      }
    }
  }
  
  const handleQrCodeComplete = async () => {
    // Reset QR code state
    setQrCodeUrl(null)
    
    // Continue with wallet connection if successful
    if (connectingWallet) {
      const connector = WalletConnectorRegistry.getConnector(connectingWallet)
      try {
        const { address, provider } = await connector.connect()
        await connectWallet(address, provider)
        onClose()
      } catch (error: any) {
        console.error('Failed to complete QR code wallet connection:', error)
        setLocalError(error.message || 'Failed to connect wallet after QR code scan')
      } finally {
        setConnectingWallet(null)
      }
    }
  }
  
  const cancelQrCodeFlow = () => {
    setQrCodeUrl(null)
    setConnectingWallet(null)
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    
    try {
      // In a real implementation, we would:
      // 1. Send a request to our backend to generate a one-time login link
      // 2. Email the link to the user
      // 3. Notify the user to check their email
      // 4. Once they click the link, they would be authenticated and redirected back
      
      // For demo purposes, we'll simulate the process
      console.log('Starting email authentication for:', email)
      
      // Validate email format
      if (!email || !email.includes('@') || !email.includes('.')) {
        throw new Error('Please enter a valid email address')
      }
      
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
      setLocalError(error.message || 'Failed to login with email')
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Modal Portal Root - Full viewport with centered content */}
      <div className="fixed inset-0 z-[9999]" id="auth-modal-root">
        {/* Backdrop with blur effect */}
        <div 
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          onClick={!isConnecting() && !qrCodeUrl ? onClose : undefined}
          aria-hidden="true"
        />

        {/* Modal Container - Centered both horizontally and vertically */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          {/* Modal Content */}
          <div 
            ref={modalRef}
            className="w-full max-w-md bg-emerald-950 rounded-xl shadow-2xl border border-emerald-800/50 
                       overflow-hidden animate-fadeIn"
            style={{ maxHeight: '90vh' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-emerald-800/30">
              <h2 
                id="auth-modal-title"
                className="text-lg font-medium text-emerald-100"
              >
                {qrCodeUrl 
                  ? t('auth.scanQrCode') 
                  : t('auth.connectWallet')}
              </h2>
              <button 
                onClick={qrCodeUrl ? cancelQrCodeFlow : onClose}
                className="p-1.5 rounded-full text-emerald-200 hover:bg-emerald-800/30 focus:outline-none 
                          focus:ring-2 focus:ring-emerald-500"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* QR Code View */}
            {qrCodeUrl ? (
              <div className="p-6 flex flex-col items-center">
                <p className="text-sm text-emerald-200 mb-4 text-center">
                  {t('auth.scanQrCodeDescription', { wallet: connectingWallet })}
                </p>
                
                <QRCode
                  value={qrCodeUrl}
                  size={240}
                  bgColor="transparent"
                  fgColor="#10b981"
                  className="mb-4"
                />
                
                <div className="text-xs text-emerald-200/70 mb-6 text-center max-w-xs">
                  {t('auth.qrCodeHelp')}
                </div>
                
                <Button onClick={cancelQrCodeFlow}>
                  {t('common.cancel')}
                </Button>
              </div>
            ) : (
              <>
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
                
                {/* Content with scroll if needed */}
                <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 4rem - 3.5rem)' }}>
                  {/* Display error message if there is one */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-md text-red-200 text-sm flex items-start">
                      <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  
                  {activeTab === 'wallet' ? (
                    <div className="space-y-3">
                      <p className="text-sm text-emerald-200/70 mb-4">
                        {t('auth.connectWalletDescription')}
                      </p>
                      
                      {/* Wallet list */}
                      <div className="space-y-2">
                       {walletConnectors.map((connector, index) => (
                          <WalletOption 
                            key={`${connector.name}-${index}`}
                            name={connector.name} 
                            iconUrl={connector.icon}
                            description={t(`auth.wallets.${connector.name.toLowerCase()}`)}
                            onClick={() => handleWalletConnect(connector.name)}
                            isConnecting={isConnecting() && connectingWallet === connector.name}
                            badge={connector.supportsQRCode ? "QR" : undefined}
                            isQR={connector.supportsQRCode}
                          />
                        ))}
                        <div className="mt-4 flex items-center">
                          <div className="flex-grow border-t border-emerald-800/30"></div>
                          <span className="mx-2 text-xs text-emerald-200/50">{t('common.or')}</span>
                          <div className="flex-grow border-t border-emerald-800/30"></div>
                        </div>
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
                          disabled={isConnecting() || !email} 
                          className="w-full"
                        >
                          {isConnecting() ? t('common.loading') : t('auth.continueWithEmail')}
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              </>
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
  badge?: string
  isQR?: boolean
}

const WalletOption = ({ 
  name, 
  iconUrl, 
  description, 
  onClick, 
  isConnecting,
  badge,
  isQR = false
}: WalletOptionProps) => {
  return (
    <button
      className="w-full flex items-center justify-between p-3 rounded-lg border border-emerald-800/30
                hover:bg-emerald-900/50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
        {badge && (
          <span className="mr-2 px-2 py-0.5 text-xs bg-emerald-800/50 text-emerald-300 rounded flex items-center">
            {isQR && <QrCode size={12} className="mr-1" />}
            {badge}
          </span>
        )}
        {isConnecting ? (
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <ChevronRight size={16} className="text-emerald-400" />
        )}
      </div>
    </button>
  )
}

export default AuthModal