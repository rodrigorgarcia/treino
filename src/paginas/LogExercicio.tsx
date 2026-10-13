import { useQueryClient } from '@tanstack/react-query'
import { Fragment, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { Stepper, StepperTempo } from '../componentes/Stepper'
import { BotaoPrimario, BotaoSecundario, Cabecalho, Carregando, Chip, Erro, Pagina, Rotulo } from '../componentes/ui'
import {
  chaves, mensagemDeErro, useApagarSerie, useAtualizarSerie, useCatalogo, useConcluirExercicio, useExercicio,
  useRegistrarSerie, useRegistro, useRemoverDaSessao, useSessaoDetalhe, type ValoresSerie,
} from '../lib/api'
import {
  DIFICULDADES, dataCurta, diaSemanaCurto, formatarSerie, haQuanto, numero, resumoSeries, rotuloDificuldade, sufixoLado,
  unidadeCarga,
} from '../lib/formato'
import type { Dificuldade, ItemCatalogo, Registro, Serie } from '../lib/tipos'
import { useVoltar } from '../lib/useVoltar'
import { useSessao } from './useSessao'

export default function LogExercicio() {
  const sessao = useSessao()
  const { exercicioId = '' } = useParams()
  const catalogo = useCatalogo()
  const registro = useRegistro(sessao.id, exercicioId)

  if (catalogo.isPending || registro.isPending) return <Carregando />
  const ex = catalogo.data?.find((e) => e.id === exercicioId)
  if (!ex) return catalogo.isFetching ? <Carregando /> : <Navigate to="/sessao" replace />
  return <Conteudo key={exercicioId} sessaoId={sessao.id} ex={ex} registro={registro.data ?? null} />
}

// Corrigir um exercício de uma sessão já encerrada (/sessoes/:id/exercicio/:exercicioId).
// Mesma tela, mas sem "última vez" e voltando para a edição da sessão.
export function LogExercicioPassado() {
  const { id = '', exercicioId = '' } = useParams()
  const detalhe = useSessaoDetalhe(id)
  const exercicio = useExercicio(exercicioId)
  const registro = useRegistro(id, exercicioId)

  if (detalhe.isPending || exercicio.isPending || registro.isPending) return <Carregando />
  const sessao = detalhe.data?.sessao
  const ex = exercicio.data
  const erro = detalhe.error ?? exercicio.error ?? registro.error
  if (sessao && !sessao.encerrada_em) return <Navigate to={`/sessao/exercicio/${exercicioId}`} replace />
  if (!sessao || !ex || erro) {
    return (
      <>
        <Cabecalho voltar={`/sessoes/${id}`} voltarNoHistorico titulo="Corrigir exercício" />
        <Pagina>
          <Erro>{erro && mensagemDeErro(erro)}</Erro>
          {!erro && <p className="text-fraco">Sessão ou exercício não encontrado.</p>}
        </Pagina>
      </>
    )
  }
  return <Conteudo key={exercicioId} sessaoId={id} ex={ex} registro={registro.data ?? null} passada={diaSemanaCurto(sessao.iniciada_em)} />
}

interface Valores {
  reps: number | null
  carga: number | null
  duracaoS: number | null
  distanciaKm: number | null
  andares: number | null
}

function deSerie(s: Serie): Valores {
  return {
    reps: s.reps,
    carga: s.carga_kg,
    duracaoS: s.duracao_s,
    distanciaKm: s.distancia_m === null ? null : s.distancia_m / 1000,
    andares: s.andares,
  }
}

// 1ª série = 1ª série da última vez; as seguintes = a série que acabou de ser registrada.
function valoresIniciais(ex: ItemCatalogo, series: Serie[]): Valores {
  const ultimaHoje = series[series.length - 1]
  if (ultimaHoje) return deSerie(ultimaHoje)
  if (ex.tipo === 'cardio') {
    return {
      reps: null,
      carga: null,
      duracaoS: ex.ultima_duracao_s ?? 30 * 60,
      distanciaKm: ex.ultima_distancia_m === null ? null : ex.ultima_distancia_m / 1000,
      andares: ex.ultima_andares,
    }
  }
  return { reps: ex.ultima_reps?.[0] ?? 12, carga: ex.ultima_cargas_kg?.[0] ?? null, duracaoS: null, distanciaKm: null, andares: null }
}

function paraBanco(ex: ItemCatalogo, v: Valores): ValoresSerie {
  if (ex.tipo === 'cardio') {
    return {
      reps: null,
      carga_kg: null,
      duracao_s: v.duracaoS,
      distancia_m: v.distanciaKm === null ? null : Math.round(v.distanciaKm * 1000),
      andares: v.andares,
    }
  }
  return {
    reps: v.reps ?? 0,
    carga_kg: ex.tipo === 'peso_corporal' ? null : v.carga,
    duracao_s: null,
    distancia_m: null,
    andares: null,
  }
}

// passada: data da sessão encerrada que está sendo corrigida ("sáb. 04/10").
function Conteudo({ sessaoId, ex, registro, passada }: { sessaoId: string; ex: ItemCatalogo; registro: Registro | null; passada?: string }) {
  const navigate = useNavigate()
  const voltarPara = useVoltar()
  const qc = useQueryClient()
  const destino = passada ? `/sessoes/${sessaoId}/editar` : '/sessao'
  const series = registro?.series ?? []
  // Corrigindo cardio de uma sessão passada: abre direto a série que já existe (em geral
  // há uma só), em vez de um cartão de série nova que seria fácil confundir com ela.
  const [editando, setEditando] = useState<Serie | null>(() =>
    passada && ex.tipo === 'cardio' && series.length > 0 ? series[series.length - 1] : null,
  )
  const [valores, setValores] = useState<Valores>(() => (editando ? deSerie(editando) : valoresIniciais(ex, series)))
  const [dificuldade, setDificuldade] = useState<Dificuldade | null>(registro?.dificuldade ?? null)
  const [observacao, setObservacao] = useState(registro?.observacao ?? '')
  // Na sessão em andamento, "Como foi?" é obrigatório para concluir um exercício com séries.
  // (Na correção de sessões passadas não: o histórico importado tem exercícios sem dificuldade.)
  const exigeDificuldade = !passada && series.length > 0
  const [faltaDificuldade, setFaltaDificuldade] = useState(false)
  const blocoDificuldade = useRef<HTMLElement>(null)

  const registrar = useRegistrarSerie(sessaoId, ex.id)
  const atualizar = useAtualizarSerie(sessaoId, ex.id)
  const apagar = useApagarSerie(sessaoId, ex.id)
  const concluir = useConcluirExercicio(sessaoId, ex.id)
  const remover = useRemoverDaSessao(sessaoId, ex.id)
  const erro = registrar.error ?? atualizar.error ?? apagar.error ?? concluir.error ?? remover.error

  const mudar = (campo: keyof Valores) => (v: number | null) => setValores((atual) => ({ ...atual, [campo]: v }))
  const numeroDaSerie = editando ? editando.numero : series.length + 1
  const ocupado = registrar.isPending || atualizar.isPending || apagar.isPending
  const vazio = ex.tipo === 'cardio' ? valores.duracaoS === null && valores.distanciaKm === null : valores.reps === null

  const ultimaVez =
    ex.ultima_em &&
    resumoSeries(ex, {
      reps: ex.ultima_reps ?? [],
      cargas: ex.ultima_cargas_kg ?? [],
      duracao_s: ex.ultima_duracao_s,
      distancia_m: ex.ultima_distancia_m,
      andares: ex.ultima_andares,
    })
  const dicaSerie =
    !passada && ex.tipo !== 'cardio' && ex.ultima_reps && numeroDaSerie <= ex.ultima_reps.length
      ? 'última vez: ' +
        formatarSerie(ex, {
          reps: ex.ultima_reps[numeroDaSerie - 1],
          carga_kg: ex.ultima_cargas_kg?.[numeroDaSerie - 1] ?? null,
          duracao_s: null,
          distancia_m: null,
          andares: null,
        })
      : null

  // Ao sair da edição, a próxima série volta a partir da última registrada.
  function sairDaEdicao(restantes = series) {
    setEditando(null)
    setValores(valoresIniciais(ex, restantes))
  }

  function salvarSerie() {
    const dados = paraBanco(ex, valores)
    if (!editando) return registrar.mutate(dados)
    const editada: Serie = { ...editando, ...dados }
    atualizar.mutate({ id: editando.id, ...dados }, { onSuccess: () => sairDaEdicao(series.map((s) => (s.id === editada.id ? editada : s))) })
  }

  // Na sessão em andamento volta para a lista. Numa sessão passada, espera o detalhe recarregar
  // para a edição da sessão já mostrar a correção.
  async function sair() {
    if (!passada) return navigate('/sessao')
    await qc.refetchQueries({ queryKey: chaves.sessaoDetalhe(sessaoId) })
    voltarPara(destino)
  }

  async function concluirExercicio() {
    if (exigeDificuldade && !dificuldade) {
      setFaltaDificuldade(true)
      blocoDificuldade.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    // Uma série em edição com mudanças não salvas é salva antes de sair, em vez de descartada.
    if (editando) {
      const dados = paraBanco(ex, valores)
      const alterada = (Object.keys(dados) as (keyof ValoresSerie)[]).some((k) => dados[k] !== editando[k])
      if (alterada) {
        try {
          await atualizar.mutateAsync({ id: editando.id, ...dados })
        } catch {
          return // o erro aparece na tela
        }
      }
    }
    const obs = observacao.trim() || null
    const mudou = dificuldade !== (registro?.dificuldade ?? null) || obs !== (registro?.observacao ?? null)
    if (passada && registro?.id && series.length === 0) {
      remover.mutate(registro.id, { onSuccess: sair }) // apagou todas as séries: sai da sessão
    } else if (registro?.id && mudou) {
      concluir.mutate({ registroId: registro.id, dificuldade, observacao: obs }, { onSuccess: sair })
    } else {
      sair()
    }
  }

  function removerDaSessao() {
    if (!registro?.id) return
    const apagadas = series.length === 1 ? 'A série registrada será apagada.' : `As ${series.length} séries registradas serão apagadas.`
    if (!window.confirm(`Tirar “${ex.nome}” desta sessão? ${apagadas}`)) return
    remover.mutate(registro.id, { onSuccess: sair })
  }

  const carga = unidadeCarga(ex.tipo)
  const lado = sufixoLado(ex.reps_por_lado, ex.regiao)

  return (
    <>
      <Cabecalho voltar={destino} voltarNoHistorico={!!passada} titulo={ex.nome} />
      <Pagina>
        <p className="-mt-1 mb-3 flex items-baseline justify-between gap-3 text-sm text-suave">
          <span className="min-w-0 truncate">
            {ex.aparelho ?? ex.grupo}
            {ex.tipo !== 'cardio' && ex.tipo !== 'peso_corporal' && ` · passo ${numero(ex.incremento_kg)} kg`}
          </span>
          <Link to={`/exercicios/${ex.id}/editar`} className="shrink-0 text-fraco underline underline-offset-2">
            editar
          </Link>
        </p>

        {ex.nota && <p className="mb-3 rounded-xl border border-alerta/40 bg-alerta/10 px-3 py-2 text-sm text-alerta">{ex.nota}</p>}

        {passada ? (
          <p className="mb-4 rounded-xl border border-borda bg-cartao-2 px-3 py-2 text-sm text-suave" data-testid="corrigindo">
            Corrigindo a sessão de {passada}. As séries são salvas na hora.
          </p>
        ) : (
          <div className="mb-4 text-sm text-fraco" data-testid="ultima-vez">
            {ultimaVez ? (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <span>
                    Última vez · {dataCurta(ex.ultima_em!)}, {haQuanto(ex.ultima_em!)}
                  </span>
                  <Link to={`/exercicios/${ex.id}`} className="shrink-0 text-acento">
                    ver histórico
                  </Link>
                </div>
                <div className="text-suave">
                  {ultimaVez}
                  {ex.ultima_dificuldade && ` · ${rotuloDificuldade(ex.ultima_dificuldade)}`}
                </div>
                {ex.ultima_observacao && <div className="italic">“{ex.ultima_observacao}”</div>}
              </>
            ) : (
              'Primeira vez neste exercício.'
            )}
          </div>
        )}

        <Erro>{erro && mensagemDeErro(erro)}</Erro>

        <section className={`mb-5 space-y-5 rounded-3xl border bg-cartao p-4 ${editando ? 'border-alerta/50' : 'border-borda'}`}>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-semibold">{editando ? `Editando série ${numeroDaSerie}` : `Série ${numeroDaSerie}`}</span>
            {dicaSerie && <span className="text-sm text-fraco">{dicaSerie}</span>}
          </div>

          {/* chave: ao trocar de série (ou registrar), um campo aberto para digitar fecha */}
          {ex.tipo === 'cardio' ? (
            <Fragment key={`${editando?.id ?? 'nova'}-${series.length}`}>
              <StepperTempo rotulo="Duração" segundos={valores.duracaoS} onChange={mudar('duracaoS')} />
              <Stepper rotulo="Distância" valor={valores.distanciaKm} passo={0.1} sufixo="km" onChange={mudar('distanciaKm')} />
              <Stepper rotulo="Andares" valor={valores.andares} passo={1} onChange={mudar('andares')} />
            </Fragment>
          ) : (
            <Fragment key={`${editando?.id ?? 'nova'}-${series.length}`}>
              <Stepper rotulo="Reps" valor={valores.reps} passo={1} sufixo={lado ? `reps${lado}` : 'reps'} onChange={mudar('reps')} />
              {ex.tipo !== 'peso_corporal' && (
                <Stepper
                  rotulo="Carga"
                  valor={valores.carga}
                  passo={ex.incremento_kg}
                  prefixo={carga.prefixo}
                  sufixo={carga.sufixo}
                  onChange={mudar('carga')}
                />
              )}
            </Fragment>
          )}

          {editando ? (
            <div className="grid grid-cols-3 gap-2">
              <BotaoSecundario onClick={() => sairDaEdicao()} disabled={ocupado}>
                Cancelar
              </BotaoSecundario>
              <BotaoSecundario
                className="text-perigo"
                disabled={ocupado}
                onClick={() => apagar.mutate(editando.id, { onSuccess: () => sairDaEdicao(series.filter((s) => s.id !== editando.id)) })}
              >
                Apagar
              </BotaoSecundario>
              <BotaoPrimario className="h-12 rounded-xl text-base" onClick={salvarSerie} disabled={ocupado || vazio}>
                Salvar
              </BotaoPrimario>
            </div>
          ) : (
            <BotaoPrimario onClick={salvarSerie} disabled={ocupado || vazio}>
              Registrar série {numeroDaSerie}
            </BotaoPrimario>
          )}
        </section>

        {series.length > 0 && (
          <section className="mb-6">
            <Rotulo>{passada ? 'Séries' : 'Hoje'}</Rotulo>
            <ul className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-cartao">
              {series.map((s) => (
                <li key={s.id}>
                  <button
                    disabled={s.id.startsWith('provisoria-') || ocupado}
                    onClick={() => {
                      setEditando(s)
                      setValores(deSerie(s))
                    }}
                    className={`flex w-full items-center gap-4 px-4 py-3 text-left active:bg-cartao-2 ${editando?.id === s.id ? 'bg-alerta/10' : ''}`}
                  >
                    <span className="w-5 text-fraco tabular-nums">{s.numero}</span>
                    <span className="flex-1 text-lg tabular-nums">{formatarSerie(ex, s)}</span>
                    <span className="text-sm text-fraco">editar</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section ref={blocoDificuldade}>
          <Rotulo>Como foi?{exigeDificuldade && ' · obrigatório'}</Rotulo>
          <div className={`mb-3 flex flex-wrap gap-2 ${faltaDificuldade && !dificuldade ? 'rounded-2xl ring-2 ring-alerta ring-offset-4 ring-offset-fundo' : ''}`}>
            {DIFICULDADES.map((d) => (
              <Chip
                key={d.valor}
                ativo={dificuldade === d.valor}
                onClick={() => {
                  setDificuldade(dificuldade === d.valor ? null : d.valor)
                  setFaltaDificuldade(false)
                }}
              >
                {d.rotulo}
              </Chip>
            ))}
          </div>
          {faltaDificuldade && !dificuldade && (
            <p className="mb-3 text-sm text-alerta" role="alert">
              Escolha como foi para concluir o exercício.
            </p>
          )}
          <textarea
            placeholder="Observação (opcional)"
            aria-label="Observação"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={2}
            className="mb-4 w-full rounded-xl border border-borda bg-cartao px-4 py-3 outline-none focus:border-acento"
          />
          <BotaoSecundario
            className="w-full"
            onClick={concluirExercicio}
            disabled={concluir.isPending || registrar.isPending || atualizar.isPending || remover.isPending || (series.length > 0 && !registro?.id)}
          >
            {series.length > 0 ? (passada ? 'Pronto' : 'Concluir exercício') : 'Voltar sem registrar'}
          </BotaoSecundario>
          {passada && registro?.id && series.length > 0 && (
            <button
              onClick={removerDaSessao}
              disabled={ocupado || remover.isPending}
              className="mt-4 h-12 w-full rounded-xl text-perigo active:bg-perigo/10 disabled:opacity-50"
            >
              Tirar da sessão
            </button>
          )}
        </section>
      </Pagina>
    </>
  )
}
