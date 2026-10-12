import { Link, useNavigate } from 'react-router'
import { ListaExercicios } from '../componentes/ListaExercicios'
import { BotaoSecundario, Cabecalho, Erro, Pagina } from '../componentes/ui'
import { mensagemDeErro, useArquivados, useCatalogo } from '../lib/api'

// Catálogo fora da sessão: cada exercício abre o seu histórico e evolução; daqui também se cria e edita.
export default function Exercicios() {
  const navigate = useNavigate()
  const catalogo = useCatalogo()
  const arquivados = useArquivados()
  const nArquivados = arquivados.data?.length ?? 0

  return (
    <>
      <Cabecalho
        voltar="/"
        voltarNoHistorico
        titulo="Exercícios"
        direita={
          <Link to="/aparelhos" className="flex h-10 items-center rounded-xl px-3 font-medium text-acento">
            Aparelhos
          </Link>
        }
      />
      <Pagina>
        <Erro>{catalogo.error && mensagemDeErro(catalogo.error)}</Erro>
        <ListaExercicios
          catalogo={catalogo.data}
          carregando={catalogo.isPending}
          link={(e) => `/exercicios/${e.id}`}
          rodape={(regiao) => (
            <>
              <BotaoSecundario className="w-full" onClick={() => navigate(`/exercicios/novo?regiao=${regiao}`)}>
                + Novo exercício
              </BotaoSecundario>
              {nArquivados > 0 && (
                <Link to="/exercicios/arquivados" className="mt-3 block py-2 text-center text-sm text-fraco">
                  Arquivados ({nArquivados})
                </Link>
              )}
            </>
          )}
        />
      </Pagina>
    </>
  )
}
