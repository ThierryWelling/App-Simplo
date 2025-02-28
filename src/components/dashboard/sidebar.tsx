'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  FileText, 
  Users, 
  Settings,
  LogOut,
  Gauge,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/',
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
    title: 'Leads',
    href: '/leads',
    icon: Users
  },
  {
    title: 'Configurações',
    href: '/settings',
    icon: Settings
  }
]

interface SidebarProps {
  onCollapse?: (isCollapsed: boolean) => void
}

export function Sidebar({ onCollapse }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

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
        <div className="mb-8 overflow-hidden">
          <h1 className={`text-2xl font-bold text-[#1A1F2E] truncate transition-all duration-300 ${
            isCollapsed ? 'text-center text-xl' : ''
          }`}>
            {isCollapsed ? 'SP' : 'Simplo Pages'}
          </h1>
          {!isCollapsed && (
            <p className="text-[#1A1F2E] text-sm mt-1 opacity-80">
              Painel Administrativo
            </p>
          )}
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 -mx-2">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
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
                    <Icon className={`w-6 h-6 transition-colors duration-200 ${
                      isActive ? 'text-white' : 'group-hover:text-primary'
                    }`} />
                    {!isCollapsed && (
                      <span className="font-medium">
                        {item.title}
                      </span>
                    )}
                  </Link>
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

        {/* Botão de Sair */}
        <button
          onClick={handleSignOut}
          className={`flex items-center ${isCollapsed ? 'justify-center' : ''} gap-3 px-4 py-3 mt-8 rounded-2xl text-error hover:bg-error-bg group transition-all duration-200 relative w-full`}
        >
          <LogOut className="w-6 h-6 transition-colors duration-200 group-hover:text-error" />
          {!isCollapsed && (
            <span className="font-medium">Sair</span>
          )}
          {/* Tooltip para o botão de sair quando retraído */}
          {isCollapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-text-primary text-white text-sm rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50">
              Sair
            </div>
          )}
        </button>
      </div>
    </aside>
  )
} 