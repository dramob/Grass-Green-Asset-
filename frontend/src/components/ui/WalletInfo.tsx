import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useWallet } from '@xrpl-wallet-standard/react'
import { useAuthStore } from '../../store/useAuthStore'

interface WalletInfoProps {
  condensed?: boolean;
  showFullInfo?: boolean;
}

const WalletInfo = ({ condensed = false, showFullInfo = false }: WalletInfoProps) => {
  const { t } = useTranslation()
  const { wallet, status } = useWallet()
  const { walletAddress, walletProvider, walletBalance, isConnected } = useAuthStore()
  const [copied, setCopied] = useState(false)
  
  if (!isConnected || !walletAddress) {
    return (
      <div className="text-emerald-200/70 text-sm">
        {t('wallet.notConnected')}
      </div>
    )
  }
  
  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  // Format the address for display
  const displayAddress = condensed
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : walletAddress
  
  if (showFullInfo) {
    return (
      <div className="bg-emerald-900/50 rounded-lg p-4 border border-emerald-700/30">
        <div className="mb-4">
          <h3 className="text-emerald-200 font-medium">{t('wallet.connected')}</h3>
          <div className="text-emerald-400 text-sm">{walletProvider}</div>
        </div>
        
        <div className="mb-4">
          <div className="text-emerald-200/70 text-xs mb-1">{t('wallet.address')}</div>
          <div className="flex items-center">
            <span className="text-emerald-100 text-sm font-mono mr-2">{displayAddress}</span>
            <button 
              onClick={copyAddress}
              className="p-1 rounded-full text-emerald-200 hover:bg-emerald-800/50"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
            <a 
              href={`https://testnet.bithomp.com/explorer/${walletAddress}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1 rounded-full text-emerald-200 hover:bg-emerald-800/50 ml-1"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
        
        <div>
          <div className="text-emerald-200/70 text-xs mb-1">{t('wallet.balance')}</div>
          <div className="text-emerald-100">
            {walletBalance !== null ? (
              <span>{walletBalance.toFixed(2)} XRP</span>
            ) : (
              <span className="text-emerald-200/50">--</span>
            )}
          </div>
        </div>
        
        <div className="mt-4 text-xs text-emerald-200/50">
          {t('wallet.network')}: XRPL Testnet
        </div>
      </div>
    )
  }
  
  // Condensed view
  return (
    <div className="flex items-center px-3 py-1.5 rounded-full bg-emerald-900/50 border border-emerald-700/50">
      <div className="text-sm font-medium text-emerald-200">{displayAddress}</div>
      <button 
        onClick={copyAddress}
        className="ml-1 p-1 rounded-full text-emerald-200 hover:bg-emerald-800/50"
      >
        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
      </button>
    </div>
  )
}

export default WalletInfo