import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hoverEffect?: boolean
  glassEffect?: boolean
  bordered?: boolean
}

const Card = ({ 
  children, 
  className = '', 
  hoverEffect = false, 
  glassEffect = false,
  bordered = true
}: CardProps) => {
  return (
    <div 
      className={`
        ${bordered ? 'border border-emerald-800/30' : ''}
        ${glassEffect ? 'backdrop-blur-lg bg-emerald-900/20' : 'bg-emerald-900/40'} 
        ${hoverEffect ? 'hover:bg-emerald-800/40 transition-colors' : ''}
        rounded-xl overflow-hidden shadow-xl
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export const CardHeader = ({ children, className = '' }: CardHeaderProps) => {
  return (
    <div className={`p-4 border-b border-emerald-800/30 ${className}`}>
      {children}
    </div>
  )
}

export interface CardBodyProps {
  children: ReactNode
  className?: string
}

export const CardBody = ({ children, className = '' }: CardBodyProps) => {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  )
}

export interface CardFooterProps {
  children: ReactNode
  className?: string
}

export const CardFooter = ({ children, className = '' }: CardFooterProps) => {
  return (
    <div className={`p-4 border-t border-emerald-800/30 ${className}`}>
      {children}
    </div>
  )
}

export default Card