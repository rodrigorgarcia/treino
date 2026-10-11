import { ListaExercicios } from '../componentes/ListaExercicios'
import { Cabecalho, Erro, Pagina } from '../componentes/ui'
import { mensagemDeErro, useCatalogo } from '../lib/api'

// Catálogo fora da sessão: cada exercício abre o seu histórico e evolução.
export default function Exercicios() {
  const catalogo = useCatalogo()
  return (
    <>
      <Cabecalho voltar="/" voltarNoHistorico titulo="Exercícios" />
      <Pagina>
        <Erro>{catalogo.error && mensagemDeErro(catalogo.error)}</Erro>
        <ListaExercicios catalogo={catalogo.data} carregando={catalogo.isPending} link={(e) => `/exercicios/${e.id}`} />
      </Pagina>
    </>
  )
}
