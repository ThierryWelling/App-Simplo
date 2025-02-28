import React from 'react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div 
      className="min-h-screen bg-background-secondary flex items-center justify-center p-4"
      style={{
        backgroundImage: `
          radial-gradient(#E2E8F0 1px, transparent 1px),
          linear-gradient(135deg, rgba(124, 58, 255, 0.05) 0%, rgba(76, 201, 240, 0.05) 100%)
        `,
        backgroundSize: '20px 20px, 100% 100%',
        backgroundPosition: '-10px -10px, 0 0',
      }}
    >
      <div className="glass w-full max-w-md rounded-2xl shadow-elevated">
        {children}
      </div>
    </div>
  )
} 