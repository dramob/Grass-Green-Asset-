import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Clock, ArrowRight, TrendingUp } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import VerificationResults from '../../components/ui/VerificationResults'
import { verificationApi } from '../../services/api'
import { ProjectVerification, SDGClaim } from '../../types/sdg'

const ScoreResultPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { draftId } = useParams<{ draftId: string }>()
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [scoringResult, setScoringResult] = useState<ProjectVerification | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Mock steps for the scoring process
  const scoringSteps = [
    { key: 'upload', icon: <CheckCircle2 size={20} /> },
    { key: 'processing', icon: <Clock size={20} /> },
    { key: 'scoring', icon: <TrendingUp size={20} /> },
    { key: 'verification', icon: <Clock size={20} /> },
    { key: 'review', icon: <Clock size={20} /> },
    { key: 'complete', icon: <Clock size={20} /> },
  ]
  
  useEffect(() => {
    const runVerification = async () => {
      try {
        setIsLoading(true)
        
        // In a real app, we would retrieve the draft data from session storage or API
        // For now, we'll use mock data from session storage if available, otherwise use hardcoded values
        let projectData: {companyName: string, projectName: string, sdgClaims: SDGClaim[]} | null = null;
        
        try {
          const savedData = sessionStorage.getItem(`draft_${draftId}`);
          if (savedData) {
            projectData = JSON.parse(savedData);
            console.log('Retrieved project data from session storage:', projectData);
          }
        } catch (e) {
          console.warn('Failed to retrieve project data from session storage:', e);
        }
        
        if (!projectData) {
          console.log('Using hardcoded project data since none was found in session storage');
          // Fallback to hardcoded data for demonstration
          projectData = {
            companyName: "Eco Innovations Inc.",
            projectName: "Carbon Capture Forest Initiative",
            sdgClaims: [
              { sdgId: 13, checked: true, justification: "Our project directly addresses climate change by capturing carbon through reforestation." },
              { sdgId: 15, checked: true, justification: "We protect biodiversity through sustainable forest management practices." },
              { sdgId: 7, checked: true, justification: "The project generates renewable energy from biomass." }
            ]
          };
        }
        
        // Simulate the steps of the scoring process with realistic delays
        // Step 1: Uploading and processing documents
        setCurrentStep(0)
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Step 2: Processing documents
        setCurrentStep(1)
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Step 3: AI Scoring
        setCurrentStep(2)
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Step 4: Web Verification
        setCurrentStep(3)
        await new Promise(resolve => setTimeout(resolve, 2500))
        
        // Step 5: Final Review
        setCurrentStep(4)
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Step 6: Complete
        setCurrentStep(5)
        
        // Get verification results from API
        const results = await verificationApi.verifySDGClaims(
          projectData.companyName,
          projectData.projectName,
          projectData.sdgClaims
        )
        
        setScoringResult(results)
        setIsLoading(false)
        
      } catch (err) {
        console.error('Error during verification:', err)
        setError('Error during verification process')
        setIsLoading(false)
      }
    }
    
    runVerification()
  }, [draftId])
  
  const handleMintClick = () => {
    // In a real app, this would mint the token on XRPL
    // For now, we'll just navigate back to the sell page
    navigate('/sell')
  }
  
  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h1 className="gradient-text">{t('sell.scoring.title')}</h1>
        </div>
        <Card className="p-8 text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <Button onClick={() => navigate('/sell')}>{t('common.back')}</Button>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="gradient-text">{t('sell.scoring.title')}</h1>
        <p className="text-emerald-300/70 mt-2 max-w-3xl mx-auto">
          {isLoading ? t('sell.scoring.inProgress') : t('sell.scoring.completed')}
        </p>
      </div>
      
      <Card className="p-8">
        {/* Scoring Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between">
            {scoringSteps.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className={`rounded-full h-10 w-10 flex items-center justify-center ${
                    currentStep > index 
                      ? 'bg-emerald-600' 
                      : currentStep === index 
                        ? 'bg-emerald-600 animate-pulse' 
                        : 'bg-gray-700'
                  }`}
                >
                  {/* Replace icon based on step status */}
                  <div className={`text-white ${currentStep === index && isLoading ? 'animate-spin' : ''}`}>
                    {currentStep > index ? <CheckCircle2 size={20} /> : step.icon}
                  </div>
                </div>
                <div className={`mt-2 text-center text-sm ${
                  currentStep >= index ? 'text-emerald-300' : 'text-gray-500'
                }`}>
                  {t(`sell.scoring.steps.${step.key}`)}
                </div>
                {index < scoringSteps.length - 1 && (
                  <div className="hidden md:block">
                    <ArrowRight 
                      size={16} 
                      className={`mx-4 ${
                        currentStep > index ? 'text-emerald-500' : 'text-gray-700'
                      }`} 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-400 border-t-transparent mb-4"></div>
            <p className="text-emerald-300">{t(`sell.scoring.steps.${scoringSteps[currentStep].key}`)}</p>
          </div>
        )}
        
        {/* Results */}
        {!isLoading && scoringResult && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-4xl font-bold text-emerald-400 mb-2">
                {scoringResult.totalScore}/100
              </div>
              <p className="text-gray-300">
                {t('sell.scoring.result.score')}
              </p>
            </div>
            
            <VerificationResults
              results={scoringResult.results}
              totalScore={scoringResult.totalScore}
            />
            
            <div className="flex justify-center mt-8">
              <Button 
                onClick={handleMintClick}
                variant="primary"
                size="lg"
              >
                {t('sell.scoring.result.mint')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default ScoreResultPage