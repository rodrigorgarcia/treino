// Texto exibido no app, no mesmo jeito de escrever do log: "12+10+8 · 57 kg", "+60 kg", "10/perna".

import type { DetalheExercicio, Dificuldade, Regiao, TipoExercicio } from './tipos'

const FUSO = 'America/Sao_Paulo'

export const DIFICULDADES: { valor: Dificuldade; rotulo: string }[] = [
  { valor: 'facil', rotulo: 'Fácil' },
  { valor: 'na_medida', rotulo: 'Na medida' },
  { valor: 'dificil', rotulo: 'Difícil' },
  { valor: 'muito_dificil', rotulo: 'Muito difícil' },
  { valor: 'falha', rotulo: 'Falha' },
]

export const REGIOES: { valor: Regiao; rotulo: string }[] = [
  { valor: 'superiores', rotulo: 'Superiores' },
  { valor: 'inferiores', rotulo: 'Inferiores' },
  { valor: 'core', rotulo: 'Core' },
  { valor: 'cardio', rotulo: 'Cardio' },
]

export const TIPOS: { valor: TipoExercicio; rotulo: string }[] = [
  { valor: 'carga', rotulo: 'kg (total)' },
  { valor: 'carga_por_lado', rotulo: 'kg por lado' },
  { valor: 'carga_adicional', rotulo: '+kg (só anilhas)' },
  { valor: 'peso_corporal', rotulo: 'Peso corporal' },
  { valor: 'cardio', rotulo: 'Cardio' },
]

// "1 exercício", "8 exercícios"
export function contarExercicios(n: number): string {
  return `${n} ${n === 1 ? 'exercício' : 'exercícios'}`
}

export function rotuloDificuldade(d: Dificuldade | null): string | null {
  return DIFICULDADES.find((x) => x.valor === d)?.rotulo ?? null
}

export function numero(n: number): string {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

// Número digitado num campo: "2,5" → 2.5; vazio → null; texto inválido → NaN.
export function lerNumero(texto: string): number | null {
  const t = texto.trim().replace(',', '.')
  return t ? Number(t) : null
}

export function unidadeCarga(tipo: TipoExercicio): { prefixo: string; sufixo: string } {
  if (tipo === 'carga_por_lado') return { prefixo: '', sufixo: 'kg/lado' }
  if (tipo === 'carga_adicional') return { prefixo: '+', sufixo: 'kg' }
  return { prefixo: '', sufixo: 'kg' }
}

export function formatarCarga(kg: number | null, tipo: TipoExercicio): string {
  if (kg === null) return '—'
  const { prefixo, sufixo } = unidadeCarga(tipo)
  return `${prefixo}${numero(kg)} ${sufixo}`
}

export function sufixoLado(porLado: boolean, regiao: Regiao): string {
  if (!porLado) return ''
  return regiao === 'inferiores' ? '/perna' : '/lado'
}

function resumoReps(reps: number[]): string {
  if (reps.length > 1 && reps.every((r) => r === reps[0])) return `${reps.length}×${reps[0]}`
  return reps.join('+')
}

// "31 min" em minutos redondos; "31:49" quando há segundos (ex.: tempo de prova).
export function formatarTempo(segundos: number): string {
  if (segundos % 60 === 0) return `${segundos / 60} min`
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`
}

// Ritmo de corrida: segundos por km → "6:21 /km".
export function formatarRitmo(segundosPorKm: number): string {
  const s = Math.round(segundosPorKm)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} /km`
}

export function resumoCardio(duracaoS: number | null, distanciaM: number | null, andares: number | null): string {
  const partes: string[] = []
  if (duracaoS) partes.push(formatarTempo(duracaoS))
  if (distanciaM) partes.push(`${numero(distanciaM / 1000)} km`)
  if (andares) partes.push(`${andares} andares`)
  return partes.join(' · ') || '—'
}

export interface InfoExercicio {
  tipo: TipoExercicio
  reps_por_lado: boolean
  regiao: Regiao
}

export interface Series {
  reps: (number | null)[]
  cargas: (number | null)[]
  duracao_s: number | null
  distancia_m: number | null
  andares: number | null
}

// Resumo de um exercício inteiro. Séries seguidas com a mesma carga ficam juntas:
// "3×12 · 57 kg", "12+10+8 · 30 kg", "2×12 · 25 kg → 12 · 30 kg".
export function resumoSeries(ex: InfoExercicio, s: Series): string {
  if (ex.tipo === 'cardio') return resumoCardio(s.duracao_s, s.distancia_m, s.andares)
  const reps = s.reps.map((r) => r ?? 0)
  if (reps.length === 0) return '—'
  const lado = sufixoLado(ex.reps_por_lado, ex.regiao)
  if (ex.tipo === 'peso_corporal') return resumoReps(reps) + lado

  const blocos: { reps: number[]; carga: number | null }[] = []
  reps.forEach((rep, i) => {
    const carga = s.cargas[i] ?? null
    const ultimo = blocos[blocos.length - 1]
    if (ultimo && ultimo.carga === carga) ultimo.reps.push(rep)
    else blocos.push({ reps: [rep], carga })
  })
  return blocos.map((b) => `${resumoReps(b.reps)}${lado} · ${formatarCarga(b.carga, ex.tipo)}`).join(' → ')
}

// Exercício no detalhe da sessão (séries vindas da tabela), no mesmo formato.
export function resumoDetalhe(x: DetalheExercicio): string {
  const ex = x.exercicios
  return resumoSeries(
    { tipo: ex.tipo, reps_por_lado: ex.reps_por_lado, regiao: ex.grupos.regiao },
    {
      reps: x.series.map((s) => s.reps),
      cargas: x.series.map((s) => s.carga_kg),
      duracao_s: x.series.reduce((t, s) => t + (s.duracao_s ?? 0), 0) || null,
      distancia_m: x.series.reduce((t, s) => t + (s.distancia_m ?? 0), 0) || null,
      andares: x.series.reduce((t, s) => t + (s.andares ?? 0), 0) || null,
    },
  )
}

// Uma série: "10 × 57 kg", "8/perna × 7 kg/lado", "31 min · 3,6 km".
export function formatarSerie(
  ex: InfoExercicio,
  s: { reps: number | null; carga_kg: number | null; duracao_s: number | null; distancia_m: number | null; andares: number | null },
): string {
  if (ex.tipo === 'cardio') return resumoCardio(s.duracao_s, s.distancia_m, s.andares)
  const reps = `${s.reps ?? 0}${sufixoLado(ex.reps_por_lado, ex.regiao)}`
  if (ex.tipo === 'peso_corporal') return `${reps} reps`
  return `${reps} × ${formatarCarga(s.carga_kg, ex.tipo)}`
}

// ─── Datas ───────────────────────────────────────────────────

function diaLocal(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: FUSO }) // AAAA-MM-DD
}

