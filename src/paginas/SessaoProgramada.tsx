import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Deslizavel } from '../componentes/Deslizavel'
import { BotaoSecundario, Cabecalho, Carregando, Erro, Pagina, Rotulo, TempoDesde } from '../componentes/ui'
import { mensagemDeErro } from '../lib/api'
import { detalheExercicio } from '../lib/formato'
import { lerPreferencia, salvarPreferencia } from '../lib/preferencias'
import { useSessao } from './useSessao'
import { useItensDoTreino, useTirarDoTreino, type ItemDoTreino } from './useTreino'

type Agrupar = 'nenhum' | 'grupo' | 'aparelho'
const AGRUPAR: [Agrupar, string][] = [
  ['nenhum', 'Nenhum'],
  ['grupo', 'Grupo'],
  ['aparelho', 'Aparelho'],
]

// Seções na ordem em que o primeiro exercício de cada uma aparece no treino; dentro delas, a ordem
// do treino. O número de cada exercício é a posição no treino, agrupado ou não.
function secoesDoTreino(itens: ItemDoTreino[], agrupar: Agrupar) {
  const numerados = itens.map((item, i) => ({ ...item, numero: i + 1 }))
  if (agrupar === 'nenhum') return [{ titulo: null, itens: numerados }]
  const secoes = new Map<string, typeof numerados>()
  for (const item of numerados) {
    const titulo = agrupar === 'grupo' ? item.ex.grupo : (item.ex.aparelho ?? 'Sem aparelho')
    secoes.set(titulo, [...(secoes.get(titulo) ?? []), item])
  }
  return [...secoes].map(([titulo, itens]) => ({ titulo, itens }))
}

// Sessão do treino programado: a lista montada antes, com o estado de cada exercício.
export default function SessaoProgramada() {
  const sessao = useSessao()
  const navigate = useNavigate()
  const { itens, carregando, erro } = useItensDoTreino(sessao.id)
  const tirar = useTirarDoTreino(sessao.id)
  const feitos = itens.filter(({ x }) => x.n_series > 0 && x.dificuldade).length
  const falha = erro ?? tirar.erro
  const [agrupar, setAgrupar] = useState<Agrupar>(() => lerPreferencia('treino.agruparTreino', 'nenhum'))

  return (
    <>
      <Cabecalho
        voltar="/"
        titulo="Sessão"
        direita={
          <button onClick={() => navigate('/sessao/encerrar')} className="h-10 rounded-xl px-3 font-medium text-acento">
            Encerrar
          </button>
        }
      />
      <Pagina>
        <Erro>{falha && mensagemDeErro(falha)}</Erro>
        {carregando ? (
          <Carregando />
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <Rotulo>Treino programado</Rotulo>
              <span className="mb-2 text-sm text-suave tabular-nums" data-testid="progresso">
                {feitos} de {itens.length} feitos
              </span>
            </div>
            {itens.length > 1 && (
              <div className="mb-3 flex items-center gap-2 text-sm text-fraco">
                Agrupar por
                {AGRUPAR.map(([valor, rotulo]) => (
                  <button
                    key={valor}
                    aria-pressed={agrupar === valor}
                    onClick={() => {
                      setAgrupar(valor)
                      salvarPreferencia('treino.agruparTreino', valor)
                    }}
                    className={`rounded-lg px-2 py-1 ${agrupar === valor ? 'bg-cartao-2 text-texto' : ''}`}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
            )}
            <div data-testid="treino" className="space-y-4">
              {secoesDoTreino(itens, agrupar).map((secao) => (
                <section key={secao.titulo ?? ''}>
                  {secao.titulo && <Rotulo>{secao.titulo}</Rotulo>}
                  <ul className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-cartao">
                    {secao.itens.map((item) => (
                      <li key={item.x.id}>
                        <Deslizavel {...tirar.linha(item)}>
                          <ItemDoTreinoLinha item={item} numero={item.numero} />
                        </Deslizavel>
                      </li>
                    ))}
                    {itens.length === 0 && <li className="px-4 py-3 text-fraco">Nenhum exercício no treino.</li>}
                  </ul>
                </section>
              ))}
            </div>
            {itens.length > 0 && <p className="mt-2 text-sm text-fraco">Deslize um exercício para a esquerda para tirar do treino.</p>}
            <BotaoSecundario className="mt-5 w-full" onClick={() => navigate('/sessao/adicionar')}>
              + Adicionar exercícios
            </BotaoSecundario>
          </>
        )}
      </Pagina>
    </>
  )
}

// vazio: ainda sem séries · como-foi: falta a dificuldade · feito: pronto para encerrar
export function ItemDoTreinoLinha({ item: { x, ex }, numero }: { item: ItemDoTreino; numero: number }) {
  const estado = x.n_series === 0 ? 'vazio' : x.dificuldade ? 'feito' : 'como-foi'
  const marca = {
    vazio: 'border border-borda text-suave',
    'como-foi': 'border border-alerta/50 text-alerta',
    feito: 'border border-acento/40 bg-acento/10 text-acento',
  }[estado]
  return (
    <Link to={`/sessao/exercicio/${ex.id}`} draggable={false} data-estado={estado} className="flex items-center gap-3 px-4 py-3 active:bg-cartao-2">
      <span aria-hidden className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm tabular-nums ${marca}`}>
        {estado === 'feito' ? '✓' : numero}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{ex.nome}</div>
        <div className={`truncate text-sm ${x.n_series > 0 ? 'text-acento' : 'text-fraco'}`}>
          {detalheExercicio(ex, x.n_series > 0 ? x : undefined)}
        </div>
      </div>
      {estado === 'como-foi' && <span className="shrink-0 text-sm text-alerta">como foi?</span>}
      {estado === 'vazio' && ex.ultima_em && <TempoDesde desde={ex.ultima_em} />}
      <span className="text-2xl text-fraco">›</span>
    </Link>
  )
}
