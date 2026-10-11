import { useEffect, useRef, useState } from 'react'

export interface Ponto {
  t: number // data, em ms
  v: number // valor no eixo y
  valor: string // valor formatado, para o tooltip e o rótulo final
  data: string // "04/10"
  detalhe: string // ex.: "12+10+8 · 57 kg"
}

interface Props {
  pontos: Ponto[] // em ordem cronológica
  formatarEixo: (v: number) => string
  descricao: string // texto para leitores de tela
  passos?: number[] // passos permitidos no eixo (ex.: tempo em 15 s, 30 s, 1 min…)
}

const ALTURA = 180
const M = { topo: 22, direita: 14, base: 22, esquerda: 44 }
const COR = 'var(--color-grafico)'
const SUPERFICIE = 'var(--color-cartao)'

// Passo "redondo" (1, 2, 2,5, 5 × 10^n, ou um dos `permitidos`) para ~3 divisões do eixo.
function passoBonito(amplitude: number, permitidos?: number[]): number {
  const bruto = amplitude / 3
  if (permitidos?.length) return permitidos.find((p) => p >= bruto) ?? permitidos[permitidos.length - 1]
  const potencia = 10 ** Math.floor(Math.log10(bruto))
  const fator = [1, 2, 2.5, 5, 10].find((f) => f * potencia >= bruto) ?? 10
  return fator * potencia
}

// Linha de evolução de uma série: linha de 2px, pontos de 8px com anel da superfície,
// grade em hairline, valor mais recente rotulado no fim e tooltip com linha-guia.
export function GraficoEvolucao({ pontos, formatarEixo, descricao, passos }: Props) {
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

  const vs = pontos.map((p) => p.v)
  let min = Math.min(...vs)
  let max = Math.max(...vs)
  if (min === max) {
    min -= 1
    max += 1
  }
  const passo = passoBonito(max - min, passos)
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

  const caminho = pontos.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')
  const ultimo = pontos[pontos.length - 1]

  // A linha-guia acha o ponto mais próximo na horizontal.
  function apontar(clientX: number) {
    const el = caixa.current
    if (!el) return
    const px = clientX - el.getBoundingClientRect().left
    let melhor = 0
    pontos.forEach((p, i) => {
      if (Math.abs(x(p.t) - px) < Math.abs(x(pontos[melhor].t) - px)) melhor = i
    })
    setAtivo(melhor)
  }

  const p = ativo === null ? null : pontos[ativo]
  const tooltipX = p ? Math.min(Math.max(x(p.t), 70), largura - 70) : 0

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
              {formatarEixo(v)}
            </text>
          </g>
        ))}
        <text x={M.esquerda} y={ALTURA - 4} fontSize={11} fill="var(--color-fraco)">
          {pontos[0].data}
        </text>
        {pontos.length > 1 && (
          <text x={largura - M.direita} y={ALTURA - 4} textAnchor="end" fontSize={11} fill="var(--color-fraco)">
            {ultimo.data}
          </text>
        )}

        {p && <line x1={x(p.t)} x2={x(p.t)} y1={M.topo - 6} y2={ALTURA - M.base} stroke="var(--color-suave)" strokeWidth={1} />}

        <path d={caminho} fill="none" stroke={COR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {pontos.map((pt, i) => (
          <circle
            key={i}
            cx={x(pt.t)}
            cy={y(pt.v)}
            r={ativo === i ? 6 : 4}
            fill={COR}
            stroke={SUPERFICIE}
            strokeWidth={2}
          />
        ))}

        {/* valor mais recente, no fim da linha */}
        {!p && (
          <text
            x={Math.min(x(ultimo.t), largura - M.direita)}
            y={y(ultimo.v) - 10}
            textAnchor="end"
            fontSize={12}
            fontWeight={600}
            fill="var(--color-texto)"
            stroke={SUPERFICIE}
            strokeWidth={4}
            paintOrder="stroke"
          >
            {ultimo.valor}
          </text>
        )}
      </svg>

      {p && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-borda bg-cartao-2 px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: tooltipX }}
        >
          <div className="text-sm font-semibold text-texto tabular-nums">{p.valor}</div>
          <div className="whitespace-nowrap text-suave">
            {p.data} · {p.detalhe}
          </div>
        </div>
      )}
    </div>
  )
}
