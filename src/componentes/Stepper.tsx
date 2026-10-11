import { useState } from 'react'
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

  function confirmar() {
    setEditando(false)
    const limpo = texto.trim().replace(',', '.')
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
            onChange={(e) => setTexto(e.target.value)}
            onBlur={confirmar}
            onKeyDown={(e) => e.key === 'Enter' && confirmar()}
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
