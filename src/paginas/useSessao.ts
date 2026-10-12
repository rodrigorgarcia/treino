import { useOutletContext } from 'react-router'
import type { Sessao } from '../lib/tipos'

// Sessão em andamento, fornecida pelo SessaoLayout.
export function useSessao(): Sessao {
  return useOutletContext<Sessao>()
}
