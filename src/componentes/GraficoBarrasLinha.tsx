import { useEffect, useRef, useState } from 'react'
import { passoBonito, type Ponto, type Serie } from '../lib/grafico'

interface Props {
  pontos: Ponto[] // em ordem cronológica, uma coluna por sessão
  barras: Serie // eixo da esquerda (ex.: repetições)
  linha: Serie // eixo da direita (ex.: carga)
  rotuloBarras: string // unidade no topo do eixo: "reps"
  rotuloLinha: string // "kg"
}

const ALTURA = 220
const M = { topo: 22, direita: 34, base: 22, esquerda: 38 }
const COR_BARRA = 'var(--color-grafico)'
const COR_LINHA = 'var(--color-grafico-2)'
const SUPERFICIE = 'var(--color-cartao)'
const OPACIDADE_BARRA = 0.35 // colunas suaves, translúcidas; a da sessão tocada fica mais forte
const PASSOS_LINHA = [1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200]

// Coluna com o topo arredondado (4px) e a base reta no zero.
function coluna(x0: number, x1: number, yTopo: number, yBase: number): string {
  const r = Math.min(4, (x1 - x0) / 2, yBase - yTopo)
  return `M${x0},${yBase} L${x0},${yTopo + r} Q${x0},${yTopo} ${x0 + r},${yTopo} L${x1 - r},${yTopo} Q${x1},${yTopo} ${x1},${yTopo + r} L${x1},${yBase} Z`
}

