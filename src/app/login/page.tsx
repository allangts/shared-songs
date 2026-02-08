'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaMusic, FaEnvelope, FaLock, FaSpinner } from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Preencha todos os campos')
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      toast.success('Login realizado com sucesso!')
      router.push('/')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/20 to-zinc-950 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <FaMusic className="text-black text-xl" />
          </div>
          <h1 className="text-2xl font-bold">Entrar no Private Songs</h1>
          <p className="text-zinc-400 text-sm mt-2">
            Acesse sua conta e continue ouvindo
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-zinc-800/50 shadow-2xl"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-zinc-400 text-sm">
              Não tem uma conta?{' '}
              <Link
                href="/register"
                className="text-emerald-500 hover:text-emerald-400 font-semibold transition-colors"
              >
                Registre-se grátis
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
