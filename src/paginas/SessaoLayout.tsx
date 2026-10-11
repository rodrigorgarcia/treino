import { Navigate, Outlet } from 'react-router'
import { Carregando, Erro, Pagina } from '../componentes/ui'
import { mensagemDeErro, useSessaoAberta } from '../lib/api'

// Telas dentro de /sessao só existem com uma sessão em andamento.
export default function SessaoLayout() {
  const { data: sessao, isPending, error } = useSessaoAberta()
  if (isPending) return <Carregando />
  if (error) return <Pagina><Erro>{mensagemDeErro(error)}</Erro></Pagina>
  if (!sessao) return <Navigate to="/" replace />
  return <Outlet context={sessao} />
}

