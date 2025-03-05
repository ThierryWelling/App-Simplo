'use client'

import { useState, useEffect } from 'react'
import { Save, Trash2, Upload, Eye, Settings, Bell, Mail, User, Shield, CreditCard } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface UserProfile {
  id: string
  name: string
  email: string
  avatar_url?: string | null
}

interface AppConfig {
  site_name: string
  logo_url: string | null
  favicon_url: string | null
  primary_color: string
  notify_on_lead: boolean
  admin_email: string
  whatsapp_number: string | null
  whatsapp_message: string | null
  integration_api_key: string | null
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [config, setConfig] = useState<AppConfig>({
    site_name: 'Simplo Pages',
    logo_url: null,
    favicon_url: null,
    primary_color: '#0066FF',
    notify_on_lead: true,
    admin_email: '',
    whatsapp_number: null,
    whatsapp_message: null,
    integration_api_key: null,
  })
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    loadUserAndConfig()
  }, [])

  async function loadUserAndConfig() {
    setIsLoading(true)
    try {
      // Carregar dados do usuário
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Corrigindo a query para buscar o perfil
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', user.id)
          .single()
          
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Erro ao carregar perfil:', profileError)
        }
          
        if (profile) {
          setUserProfile({
            id: user.id,
            name: profile.name || user.email?.split('@')[0] || '',
            email: user.email || '',
            avatar_url: profile.avatar_url,
          })
        } else {
          // Criar perfil se não existir
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              name: user.email?.split('@')[0] || '',
            })
            
          if (insertError) {
            console.error('Erro ao criar perfil:', insertError)
          }
          
          setUserProfile({
            id: user.id,
            name: user.email?.split('@')[0] || '',
            email: user.email || '',
            avatar_url: null,
          })
        }
      }
      
      // Carregar configurações do aplicativo
      const { data: appConfig } = await supabase
        .from('app_config')
        .select('*')
        .eq('is_active', true)
        .single()
        
      if (appConfig) {
        setConfig({
          ...config,
          ...appConfig,
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function saveUserProfile() {
    if (!userProfile) return
    
    setIsSaving(true)
    try {
      // Corrigindo a função de update do perfil
      const { error } = await supabase
        .from('profiles')
        .update({
          name: userProfile.name,
          avatar_url: userProfile.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userProfile.id)
        
      if (error) throw error
      
      alert('Perfil atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      alert('Erro ao salvar perfil. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }
  
  async function saveAppConfig() {
    setIsSaving(true)
    try {
      // Verificar se já existe configuração
      const { data: existingConfig } = await supabase
        .from('app_config')
        .select('id')
        .eq('is_active', true)
        .single()
      
      if (existingConfig) {
        // Atualizar configuração existente
        const { error } = await supabase
          .from('app_config')
          .update({
            ...config,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingConfig.id)
          
        if (error) throw error
      } else {
        // Criar nova configuração
        const { error } = await supabase
          .from('app_config')
          .insert({
            ...config,
            is_active: true,
          })
          
        if (error) throw error
      }
      
      alert('Configurações salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      alert('Erro ao salvar configurações. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }
  
  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Verificar tipo de arquivo
    if (!file.type.includes('image/')) {
      alert('Por favor, selecione uma imagem válida.')
      return
    }
    
    // Verificar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB.')
      return
    }
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      if (event.target?.result && userProfile) {
        // Upload para o Supabase Storage
        const fileName = `avatar-${userProfile.id}-${Date.now()}`
        
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, file)
          
        if (error) {
          console.error('Erro ao fazer upload:', error)
          alert('Erro ao fazer upload da imagem. Tente novamente.')
          return
        }
        
        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)
          
        // Atualizar avatar no estado
        setUserProfile({
          ...userProfile,
          avatar_url: publicUrl,
        })
      }
    }
    reader.readAsDataURL(file)
  }
  
  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Verificar tipo de arquivo
    if (!file.type.includes('image/')) {
      alert('Por favor, selecione uma imagem válida.')
      return
    }
    
    // Verificar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB.')
      return
    }
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      if (event.target?.result) {
        // Upload para o Supabase Storage
        const fileName = `logo-${Date.now()}`
        
        const { data, error } = await supabase.storage
          .from('app-assets')
          .upload(fileName, file)
          
        if (error) {
          console.error('Erro ao fazer upload:', error)
          alert('Erro ao fazer upload da imagem. Tente novamente.')
          return
        }
        
        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('app-assets')
          .getPublicUrl(fileName)
          
        // Atualizar logo no estado
        setConfig({
          ...config,
          logo_url: publicUrl,
        })
      }
    }
    reader.readAsDataURL(file)
  }

  function handleFaviconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Verificar tipo de arquivo
    if (!file.type.includes('image/')) {
      alert('Por favor, selecione uma imagem válida.')
      return
    }
    
    // Verificar tamanho (max 1MB)
    if (file.size > 1 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 1MB.')
      return
    }
    
    const reader = new FileReader()
    reader.onload = async (event) => {
      if (event.target?.result) {
        // Upload para o Supabase Storage
        const fileName = `favicon-${Date.now()}`
        
        const { data, error } = await supabase.storage
          .from('app-assets')
          .upload(fileName, file)
          
        if (error) {
          console.error('Erro ao fazer upload:', error)
          alert('Erro ao fazer upload da imagem. Tente novamente.')
          return
        }
        
        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('app-assets')
          .getPublicUrl(fileName)
          
        // Atualizar favicon no estado
        setConfig({
          ...config,
          favicon_url: publicUrl,
        })
      }
    }
    reader.readAsDataURL(file)
  }

  function renderTab() {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )
    }
    
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                  {userProfile?.avatar_url ? (
                    <img 
                      src={userProfile.avatar_url} 
                      alt={userProfile.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-slate-400" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 text-white p-2 rounded-full cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>
              
              <div>
                <h3 className="font-medium text-lg">{userProfile?.name}</h3>
                <p className="text-slate-500">{userProfile?.email}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <Input 
                  value={userProfile?.name || ''} 
                  onChange={(e) => userProfile && setUserProfile({...userProfile, name: e.target.value})}
                  placeholder="Seu nome"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input 
                  value={userProfile?.email || ''} 
                  disabled
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500 mt-1">O email não pode ser alterado.</p>
              </div>
            </div>
            
            <Button 
              onClick={saveUserProfile} 
              disabled={isSaving}
              className="mt-4"
            >
              {isSaving ? 'Salvando...' : 'Salvar Perfil'}
            </Button>
          </div>
        )
        
      case 'app':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome do Site</label>
                <Input 
                  value={config.site_name} 
                  onChange={(e) => setConfig({...config, site_name: e.target.value})}
                  placeholder="Nome do seu site"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Logo do Site</label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-32 border border-slate-200 rounded-md flex items-center justify-center overflow-hidden bg-slate-50">
                    {config.logo_url ? (
                      <img 
                        src={config.logo_url} 
                        alt="Logo" 
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <p className="text-xs text-slate-400">Sem logo</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-md text-sm cursor-pointer inline-block">
                      Escolher arquivo
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                    </label>
                    {config.logo_url && (
                      <button 
                        className="ml-2 text-red-500 hover:text-red-700 text-sm"
                        onClick={() => setConfig({...config, logo_url: null})}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Favicon</label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 border border-slate-200 rounded-md flex items-center justify-center overflow-hidden bg-slate-50">
                    {config.favicon_url ? (
                      <img 
                        src={config.favicon_url} 
                        alt="Favicon" 
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <p className="text-xs text-slate-400">Sem favicon</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-md text-sm cursor-pointer inline-block">
                      Escolher arquivo
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFaviconUpload}
                      />
                    </label>
                    {config.favicon_url && (
                      <button 
                        className="ml-2 text-red-500 hover:text-red-700 text-sm"
                        onClick={() => setConfig({...config, favicon_url: null})}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">Recomendado: arquivo .ico ou .png de 32x32 pixels</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Cor Primária</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={config.primary_color} 
                    onChange={(e) => setConfig({...config, primary_color: e.target.value})}
                    className="w-12 h-12 rounded cursor-pointer border-0"
                  />
                  <Input 
                    value={config.primary_color} 
                    onChange={(e) => setConfig({...config, primary_color: e.target.value})}
                    className="w-32"
                  />
                </div>
              </div>
            </div>
            
            <Button 
              onClick={saveAppConfig} 
              disabled={isSaving}
              className="mt-4"
            >
              {isSaving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        )
        
      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <input 
                  type="checkbox" 
                  id="notify_on_lead" 
                  checked={config.notify_on_lead} 
                  onChange={(e) => setConfig({...config, notify_on_lead: e.target.checked})}
                  className="mt-1"
                />
                <div>
                  <label htmlFor="notify_on_lead" className="block text-sm font-medium">Notificar sobre novos leads</label>
                  <p className="text-xs text-slate-500">Receba um email sempre que um novo lead for capturado</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email para notificações</label>
                <Input 
                  value={config.admin_email} 
                  onChange={(e) => setConfig({...config, admin_email: e.target.value})}
                  placeholder="email@exemplo.com"
                  type="email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Número de WhatsApp (com DDD)</label>
                <Input 
                  value={config.whatsapp_number || ''} 
                  onChange={(e) => setConfig({...config, whatsapp_number: e.target.value})}
                  placeholder="5511999999999"
                />
                <p className="text-xs text-slate-500 mt-1">Use o formato internacional com código do país (ex: 5511999999999)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Mensagem padrão para WhatsApp</label>
                <textarea 
                  value={config.whatsapp_message || ''} 
                  onChange={(e) => setConfig({...config, whatsapp_message: e.target.value})}
                  placeholder="Olá! Vim do seu site e gostaria de mais informações."
                  className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  rows={3}
                />
              </div>
            </div>
            
            <Button 
              onClick={saveAppConfig} 
              disabled={isSaving}
              className="mt-4"
            >
              {isSaving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        )
        
      case 'integrations':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
              <h3 className="font-medium mb-2">API Key</h3>
              <p className="text-sm text-slate-600 mb-4">
                Use esta chave para integrar com outros sistemas e acessar seus leads via API.
              </p>
              
              <div className="flex gap-2">
                <Input 
                  value={config.integration_api_key || ''} 
                  readOnly
                  className="font-mono text-sm"
                />
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Gerar nova API key (UUID v4)
                    const newApiKey = crypto.randomUUID()
                    setConfig({...config, integration_api_key: newApiKey})
                  }}
                >
                  Gerar Nova
                </Button>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
              <h3 className="font-medium mb-2">Documentação da API</h3>
              <p className="text-sm text-slate-600 mb-2">
                Nossa API permite que você acesse seus leads programaticamente.
              </p>
              <div className="mt-2">
                <a 
                  href="/api/docs" 
                  target="_blank" 
                  className="text-primary hover:underline flex items-center gap-1 text-sm"
                >
                  <Eye className="w-4 h-4" />
                  Ver documentação
                </a>
              </div>
            </div>
            
            <Button 
              onClick={saveAppConfig} 
              disabled={isSaving}
              className="mt-4"
            >
              {isSaving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        )
        
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do seu aplicativo
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Menu lateral */}
        <div className="bg-card rounded-lg shadow-sm p-4">
          <nav>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-2 rounded-md flex items-center gap-2 ${
                    activeTab === 'profile' 
                      ? 'bg-primary text-white' 
                      : 'hover:bg-background-secondary'
                  }`}
                >
                  <User className="w-5 h-5" />
                  Perfil
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('app')}
                  className={`w-full text-left px-4 py-2 rounded-md flex items-center gap-2 ${
                    activeTab === 'app' 
                      ? 'bg-primary text-white' 
                      : 'hover:bg-background-secondary'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  Aplicativo
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full text-left px-4 py-2 rounded-md flex items-center gap-2 ${
                    activeTab === 'notifications' 
                      ? 'bg-primary text-white' 
                      : 'hover:bg-background-secondary'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  Notificações
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('integrations')}
                  className={`w-full text-left px-4 py-2 rounded-md flex items-center gap-2 ${
                    activeTab === 'integrations' 
                      ? 'bg-primary text-white' 
                      : 'hover:bg-background-secondary'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  Integrações e API
                </button>
              </li>
            </ul>
          </nav>
        </div>
        
        {/* Conteúdo principal */}
        <div className="col-span-1 md:col-span-3 bg-card rounded-lg shadow-sm p-6">
          {renderTab()}
        </div>
      </div>
    </div>
  )
} 