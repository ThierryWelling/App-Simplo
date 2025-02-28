'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

const authSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
})

type AuthFormData = z.infer<typeof authSchema>

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  })

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true)
    setError('')
    
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      
      if (signInError) {
        setError('Email ou senha incorretos')
        return
      }

      window.location.href = '/dashboard'
      
    } catch (error) {
      console.error('Erro:', error)
      setError('Ocorreu um erro inesperado. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card p-8 w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#1A1F2E] mb-2">
          Simplo Pages
        </h1>
        <p className="text-[#1A1F2E] opacity-80">
          Faça login para acessar o painel
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}
        
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-text-primary">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input w-full px-4 py-2 rounded-xl"
            placeholder="seu@email.com"
            {...register('email')}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-error text-sm">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-text-primary">
            Senha
          </label>
          <input
            id="password"
            type="password"
            className="input w-full px-4 py-2 rounded-xl"
            placeholder="••••••••"
            {...register('password')}
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-error text-sm">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          className="btn-action w-full py-2 rounded-xl flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </button>
      </form>
    </div>
  )
} 