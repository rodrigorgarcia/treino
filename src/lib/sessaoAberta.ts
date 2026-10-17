import { createContext } from 'react'

// Início da sessão em andamento (ou null), para o cronômetro no topo de todas as telas.
export const SessaoAbertaContext = createContext<string | null>(null)
