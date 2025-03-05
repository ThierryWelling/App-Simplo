import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { to, message, lead } = await request.json()
    
    // Formatar dados do lead
    const leadData = Object.entries(lead.data)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')
    
    // Formatar mensagem do WhatsApp
    const whatsappMessage = `
${message}

*Dados do Lead:*
${leadData}

Landing Page: ${lead.landing_page?.title || 'N/A'}
Data: ${new Date(lead.created_at).toLocaleString('pt-BR')}
    `.trim()
    
    // Enviar mensagem via WhatsApp usando a API do WhatsApp Business
    // Você precisará implementar a integração com a API do WhatsApp Business aqui
    // Por enquanto, vamos apenas simular o envio
    console.log('Enviando WhatsApp para:', to)
    console.log('Mensagem:', whatsappMessage)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar WhatsApp' },
      { status: 500 }
    )
  }
} 