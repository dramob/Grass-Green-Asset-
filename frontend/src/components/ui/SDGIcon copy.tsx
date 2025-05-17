import React from 'react'
import { SDGGoal } from '../../types/sdg'

// Define colors for each SDG
const sdgColors: Record<SDGGoal, { background: string, text: string }> = {
  [SDGGoal.NoPoverty]: { background: 'bg-[#E5243B]', text: 'text-white' },
  [SDGGoal.ZeroHunger]: { background: 'bg-[#DDA63A]', text: 'text-white' },
  [SDGGoal.GoodHealth]: { background: 'bg-[#4C9F38]', text: 'text-white' },
  [SDGGoal.QualityEducation]: { background: 'bg-[#C5192D]', text: 'text-white' },
  [SDGGoal.GenderEquality]: { background: 'bg-[#FF3A21]', text: 'text-white' },
  [SDGGoal.CleanWater]: { background: 'bg-[#26BDE2]', text: 'text-white' },
  [SDGGoal.CleanEnergy]: { background: 'bg-[#FCC30B]', text: 'text-white' },
  [SDGGoal.DecentWork]: { background: 'bg-[#A21942]', text: 'text-white' },
  [SDGGoal.Industry]: { background: 'bg-[#FD6925]', text: 'text-white' },
  [SDGGoal.ReducedInequality]: { background: 'bg-[#DD1367]', text: 'text-white' },
  [SDGGoal.SustainableCities]: { background: 'bg-[#FD9D24]', text: 'text-white' },
  [SDGGoal.ResponsibleConsumption]: { background: 'bg-[#BF8B2E]', text: 'text-white' },
  [SDGGoal.ClimateAction]: { background: 'bg-[#3F7E44]', text: 'text-white' },
  [SDGGoal.LifeBelowWater]: { background: 'bg-[#0A97D9]', text: 'text-white' },
  [SDGGoal.LifeOnLand]: { background: 'bg-[#56C02B]', text: 'text-white' },
  [SDGGoal.PeaceAndJustice]: { background: 'bg-[#00689D]', text: 'text-white' },
  [SDGGoal.Partnerships]: { background: 'bg-[#19486A]', text: 'text-white' }
}

interface SDGIconProps {
  sdgId: SDGGoal;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SDGIcon: React.FC<SDGIconProps> = ({ 
  sdgId, 
  size = 'md',
  className = ''
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-base'
  }
  
  const { background, text } = sdgColors[sdgId as SDGGoal]
  
  return (
    <div 
      className={`${background} ${text} ${sizeClasses[size]} rounded-full flex items-center justify-center font-bold ${className}`}
      title={`SDG ${sdgId}`}
    >
      {sdgId}
    </div>
  )
}

export default SDGIcon