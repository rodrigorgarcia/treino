import { useEffect, useRef, useState } from 'react'
import { passoBonito, type Ponto, type Serie } from '../lib/grafico'

interface Props {
  pontos: Ponto[] // em ordem cronológica
  serie: Serie
}

const ALTURA = 180
const M = { topo: 22, direita: 14, base: 22, esquerda: 44 }
const COR = 'var(--color-grafico)'
const SUPERFICIE = 'var(--color-cartao)'

// Linha de evolução de uma medida: linha de 2px, pontos de 8px com anel da superfície,
// grade em hairline, valor mais recente rotulado no fim e tooltip com linha-guia.
export function GraficoEvolucao({ pontos, serie }: Props) {
  const caixa = useRef<HTMLDivElement>(null)
  const [largura, setLargura] = useState(340)
  const [ativo, setAtivo] = useState<number | null>(null)

  useEffect(() => {
    const el = caixa.current
    if (!el) return
    const obs = new ResizeObserver(([e]) => setLargura(Math.max(240, Math.round(e.contentRect.width))))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const comValor = pontos.flatMap((pt, i) => (serie.valores[i] === null ? [] : [{ pt, i, v: serie.valores[i]! }]))
  if (comValor.length === 0) return null

  const vs = comValor.map((c) => c.v)
  let min = Math.min(...vs)
  let max = Math.max(...vs)
  if (min === max) {
    min -= 1
    max += 1
  }
  const passo = passoBonito(max - min, serie.passos)
  const y0 = Math.floor(min / passo) * passo
  const y1 = Math.ceil(max / passo) * passo
  const ticks: number[] = []
  for (let v = y0; v <= y1 + passo / 2; v += passo) ticks.push(Math.round(v * 1000) / 1000)

  const t0 = pontos[0].t
  const t1 = pontos[pontos.length - 1].t
  const larguraUtil = largura - M.esquerda - M.direita
  const alturaUtil = ALTURA - M.topo - M.base
  const x = (t: number) => M.esquerda + (t1 === t0 ? larguraUtil / 2 : ((t - t0) / (t1 - t0)) * larguraUtil)
  const y = (v: number) => M.topo + (1 - (v - y0) / (y1 - y0)) * alturaUtil

  const caminho = comValor.map((c, k) => `${k ? 'L' : 'M'}${x(c.pt.t).toFixed(1)},${y(c.v).toFixed(1)}`).join(' ')
  const fim = comValor[comValor.length - 1]
  const descricao = `${serie.titulo}: de ${serie.formatar(comValor[0].v)} em ${comValor[0].pt.data} a ${serie.formatar(fim.v)} em ${fim.pt.data}`

  // A linha-guia acha o ponto mais próximo na horizontal.
  function apontar(clientX: number) {
    const el = caixa.current
    if (!el) return
    const px = clientX - el.getBoundingClientRect().left
    let melhor = comValor[0]
    for (const c of comValor) if (Math.abs(x(c.pt.t) - px) < Math.abs(x(melhor.pt.t) - px)) melhor = c
    setAtivo(melhor.i)
  }

  const a = ativo === null ? null : comValor.find((c) => c.i === ativo) ?? null
  const tooltipX = a ? Math.min(Math.max(x(a.pt.t), 70), largura - 70) : 0

  return (
    <div ref={caixa} className="relative select-none" style={{ touchAction: 'pan-y' }}>
      <svg
        width={largura}
        height={ALTURA}
        role="img"
        aria-label={descricao}
        onPointerMove={(e) => apontar(e.clientX)}
        onPointerDown={(e) => apontar(e.clientX)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setAtivo(null)}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line x1={M.esquerda} x2={largura - M.direita} y1={y(v)} y2={y(v)} stroke="var(--color-borda)" strokeWidth={1} />
            <text x={M.esquerda - 8} y={y(v)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--color-fraco)">
              {serie.formatarEixo(v)}
            </text>
          </g>
        ))}
        <text x={M.esquerda} y={ALTURA - 4} fontSize={11} fill="var(--color-fraco)">
          {pontos[0].data}
        </text>
        {pontos.length > 1 && (
          <text x={largura - M.direita} y={ALTURA - 4} textAnchor="end" fontSize={11} fill="var(--color-fraco)">
            {pontos[pontos.length - 1].data}
          </text>
        )}

        {a && <line x1={x(a.pt.t)} x2={x(a.pt.t)} y1={M.topo - 6} y2={ALTURA - M.base} stroke="var(--color-suave)" strokeWidth={1} />}

        <path d={caminho} fill="none" stroke={COR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {comValor.map((c) => (
          <circle key={c.i} cx={x(c.pt.t)} cy={y(c.v)} r={ativo === c.i ? 6 : 4} fill={COR} stroke={SUPERFICIE} strokeWidth={2} />
        ))}

        {/* valor mais recente, no fim da linha */}
        {!a && (
          <text
            x={Math.min(x(fim.pt.t), largura - M.direita)}
            y={y(fim.v) - 10}
            textAnchor="end"
            fontSize={12}
            fontWeight={600}
            fill="var(--color-texto)"
            stroke={SUPERFICIE}
            strokeWidth={4}
            paintOrder="stroke"
          >
            {serie.formatar(fim.v)}
          </text>
        )}
      </svg>

      {a && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-borda bg-cartao-2 px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: tooltipX }}
          data-testid="tooltip"
        >
          <div className="text-sm font-semibold text-texto tabular-nums">{serie.formatar(a.v)}</div>
          <div className="whitespace-nowrap text-suave">
            {a.pt.data} · {a.pt.detalhe}
          </div>
        </div>
      )}
    </div>
  )
}
