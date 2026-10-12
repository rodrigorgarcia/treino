import { Link, useNavigate } from 'react-router'
import { BotaoSecundario, Cabecalho, Carregando, Erro, Pagina } from '../componentes/ui'
import { mensagemDeErro, useAparelhos } from '../lib/api'
import { contarExercicios, numero } from '../lib/formato'

export default function Aparelhos() {
  const navigate = useNavigate()
  const aparelhos = useAparelhos()

  return (
    <>
      <Cabecalho voltar="/exercicios" voltarNoHistorico titulo="Aparelhos" />
      <Pagina>
        <Erro>{aparelhos.error && mensagemDeErro(aparelhos.error)}</Erro>
        <p className="mb-4 text-sm text-suave">O passo é quanto os botões + / − mudam a carga nos exercícios do aparelho.</p>
        {aparelhos.isPending ? (
          <Carregando />
        ) : (
          <ul className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-cartao">
            {aparelhos.data?.map((a) => {
              const n = a.exercicios?.[0]?.count ?? 0
              return (
                <li key={a.id}>
                  <Link to={`/aparelhos/${a.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-cartao-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{a.nome}</div>
                      <div className="truncate text-sm text-fraco">
                        passo {numero(a.incremento_kg)} kg · {n === 0 ? 'sem exercícios' : contarExercicios(n)}
                        {a.observacao && ` · ${a.observacao}`}
                      </div>
                    </div>
                    <span className="text-2xl text-fraco">›</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        <BotaoSecundario className="mt-4 w-full" onClick={() => navigate('/aparelhos/novo')}>
          + Novo aparelho
        </BotaoSecundario>
      </Pagina>
    </>
  )
}
