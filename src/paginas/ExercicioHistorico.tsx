import { Link, useParams } from 'react-router'
import { GraficoBarrasLinha } from '../componentes/GraficoBarrasLinha'
import { GraficoEvolucao } from '../componentes/GraficoEvolucao'
import { Cabecalho, Carregando, Erro, Pagina, Rotulo, Semanas } from '../componentes/ui'
import { mensagemDeErro, useAtualizarExercicio, useExercicio, useHistoricoExercicio } from '../lib/api'
import {
  dataCurta, diaSemanaCurto, formatarCarga, formatarRitmo, formatarTempo, numero, resumoSeries, rotuloDificuldade,
  semanasDesde, unidadeCarga,
} from '../lib/formato'
import type { Ponto, Serie } from '../lib/grafico'
import type { Execucao, ItemCatalogo } from '../lib/tipos'

interface Indicador {
  rotulo: string
  valor: string
  detalhe?: string
}

interface Analise {
  indicadores: Indicador[]
  pontos: Ponto[] // sessões no gráfico
  // Força: linha de carga e colunas de repetições. Os outros: uma linha.
  grafico: { linha: Serie } | { barras: Serie; linha: Serie } | null
}

const quando = (x: Execucao) => dataCurta(x.sessao_iniciada_em)
const minSeg = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`

function resumo(ex: ItemCatalogo, x: Execucao): string {
  return resumoSeries(ex, { reps: x.reps, cargas: x.cargas_kg, duracao_s: x.duracao_s, distancia_m: x.distancia_m, andares: x.andares })
}

const PASSOS_REPS = [1, 2, 5, 10, 20]

// O que mostrar para cada tipo de exercício. `execs` vem em ordem cronológica.
function analisar(ex: ItemCatalogo, execs: Execucao[]): Analise {
  const ponto = (x: Execucao): Ponto => ({ t: Date.parse(x.sessao_iniciada_em), data: quando(x), detalhe: resumo(ex, x) })

  if (ex.tipo === 'cardio') {
    const comDistancia = execs.filter((x) => x.distancia_m && x.duracao_s)
    if (comDistancia.length > 0) {
      const ritmo = (x: Execucao) => x.duracao_s! / (x.distancia_m! / 1000)
      const melhorRitmo = comDistancia.reduce((a, b) => (ritmo(b) < ritmo(a) ? b : a))
      const maisLonga = comDistancia.reduce((a, b) => (b.distancia_m! > a.distancia_m! ? b : a))
      const cincoK = comDistancia.filter((x) => x.distancia_m! >= 5000)
      const indicadores: Indicador[] = []
      if (cincoK.length > 0) {
        const melhor = cincoK.reduce((a, b) => (b.duracao_s! < a.duracao_s! ? b : a))
        indicadores.push({ rotulo: 'Melhor 5 km', valor: formatarTempo(melhor.duracao_s!), detalhe: quando(melhor) })
      }
      indicadores.push({ rotulo: 'Melhor ritmo', valor: formatarRitmo(ritmo(melhorRitmo)), detalhe: quando(melhorRitmo) })
      indicadores.push({ rotulo: 'Maior distância', valor: `${numero(maisLonga.distancia_m! / 1000)} km`, detalhe: quando(maisLonga) })
      return {
        indicadores,
        pontos: comDistancia.map(ponto),
        grafico: {
          linha: {
            titulo: 'Ritmo por corrida (min/km) · mais baixo é mais rápido',
            valores: comDistancia.map(ritmo),
            formatar: formatarRitmo,
            formatarEixo: minSeg,
            passos: [15, 30, 60, 120, 300], // segundos por km
          },
        },
      }
    }
    const comTempo = execs.filter((x) => x.duracao_s)
    const maisLonga = comTempo.length ? comTempo.reduce((a, b) => (b.duracao_s! > a.duracao_s! ? b : a)) : null
    return {
      indicadores: maisLonga ? [{ rotulo: 'Maior duração', valor: formatarTempo(maisLonga.duracao_s!), detalhe: quando(maisLonga) }] : [],
      pontos: comTempo.map(ponto),
      grafico: {
        linha: {
          titulo: 'Duração (min)',
          valores: comTempo.map((x) => x.duracao_s! / 60),
          formatar: (v) => formatarTempo(Math.round(v * 60)),
          formatarEixo: numero,
        },
      },
    }
  }

  if (ex.tipo === 'peso_corporal') {
    const total = (x: Execucao) => x.reps.reduce<number>((t, r) => t + (r ?? 0), 0)
    const melhor = execs.reduce((a, b) => (total(b) > total(a) ? b : a))
    return {
      indicadores: [{ rotulo: 'Mais repetições', valor: `${total(melhor)}`, detalhe: quando(melhor) }],
      pontos: execs.map(ponto),
      grafico: {
        linha: { titulo: 'Repetições por sessão', valores: execs.map(total), formatar: (v) => `${v} reps`, formatarEixo: numero, passos: PASSOS_REPS },
      },
    }
  }

  // Força: carga máxima de cada sessão (linha) e as repetições da série com menos (colunas);
  // séries interrompidas, com 0, ficam de fora.
  const maxCarga = (x: Execucao) => Math.max(...x.cargas_kg.filter((c): c is number => c !== null))
  const minReps = (x: Execucao) => {
    const feitas = x.reps.filter((r): r is number => r !== null && r > 0)
    return feitas.length ? Math.min(...feitas) : null
  }
  const comCarga = execs.filter((x) => Number.isFinite(maxCarga(x)))
  if (comCarga.length === 0) return { indicadores: [], pontos: [], grafico: null }
  const recorde = Math.max(...comCarga.map(maxCarga))
  const primeiraNoRecorde = comCarga.find((x) => maxCarga(x) === recorde)!
  const primeira = comCarga[0]
  return {
    indicadores: [
      { rotulo: 'Maior carga', valor: formatarCarga(recorde, ex.tipo), detalhe: `desde ${quando(primeiraNoRecorde)}` },
      { rotulo: 'Primeira vez', valor: formatarCarga(maxCarga(primeira), ex.tipo), detalhe: quando(primeira) },
    ],
    pontos: comCarga.map(ponto),
    grafico: {
      linha: {
        titulo: 'Carga máxima',
        valores: comCarga.map(maxCarga),
        formatar: (v) => formatarCarga(v, ex.tipo),
        formatarEixo: numero,
      },
      barras: {
        titulo: 'Repetições (série com menos)',
        valores: comCarga.map(minReps),
        formatar: (v) => `${v} reps`,
        formatarEixo: numero,
        passos: PASSOS_REPS,
      },
    },
  }
}

export default function ExercicioHistorico() {
  const { id = '' } = useParams()
  const exercicio = useExercicio(id)
  const historico = useHistoricoExercicio(id)
  const atualizar = useAtualizarExercicio()

  if (exercicio.isPending || historico.isPending) return <Carregando />
  const ex = exercicio.data
  const execs = historico.data ?? [] // da mais recente para a mais antiga
  const erro = exercicio.error ?? historico.error ?? atualizar.error

  if (!ex) {
    return (
      <>
        <Cabecalho voltar="/exercicios" voltarNoHistorico titulo="Exercício" />
        <Pagina>
          <Erro>{erro && mensagemDeErro(erro)}</Erro>
          {!erro && <p className="text-fraco">Exercício não encontrado.</p>}
        </Pagina>
      </>
    )
  }

  const cronologico = [...execs].reverse()
  const analise = execs.length > 0 ? analisar(ex, cronologico) : null
  const indicadores = analise ? [...analise.indicadores, { rotulo: 'Vezes', valor: `${execs.length}`, detalhe: `desde ${quando(cronologico[0])}` }] : []

  return (
    <>
      <Cabecalho
        voltar="/exercicios"
        voltarNoHistorico
        titulo={ex.nome}
        direita={
          <Link to={`/exercicios/${id}/editar`} className="flex h-10 items-center rounded-xl px-3 font-medium text-acento">
            Editar
          </Link>
        }
      />
      <Pagina>
        <Erro>{erro && mensagemDeErro(erro)}</Erro>
        <p className="-mt-1 mb-3 text-sm text-suave">
          {ex.aparelho ? `${ex.aparelho} · ${ex.grupo}` : ex.grupo}
          {ex.arquivado && <span className="ml-2 rounded-md bg-cartao-2 px-1.5 py-0.5 text-xs text-fraco">arquivado</span>}
        </p>

        {/* Semanas desde a última vez e arquivar: arquivado some da lista da sessão, mas fica aqui. */}
        <div className="mb-4 flex items-center justify-between gap-3" data-testid="situacao">
          {ex.ultima_em ? (
            <span className="flex items-center gap-2 text-sm text-suave">
              <Semanas desde={ex.ultima_em} />
              {semanasDesde(ex.ultima_em) === 1 ? 'semana' : 'semanas'} desde a última vez
            </span>
          ) : (
            <span className="text-sm text-fraco">Ainda não foi feito.</span>
          )}
          <button
            onClick={() => atualizar.mutate({ id, arquivado: !ex.arquivado })}
            disabled={atualizar.isPending}
            className={`h-9 shrink-0 rounded-xl border px-3 text-sm font-medium disabled:opacity-50 ${
              ex.arquivado ? 'border-acento/50 text-acento' : 'border-borda text-suave'
            }`}
          >
            {ex.arquivado ? 'Reativar' : 'Arquivar'}
          </button>
        </div>
        {ex.arquivado && (
          <p className="mb-4 rounded-xl border border-borda bg-cartao-2 px-3 py-2 text-sm text-suave">
            Arquivado: não aparece na lista da sessão. Reative para voltar a usar.
          </p>
        )}
        {ex.nota && <p className="mb-4 rounded-xl border border-alerta/40 bg-alerta/10 px-3 py-2 text-sm text-alerta">{ex.nota}</p>}

        {execs.length === 0 ? (
          <p className="text-fraco">Este exercício ainda não foi feito.</p>
        ) : (
          <>
            <div className="mb-5 grid grid-cols-3 gap-2" data-testid="indicadores">
              {indicadores.slice(0, 3).map((i) => (
                <div key={i.rotulo} className="rounded-2xl border border-borda bg-cartao px-3 py-2.5">
                  <div className="text-xs text-fraco">{i.rotulo}</div>
                  <div className="text-lg font-semibold tabular-nums">{i.valor}</div>
                  {i.detalhe && <div className="text-xs text-fraco">{i.detalhe}</div>}
                </div>
              ))}
            </div>

            {analise?.grafico && (
              <section className="mb-6 rounded-2xl border border-borda bg-cartao p-3" data-testid="grafico">
                <div className="mb-2 text-sm text-suave">
                  {'barras' in analise.grafico ? 'Carga e repetições por sessão' : analise.grafico.linha.titulo}
                </div>
                {analise.pontos.length < 2 ? (
                  <p className="py-6 text-center text-sm text-fraco">O gráfico aparece a partir da segunda vez.</p>
                ) : 'barras' in analise.grafico ? (
                  <GraficoBarrasLinha
                    pontos={analise.pontos}
                    barras={analise.grafico.barras}
                    linha={analise.grafico.linha}
                    rotuloBarras="reps"
                    rotuloLinha={unidadeCarga(ex.tipo).prefixo + 'kg'}
                  />
                ) : (
                  <GraficoEvolucao pontos={analise.pontos} serie={analise.grafico.linha} />
                )}
              </section>
            )}

            <Rotulo>Todas as vezes ({execs.length})</Rotulo>
            <ul className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-cartao">
              {execs.map((x) => (
                <li key={x.id}>
                  <Link to={`/sessoes/${x.sessao_id}`} className="block px-4 py-3 active:bg-cartao-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0">
                        <span className="mr-2 text-sm text-fraco tabular-nums">{diaSemanaCurto(x.sessao_iniciada_em)}</span>
                        <span className="tabular-nums">{resumo(ex, x)}</span>
                      </span>
                      {x.dificuldade && <span className="shrink-0 text-sm text-suave">{rotuloDificuldade(x.dificuldade)}</span>}
                    </div>
                    {x.observacao && <div className="mt-0.5 text-sm text-fraco italic">“{x.observacao}”</div>}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Pagina>
    </>
  )
}
