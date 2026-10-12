import { useState, type FormEvent } from 'react'
import { BotaoPrimario, Erro } from '../componentes/ui'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    setEnviando(false)
    if (error) setErro(error.message.includes('Invalid login') ? 'E-mail ou senha incorretos.' : error.message)
  }

  const campo = 'h-14 w-full rounded-2xl border border-borda bg-cartao px-4 text-lg outline-none focus:border-acento'

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 pt-[env(safe-area-inset-top)]">
      <h1 className="mb-1 text-3xl font-bold">Treino</h1>
      <p className="mb-8 text-suave">Entre uma vez; o app lembra de você.</p>
      <form onSubmit={entrar} className="space-y-3">
        <Erro>{erro}</Erro>
        <input
          type="email"
          autoComplete="email"
          placeholder="E-mail"
          aria-label="E-mail"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={campo}
        />
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Senha"
          aria-label="Senha"
          required
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className={campo}
        />
        <BotaoPrimario type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </BotaoPrimario>
      </form>
    </main>
  )
}
