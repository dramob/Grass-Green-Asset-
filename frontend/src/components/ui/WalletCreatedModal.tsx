import { useState, useEffect, useRef } from 'react'
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
  const modalRef = useRef<HTMLDivElement>(null)
  
  // Auto-close after a delay
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose()
      }, 10000) // 10 seconds
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])
  
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
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
  
  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  if (!isOpen) return null
  
  return (
    <div 
      className="fixed inset-0 z-[9999]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-created-title"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            ref={modalRef}
            className="w-full max-w-md bg-emerald-950 rounded-xl shadow-2xl border border-emerald-800/50 
                     p-6 animate-fadeIn relative"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 
                id="wallet-created-title"
                className="text-lg font-medium text-emerald-100 flex items-center"
              >
                <Check size={18} className="mr-2 text-green-500" />
                {t('auth.walletCreatedTitle')}
              </h2>
              <button 
                onClick={onClose}
                className="p-1.5 rounded-full text-emerald-200 hover:bg-emerald-800/30 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label="Close"
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
                <span className="font-mono text-sm text-emerald-100 overflow-auto">
                  {address}
                </span>
                <button 
                  onClick={copyAddress}
                  className="p-1.5 rounded-full text-emerald-200 hover:bg-emerald-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  aria-label={copied ? "Copied" : "Copy to clipboard"}
                  title={copied ? "Copied" : "Copy to clipboard"}
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
                  className="flex items-center justify-center text-sm text-emerald-200 hover:text-emerald-100 
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-md p-2"
                >
                  <span>View on XRPL Explorer</span>
                  <ExternalLink size={14} className="ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WalletCreatedModal