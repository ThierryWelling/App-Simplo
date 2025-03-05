'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { 
  FileText, 
  Users, 
  Settings,
  LogOut,
  Gauge,
  ChevronLeft,
  ChevronRight,
  User,
  BarChart
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Gauge
  },
  {
    title: 'Landing Pages',
    href: '/landing-pages',
    icon: FileText
  },
  {
    title: 'Páginas de Agradecimento',
    href: '/thank-you-pages',
    icon: FileText
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart
  },
  {
    title: 'Leads',
    href: '/leads',
    icon: Users
  },
  {
    title: 'Configurações',
    href: '/settings',
    icon: Settings,
    submenu: [
      {
        title: 'Geral',
        href: '/settings'
      },
      {
        title: 'Integrações e API',
        href: '/settings/api'
      }
    ]
  }
]

interface SidebarProps {
  onCollapse?: (isCollapsed: boolean) => void
}

interface UserProfile {
  id: string
  name: string
  email: string
  avatar_url?: string | null
}

interface AppConfig {
  site_name: string
  logo_url: string | null
  favicon_url?: string | null
}

export function Sidebar({ onCollapse }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [appConfig, setAppConfig] = useState<AppConfig>({
    site_name: 'Simplo Pages',
    logo_url: null,
    favicon_url: null
  })

  useEffect(() => {
    loadUserAndConfig()
  }, [])

  async function loadUserAndConfig() {
    try {
      // Carregar dados do usuário
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', user.id)
          .single()
          
        if (profile) {
          setUserProfile({
            id: user.id,
            name: profile.name || user.email?.split('@')[0] || '',
            email: user.email || '',
            avatar_url: profile.avatar_url,
          })
        }
      }
      
      // Carregar configurações do app
      const { data: config } = await supabase
        .from('app_config')
        .select('site_name, logo_url, favicon_url')
        .eq('is_active', true)
        .single()
        
      if (config) {
        setAppConfig(config)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
    onCollapse?.(!isCollapsed)
  }

  // Sincronizar estado com o layout pai
  useEffect(() => {
    onCollapse?.(isCollapsed)
  }, [isCollapsed, onCollapse])

  return (
    <aside 
      className={`glass fixed left-0 top-0 h-screen border-r border-border rounded-r-[32px] shadow-elevated transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Botão de Retrair */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-8 bg-background rounded-full p-1.5 border border-border shadow-card hover:shadow-elevated transition-all duration-200"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-text-secondary" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-text-secondary" />
        )}
      </button>

      <div className="flex flex-col h-full p-6">
        {/* Logo/Título */}
        <div className="mb-8 overflow-hidden flex justify-center">
          {appConfig.logo_url ? (
            <div className={`relative transition-all duration-300 ${
              isCollapsed 
                ? 'h-10 w-10' 
                : 'h-12 w-full'
            }`}>
              <Image
                src={isCollapsed && appConfig.favicon_url ? appConfig.favicon_url : appConfig.logo_url}
                alt={appConfig.site_name}
                fill
                className="object-contain"
                priority
              />
            </div>
          ) : (
            <h1 className={`text-2xl font-bold text-[#1A1F2E] truncate transition-all duration-300 ${
              isCollapsed ? 'text-center text-xl' : ''
            }`}>
              {isCollapsed ? 'SP' : appConfig.site_name}
            </h1>
          )}
          {!isCollapsed && !appConfig.logo_url && (
            <p className="text-[#1A1F2E] text-sm mt-1 opacity-80 text-center">
              Painel Administrativo
            </p>
          )}
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 -mx-2">
          <ul className="space-y-3">
            {menuItems.map((item) => {
              const isActive = item.submenu 
                ? item.submenu.some(subitem => pathname === subitem.href)
                : pathname === item.href
              const Icon = item.icon

              return (
                <li key={item.href} className="relative group">
                  <Link
                    href={item.href}
                    className={`flex items-center ${isCollapsed ? 'justify-center' : ''} gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-primary text-white shadow-button' 
                        : 'text-text-secondary hover:bg-background-secondary hover:text-primary hover:shadow-card'
                    }`}
                  >
                    <Icon className={`${isCollapsed ? 'w-8 h-8' : 'w-6 h-6'} transition-all duration-200 ${
                      isActive ? 'text-white' : 'group-hover:text-primary'
                    }`} />
                    {!isCollapsed && (
                      <span className="font-medium">
                        {item.title}
                      </span>
                    )}
                  </Link>
                  {/* Submenu */}
                  {!isCollapsed && item.submenu && (
                    <ul className="mt-2 ml-10 space-y-2">
                      {item.submenu.map((subitem) => {
                        const isSubActive = pathname === subitem.href
                        return (
                          <li key={subitem.href}>
                            <Link
                              href={subitem.href}
                              className={`block px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
                                isSubActive
                                  ? 'text-primary font-medium'
                                  : 'text-text-secondary hover:text-primary'
                              }`}
                            >
                              {subitem.title}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                  {/* Tooltip quando retraído */}
                  {isCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-text-primary text-white text-sm rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                      {item.title}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Perfil do Usuário */}
        <div className="mt-auto pt-4 border-t border-border">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            {/* Avatar */}
            <div className="relative">
              {userProfile?.avatar_url ? (
                <div className={`relative rounded-full overflow-hidden ${isCollapsed ? 'w-10 h-10' : 'w-9 h-9'}`}>
                  <Image
                    src={userProfile.avatar_url}
                    alt={userProfile.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className={`flex items-center justify-center rounded-full bg-background-secondary ${
                  isCollapsed ? 'w-10 h-10' : 'w-9 h-9'
                }`}>
                  <User className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} text-text-secondary`} />
                </div>
              )}
              
              {/* Indicador Online */}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-white" />
            </div>

            {/* Info do Usuário - Só mostra quando não está retraído */}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">
                  {userProfile?.name}
                </h3>
                <p className="text-xs text-text-secondary truncate">
                  {userProfile?.email}
                </p>
              </div>
            )}

            {/* Botão de Logout - Ajustado para versão retraída */}
            <button
              onClick={handleSignOut}
              className={`group flex items-center justify-center ${
                isCollapsed ? 'w-10 h-10' : 'w-9 h-9'
              } rounded-xl hover:bg-background-secondary transition-colors duration-200`}
              title="Sair"
            >
              <LogOut className={`${
                isCollapsed ? 'w-5 h-5' : 'w-4 h-4'
              } text-text-secondary group-hover:text-primary transition-colors duration-200`} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
} 