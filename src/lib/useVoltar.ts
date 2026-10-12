import { useNavigate } from 'react-router'

// Volta para a tela anterior; se o app abriu direto nesta tela, vai para `destino`.
export function useVoltar() {
  const navigate = useNavigate()
  return (destino: string) => {
    const temAnterior = ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0
    if (temAnterior) navigate(-1)
    else navigate(destino, { replace: true })
  }
}
