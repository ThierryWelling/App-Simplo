import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { ThankYouPageForm } from '../../components/thank-you-page-form'

interface Props {
  params: {
    id: string
  }
}

export default async function EditThankYouPage({ params }: Props) {
  const { data: page } = await supabase
    .from('thank_you_pages')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!page) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Editar Página de Agradecimento</h1>
      <ThankYouPageForm initialData={page} />
    </div>
  )
}
