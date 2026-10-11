import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Cabecalho, Carregando, Chip, Erro, Pagina, Rotulo } from '../componentes/ui'
import { mensagemDeErro, useHistorico } from '../lib/api'
import { REGIOES, dataCurta, diaSemanaCurto, formatarDuracao, mesAno, minutosDoIntervalo, normalizar } from '../lib/formato'
import type { Regiao, ResumoSessao } from '../lib/tipos'

const PREVIA = 4 // exercícios mostrados em cada cartão

// Texto em que a busca procura: título, objetivo, observação, exercícios e data.
function textoDeBusca(s: ResumoSessao): string {
  return normalizar([s.titulo, s.objetivo, s.observacao, ...s.exercicios, dataCurta(s.iniciada_em)].filter(Boolean).join(' '))
}

export default function Sessoes() {
  const historico = useHistorico()
  // Busca e região ficam no endereço (?q=…&regiao=…): voltar do detalhe devolve a lista filtrada.
  const [params, setParams] = useSearchParams()
  const busca = params.get('q') ?? ''
  const regiao = REGIOES.some((r) => r.valor === params.get('regiao')) ? (params.get('regiao') as Regiao) : null

  function filtrar(mudancas: { q?: string; regiao?: Regiao | null }) {
    const novos = new URLSearchParams(params)
    for (const [chave, valor] of Object.entries(mudancas)) {
      if (valor) novos.set(chave, valor)
      else novos.delete(chave)
    }
    setParams(novos, { replace: true })
  }

  const indexadas = useMemo(() => (historico.data ?? []).map((s) => ({ s, texto: textoDeBusca(s) })), [historico.data])

  const meses = useMemo(() => {
    const termos = normalizar(busca).split(/\s+/).filter(Boolean)
    const grupos = new Map<string, ResumoSessao[]>()
    for (const { s, texto } of indexadas) {
      if (regiao && !s.regioes.includes(regiao)) continue
      if (!termos.every((t) => texto.includes(t))) continue
      const mes = mesAno(s.iniciada_em)
      if (!grupos.has(mes)) grupos.set(mes, [])
      grupos.get(mes)!.push(s)
    }
    return [...grupos.entries()]
  }, [indexadas, busca, regiao])

  const encontradas = meses.reduce((total, [, lista]) => total + lista.length, 0)
  const filtrando = busca.trim() !== '' || regiao !== null

  return (
    <>
      <Cabecalho voltar="/" titulo="Histórico" />
      <Pagina>
        <Erro>{historico.error && mensagemDeErro(historico.error)}</Erro>
        <input
          type="search"
          placeholder="Buscar por exercício, título, data…"
          aria-label="Buscar sessões"
          value={busca}
          onChange={(e) => filtrar({ q: e.target.value })}
          className="mb-3 h-12 w-full rounded-xl border border-borda bg-cartao px-4 outline-none focus:border-acento"
        />
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <Chip pequeno ativo={regiao === null} onClick={() => filtrar({ regiao: null })}>
            Todas
          </Chip>
          {REGIOES.map((r) => (
            <Chip key={r.valor} pequeno ativo={regiao === r.valor} onClick={() => filtrar({ regiao: regiao === r.valor ? null : r.valor })}>
              {r.rotulo}
            </Chip>
          ))}
        </div>

        {historico.isPending ? (
          <Carregando />
        ) : (
          <>
            <p className="mb-4 text-sm text-fraco" data-testid="contagem">
              {filtrando ? `${encontradas} de ${indexadas.length} sessões` : `${indexadas.length} sessões`}
            </p>
            {meses.map(([mes, lista]) => (
              <section key={mes} className="mb-5">
                <Rotulo>{mes}</Rotulo>
                <ul className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-cartao">
                  {lista.map((s) => (
                    <CartaoSessao key={s.id} s={s} />
                  ))}
                </ul>
              </section>
            ))}
            {filtrando && encontradas === 0 && <p className="text-fraco">Nenhuma sessão encontrada.</p>}
          </>
        )}
      </Pagina>
    </>
  )
}

function CartaoSessao({ s }: { s: ResumoSessao }) {
  const minutos = minutosDoIntervalo(s.duracao)
  const resto = s.exercicios.length - PREVIA
  return (
    <li>
      <Link to={`/sessoes/${s.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-cartao-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3 text-sm text-suave">
            <span className="tabular-nums">{diaSemanaCurto(s.iniciada_em)}</span>
            <span>
              {s.n_exercicios} exercícios{minutos > 0 && ` · ${formatarDuracao(minutos)}`}
            </span>
          </div>
          <div className="truncate font-medium">{s.titulo ?? 'Sessão'}</div>
          <div className="truncate text-sm text-fraco">
            {s.exercicios.slice(0, PREVIA).join(', ')}
            {resto > 0 && ` +${resto}`}
          </div>
        </div>
        <span className="text-2xl text-fraco">›</span>
      </Link>
    </li>
  )
}
