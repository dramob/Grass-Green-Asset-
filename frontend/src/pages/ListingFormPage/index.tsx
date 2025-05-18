import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import SDGSelection, { SDGData } from '../../components/ui/SDGSelection'
import useAuthStore from '../../store/useAuthStore'

interface FormData {
  companyName: string
  projectName: string
  description: string
  selectedSDGs: SDGData[]
}

const ListingFormPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, isConnected, walletAddress } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    companyName: user?.companyName || '',
    projectName: '',
    description: '',
    selectedSDGs: []
  })

  const steps = [
    t('sell.form.generalInfo'),
    t('sell.form.sdgGoals'),
    t('sell.form.review')
  ]

  const handleSDGChange = (selectedSDGs: SDGData[]) => {
    setFormData(prev => ({
      ...prev,
      selectedSDGs
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Log the data being submitted
      console.log('Submitting project data:', formData)
      
      // In a real app, we would send this to the backend
      // For now, we'll save it to session storage for the next page to use
      const draftId = Math.random().toString(36).substring(2, 15)
      
      // Convert selected SDGs to the format expected by the verification API
      const sdgClaims = formData.selectedSDGs.map(sdg => ({
        sdgId: sdg.id,
        checked: sdg.checked,
        justification: sdg.justification
      }))
      
      // Save to session storage
      sessionStorage.setItem(`draft_${draftId}`, JSON.stringify({
        companyName: formData.companyName,
        projectName: formData.projectName,
        description: formData.description,
        sdgClaims
      }))
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Navigate to scoring page
      navigate(`/sell/score/${draftId}`)
    } catch (error) {
      console.error('Error submitting project:', error)
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  if (!isConnected() || !walletAddress) {
    return (
      <div className="space-y-8 text-center">
        <h1 className="gradient-text">{t('sell.title')}</h1>
        <Card className="p-8">
          <p className="text-emerald-300 mb-4">{t('sell.login')}</p>
          <Button className="mx-auto" onClick={() => navigate('/sell')}>{t('wallet.connect')}</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="gradient-text">{t('sell.form.title')}</h1>
        <p className="text-emerald-300/70 mt-2 max-w-3xl mx-auto">
          {t('sell.subtitle')}
        </p>
      </div>
      
      <Card className="p-8">
        {/* Form Steps Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className={`rounded-full h-8 w-8 flex items-center justify-center ${
                    currentStep >= index ? 'bg-emerald-600' : 'bg-gray-700'
                  }`}
                >
                  <span className="text-sm font-medium text-white">{index + 1}</span>
                </div>
                <div className={`ml-2 ${currentStep >= index ? 'text-emerald-300' : 'text-gray-500'}`}>
                  {step}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-24 h-1 mx-2 ${
                    currentStep > index ? 'bg-emerald-600' : 'bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Step 1: General Information */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-emerald-300 mb-1">
                  {t('sell.form.companyName')}
                </label>
                <input
                  type="text"
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  required
                  className="w-full bg-gray-800 border border-emerald-200/30 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-emerald-300 mb-1">
                  {t('sell.form.projectName')}
                </label>
                <input
                  type="text"
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                  required
                  className="w-full bg-gray-800 border border-emerald-200/30 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-emerald-300 mb-1">
                  {t('sell.form.description')}
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  className="w-full bg-gray-800 border border-emerald-200/30 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          )}
          
          {/* Step 2: SDG Goals Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <SDGSelection 
                onChange={handleSDGChange}
                initialValues={formData.selectedSDGs}
              />
            </div>
          )}
          
          {/* Step 3: Review & Submit */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-medium text-emerald-300 mb-4">
                {t('sell.form.review')}
              </h3>
              
              <div className="bg-gray-900 p-4 rounded-lg">
                <h4 className="font-medium text-emerald-300 mb-2">{t('sell.form.generalInfo')}</h4>
                <div className="grid grid-cols-1 gap-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('sell.form.companyName')}</span>
                    <span className="text-white">{formData.companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">{t('sell.form.projectName')}</span>
                    <span className="text-white">{formData.projectName}</span>
                  </div>
                </div>
                
                <h4 className="font-medium text-emerald-300 mb-2 mt-4">{t('sell.form.description')}</h4>
                <p className="text-white mb-4">{formData.description}</p>
                
                <h4 className="font-medium text-emerald-300 mb-2 mt-4">{t('sell.form.sdgGoals')}</h4>
                <div className="space-y-2">
                  {formData.selectedSDGs.length > 0 ? (
                    formData.selectedSDGs.map(sdg => (
                      <div key={sdg.id} className="bg-gray-800 p-3 rounded">
                        <div className="font-medium text-emerald-200">
                          {t(`sell.sdg.goals.${sdg.id}.name`)}
                        </div>
                        <div className="text-sm text-gray-300 mt-1">
                          {sdg.justification}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400">{t('common.noResults')}</p>
                  )}
                </div>
              </div>
              
              <div className="bg-emerald-900/30 border border-emerald-500/30 p-4 rounded-lg">
                <p className="text-emerald-300">
                  {t('sell.scoring.title')}
                </p>
                <p className="text-sm text-gray-300 mt-2">
                  Upon submission, our AI system with web search capabilities will analyze your SDG claims and provide a verification score based on publicly available information about your company.
                </p>
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 0 ? (
              <Button 
                type="button"
                variant="secondary"
                onClick={prevStep}
              >
                {t('common.previous')}
              </Button>
            ) : (
              <div></div>
            )}
            
            {currentStep < steps.length - 1 ? (
              <Button 
                type="button"
                variant="primary"
                onClick={nextStep}
              >
                {t('common.next')}
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('sell.form.submitting') : t('sell.form.submit')}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  )
}

export default ListingFormPage