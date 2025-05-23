import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/useAuthStore'

interface DisconnectWalletButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  iconOnly?: boolean;
  className?: string;
}

const DisconnectWalletButton = ({
  variant = 'danger',
  size = 'md',
  fullWidth = false,
  iconOnly = false,
  className = ''
}: DisconnectWalletButtonProps) => {
  const { t } = useTranslation();
  const { disconnectWallet, walletAddress, isConnected, isConnecting } = useAuthStore();

  // Only show button if wallet is connected
  if (!isConnected() || !walletAddress) {
    return null;
  }

  const handleDisconnect = () => {
    disconnectWallet();
  };

  // Style variants
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white';
      case 'secondary':
        return 'bg-emerald-800/50 hover:bg-emerald-700/50 text-emerald-100';
      case 'outline':
        return 'bg-transparent border border-emerald-600 text-emerald-600 hover:bg-emerald-600/10';
      case 'ghost':
        return 'bg-transparent hover:bg-emerald-800/20 text-emerald-200';
      case 'danger':
        return 'bg-red-600/80 hover:bg-red-700 text-white';
      default:
        return 'bg-emerald-600 hover:bg-emerald-700 text-white';
    }
  };

  // Size variants
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'text-xs py-1 px-2';
      case 'md':
        return 'text-sm py-2 px-3';
      case 'lg':
        return 'text-base py-3 px-4';
      default:
        return 'text-sm py-2 px-3';
    }
  };

  // Format the address for display
  const formattedAddress = walletAddress 
    ? `${walletAddress.substring(0, 4)}...${walletAddress.substring(walletAddress.length - 4)}`
    : '';

  return (
    <button
      className={`
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${fullWidth ? 'w-full' : ''}
        ${className}
        inline-flex items-center justify-center
        rounded-lg font-medium
        transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      onClick={handleDisconnect}
      disabled={isConnecting()}
      title={!iconOnly ? undefined : t('wallet.disconnectTitle', { address: walletAddress })}
    >
      <LogOut size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className={iconOnly ? '' : 'mr-2'} />
      {!iconOnly && (isConnecting() ? t('wallet.disconnecting') : iconOnly ? '' : t('wallet.disconnect'))}
    </button>
  );
};

export default DisconnectWalletButton;