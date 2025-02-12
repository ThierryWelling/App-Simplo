/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['uuhogkbgslodehkrxaoq.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uuhogkbgslodehkrxaoq.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig 