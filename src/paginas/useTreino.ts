import { useState } from 'react'
import { useCatalogo, useExecucoes, useTirarDaSessao } from '../lib/api'
import type { Execucao, ItemCatalogo } from '../lib/tipos'

export interface ItemDoTreino {
  x: Execucao
  ex: ItemCatalogo
}

// Os exercícios da sessão na ordem do treino, com os dados do catálogo.
export function useItensDoTreino(sessaoId: string) {
  const catalogo = useCatalogo()
  const execucoes = useExecucoes(sessaoId)
  const porId = new Map((catalogo.data ?? []).map((e) => [e.id, e]))
  const itens: ItemDoTreino[] = (execucoes.data ?? []).flatMap((x) => {
    const ex = porId.get(x.exercicio_id)
    return ex ? [{ x, ex }] : []
  })
  return { itens, carregando: catalogo.isPending || execucoes.isPending, erro: catalogo.error ?? execucoes.error }
}

// Tirar do treino pela lista. Vazio sai na hora; com séries, pede confirmação.
export function useTirarDoTreino(sessaoId: string) {
  const tirar = useTirarDaSessao(sessaoId)
  const [aberto, setAberto] = useState<string | null>(null) // linha deslizada (uma por vez)

  function linha({ x, ex }: ItemDoTreino) {
    return {
      aberto: aberto === x.id,
      onAberto: (a: boolean) => setAberto(a ? x.id : null),
      acao: 'Tirar',
      rotuloAcao: `Tirar ${ex.nome} do treino`,
      onAcao: () => {
        setAberto(null)
        if (x.n_series > 0) {
          const apagadas = x.n_series === 1 ? 'A série registrada será apagada.' : `As ${x.n_series} séries registradas serão apagadas.`
          if (!window.confirm(`Tirar “${ex.nome}” do treino? ${apagadas}`)) return
        }
        tirar.mutate({ registroId: x.id, exercicioId: ex.id })
      },
    }
  }
  return { linha, erro: tirar.error }
}
