import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { BotaoSecundario, Cabecalho, Carregando, Chip, Cronometro, Erro, Pagina, Rotulo } from '../componentes/ui'
import { mensagemDeErro, useCatalogo, useExecucoes } from '../lib/api'
import { REGIOES, dataCurta, resumoSeries } from '../lib/formato'
import type { Execucao, ItemCatalogo, Regiao } from '../lib/tipos'
import { useSessao } from './useSessao'

type Modo = 'grupo' | 'aparelho'

function lerPreferencia<T extends string>(chave: string, padrao: T): T {
  try {
    return (localStorage.getItem(chave) as T) || padrao
  } catch {
    return padrao
  }
}
function salvarPreferencia(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor)
  } catch {
    /* sem armazenamento: só não lembra */
  }
}

const porIndice = (a: ItemCatalogo, b: ItemCatalogo) =>
  (a.indice ?? 999) - (b.indice ?? 999) || a.nome.localeCompare(b.nome, 'pt-BR')

export default function Sessao() {
  const sessao = useSessao()
  const navigate = useNavigate()
  const catalogo = useCatalogo()
  const execucoes = useExecucoes(sessao.id)
  const [aba, setAba] = useState<Regiao>(() => lerPreferencia('treino.aba', 'superiores'))
  const [modo, setModo] = useState<Modo>(() => lerPreferencia('treino.modo', 'grupo'))
  const [busca, setBusca] = useState('')

  const feitos = useMemo(() => {
    const mapa = new Map<string, Execucao>()
    for (const e of execucoes.data ?? []) if (e.n_series > 0) mapa.set(e.exercicio_id, e)
    return mapa
  }, [execucoes.data])

  const secoes = useMemo(() => {
    const lista = catalogo.data ?? []
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    if (termo) {
      return [{ titulo: 'Resultados', itens: lista.filter((e) => e.nome.toLocaleLowerCase('pt-BR').includes(termo)).sort(porIndice) }]
    }
    const mapa = new Map<string, { titulo: string; ordem: number | string; itens: ItemCatalogo[] }>()
    for (const e of lista) {
      if (modo === 'grupo' && e.regiao !== aba) continue
      const titulo = modo === 'grupo' ? e.grupo : (e.aparelho ?? 'Sem aparelho')
      const ordem = modo === 'grupo' ? e.grupo_ordem : titulo
      if (!mapa.has(titulo)) mapa.set(titulo, { titulo, ordem, itens: [] })
      mapa.get(titulo)!.itens.push(e)
    }
    return [...mapa.values()]
      .sort((a, b) => (typeof a.ordem === 'number' && typeof b.ordem === 'number' ? a.ordem - b.ordem : String(a.ordem).localeCompare(String(b.ordem), 'pt-BR')))
      .map((s) => ({ ...s, itens: s.itens.sort(porIndice) }))
  }, [catalogo.data, busca, modo, aba])

  const feitosHoje = (catalogo.data ?? []).filter((e) => feitos.has(e.id))

  return (
    <>
      <Cabecalho
        voltar="/"
        titulo={
          <>
            Sessão · <Cronometro desde={sessao.iniciada_em} />
          </>
        }
        direita={
          <button onClick={() => navigate('/sessao/encerrar')} className="h-10 rounded-xl px-3 font-medium text-acento">
            Encerrar
          </button>
        }
      />
      <Pagina>
        <Erro>{(catalogo.error || execucoes.error) && mensagemDeErro(catalogo.error ?? execucoes.error)}</Erro>

        {feitosHoje.length > 0 && (
          <section className="mb-5">
            <Rotulo>Feitos hoje ({feitosHoje.length})</Rotulo>
            <div className="flex flex-wrap gap-2">
              {feitosHoje
                .sort((a, b) => feitos.get(a.id)!.iniciado_em.localeCompare(feitos.get(b.id)!.iniciado_em))
                .map((e) => (
                  <Link
                    key={e.id}
                    to={`/sessao/exercicio/${e.id}`}
                    className="rounded-full border border-acento/40 bg-acento/10 px-3 py-2 text-sm text-acento"
                  >
                    ✓ {e.nome}
                  </Link>
                ))}
            </div>
          </section>
        )}

        <input
          type="search"
          placeholder="Buscar exercício"
          aria-label="Buscar exercício"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="mb-3 h-12 w-full rounded-xl border border-borda bg-cartao px-4 outline-none focus:border-acento"
        />

        {!busca && (
          <div className="mb-4 space-y-3">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              {modo === 'grupo' &&
                REGIOES.map((r) => (
                  <Chip
                    key={r.valor}
                    ativo={aba === r.valor}
                    onClick={() => {
                      setAba(r.valor)
                      salvarPreferencia('treino.aba', r.valor)
                    }}
                  >
                    {r.rotulo}
                  </Chip>
                ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-fraco">
              Agrupar por
              {(['grupo', 'aparelho'] as const).map((m) => (
                <button
                  key={m}
                  aria-pressed={modo === m}
                  onClick={() => {
                    setModo(m)
                    salvarPreferencia('treino.modo', m)
                  }}
                  className={`rounded-lg px-2 py-1 ${modo === m ? 'bg-cartao-2 text-texto' : ''}`}
                >
                  {m === 'grupo' ? 'Grupo' : 'Aparelho'}
                </button>
              ))}
            </div>
          </div>
        )}

        {catalogo.isPending ? (
          <Carregando />
        ) : (
          secoes.map((s) => (
            <section key={s.titulo} className="mb-5">
              <Rotulo>{s.titulo}</Rotulo>
              <ul className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-cartao">
                {s.itens.map((e) => (
                  <ItemExercicio key={e.id} ex={e} hoje={feitos.get(e.id)} />
                ))}
                {s.itens.length === 0 && <li className="px-4 py-3 text-fraco">Nenhum exercício.</li>}
              </ul>
            </section>
          ))
        )}

        <BotaoSecundario className="w-full" onClick={() => navigate(`/sessao/novo-exercicio?regiao=${aba}`)}>
          + Novo exercício
        </BotaoSecundario>
      </Pagina>
    </>
  )
}

function ItemExercicio({ ex, hoje }: { ex: ItemCatalogo; hoje?: Execucao }) {
  let detalhe: string
  if (hoje) {
    detalhe = 'hoje: ' + resumoSeries(ex, { reps: hoje.reps, cargas: hoje.cargas_kg, duracao_s: hoje.duracao_s, distancia_m: hoje.distancia_m, andares: hoje.andares })
  } else if (ex.ultima_em) {
    detalhe = `${dataCurta(ex.ultima_em)} · ` + resumoSeries(ex, {
      reps: ex.ultima_reps ?? [],
      cargas: ex.ultima_cargas_kg ?? [],
      duracao_s: ex.ultima_duracao_s,
      distancia_m: ex.ultima_distancia_m,
      andares: ex.ultima_andares,
    })
  } else {
    detalhe = 'nunca feito'
  }
  return (
    <li>
      <Link to={`/sessao/exercicio/${ex.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-cartao-2">
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">
            {ex.indice !== null && <span className="mr-1.5 text-sm text-fraco tabular-nums">#{ex.indice}</span>}
            {ex.nome}
          </div>
          <div className={`truncate text-sm ${hoje ? 'text-acento' : 'text-fraco'}`}>{detalhe}</div>
        </div>
        {hoje ? <span className="text-xl text-acento">✓</span> : <span className="text-2xl text-fraco">›</span>}
      </Link>
    </li>
  )
}
