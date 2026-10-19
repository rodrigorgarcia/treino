import { useContext, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { relogio, tempoDesde, type FaixaTempo } from '../lib/formato'
import { SessaoAbertaContext } from '../lib/sessaoAberta'
import { useAgora } from '../lib/useAgora'
import { useVoltar } from '../lib/useVoltar'

// voltarNoHistorico: volta para a tela anterior (ex.: início ou histórico); sem histórico, vai para `voltar`.
// Com uma sessão em andamento, mostra o cronômetro dela (toque leva para a sessão).
export function Cabecalho({
  titulo,
  voltar,
  voltarNoHistorico = false,
  direita,
}: {
  titulo: ReactNode
  voltar?: string
  voltarNoHistorico?: boolean
  direita?: ReactNode
}) {
  const navigate = useNavigate()
  const voltarPara = useVoltar()
  const sessaoDesde = useContext(SessaoAbertaContext)
  return (
    <header className="sticky top-0 z-10 border-b border-borda bg-fundo/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="flex h-14 items-center gap-1 px-4">
        {voltar && (
          <button
            onClick={() => (voltarNoHistorico ? voltarPara(voltar) : navigate(voltar))}
            aria-label="Voltar"
            className="-ml-3 grid h-11 w-11 place-items-center text-3xl leading-none text-suave"
          >
            ‹
          </button>
        )}
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">{titulo}</h1>
        {sessaoDesde && (
          <Link
            to="/sessao"
            aria-label="Tempo de sessão"
            data-testid="cronometro-sessao"
            className="mx-1 flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-acento/40 bg-acento/10 px-3 text-base font-semibold text-acento"
          >
            <IconeCronometro />
            <Cronometro desde={sessaoDesde} />
          </Link>
        )}
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

// Campo de formulário: rótulo em cima e dica embaixo (fora do <label>, para não entrar no nome acessível).
export function Campo({ rotulo, dica, children }: { rotulo: ReactNode; dica?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <label className="block">
        <Rotulo>{rotulo}</Rotulo>
        {children}
      </label>
      {dica && <div className="mt-1.5 text-sm text-fraco">{dica}</div>}
    </div>
  )
}

// Tempo desde o início da sessão, em horas e minutos ("0:42").
export function Cronometro({ desde }: { desde: string }) {
  const agora = useAgora()
  const minutos = Math.max(0, Math.floor((agora - Date.parse(desde)) / 60_000))
  return <span className="tabular-nums">{relogio(minutos)}</span>
}

function IconeCronometro() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <circle cx="12" cy="13.5" r="7.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 13.5V9.5M10 3h4M18.5 6.5l1.5-1.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// Badge com o tempo desde a última vez que o exercício foi feito: "3d" até 7 dias, depois "2s".
// Tons pastel, discretos: verde até 7 dias, âmbar até 4 semanas, azul depois disso.
const COR_FAIXA: Record<FaixaTempo, string> = {
  dias: 'border-pastel-verde/30 bg-pastel-verde/10 text-pastel-verde',
  semanas: 'border-pastel-ambar/30 bg-pastel-ambar/10 text-pastel-ambar',
  longe: 'border-pastel-azul/30 bg-pastel-azul/10 text-pastel-azul',
}

export function TempoDesde({ desde }: { desde: string }) {
  const t = tempoDesde(desde)
  const texto = `${t.longo} desde a última vez`
  return (
    <span
      title={texto}
      aria-label={texto}
      data-testid="desde"
      data-faixa={t.faixa}
      className={`inline-grid h-7 min-w-7 shrink-0 place-items-center rounded-full border px-2 text-sm font-semibold tabular-nums ${COR_FAIXA[t.faixa]}`}
    >
      {t.curto}
    </span>
  )
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
