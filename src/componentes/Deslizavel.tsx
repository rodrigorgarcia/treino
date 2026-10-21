import { useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react'

const LARGURA = 96 // px do botão que aparece atrás da linha

interface Props {
  aberto: boolean
  onAberto: (aberto: boolean) => void
  acao: ReactNode // texto do botão revelado
  rotuloAcao: string // nome acessível do botão
  onAcao: () => void
  children: ReactNode
}

// Linha que desliza para a esquerda e revela um botão de ação (ex.: "Tirar"). Só o arrasto
// horizontal conta: a rolagem vertical continua com o navegador (touch-action: pan-y). O clique
// que vem de um arrasto não abre o link da linha; com a linha aberta, tocar nela só fecha.
export function Deslizavel({ aberto, onAberto, acao, rotuloAcao, onAcao, children }: Props) {
  const [arrasto, setArrasto] = useState<number | null>(null) // deslocamento enquanto arrasta
  const gesto = useRef<{ id: number; x: number; y: number; horizontal: boolean | null; atual: number } | null>(null)
  const arrastou = useRef(false) // o gesto atual foi um arrasto (o clique dele não vale)
  const base = aberto ? -LARGURA : 0

  function iniciar(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    gesto.current = { id: e.pointerId, x: e.clientX, y: e.clientY, horizontal: null, atual: base }
    arrastou.current = false
  }

  function mover(e: PointerEvent<HTMLDivElement>) {
    const g = gesto.current
    if (!g || g.id !== e.pointerId) return
    const dx = e.clientX - g.x
    const dy = e.clientY - g.y
    if (g.horizontal === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      g.horizontal = Math.abs(dx) > Math.abs(dy)
      if (!g.horizontal) {
        gesto.current = null
        return
      }
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    g.atual = Math.min(0, Math.max(-LARGURA * 1.4, base + dx))
    setArrasto(g.atual)
  }

  function soltar(cancelado: boolean) {
    const g = gesto.current
    gesto.current = null
    if (!g?.horizontal) return
    arrastou.current = true
    setArrasto(null)
    onAberto(cancelado ? aberto : g.atual < -LARGURA / 2)
  }

  function clique(e: MouseEvent) {
    if (!arrastou.current && !aberto) return
    e.preventDefault()
    e.stopPropagation()
    if (!arrastou.current) onAberto(false)
  }

  return (
    <div className="relative overflow-hidden">
      <button
        type="button"
        onClick={onAcao}
        tabIndex={aberto ? 0 : -1}
        aria-hidden={!aberto}
        aria-label={rotuloAcao}
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-perigo font-semibold text-acento-escuro"
        style={{ width: LARGURA }}
      >
        {acao}
      </button>
      <div
        onPointerDown={iniciar}
        onPointerMove={mover}
        onPointerUp={() => soltar(false)}
        onPointerCancel={() => soltar(true)}
        onClickCapture={clique}
        onDragStart={(e) => e.preventDefault()}
        className={`relative touch-pan-y bg-cartao ${arrasto === null ? 'transition-transform duration-200' : ''}`}
        style={{ transform: `translateX(${arrasto ?? base}px)` }}
      >
        {children}
      </div>
    </div>
  )
}
