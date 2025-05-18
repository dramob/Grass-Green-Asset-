import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { projectService } from '../services/projectService'

const BuyPage = () => {
  const { t } = useTranslation()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch projects when the component mounts
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        const projectsData = await projectService.listProjects('verified')
        setProjects(projectsData)
        setError(null)
      } catch (err) {
        console.error('Error fetching projects:', err)
        setError('Failed to load projects. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h1 className="gradient-text">{t('buy.title')}</h1>
        <p className="text-emerald-300/70 mt-2 max-w-3xl mx-auto">
          {t('buy.subtitle')}
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            {t('common.tryAgain')}
          </Button>
        </Card>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="p-6 hover:shadow-emerald-900/20 transition-all">
              <h3 className="font-bold text-xl mb-2">{project.projectName}</h3>
              <p className="text-sm text-emerald-300/70 mb-1">{project.companyName}</p>
              
              {project.tokenInfo && (
                <div className="mt-4 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-emerald-300/50">Price</p>
                    <p className="font-semibold">{project.tokenInfo.tokenPrice || 0} XRP</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-300/50">Available</p>
                    <p className="font-semibold">{project.tokenInfo.availableSupply || 0} tokens</p>
                  </div>
                </div>
              )}
              
              {project.verificationResults && (
                <div className="mt-4 flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
                  <p className="text-xs text-emerald-300/70">
                    Verification Score: {project.verificationResults.totalScore || 0}%
                  </p>
                </div>
              )}
              
              <Button className="w-full mt-4" href={`/token/${project.id}`}>
                {t('buy.viewDetails')}
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 flex items-center justify-center">
          <div className="text-center">
            <p className="text-emerald-300 mb-4">No verified projects available at the moment</p>
            <Button href="/sell">{t('buy.createYourOwn')}</Button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default BuyPage