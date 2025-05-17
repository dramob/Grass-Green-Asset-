import { useState, useEffect } from 'react'
import { X, Check, Copy, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface WalletCreatedModalProps {
  isOpen: boolean
  onClose: () => void
  address: string
}

const WalletCreatedModal = ({ isOpen, onClose, address }: WalletCreatedModalProps) => {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  
  // Auto-close after a delay
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose()
      }, 10000) // 10 seconds
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])
  
  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  if (!isOpen) return null
  
  return (
    <div 
      className="fixed inset-0 z-[9999] overflow-hidden"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      
      {/* Modal positioning container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="relative bg-emerald-950 rounded-xl shadow-2xl border border-emerald-800/50 w-full max-w-md p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-emerald-100 flex items-center">
            <Check size={18} className="mr-2 text-green-500" />
            {t('auth.walletCreatedTitle')}
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-emerald-200 hover:bg-emerald-800/30"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Content */}
        <div>
          <p className="text-sm text-emerald-200 mb-2">
            {t('auth.walletCreatedMessage')}
          </p>
          
          <div className="bg-emerald-900/50 rounded-lg border border-emerald-800/30 p-3 flex items-center justify-between mb-4">
            <span className="font-mono text-sm text-emerald-100">
              {address}
            </span>
            <button 
              onClick={copyAddress}
              className="p-1.5 rounded-full text-emerald-200 hover:bg-emerald-800/50"
            >
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
          </div>
          
          <div className="text-xs text-emerald-200/70 mb-4 space-y-2">
            <p>{t('auth.walletCreatedHelp')}</p>
            <p className="font-medium text-yellow-300">{t('auth.walletCreatedWarning')}</p>
          </div>
          
          <div>
            <a 
              href={`https://testnet.bithomp.com/explorer/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center text-sm text-emerald-200 hover:text-emerald-100"
            >
              <span>View on XRPL Explorer</span>
              <ExternalLink size={14} className="ml-1" />
            </a>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default WalletCreatedModal