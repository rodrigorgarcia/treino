import { Link } from 'react-router'
import { Cabecalho, Carregando, Erro, Pagina } from '../componentes/ui'
import { mensagemDeErro, useArquivados } from '../lib/api'
import { dataCurta } from '../lib/formato'

// Exercícios fora do catálogo. Cada um abre o histórico; de lá, "Editar" restaura.
export default function Arquivados() {
  const arquivados = useArquivados()

  return (
    <>
      <Cabecalho voltar="/exercicios" voltarNoHistorico titulo="Arquivados" />
      <Pagina>
        <Erro>{arquivados.error && mensagemDeErro(arquivados.error)}</Erro>
        {arquivados.isPending ? (
          <Carregando />
        ) : arquivados.data?.length ? (
          <ul className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-cartao">
            {arquivados.data.map((e) => (
              <li key={e.id}>
                <Link to={`/exercicios/${e.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-cartao-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{e.nome}</div>
                    <div className="truncate text-sm text-fraco">
                      {e.grupo}
                      {e.ultima_em ? ` · última vez ${dataCurta(e.ultima_em)}` : ' · nunca feito'}
                    </div>
                  </div>
                  <span className="text-2xl text-fraco">›</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-fraco">Nenhum exercício arquivado.</p>
        )}
      </Pagina>
    </>
  )
}
