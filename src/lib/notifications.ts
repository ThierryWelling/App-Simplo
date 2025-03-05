import { supabase } from './supabase'

interface Lead {
  id: string
  created_at: string
  landing_page_id: string
  data: Record<string, any>
  landing_page?: {
    title: string
    slug: string
  }
}

interface AppConfig {
  notify_on_lead: boolean
  admin_email: string
  whatsapp_number: string | null
  whatsapp_message: string | null
}

export async function notifyNewLead(lead: Lead) {
  try {
    // Buscar configurações
    const { data: config } = await supabase
      .from('app_config')
      .select('*')
      .eq('is_active', true)
      .single()
      
    if (!config || !config.notify_on_lead) return
    
    // Enviar email de notificação
    if (config.admin_email) {
      await sendEmailNotification(lead, config.admin_email)
    }
    
    // Enviar notificação WhatsApp (se configurado)
    if (config.whatsapp_number && config.whatsapp_message) {
      await sendWhatsAppNotification(lead, config.whatsapp_number, config.whatsapp_message)
    }
  } catch (error) {
    console.error('Erro ao enviar notificações:', error)
  }
}

async function sendEmailNotification(lead: Lead, adminEmail: string) {
  try {
    const response = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: adminEmail,
        subject: 'Novo Lead Capturado!',
        lead: lead,
      }),
    })
    
    if (!response.ok) {
      throw new Error('Falha ao enviar email')
    }
  } catch (error) {
    console.error('Erro ao enviar email:', error)
  }
}

async function sendWhatsAppNotification(lead: Lead, whatsappNumber: string, message: string) {
  try {
    const response = await fetch('/api/notifications/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: whatsappNumber,
        message: message,
        lead: lead,
      }),
    })
    
    if (!response.ok) {
      throw new Error('Falha ao enviar mensagem WhatsApp')
    }
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error)
  }
} 