// Colunas de uma medida e linha de outra, cada uma com o seu eixo (esquerda e direita).
// Os dois eixos começam no zero e dividem as mesmas linhas de grade, para as alturas
// serem comparáveis; a legenda diz qual eixo é de quem.
export function GraficoBarrasLinha({ pontos, barras, linha, rotuloBarras, rotuloLinha }: Props) {
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

  const n = pontos.length
  const larguraUtil = largura - M.esquerda - M.direita
  const alturaUtil = ALTURA - M.topo - M.base
  const faixa = larguraUtil / n
  const larguraBarra = Math.max(2, Math.min(28, faixa - 2)) // 2px de respiro entre colunas
  const cx = (i: number) => M.esquerda + faixa * (i + 0.5)

  // Escala da esquerda a partir do zero; a da direita usa o mesmo número de divisões.
  const maxBarra = Math.max(...barras.valores.map((v) => v ?? 0), 1)
  const passoBarra = passoBonito(maxBarra, barras.passos)
  const divisoes = Math.max(1, Math.ceil(maxBarra / passoBarra))
  const topoBarra = passoBarra * divisoes
  const maxLinha = Math.max(...linha.valores.map((v) => v ?? 0), 1)
  const passoLinha = PASSOS_LINHA.find((p) => p * divisoes >= maxLinha) ?? Math.ceil(maxLinha / divisoes)
  const topoLinha = passoLinha * divisoes
  const yBarra = (v: number) => M.topo + (1 - v / topoBarra) * alturaUtil
  const yLinha = (v: number) => M.topo + (1 - v / topoLinha) * alturaUtil
  const base = M.topo + alturaUtil
  const grade = Array.from({ length: divisoes + 1 }, (_, k) => k)

  const comLinha = pontos.flatMap((_, i) => (linha.valores[i] === null ? [] : [{ i, v: linha.valores[i]! }]))
  const caminho = comLinha.map((c, k) => `${k ? 'L' : 'M'}${cx(c.i).toFixed(1)},${yLinha(c.v).toFixed(1)}`).join(' ')

  const primeiro = (s: Serie) => s.valores.find((v) => v !== null)
  const ultimo = (s: Serie) => [...s.valores].reverse().find((v) => v !== null)
  const resumo = (s: Serie) => {
    const a = primeiro(s)
    const b = ultimo(s)
    return a == null || b == null ? s.titulo : `${s.titulo}: de ${s.formatar(a)} a ${s.formatar(b)}`
  }
  const descricao = `${resumo(linha)}; ${resumo(barras)}; de ${pontos[0].data} a ${pontos[n - 1].data}`

  function apontar(clientX: number) {
    const el = caixa.current
    if (!el) return
    const px = clientX - el.getBoundingClientRect().left
    setAtivo(Math.min(n - 1, Math.max(0, Math.floor((px - M.esquerda) / faixa))))
  }

  const p = ativo === null ? null : pontos[ativo]
  const valores =
    ativo === null
      ? []
      : [linha, barras].flatMap((s) => {
          const v = s.valores[ativo]
          return v === null ? [] : [s.formatar(v)]
        })
  const tooltipX = ativo === null ? 0 : Math.min(Math.max(cx(ativo), 80), largura - 80)

  return (
    <div>
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
          {/* faixa da sessão tocada */}
          {ativo !== null && (
            <rect x={cx(ativo) - faixa / 2} y={M.topo - 6} width={faixa} height={alturaUtil + 6} fill="var(--color-cartao-2)" />
          )}

          {grade.map((k) => {
            const y = M.topo + (1 - k / divisoes) * alturaUtil
            return (
              <g key={k}>
                <line x1={M.esquerda} x2={largura - M.direita} y1={y} y2={y} stroke="var(--color-borda)" strokeWidth={1} />
                <text x={M.esquerda - 6} y={y} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--color-fraco)">
                  {barras.formatarEixo(passoBarra * k)}
                </text>
                <text x={largura - M.direita + 6} y={y} dy="0.32em" fontSize={11} fill="var(--color-fraco)">
                  {linha.formatarEixo(passoLinha * k)}
                </text>
              </g>
            )
          })}
          <text x={M.esquerda - 6} y={10} textAnchor="end" fontSize={11} fill="var(--color-suave)">
            {rotuloBarras}
          </text>
          <text x={largura - M.direita + 6} y={10} fontSize={11} fill="var(--color-suave)">
            {rotuloLinha}
          </text>

          {pontos.map((_, i) => {
            const v = barras.valores[i]
            if (v === null || v <= 0) return null
            const x0 = cx(i) - larguraBarra / 2
            return (
              <path
                key={i}
                d={coluna(x0, x0 + larguraBarra, yBarra(v), base)}
                fill={COR_BARRA}
                fillOpacity={ativo === i ? 0.75 : OPACIDADE_BARRA}
              />
            )
          })}

          <path d={caminho} fill="none" stroke={COR_LINHA} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {comLinha.map((c) => (
            <circle key={c.i} cx={cx(c.i)} cy={yLinha(c.v)} r={ativo === c.i ? 6 : 4} fill={COR_LINHA} stroke={SUPERFICIE} strokeWidth={2} />
          ))}

          <text x={cx(0)} y={ALTURA - 4} textAnchor={n > 1 ? 'start' : 'middle'} fontSize={11} fill="var(--color-fraco)" dx={n > 1 ? -larguraBarra / 2 : 0}>
            {pontos[0].data}
          </text>
          {n > 1 && (
            <text x={cx(n - 1) + larguraBarra / 2} y={ALTURA - 4} textAnchor="end" fontSize={11} fill="var(--color-fraco)">
              {pontos[n - 1].data}
            </text>
          )}
        </svg>

        {p && (
          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-borda bg-cartao-2 px-2.5 py-1.5 text-xs shadow-lg"
            style={{ left: tooltipX }}
            data-testid="tooltip"
          >
            <div className="text-sm font-semibold whitespace-nowrap text-texto tabular-nums">{valores.join(' · ')}</div>
            <div className="whitespace-nowrap text-suave">
              {p.data} · {p.detalhe}
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-suave" data-testid="legenda">
        <span className="flex items-center gap-1.5">
          <svg width="18" height="10" aria-hidden>
            <line x1="1" x2="17" y1="5" y2="5" stroke={COR_LINHA} strokeWidth="2" strokeLinecap="round" />
            <circle cx="9" cy="5" r="3.5" fill={COR_LINHA} stroke={SUPERFICIE} strokeWidth="1.5" />
          </svg>
          {linha.titulo} · eixo da direita
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="10" height="12" aria-hidden>
            <path d={coluna(0, 10, 0, 12)} fill={COR_BARRA} fillOpacity={OPACIDADE_BARRA} />
          </svg>
          {barras.titulo} · eixo da esquerda
        </span>
      </div>
    </div>
  )
}
