import { useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { ListaExercicios } from '../componentes/ListaExercicios'
import { BotaoPrimario, BotaoSecundario, Cabecalho, Carregando, Erro, Pagina } from '../componentes/ui'
import { mensagemDeErro, useAdicionarAoPlano, useCatalogo, useExecucoes, useIniciarSessao, useSessaoAberta } from '../lib/api'
import type { ItemCatalogo, Regiao } from '../lib/tipos'
import { useSessao } from './useSessao'

// Treino programado (/montar): marcar os exercícios na ordem em que vai fazer e começar a sessão.
export default function MontarTreino() {
  const navigate = useNavigate()
  const aberta = useSessaoAberta()
  const iniciar = useIniciarSessao()

  if (aberta.isPending) return <Carregando />
  if (aberta.data) return <Navigate to="/sessao" replace />

  return (
    <Escolher
      titulo="Montar treino"
      voltar="/"
      botao="Começar treino"
      ocupado={iniciar.isPending}
      erro={iniciar.error}
      onConfirmar={(ids) => iniciar.mutate(ids, { onSuccess: () => navigate('/sessao', { replace: true }) })}
    />
  )
}

// Incluir mais exercícios no treino programado em andamento (/sessao/adicionar); entram no fim.
export function AdicionarAoTreino() {
  const sessao = useSessao()
  const navigate = useNavigate()
  const execucoes = useExecucoes(sessao.id)
  const adicionar = useAdicionarAoPlano(sessao.id)

  if (execucoes.isPending) return <Carregando />

  return (
    <Escolher
      titulo="Adicionar ao treino"
      voltar="/sessao"
      botao="Adicionar"
      jaNoTreino={new Set((execucoes.data ?? []).map((x) => x.exercicio_id))}
      ocupado={adicionar.isPending}
      erro={adicionar.error ?? execucoes.error}
      onConfirmar={(ids) => adicionar.mutate(ids, { onSuccess: () => navigate('/sessao', { replace: true }) })}
      rodape={(regiao) => (
        <BotaoSecundario className="w-full" onClick={() => navigate(`/sessao/novo-exercicio?regiao=${regiao}`)}>
          + Novo exercício
        </BotaoSecundario>
      )}
    />
  )
}

interface Props {
  titulo: string
  voltar: string
  botao: string
  jaNoTreino?: Set<string>
  ocupado: boolean
  erro: unknown
  onConfirmar: (exercicios: string[]) => void
  rodape?: (regiao: Regiao) => ReactNode
}

function Escolher({ titulo, voltar, botao, jaNoTreino, ocupado, erro, onConfirmar, rodape }: Props) {
  const catalogo = useCatalogo()
  const [escolhidos, setEscolhidos] = useState<ItemCatalogo[]>([])

  function alternar(ex: ItemCatalogo) {
    setEscolhidos((atual) => (atual.some((e) => e.id === ex.id) ? atual.filter((e) => e.id !== ex.id) : [...atual, ex]))
  }
  const ordem = (id: string) => {
    const i = escolhidos.findIndex((e) => e.id === id)
    return i < 0 ? null : i + 1
  }
  const falha = erro ?? catalogo.error

  return (
    <>
      <Cabecalho voltar={voltar} titulo={titulo} />
      <Pagina>
        <p className="-mt-1 mb-3 text-sm text-suave">Marque os exercícios na ordem em que vai fazer.</p>
        <Erro>{falha && mensagemDeErro(falha)}</Erro>
        <ListaExercicios
          catalogo={catalogo.data?.filter((e) => !e.arquivado)}
          carregando={catalogo.isPending}
          escolha={{ ordem, jaNoTreino, alternar }}
          rodape={rodape}
        />

        <div className="sticky bottom-0 -mx-4 mt-4 border-t border-borda bg-fundo/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
          {escolhidos.length > 0 && (
            <ol aria-label="Escolhidos" className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
              {escolhidos.map((ex, i) => (
                <li key={ex.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => alternar(ex)}
                    aria-label={`Desmarcar ${ex.nome}`}
                    className="rounded-full border border-acento/40 bg-acento/10 px-3 py-1.5 text-sm whitespace-nowrap text-acento"
                  >
                    {i + 1}. {ex.nome} <span className="text-acento/70">✕</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
          <BotaoPrimario disabled={escolhidos.length === 0 || ocupado} onClick={() => onConfirmar(escolhidos.map((e) => e.id))}>
            {escolhidos.length ? `${botao} (${escolhidos.length})` : botao}
          </BotaoPrimario>
        </div>
      </Pagina>
    </>
  )
}
