import { Link, useNavigate } from 'react-router'
import { ListaExercicios } from '../componentes/ListaExercicios'
import { BotaoSecundario, Cabecalho, Erro, Pagina } from '../componentes/ui'
import { mensagemDeErro, useCatalogo } from '../lib/api'

// Catálogo fora da sessão, com os arquivados (marcados, no fim de cada grupo): cada exercício
// abre o seu histórico e evolução, de onde se arquiva, reativa e edita.
export default function Exercicios() {
  const navigate = useNavigate()
  const catalogo = useCatalogo()

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
        <Link
          to="/exercicios/relatorio"
          className="mb-4 flex items-center gap-3 rounded-2xl border border-borda bg-cartao px-4 py-3 active:bg-cartao-2"
        >
          <div className="min-w-0 flex-1">
            <div className="font-medium">Relatório de carga e repetições</div>
            <div className="text-sm text-fraco">Semanal ou mensal, todos os grupos somados</div>
          </div>
          <span className="text-2xl text-fraco">›</span>
        </Link>
        <ListaExercicios
          catalogo={catalogo.data}
          carregando={catalogo.isPending}
          link={(e) => `/exercicios/${e.id}`}
          rodape={(regiao) => (
            <BotaoSecundario className="w-full" onClick={() => navigate(`/exercicios/novo?regiao=${regiao}`)}>
              + Novo exercício
            </BotaoSecundario>
          )}
        />
      </Pagina>
    </>
  )
}