export function dataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: FUSO })
}

// "sábado, 4 de outubro de 2026"
export function dataLonga(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: FUSO })
}

// "sáb. 04/10"
export function diaSemanaCurto(iso: string): string {
  const dia = new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', timeZone: FUSO })
  return `${dia} ${dataCurta(iso)}`
}

// "Outubro de 2026"
export function mesAno(iso: string): string {
  const texto = new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: FUSO })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// Para busca: minúsculas e sem acento ("Agachamento sumô" → "agachamento sumo").
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR')
}

// Campo datetime-local ("2026-10-04T07:30") no fuso do app, e de volta para ISO.
export function paraCampoDataHora(iso: string): string {
  return new Date(iso)
    .toLocaleString('sv-SE', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    .replace(' ', 'T')
}

export function deCampoDataHora(valor: string): string {
  const comoUtc = Date.parse(valor + ':00Z') // os números do campo lidos como se fossem UTC
  const deslocamento = Date.parse(paraCampoDataHora(new Date(comoUtc).toISOString()) + ':00Z') - comoUtc // fuso − UTC
  return new Date(comoUtc - deslocamento).toISOString()
}

export function horaCurta(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: FUSO })
}

export function diasDesde(iso: string, agora = new Date()): number {
  const a = Date.parse(diaLocal(new Date(iso)))
  const b = Date.parse(diaLocal(agora))
  return Math.round((b - a) / 86_400_000)
}

// Semanas completas desde a data: 0 a 6 dias = 0, 7 a 13 = 1…
export function semanasDesde(iso: string, agora = new Date()): number {
  return Math.floor(diasDesde(iso, agora) / 7)
}

export function haQuanto(iso: string, agora = new Date()): string {
  const dias = diasDesde(iso, agora)
  if (dias === 0) return 'hoje'
  if (dias === 1) return 'ontem'
  return `há ${dias} dias`
}

export function formatarDuracao(minutos: number): string {
  if (minutos < 60) return `${minutos} min`
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return `${h}h${String(m).padStart(2, '0')}`
}

// Intervalo do Postgres ("01:05:00", "1 day 02:00:00") → minutos.
export function minutosDoIntervalo(intervalo: string | null): number {
  if (!intervalo) return 0
  const dias = /(\d+) days?/.exec(intervalo)
  const hms = /(\d+):(\d+):(\d+)/.exec(intervalo)
  return (dias ? Number(dias[1]) * 1440 : 0) + (hms ? Number(hms[1]) * 60 + Number(hms[2]) : 0)
}

// Título sugerido ao encerrar, pelas regiões treinadas.
export function tituloSugerido(regioes: Regiao[]): string {
  const forca = new Set(regioes.filter((r) => r !== 'cardio'))
  const cardio = regioes.includes('cardio')
  let base: string | null = null
  if (forca.has('superiores') && forca.has('inferiores')) base = 'Treino Misto'
  else if (forca.has('superiores')) base = 'Treino Superiores'
  else if (forca.has('inferiores')) base = 'Treino Inferiores'
  else if (forca.has('core')) base = 'Treino Core'
  if (!base) return cardio ? 'Cardio' : 'Treino'
  return cardio ? `${base} + Cardio` : base
}
