import { useRef, useState } from 'react'
import { numero } from '../lib/formato'

interface Props {
  rotulo: string
  valor: number | null
  passo: number
  onChange: (valor: number | null) => void
  prefixo?: string
  sufixo?: string
  dica?: string | null
}

const arredondar = (v: number) => Math.round(v * 100) / 100

// Botões − / + grandes; tocar no número abre o teclado para valores fora do passo.
export function Stepper({ rotulo, valor, passo, onChange, prefixo = '', sufixo = '', dica }: Props) {
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState('')

  // O valor vale a cada tecla, não só quando o campo perde o foco: no iPhone, tocar em
  // "Registrar" ou "Salvar" não tira o foco do campo, e o número digitado se perderia.
  function aplicar(t: string) {
    setTexto(t)
    const limpo = t.trim().replace(',', '.')
    if (limpo === '') return onChange(null)
    const n = Number(limpo)
    if (Number.isFinite(n) && n >= 0) onChange(arredondar(n))
  }

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-medium tracking-wider text-fraco uppercase">{rotulo}</span>
        {dica && <span className="text-xs text-fraco">{dica}</span>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Diminuir ${rotulo.toLowerCase()}`}
          onClick={() => valor !== null && onChange(Math.max(0, arredondar(valor - passo)))}
          className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-cartao-2 text-4xl font-light active:bg-borda"
        >
          −
        </button>
        {editando ? (
          <input
            autoFocus
            inputMode="decimal"
            aria-label={rotulo}
            value={texto}
            onChange={(e) => aplicar(e.target.value)}
            onBlur={() => setEditando(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditando(false)}
            className="h-16 w-full min-w-0 rounded-2xl border border-acento bg-cartao text-center text-4xl font-semibold tabular-nums outline-none"
          />
        ) : (
          <button
            type="button"
            aria-label={`${rotulo}: ${valor === null ? 'vazio' : numero(valor)}. Toque para digitar`}
            onClick={() => {
              setTexto(valor === null ? '' : String(valor).replace('.', ','))
              setEditando(true)
            }}
            className="flex h-16 min-w-0 flex-1 items-baseline justify-center gap-1 rounded-2xl tabular-nums"
          >
            <span className="text-5xl font-semibold">{valor === null ? '—' : `${prefixo}${numero(valor)}`}</span>
            {valor !== null && sufixo && <span className="text-lg text-suave">{sufixo}</span>}
          </button>
        )}
        <button
          type="button"
          aria-label={`Aumentar ${rotulo.toLowerCase()}`}
          onClick={() => onChange(arredondar((valor ?? 0) + passo))}
          className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-cartao-2 text-4xl font-light active:bg-borda"
        >
          +
        </button>
      </div>
    </div>
  )
}

const relogio = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

// Duração em segundos, exibida como 31:49. − / + mudam 1 minuto; tocar no tempo abre
// minutos e segundos separados, com teclado numérico (o do celular não tem ":").
export function StepperTempo({ rotulo, segundos, onChange }: { rotulo: string; segundos: number | null; onChange: (s: number | null) => void }) {
  const [editando, setEditando] = useState(false)
  const [min, setMin] = useState('')
  const [seg, setSeg] = useState('')
  const campoSeg = useRef<HTMLInputElement>(null)

  function abrir() {
    setMin(segundos === null ? '' : String(Math.floor(segundos / 60)))
    setSeg(segundos === null ? '' : String(segundos % 60).padStart(2, '0'))
    setEditando(true)
  }

  // Como no Stepper, o tempo vale a cada tecla (no iPhone, tocar em "Salvar" não tira o foco).
  function aplicar(m: string, s: string) {
    setMin(m)
    setSeg(s)
    if (m === '' && s === '') return onChange(null)
    onChange(Number(m || 0) * 60 + Number(s || 0))
  }

  const campo = 'h-16 min-w-0 rounded-2xl border border-acento bg-cartao text-center text-4xl font-semibold tabular-nums outline-none'

  return (
    <div>
      <div className="mb-1 text-xs font-medium tracking-wider text-fraco uppercase">{rotulo}</div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Diminuir ${rotulo.toLowerCase()}`}
          onClick={() => segundos !== null && onChange(Math.max(0, segundos - 60))}
          className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-cartao-2 text-4xl font-light active:bg-borda"
        >
          −
        </button>
        {editando ? (
          <div
            className="flex min-w-0 flex-1 items-center justify-center gap-1"
            onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node | null) && setEditando(false)}
          >
            <input
              autoFocus
              inputMode="numeric"
              aria-label={`${rotulo}: minutos`}
              value={min}
              onChange={(e) => aplicar(e.target.value.replace(/\D/g, ''), seg)}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => e.key === 'Enter' && campoSeg.current?.focus()}
              className={`${campo} w-0 flex-[3]`}
            />
            <span className="text-4xl font-semibold">:</span>
            <input
              ref={campoSeg}
              inputMode="numeric"
              maxLength={2}
              aria-label={`${rotulo}: segundos`}
              value={seg}
              onChange={(e) => aplicar(min, e.target.value.replace(/\D/g, ''))}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => e.key === 'Enter' && setEditando(false)}
              className={`${campo} w-0 flex-[2]`}
            />
          </div>
        ) : (
          <button
            type="button"
            aria-label={`${rotulo}: ${segundos === null ? 'vazio' : relogio(segundos)}. Toque para digitar`}
            onClick={abrir}
            className="flex h-16 min-w-0 flex-1 items-baseline justify-center gap-1 rounded-2xl tabular-nums"
          >
            <span className="text-5xl font-semibold">{segundos === null ? '—' : relogio(segundos)}</span>
            {segundos !== null && <span className="text-lg text-suave">min</span>}
          </button>
        )}
        <button
          type="button"
          aria-label={`Aumentar ${rotulo.toLowerCase()}`}
          onClick={() => onChange((segundos ?? 0) + 60)}
          className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-cartao-2 text-4xl font-light active:bg-borda"
        >
          +
        </button>
      </div>
    </div>
  )
}
