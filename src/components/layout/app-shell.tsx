'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/providers/auth-provider'
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Menu, 
  X, 
  Bell, 
  Search,
  LogOut,
  Layout
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard'
  },
  {
    title: 'Templates',
    icon: Layout,
    href: '/dashboard/templates'
  },
  {
    title: 'Landing Pages',
    icon: FileText,
    href: '/dashboard/landing-pages'
  },
  {
    title: 'Leads',
    icon: Users,
    href: '/dashboard/leads'
  },
  {
    title: 'Configurações',
    icon: Settings,
    href: '/dashboard/settings'
  }
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClientComponentClient()

  const handleSignOut = async () => {
    try {
      setLoading(true)
      // Limpa a sessão no Supabase
      await supabase.auth.signOut()
      // Limpa qualquer dado local
      localStorage.clear()
      // Remove cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })
      // Redireciona para o login
      toast.success('Logout realizado com sucesso!')
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      toast.error('Erro ao fazer logout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white">
      {/* Sidebar Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <nav className="relative w-80 h-full bg-zinc-900/90 border-r border-zinc-800/50 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-12">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
                  SimploLive
                </h1>
                <button 
                  onClick={() => setSidebarOpen(false)} 
                  className="p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Perfil do Usuário */}
              <div className="mb-8 p-4 glass-effect rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium">{user?.name}</h3>
                    <p className="text-sm text-zinc-400">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Sair</span>
                </button>
              </div>
              
              <div className="space-y-2">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 text-white border border-purple-500/20' 
                          : 'hover:bg-zinc-800/50 text-zinc-400 border border-transparent hover:border-purple-500/10'
                      }`}
                    >
                      <div className={`p-2 rounded-lg transition-all duration-300 ${
                        isActive
                          ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20'
                          : 'bg-zinc-800/50 group-hover:bg-gradient-to-br group-hover:from-blue-500/10 group-hover:to-purple-500/10'
                      }`}>
                        <item.icon className={`w-5 h-5 transition-all duration-300 ${
                          isActive
                            ? 'text-purple-400'
                            : 'group-hover:text-purple-400'
                        }`} />
                      </div>
                      <span className="font-medium">{item.title}</span>
                      {isActive && (
                        <motion.div
                          className="absolute left-0 w-1.5 h-8 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-r-full"
                          layoutId="activeTabMobile"
                        />
                      )}
                    </Link>
                  )
                })}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Desktop */}
      <nav className="hidden lg:block fixed top-0 left-0 w-80 h-full bg-zinc-900/90 border-r border-zinc-800/50 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
            SimploLive
          </h1>
        </div>

        {/* Perfil do Usuário */}
        <div className="mb-8 p-4 glass-effect rounded-lg">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-medium">{user?.name}</h3>
              <p className="text-sm text-zinc-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sair</span>
          </button>
        </div>

        <div className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 text-white border border-purple-500/20' 
                    : 'hover:bg-zinc-800/50 text-zinc-400 border border-transparent hover:border-purple-500/10'
                }`}
              >
                <div className={`p-2 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20'
                    : 'bg-zinc-800/50 group-hover:bg-gradient-to-br group-hover:from-blue-500/10 group-hover:to-purple-500/10'
                }`}>
                  <item.icon className={`w-5 h-5 transition-all duration-300 ${
                    isActive
                      ? 'text-purple-400'
                      : 'group-hover:text-purple-400'
                  }`} />
                </div>
                <span className="font-medium">{item.title}</span>
                {isActive && (
                  <motion.div
                    className="absolute left-0 w-1.5 h-8 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-r-full"
                    layoutId="activeTab"
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Main Content */}
      <div className="lg:pl-80">
        {/* Header */}
        <header className="fixed top-0 right-0 left-0 lg:left-80 h-16 glass-effect z-40">
          <div className="flex items-center justify-between h-full px-4">
            <div className="flex items-center space-x-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 lg:hidden">
                <Menu className="w-6 h-6" />
              </button>
              <div className="hidden sm:block relative w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="w-full h-10 pl-10 pr-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="pt-24 min-h-screen">
          <div className="px-4 py-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 