import { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'success' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  isLoading?: boolean
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white border-transparent',
    secondary: 'bg-emerald-800/30 hover:bg-emerald-800/50 text-emerald-200 border-emerald-700/50',
    ghost: 'bg-transparent hover:bg-emerald-800/20 text-emerald-300 border-transparent',
    outline: 'bg-transparent hover:bg-emerald-800/20 text-emerald-300 border-emerald-700/50',
    success: 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white border-transparent',
    danger: 'bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600 text-white border-transparent',
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1 rounded',
    md: 'text-sm px-4 py-2 rounded-lg',
    lg: 'text-base px-6 py-3 rounded-lg',
  }

  return (
    <button
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        inline-flex items-center justify-center border
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500
        transition-all duration-150 ease-in-out
        font-medium shadow-sm
        disabled:opacity-70 disabled:cursor-not-allowed
        ${className}
      `}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  )
}

export default Button