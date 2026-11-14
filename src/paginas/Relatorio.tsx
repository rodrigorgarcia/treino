import { useMemo, useState } from 'react'
import { GraficoBarrasLinha } from '../componentes/GraficoBarrasLinha'
import { Cabecalho, Carregando, Erro, Pagina, Rotulo } from '../componentes/ui'
import { mensagemDeErro, useCatalogo, useRelatorio } from '../lib/api'
import { numero } from '../lib/formato'
import type { Ponto } from '../lib/grafico'
import { lerPreferencia, salvarPreferencia } from '../lib/preferencias'
import { totaisPorPeriodo, type Periodo, type Total } from '../lib/relatorio'
import type { TipoExercicio } from '../lib/tipos'

const PERIODOS: [Periodo, string][] = [
  ['semana', 'Semanal'],
  ['mes', 'Mensal'],
]
const NO_GRAFICO: Record<Periodo, number> = { semana: 26, mes: 24 } // colunas no gráfico (as mais recentes)
const AQUI: Record<Periodo, string> = { semana: 'Esta semana', mes: 'Este mês' }

// Eixos curtos: 12.500 vira "12,5k".
const eixo = (v: number) => (v >= 1000 ? `${numero(v / 1000)}k` : numero(v))
const kg = (v: number) => `${numero(v)} kg`
const reps = (v: number) => `${numero(v)} reps`
const treinos = (n: number) => (n === 1 ? '1 treino' : `${n} treinos`)
const series = (n: number) => (n === 1 ? '1 série' : `${n} séries`)

// Relatório de carga e repetições somadas de todos os exercícios de força, por semana ou mês.
export default function Relatorio() {
  const catalogo = useCatalogo()
  const relatorio = useRelatorio()
  const [periodo, setPeriodo] = useState<Periodo>(() => lerPreferencia('treino.relatorio', 'semana'))

  const totais = useMemo(() => {
    if (!catalogo.data || !relatorio.data) return []
    const tipos = new Map<string, TipoExercicio>(catalogo.data.map((e) => [e.id, e.tipo]))
    return totaisPorPeriodo(relatorio.data, tipos, periodo)
  }, [catalogo.data, relatorio.data, periodo])

  const noGrafico = totais.slice(-NO_GRAFICO[periodo])
  const pontos: Ponto[] = noGrafico.map((t) => ({
    t: 0,
    data: t.curto,
    detalhe: t.treinos ? `${treinos(t.treinos)} · ${series(t.series)}` : 'sem treino',
  }))
  const atual = totais.at(-1)
  const anterior = totais.at(-2)
  const erro = catalogo.error ?? relatorio.error

  return (
    <>
      <Cabecalho voltar="/exercicios" voltarNoHistorico titulo="Relatório" />
      <Pagina>
        <Erro>{erro && mensagemDeErro(erro)}</Erro>
        <p className="-mt-1 mb-3 text-sm text-suave">
          Todas as séries de força somadas, de todos os grupos. Carga em kg/lado conta os dois lados; cardio fica de fora.
        </p>
        <div className="mb-4 flex items-center gap-2 text-sm text-fraco">
          Período
          {PERIODOS.map(([valor, rotulo]) => (
            <button
              key={valor}
              aria-pressed={periodo === valor}
              onClick={() => {
                setPeriodo(valor)
                salvarPreferencia('treino.relatorio', valor)
              }}
              className={`rounded-lg px-2 py-1 ${periodo === valor ? 'bg-cartao-2 text-texto' : ''}`}
            >
              {rotulo}
            </button>
          ))}
        </div>

        {catalogo.isPending || relatorio.isPending ? (
          <Carregando />
        ) : !atual ? (
          <p className="text-fraco">Ainda não há treinos encerrados.</p>
        ) : (
          <>
            <Rotulo>{AQUI[periodo]}</Rotulo>
            <div className="mb-5 grid grid-cols-3 gap-2" data-testid="indicadores">
              {[
                { rotulo: 'Repetições', valor: numero(atual.reps), antes: anterior && numero(anterior.reps) },
                { rotulo: 'Carga', valor: kg(atual.carga), antes: anterior && kg(anterior.carga) },
                { rotulo: 'Treinos', valor: String(atual.treinos), antes: anterior && String(anterior.treinos) },
              ].map((i) => (
                <div key={i.rotulo} className="rounded-2xl border border-borda bg-cartao px-3 py-2.5">
                  <div className="text-xs text-fraco">{i.rotulo}</div>
                  <div className="text-lg font-semibold tabular-nums">{i.valor}</div>
                  {i.antes && <div className="text-xs text-fraco">antes: {i.antes}</div>}
                </div>
              ))}
            </div>

            <section className="mb-6 rounded-2xl border border-borda bg-cartao p-3" data-testid="grafico">
              <div className="mb-2 text-sm text-suave">Carga e repetições por {periodo === 'semana' ? 'semana' : 'mês'}</div>
              {pontos.length < 2 ? (
                <p className="py-6 text-center text-sm text-fraco">O gráfico aparece a partir do segundo período.</p>
              ) : (
                <GraficoBarrasLinha
                  pontos={pontos}
                  barras={{ titulo: 'Repetições', valores: noGrafico.map((t) => t.reps), formatar: reps, formatarEixo: eixo }}
                  linha={{ titulo: 'Carga somada', valores: noGrafico.map((t) => t.carga), formatar: kg, formatarEixo: eixo }}
                  rotuloBarras="reps"
                  rotuloLinha="kg"
                />
              )}
            </section>

            <ListaDePeriodos totais={totais} periodo={periodo} />
          </>
        )}
      </Pagina>
    </>
  )
}

// Os períodos com treino, do mais recente ao mais antigo.
function ListaDePeriodos({ totais, periodo }: { totais: Total[]; periodo: Periodo }) {
  const comTreino = totais.filter((t) => t.treinos > 0).reverse()
  return (
    <>
      <Rotulo>
        {periodo === 'semana' ? 'Semanas' : 'Meses'} com treino ({comTreino.length})
      </Rotulo>
      <ul className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-cartao" data-testid="periodos">
        {comTreino.map((t) => (
          <li key={t.chave} className="px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium tabular-nums">{t.rotulo}</span>
              <span className="shrink-0 text-sm text-suave tabular-nums">{treinos(t.treinos)}</span>
            </div>
            <div className="text-sm text-fraco tabular-nums">
              {reps(t.reps)} · {kg(t.carga)} · {series(t.series)}
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
