import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Leaf, ShieldCheck, BarChart3, Globe, RefreshCcw } from 'lucide-react'
import Card, { CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import projectService from '../services/projectService'

const HomePage = () => {
  const { t } = useTranslation()
  const [marketStats, setMarketStats] = useState({
    totalAssets: 0,
    totalValue: 0,
    carbonOffset: 0
  })
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])

  // Fetch real market data and projects
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch projects
        const projectsData = await projectService.listProjects('verified')
        setProjects(projectsData)
        
        // Calculate market stats from real data
        const totalAssets = projectsData.length
        const totalValue = projectsData.reduce((sum, project) => {
          return sum + (project.tokenInfo?.tokenAmount || 0)
        }, 0)
        const carbonOffset = projectsData.reduce((sum, project) => {
          return sum + (project.verificationResults?.emissionReductions || 0)
        }, 0)
        
        // If no real data, use simulation for demo purposes
        if (totalAssets === 0) {
          setMarketStats({
            totalAssets: 2847,
            totalValue: 5692341,
            carbonOffset: 128763
          })
        } else {
          setMarketStats({
            totalAssets,
            totalValue,
            carbonOffset
          })
        }
      } catch (error) {
        console.error('Error fetching homepage data:', error)
        // Fallback to simulated data
        setMarketStats({
          totalAssets: 2847,
          totalValue: 5692341,
          carbonOffset: 128763
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const features = [
    {
      icon: <Leaf size={32} className="text-green-400" />,
      title: t('home.features.sustainable.title'),
      description: t('home.features.sustainable.description')
    },
    {
      icon: <ShieldCheck size={32} className="text-blue-400" />,
      title: t('home.features.secure.title'),
      description: t('home.features.secure.description')
    },
    {
      icon: <BarChart3 size={32} className="text-purple-400" />,
      title: t('home.features.transparent.title'),
      description: t('home.features.transparent.description')
    },
    {
      icon: <Globe size={32} className="text-orange-400" />,
      title: t('home.features.global.title'),
      description: t('home.features.global.description')
    }
  ]

  // Map of SDG to project types for display
  const sdgToType = {
    1: 'Poverty',
    2: 'Hunger',
    3: 'Health',
    4: 'Education',
    5: 'Gender',
    6: 'Water',
    7: 'Energy',
    8: 'Economy',
    9: 'Infrastructure',
    10: 'Inequality',
    11: 'Cities',
    12: 'Consumption',
    13: 'Climate',
    14: 'Oceans',
    15: 'Land',
    16: 'Peace',
    17: 'Partnerships'
  }
  
  // Default images based on project type/SDG
  const defaultImages = {
    'Energy': 'https://images.unsplash.com/photo-1605980776566-0486c3ac7877?w=500&auto=format',
    'Climate': 'https://images.unsplash.com/photo-1565647952915-2739a3e4beb7?w=500&auto=format',
    'Water': 'https://images.unsplash.com/photo-1505217786770-835ae9884cd1?w=500&auto=format',
    'Land': 'https://images.unsplash.com/photo-1511497584788-876760111969?w=500&auto=format',
    'Oceans': 'https://images.unsplash.com/photo-1482685945432-29a7abf2f466?w=500&auto=format',
    'default': 'https://images.unsplash.com/photo-1569376813276-fca33f2d71fa?w=500&auto=format'
  }
  
  // Convert API projects to display format
  const getProjectsForDisplay = () => {
    if (projects.length > 0) {
      return projects.slice(0, 3).map(project => {
        // Find the primary SDG (highest score)
        const primarySdg = project.verificationResults?.results?.sort((a, b) => 
          b.verificationScore - a.verificationScore
        )[0]?.sdgId || 7; // Default to Energy (7) if no SDG found
        
        const type = sdgToType[primarySdg] || 'Energy';
        const image = defaultImages[type] || defaultImages.default;
        
        return {
          id: project.id,
          name: project.projectName || project.companyName,
          location: project.location || 'Global',
          type: type,
          price: project.tokenInfo?.tokenPrice || Math.floor(Math.random() * 2000) + 1000,
          image: image
        };
      });
    }
    
    // Fallback to placeholder data if no projects
    return [
      {
        id: 'asset-001',
        name: 'Solar Farm Alpha',
        location: 'California, USA',
        type: 'Energy',
        price: 2500,
        image: 'https://images.unsplash.com/photo-1605980776566-0486c3ac7877?w=500&auto=format'
      },
      {
        id: 'asset-002',
        name: 'Wind Project Beta',
        location: 'Scotland, UK',
        type: 'Climate',
        price: 1800,
        image: 'https://images.unsplash.com/photo-1548337138-e87d889cc369?w=500&auto=format'
      },
      {
        id: 'asset-003',
        name: 'Hydro Station Gamma',
        location: 'Quebec, Canada',
        type: 'Water',
        price: 3200,
        image: 'https://images.unsplash.com/photo-1482685945432-29a7abf2f466?w=500&auto=format'
      }
    ];
  }
  
  // Get assets for display - either real or placeholders
  const latestAssets = getProjectsForDisplay()

  return (
    <div className="space-y-12">
      {/* Hero section */}
      <section className="py-12 rounded-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-emerald-950/90 z-0" />
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-400">
            {t('home.hero.title')}
          </h1>
          <p className="text-lg md:text-xl text-emerald-100 mb-8">
            {t('home.hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              leftIcon={<Leaf size={18} />}
            >
              {t('home.hero.cta.primary')}
            </Button>
            <Button 
              size="lg" 
              variant="secondary" 
              rightIcon={<ArrowRight size={18} />}
            >
              {t('home.hero.cta.secondary')}
            </Button>
          </div>
        </div>
      </section>

      {/* Stats section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card glassEffect>
          <CardBody className="text-center">
            {loading ? (
              <div className="animate-pulse h-10 bg-emerald-800/50 rounded mb-2"></div>
            ) : (
              <div className="text-3xl font-bold mb-2 text-emerald-400">
                {marketStats.totalAssets.toLocaleString()}
              </div>
            )}
            <p className="text-emerald-200">{t('home.stats.assets')}</p>
          </CardBody>
        </Card>
        <Card glassEffect>
          <CardBody className="text-center">
            {loading ? (
              <div className="animate-pulse h-10 bg-emerald-800/50 rounded mb-2"></div>
            ) : (
              <div className="text-3xl font-bold mb-2 text-emerald-400">
                ${marketStats.totalValue.toLocaleString()}
              </div>
            )}
            <p className="text-emerald-200">{t('home.stats.value')}</p>
          </CardBody>
        </Card>
        <Card glassEffect>
          <CardBody className="text-center">
            {loading ? (
              <div className="animate-pulse h-10 bg-emerald-800/50 rounded mb-2"></div>
            ) : (
              <div className="text-3xl font-bold mb-2 text-emerald-400">
                {marketStats.carbonOffset.toLocaleString()} kg
              </div>
            )}
            <p className="text-emerald-200">{t('home.stats.carbon')}</p>
          </CardBody>
        </Card>
      </section>

      {/* Features section */}
      <section>
        <h2 className="text-2xl font-bold mb-8 text-center text-emerald-200">
          {t('home.featuresTitle')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} hoverEffect>
              <CardBody className="flex flex-col items-center text-center">
                <div className="mb-4 p-3 rounded-full bg-emerald-900/70">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-emerald-200">
                  {feature.title}
                </h3>
                <p className="text-emerald-300/70 text-sm">
                  {feature.description}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* Latest assets section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-emerald-200">
            {t('home.latestAssets')}
          </h2>
          <Link to="/buy">
            <Button 
              variant="ghost" 
              rightIcon={<ArrowRight size={16} />}
            >
              {t('home.viewAll')}
            </Button>
          </Link>
        </div>
        {loading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} hoverEffect>
                <div className="h-48 overflow-hidden bg-emerald-900/30 animate-pulse"></div>
                <CardBody>
                  <div className="flex justify-between items-start mb-2">
                    <div className="h-6 w-3/4 bg-emerald-900/40 rounded animate-pulse"></div>
                    <div className="h-6 w-1/5 bg-emerald-900/40 rounded-full animate-pulse"></div>
                  </div>
                  <div className="h-4 w-1/2 bg-emerald-900/30 rounded mb-4 animate-pulse"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 w-1/4 bg-emerald-900/40 rounded animate-pulse"></div>
                    <div className="h-4 w-1/3 bg-emerald-900/30 rounded animate-pulse"></div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          // Real project data
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestAssets.map((asset) => (
              <Link to={`/token/${asset.id}`} key={asset.id}>
                <Card hoverEffect>
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={asset.image} 
                      alt={asset.name} 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                  </div>
                  <CardBody>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-emerald-200">{asset.name}</h3>
                      <span className="px-2 py-1 bg-emerald-900/50 rounded-full text-xs text-emerald-300">
                        {asset.type}
                      </span>
                    </div>
                    <p className="text-sm text-emerald-300/70 mb-4">
                      <Globe size={14} className="inline mr-1" />
                      {asset.location}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-emerald-400">
                        ${asset.price}
                      </span>
                      <div className="flex items-center text-xs text-emerald-300/70">
                        <RefreshCcw size={12} className="mr-1" />
                        {t('home.updatedRecently')}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA section */}
      <section className="bg-gradient-to-r from-emerald-800/20 to-green-800/20 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-4 text-emerald-200">
          {t('home.cta.title')}
        </h2>
        <p className="text-emerald-300/70 max-w-2xl mx-auto mb-6">
          {t('home.cta.description')}
        </p>
        <Button size="lg">
          {t('home.cta.button')}
        </Button>
      </section>
    </div>
  )
}

export default HomePage