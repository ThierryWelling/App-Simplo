import { NextResponse } from 'next/server'
import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY não está configurada nas variáveis de ambiente')
}

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { to, subject, lead } = await request.json()
    
    // Formatar dados do lead
    const leadData = Object.entries(lead.data)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')
    
    const html = `
      <h1>Novo Lead Capturado!</h1>
      <p>Um novo lead foi capturado na landing page "${lead.landing_page?.title || 'N/A'}".</p>
      
      <h2>Dados do Lead:</h2>
      <pre>${leadData}</pre>
      
      <p>Data de captura: ${new Date(lead.created_at).toLocaleString('pt-BR')}</p>
      
      <hr />
      <p>Este é um email automático, não responda.</p>
    `
    
    await resend.emails.send({
      from: 'Simplo Pages <noreply@simplopages.com.br>',
      to: [to],
      subject: subject,
      html: html,
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar email' },
      { status: 500 }
    )
  }
} 