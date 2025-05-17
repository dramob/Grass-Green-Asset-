import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  ShoppingBag, 
  Tag, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight, 
  Leaf, 
  Trophy,
  Book
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

const Sidebar = () => {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const navItems = [
    { name: 'nav.home', path: '/', icon: Home },
    { name: 'nav.buy', path: '/buy', icon: ShoppingBag },
    { name: 'nav.sell', path: '/sell', icon: Tag },
    { name: 'nav.analytics', path: '/analytics', icon: BarChart3 },
    { name: 'nav.sustainability', path: '/sustainability', icon: Leaf },
    { name: 'nav.leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'nav.learn', path: '/learn', icon: Book }
  ]

  return (
    <aside 
      className={`bg-emerald-950/70 border-r border-emerald-800/30 text-emerald-100 
                  transition-all duration-300 ease-in-out h-screen sticky top-0 left-0
                  ${collapsed ? 'w-16' : 'w-64'} hidden lg:block`}
    >
      <div className="h-16 flex items-center justify-center border-b border-emerald-800/30">
        {!collapsed && (
          <Link to="/" className="flex items-center px-4">
            <img 
              src="/grass-icon.svg" 
              alt="Grass Green Asset" 
              className="h-8 w-8 mr-2" 
            />
            <span className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-400">
              GreenAsset
            </span>
          </Link>
        )}
        {collapsed && (
          <Link to="/" className="flex items-center justify-center">
            <img 
              src="/grass-icon.svg" 
              alt="Grass Green Asset" 
              className="h-8 w-8" 
            />
          </Link>
        )}
      </div>

      <div className="py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-2 py-3 rounded-lg transition-colors duration-200
                  ${isActive 
                    ? 'bg-emerald-800/30 text-emerald-400 border-l-2 border-emerald-500' 
                    : 'text-emerald-200 hover:bg-emerald-800/20 hover:text-emerald-300'
                  }
                `}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && (
                  <span className="ml-3 text-sm font-medium">{t(item.name)}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Collapse button */}
      <div className="absolute bottom-4 w-full flex justify-center">
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-full bg-emerald-800/30 hover:bg-emerald-800/50 text-emerald-200"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar