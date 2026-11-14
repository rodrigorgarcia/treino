// Relatório de todas as séries de força somadas por semana ou por mês, de todos os grupos.
// Carga: a de cada série, somada; kg/lado conta em dobro (os dois lados), +kg como anotado,
// peso corporal sem carga. Repetições como anotadas. Cardio fica de fora.

import { diaLocal } from './formato'
import type { TipoExercicio } from './tipos'

export type Periodo = 'semana' | 'mes'

// Uma execução de exercício (v_execucoes), só com o que o relatório usa.
export interface ExecucaoRelatorio {
  sessao_id: string
  exercicio_id: string
  sessao_iniciada_em: string
  reps: (number | null)[]
  cargas_kg: (number | null)[]
}

export interface Total {
  chave: string // "2026-11-10" (segunda-feira da semana) ou "2026-11"
  curto: string // eixo do gráfico: "10/11" ou "nov/26"
  rotulo: string // lista: "10/11 a 16/11" ou "Novembro de 2026"
  reps: number
  carga: number // kg
  series: number
  treinos: number
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// Datas do relatório são dias do calendário ("AAAA-MM-DD"), tratados ao meio-dia UTC para as
// contas de dia não escorregarem.
const dia = (texto: string) => new Date(`${texto}T12:00:00Z`)
const texto = (d: Date) => d.toISOString().slice(0, 10)
const ddmm = (d: Date) => `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`

function chaveDoDia(d: string, periodo: Periodo): string {
  if (periodo === 'mes') return d.slice(0, 7)
  const data = dia(d)
  data.setUTCDate(data.getUTCDate() - ((data.getUTCDay() + 6) % 7)) // volta até a segunda-feira
  return texto(data)
}

function proxima(chave: string, periodo: Periodo): string {
  if (periodo === 'semana') {
    const data = dia(chave)
    data.setUTCDate(data.getUTCDate() + 7)
    return texto(data)
  }
  const [a, m] = chave.split('-').map(Number)
  return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, '0')}`
}

function rotulos(chave: string, periodo: Periodo): Pick<Total, 'curto' | 'rotulo'> {
  if (periodo === 'semana') {
    const inicio = dia(chave)
    const fim = dia(chave)
    fim.setUTCDate(fim.getUTCDate() + 6)
    return { curto: ddmm(inicio), rotulo: `${ddmm(inicio)} a ${ddmm(fim)}` }
  }
  const [a, m] = chave.split('-').map(Number)
  const longo = new Date(Date.UTC(a, m - 1, 15)).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  return { curto: `${MESES[m - 1]}/${String(a).slice(2)}`, rotulo: longo.charAt(0).toUpperCase() + longo.slice(1) }
}

// Carga que a série soma no relatório.
function cargaDaSerie(kg: number | null, tipo: TipoExercicio): number {
  if (kg === null || tipo === 'peso_corporal') return 0
  return tipo === 'carga_por_lado' ? kg * 2 : kg
}

// Totais em ordem cronológica, da primeira semana (ou mês) com treino até a atual, incluindo
// as vazias no meio, para o gráfico mostrar o tempo de verdade.
export function totaisPorPeriodo(
  execs: ExecucaoRelatorio[],
  tipos: Map<string, TipoExercicio>,
  periodo: Periodo,
  hoje = new Date(),
): Total[] {
  const porChave = new Map<string, { reps: number; carga: number; series: number; sessoes: Set<string> }>()
  for (const x of execs) {
    const tipo = tipos.get(x.exercicio_id)
    if (!tipo || tipo === 'cardio') continue
    const chave = chaveDoDia(diaLocal(new Date(x.sessao_iniciada_em)), periodo)
    const t = porChave.get(chave) ?? { reps: 0, carga: 0, series: 0, sessoes: new Set<string>() }
    x.reps.forEach((r, i) => {
      if (r === null) return
      t.reps += r
      t.carga += cargaDaSerie(x.cargas_kg[i] ?? null, tipo)
      t.series += 1
    })
    t.sessoes.add(x.sessao_id)
    porChave.set(chave, t)
  }
  if (porChave.size === 0) return []

  const atual = chaveDoDia(diaLocal(hoje), periodo)
  const chaves = [...porChave.keys()].sort()
  const totais: Total[] = []
  for (let c = chaves[0]; c <= atual || c <= chaves[chaves.length - 1]; c = proxima(c, periodo)) {
    const t = porChave.get(c)
    totais.push({
      chave: c,
      ...rotulos(c, periodo),
      reps: t?.reps ?? 0,
      carga: Math.round(t?.carga ?? 0),
      series: t?.series ?? 0,
      treinos: t?.sessoes.size ?? 0,
    })
  }
  return totais
}
