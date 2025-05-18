import { useTranslation } from 'react-i18next'
import { SDGVerificationResult } from '../../types/sdg'
import { CheckCircle, AlertCircle, XCircle, ExternalLink } from 'lucide-react'
import SDGIcon from './SDGIcon'
import { SDGGoal } from '../../types/sdg'

interface VerificationResultsProps {
  results: SDGVerificationResult[]
  totalScore: number
}

const VerificationResults: React.FC<VerificationResultsProps> = ({ 
  results,
  totalScore
}) => {
  const { t } = useTranslation()

  // Sort results by score descending
  const sortedResults = [...results].sort((a, b) => 
    b.verificationScore - a.verificationScore
  )

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="text-emerald-400" />
    if (score >= 50) return <AlertCircle className="text-yellow-400" />
    return <XCircle className="text-red-400" />
  }

  const getConfidenceBadge = (level: 'high' | 'medium' | 'low') => {
    const baseClasses = "text-xs font-medium px-2.5 py-0.5 rounded-full"
    
    switch (level) {
      case 'high':
        return <span className={`${baseClasses} bg-emerald-900/50 text-emerald-300`}>
          {t('sell.scoring.result.confidenceHigh', 'High')}
        </span>
      case 'medium':
        return <span className={`${baseClasses} bg-yellow-900/50 text-yellow-300`}>
          {t('sell.scoring.result.confidenceMedium', 'Medium')}
        </span>
      case 'low':
        return <span className={`${baseClasses} bg-red-900/50 text-red-300`}>
          {t('sell.scoring.result.confidenceLow', 'Low')}
        </span>
    }
  }

  return (
    <div className="bg-gray-800 border border-emerald-200/20 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium text-emerald-300">
          {t('sell.scoring.result.sdgVerification')}
        </h3>
        <div className="flex items-center">
          <span className="mr-2">{t('sell.scoring.result.score')}</span>
          <span className={`text-2xl font-bold ${getScoreColor(totalScore)}`}>
            {totalScore}/100
          </span>
        </div>
      </div>
      
      <p className="text-gray-300 mb-6">
        {t('sell.scoring.result.webVerificationSummary')}
      </p>
      
      <div className="space-y-6">
        {sortedResults.map((result) => (
          <div 
            key={result.sdgId}
            className="border-b border-gray-700 pb-6 last:border-0"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center">
                <div className="mr-3 flex items-center">
                  <SDGIcon sdgId={result.sdgId as SDGGoal} size="sm" className="mr-2" />
                  {getScoreIcon(result.verificationScore)}
                </div>
                <h4 className="font-medium text-emerald-200">
                  {t(`sell.sdg.goals.${result.sdgId}.name`)}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                {getConfidenceBadge(result.confidenceLevel)}
                <span className={`font-bold ${getScoreColor(result.verificationScore)}`}>
                  {result.verificationScore}/100
                </span>
              </div>
            </div>
            
            <p className="text-gray-300 ml-8 mb-4">
              {result.evidenceSummary}
            </p>
            
            {result.sources.length > 0 && (
              <div className="ml-8">
                <h5 className="text-sm font-medium text-gray-400 mb-1">
                  {t('sell.scoring.result.sources', 'Sources')}:
                </h5>
                <div className="flex flex-wrap gap-2">
                  {result.sources.map((source, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                    >
                      {source}
                      <ExternalLink size={12} className="ml-1 text-gray-400" />
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-sm text-gray-400 flex items-center justify-end">
        <span>{t('sell.scoring.result.verifiedBy')}</span>
      </div>
    </div>
  )
}

export default VerificationResults