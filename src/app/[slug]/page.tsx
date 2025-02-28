import { LandingPageClient } from './landing-page-client'

interface Props {
  params: {
    slug: string
  }
}

export default function Page({ params }: Props) {
  return <LandingPageClient slug={params.slug} />
} 