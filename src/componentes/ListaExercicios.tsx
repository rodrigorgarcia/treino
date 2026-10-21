import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { REGIOES, detalheExercicio } from '../lib/formato'
import { lerPreferencia, salvarPreferencia } from '../lib/preferencias'
import type { Execucao, ItemCatalogo, Regiao } from '../lib/tipos'
import { Carregando, Chip, Rotulo, TempoDesde } from './ui'

type Modo = 'grupo' | 'aparelho'

// Por nome, com os arquivados no fim de cada grupo.
const porNome = (a: ItemCatalogo, b: ItemCatalogo) =>
  Number(a.arquivado) - Number(b.arquivado) || a.nome.localeCompare(b.nome, 'pt-BR')

// Montar o treino programado: tocar marca ou desmarca em vez de abrir, e o círculo mostra a ordem.
export interface Escolha {
  ordem: (id: string) => number | null // posição entre os marcados (1, 2…), ou null
  jaNoTreino?: Set<string> // já estão no treino: aparecem marcados, sem desmarcar
  alternar: (ex: ItemCatalogo) => void
}

interface Props {
  catalogo: ItemCatalogo[] | undefined
  carregando: boolean
  link?: (ex: ItemCatalogo) => string // para onde cada exercício leva
  escolha?: Escolha // no lugar de link
  substituir?: boolean // o link substitui a tela atual no histórico (escolher e seguir)
  feitos?: Map<string, Execucao> // feitos na sessão de hoje (marca ✓ e mostra o resumo de hoje)
  rodape?: (regiao: Regiao) => ReactNode
}

// Catálogo navegável: busca, regiões, subgrupos e agrupamento por grupo ou aparelho,
// com a última execução em cada linha. Usado na sessão e na tela de exercícios.
export function ListaExercicios({ catalogo, carregando, link, escolha, substituir = false, feitos, rodape }: Props) {
  const [aba, setAba] = useState<Regiao>(() => lerPreferencia('treino.aba', 'superiores'))
  const [modo, setModo] = useState<Modo>(() => lerPreferencia('treino.modo', 'grupo'))
  const [subgrupo, setSubgrupo] = useState<string | null>(() => lerPreferencia('treino.subgrupo', '') || null)
  const [busca, setBusca] = useState('')

  // Grupos da região escolhida, na ordem do catálogo (Peito, Costas, Ombros…).
  const subgrupos = useMemo(() => {
    const ordem = new Map<string, number>()
    for (const e of catalogo ?? []) if (e.regiao === aba) ordem.set(e.grupo, e.grupo_ordem)
    return [...ordem.entries()].sort((a, b) => a[1] - b[1]).map(([nome]) => nome)
  }, [catalogo, aba])
  const filtroGrupo = subgrupo && subgrupos.includes(subgrupo) ? subgrupo : null

  function escolherSubgrupo(grupo: string | null) {
    setSubgrupo(grupo)
    salvarPreferencia('treino.subgrupo', grupo ?? '')
  }

  const secoes = useMemo(() => {
    const lista = catalogo ?? []
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    if (termo) {
      return [{ titulo: 'Resultados', itens: lista.filter((e) => e.nome.toLocaleLowerCase('pt-BR').includes(termo)).sort(porNome) }]
    }
    const mapa = new Map<string, { titulo: string; ordem: number | string; itens: ItemCatalogo[] }>()
    for (const e of lista) {
      if (modo === 'grupo' && (e.regiao !== aba || (filtroGrupo && e.grupo !== filtroGrupo))) continue
      const titulo = modo === 'grupo' ? e.grupo : (e.aparelho ?? 'Sem aparelho')
      const ordem = modo === 'grupo' ? e.grupo_ordem : titulo
      if (!mapa.has(titulo)) mapa.set(titulo, { titulo, ordem, itens: [] })
      mapa.get(titulo)!.itens.push(e)
    }
    return [...mapa.values()]
      .sort((a, b) => (typeof a.ordem === 'number' && typeof b.ordem === 'number' ? a.ordem - b.ordem : String(a.ordem).localeCompare(String(b.ordem), 'pt-BR')))
      .map((s) => ({ ...s, itens: s.itens.sort(porNome) }))
  }, [catalogo, busca, modo, aba, filtroGrupo])

  return (
    <>
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
                    escolherSubgrupo(null)
                  }}
                >
                  {r.rotulo}
                </Chip>
              ))}
          </div>
          {modo === 'grupo' && subgrupos.length > 1 && (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              <Chip pequeno ativo={!filtroGrupo} onClick={() => escolherSubgrupo(null)}>
                Todos
              </Chip>
              {subgrupos.map((g) => (
                <Chip key={g} pequeno ativo={filtroGrupo === g} onClick={() => escolherSubgrupo(filtroGrupo === g ? null : g)}>
                  {g}
                </Chip>
              ))}
            </div>
          )}
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

      {carregando ? (
        <Carregando />
      ) : (
        secoes.map((s) => (
          <section key={s.titulo} className="mb-5">
            <Rotulo>{s.titulo}</Rotulo>
            <ul className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-cartao">
              {s.itens.map((e) => (
                <ItemExercicio key={e.id} ex={e} para={link?.(e)} escolha={escolha} substituir={substituir} hoje={feitos?.get(e.id)} />
              ))}
              {s.itens.length === 0 && <li className="px-4 py-3 text-fraco">Nenhum exercício.</li>}
            </ul>
          </section>
        ))
      )}

      {rodape?.(aba)}
    </>
  )
}

function ItemExercicio({ ex, para, escolha, substituir, hoje }: { ex: ItemCatalogo; para?: string; escolha?: Escolha; substituir: boolean; hoje?: Execucao }) {
  const info = (
    <div className={`min-w-0 flex-1 ${ex.arquivado ? 'opacity-55' : ''}`}>
      <div className="truncate font-medium">
        {ex.nome}
      </div>
      <div className={`truncate text-sm ${hoje ? 'text-acento' : 'text-fraco'}`}>
        {ex.arquivado && <span className="mr-1.5 rounded-md bg-cartao-2 px-1.5 py-0.5 text-xs">arquivado</span>}
        {detalheExercicio(ex, hoje)}
      </div>
    </div>
  )
  // tempo desde a última vez (feito hoje mostra ✓)
  const desde = !hoje && ex.ultima_em && <TempoDesde desde={ex.ultima_em} />

  if (escolha) {
    const noTreino = escolha.jaNoTreino?.has(ex.id) ?? false
    const n = escolha.ordem(ex.id)
    const marca = noTreino
      ? 'border border-acento/40 bg-acento/10 text-acento'
      : n !== null
        ? 'bg-acento font-semibold text-acento-escuro'
        : 'border-2 border-borda'
    return (
      <li>
        <button
          type="button"
          aria-pressed={noTreino || n !== null}
          disabled={noTreino}
          onClick={() => escolha.alternar(ex)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-cartao-2"
        >
          {info}
          {desde}
          <span aria-hidden className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm tabular-nums ${marca}`}>
            {noTreino ? '✓' : n}
          </span>
        </button>
      </li>
    )
  }

  return (
    <li>
      <Link to={para ?? ''} replace={substituir} className="flex items-center gap-3 px-4 py-3 active:bg-cartao-2">
        {info}
        {desde}
        {hoje ? <span className="text-xl text-acento">✓</span> : <span className="text-2xl text-fraco">›</span>}
      </Link>
    </li>
  )
}
