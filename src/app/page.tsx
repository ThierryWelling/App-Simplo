import React from 'react'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8 text-[#1A1F2E]">
          Simplo Landing Pages
        </h1>
        <p className="text-center text-[#1A1F2E] mb-8">
          Plataforma de criação e gerenciamento de landing pages para transmissões ao vivo.
        </p>
      </div>

      <div className="w-full max-w-md">
        <Link
          href="/auth/login"
          className="w-full group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30 block text-center"
        >
          <h2 className="mb-3 text-2xl font-semibold text-[#1A1F2E]">
            Acessar Painel{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] mx-auto text-sm text-[#1A1F2E] opacity-80">
            Entre para gerenciar suas landing pages.
          </p>
        </Link>
      </div>
    </main>
  )
} 