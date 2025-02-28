/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'itnaikhgtszxlxpdfmzd.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Configurar headers de segurança
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          }
        ],
      },
    ]
  },
  // Configurações para scripts
  webpack: (config) => {
    config.ignoreWarnings = [
      { message: /Failed to parse source map/ },
      { message: /Module not found/ },
    ]
    return config
  },
}

module.exports = nextConfig