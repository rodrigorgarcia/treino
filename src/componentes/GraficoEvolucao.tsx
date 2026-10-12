import { useEffect, useRef, useState } from 'react'

export interface Ponto {
  t: number // data, em ms
  data: string // "04/10"
  detalhe: string // ex.: "12+10+8 · 57 kg"
}

// Uma medida ao longo dos pontos. Com mais de uma, cada uma ganha o seu painel, empilhados
// e alinhados pela data (nunca dois eixos no mesmo gráfico).
export interface Serie {
  titulo: string
  valores: (number | null)[] // um por ponto; null = sem valor nessa sessão
  formatar: (v: number) => string // tooltip e rótulo final: "57 kg"
  formatarEixo: (v: number) => string
  passos?: number[] // passos permitidos no eixo (ex.: tempo em 15 s, 30 s, 1 min…)
}

interface Props {
  pontos: Ponto[] // em ordem cronológica
  series: Serie[]
}

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

// Linha de evolução: linha de 2px, pontos de 8px com anel da superfície, grade em hairline,
// valor mais recente rotulado no fim e tooltip com linha-guia, compartilhada entre os painéis.
export function GraficoEvolucao({ pontos, series }: Props) {
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

  const varios = series.length > 1
  const altura = varios ? 150 : 180
  const t0 = pontos[0].t
  const t1 = pontos[pontos.length - 1].t
  const larguraUtil = largura - M.esquerda - M.direita
  const x = (t: number) => M.esquerda + (t1 === t0 ? larguraUtil / 2 : ((t - t0) / (t1 - t0)) * larguraUtil)

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
  const tooltipX = p ? Math.min(Math.max(x(p.t), 80), largura - 80) : 0
  const valoresAtivos =
    ativo === null
      ? []
      : series.flatMap((s) => {
          const v = s.valores[ativo]
          return v === null ? [] : [s.formatar(v)]
        })

  return (
    <div
      ref={caixa}
      className="relative select-none"
      style={{ touchAction: 'pan-y' }}
      onPointerMove={(e) => apontar(e.clientX)}
      onPointerDown={(e) => apontar(e.clientX)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setAtivo(null)}
    >
      {series.map((s, n) => (
        <Painel
          key={s.titulo}
          serie={s}
          pontos={pontos}
          largura={largura}
          altura={altura}
          x={x}
          ativo={ativo}
          mostrarTitulo={varios}
          ultimo={n === series.length - 1}
        />
      ))}

      {p && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-borda bg-cartao-2 px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: tooltipX }}
          data-testid="tooltip"
        >
          <div className="text-sm font-semibold whitespace-nowrap text-texto tabular-nums">{valoresAtivos.join(' · ')}</div>
          <div className="whitespace-nowrap text-suave">
            {p.data} · {p.detalhe}
          </div>
        </div>
      )}
    </div>
  )
}

function Painel({
  serie, pontos, largura, altura, x, ativo, mostrarTitulo, ultimo,
}: {
  serie: Serie
  pontos: Ponto[]
  largura: number
  altura: number
  x: (t: number) => number
  ativo: number | null
  mostrarTitulo: boolean
  ultimo: boolean // só o painel de baixo mostra as datas
}) {
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

  // Só o painel de baixo leva as datas; os de cima são mais baixos, sem essa faixa.
  const base = ultimo ? M.base : 8
  const alturaSvg = ultimo ? altura : altura - (M.base - 8)
  const alturaUtil = alturaSvg - M.topo - base
  const y = (v: number) => M.topo + (1 - (v - y0) / (y1 - y0)) * alturaUtil
  const caminho = comValor.map((c, k) => `${k ? 'L' : 'M'}${x(c.pt.t).toFixed(1)},${y(c.v).toFixed(1)}`).join(' ')
  const fim = comValor[comValor.length - 1]
  const p = ativo === null ? null : pontos[ativo]
  const descricao = `${serie.titulo}: de ${serie.formatar(comValor[0].v)} em ${comValor[0].pt.data} a ${serie.formatar(fim.v)} em ${fim.pt.data}`

  return (
    <div className={mostrarTitulo && !ultimo ? 'mb-2' : ''}>
      {mostrarTitulo && <div className="mb-1 text-sm text-suave">{serie.titulo}</div>}
      <svg width={largura} height={alturaSvg} role="img" aria-label={descricao} className="block">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={M.esquerda} x2={largura - M.direita} y1={y(v)} y2={y(v)} stroke="var(--color-borda)" strokeWidth={1} />
            <text x={M.esquerda - 8} y={y(v)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--color-fraco)">
              {serie.formatarEixo(v)}
            </text>
          </g>
        ))}
        {ultimo && (
          <>
            <text x={M.esquerda} y={alturaSvg - 4} fontSize={11} fill="var(--color-fraco)">
              {pontos[0].data}
            </text>
            {pontos.length > 1 && (
              <text x={largura - M.direita} y={alturaSvg - 4} textAnchor="end" fontSize={11} fill="var(--color-fraco)">
                {pontos[pontos.length - 1].data}
              </text>
            )}
          </>
        )}

        {p && <line x1={x(p.t)} x2={x(p.t)} y1={M.topo - 6} y2={alturaSvg - base} stroke="var(--color-suave)" strokeWidth={1} />}

        <path d={caminho} fill="none" stroke={COR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {comValor.map((c) => (
          <circle key={c.i} cx={x(c.pt.t)} cy={y(c.v)} r={ativo === c.i ? 6 : 4} fill={COR} stroke={SUPERFICIE} strokeWidth={2} />
        ))}

        {/* valor mais recente, no fim da linha */}
        {!p && (
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
    </div>
  )
}
