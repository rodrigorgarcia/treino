import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { formatarDuracao } from '../lib/formato'
import { useAgora } from '../lib/useAgora'

export function Cabecalho({ titulo, voltar, direita }: { titulo: ReactNode; voltar?: string; direita?: ReactNode }) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-10 border-b border-borda bg-fundo/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="flex h-14 items-center gap-1 px-4">
        {voltar && (
          <button
            onClick={() => navigate(voltar)}
            aria-label="Voltar"
            className="-ml-3 grid h-11 w-11 place-items-center text-3xl leading-none text-suave"
          >
            ‹
          </button>
        )}
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">{titulo}</h1>
        {direita}
      </div>
    </header>
  )
}

export function Pagina({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-lg px-4 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">{children}</main>
}

export function BotaoPrimario({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`h-14 w-full rounded-2xl bg-acento text-lg font-semibold text-acento-escuro active:opacity-80 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function BotaoSecundario({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`h-12 rounded-xl border border-borda bg-cartao px-4 font-medium text-texto active:bg-cartao-2 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function Carregando() {
  return <div className="grid min-h-[50vh] place-items-center text-fraco">Carregando…</div>
}

export function Erro({ children }: { children: ReactNode }) {
  if (!children) return null
  return <div className="mb-4 rounded-xl border border-perigo/40 bg-perigo/10 px-4 py-3 text-sm text-perigo">{children}</div>
}

export function Rotulo({ children }: { children: ReactNode }) {
  return <div className="mb-2 text-xs font-medium tracking-wider text-fraco uppercase">{children}</div>
}

// Tempo desde o início da sessão.
export function Cronometro({ desde }: { desde: string }) {
  const agora = useAgora()
  const minutos = Math.max(0, Math.floor((agora - Date.parse(desde)) / 60_000))
  return <span className="tabular-nums">{formatarDuracao(minutos)}</span>
}

// pequeno: chip de segundo nível (ex.: subgrupos abaixo das regiões), com destaque mais leve.
export function Chip({ ativo, pequeno = false, children, ...props }: { ativo: boolean; pequeno?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const tamanho = pequeno ? 'h-10 px-3' : 'h-11 px-4 font-medium'
  const cor = ativo
    ? pequeno
      ? 'border-acento bg-acento/15 text-acento'
      : 'border-acento bg-acento text-acento-escuro'
    : 'border-borda bg-cartao text-suave active:bg-cartao-2'
  return (
    <button {...props} aria-pressed={ativo} className={`rounded-full border text-sm whitespace-nowrap ${tamanho} ${cor}`}>
      {children}
    </button>
  )
}
