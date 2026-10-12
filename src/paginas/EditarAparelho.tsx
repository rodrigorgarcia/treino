import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { BotaoPrimario, Cabecalho, Campo, Carregando, Erro, Pagina, Rotulo } from '../componentes/ui'
import {
  mensagemDeErro, useAparelho, useAtualizarAparelho, useCriarAparelho, useExcluirAparelho, type DadosAparelho,
} from '../lib/api'
import { useVoltar } from '../lib/useVoltar'
import { AREA, CAMPO } from '../lib/estilos'
import { lerNumero, numero } from '../lib/formato'

// Sem :id, cria um aparelho novo (/aparelhos/novo).
export default function EditarAparelho() {
  const { id } = useParams()
  return id ? <Editar id={id} /> : <Criar />
}

function Criar() {
  const voltar = useVoltar()
  const criar = useCriarAparelho()
  return (
    <>
      <Cabecalho voltar="/aparelhos" voltarNoHistorico titulo="Novo aparelho" />
      <Pagina>
        <FormAparelho botao="Criar aparelho" salvando={criar.isPending} onSalvar={(dados) => criar.mutate(dados, { onSuccess: () => voltar('/aparelhos') })}>
          <Erro>{criar.error && mensagemDeErro(criar.error)}</Erro>
        </FormAparelho>
      </Pagina>
    </>
  )
}

function Editar({ id }: { id: string }) {
  const navigate = useNavigate()
  const voltar = useVoltar()
  const aparelho = useAparelho(id)
  const atualizar = useAtualizarAparelho()
  const excluir = useExcluirAparelho()

  if (aparelho.isPending) return <Carregando />
  const a = aparelho.data
  const erro = atualizar.error ?? excluir.error ?? aparelho.error
  const ocupado = atualizar.isPending || excluir.isPending

  if (!a) {
    return (
      <>
        <Cabecalho voltar="/aparelhos" voltarNoHistorico titulo="Aparelho" />
        <Pagina>
          <Erro>{erro && mensagemDeErro(erro)}</Erro>
          {!erro && <p className="text-fraco">Aparelho não encontrado.</p>}
        </Pagina>
      </>
    )
  }

  function apagar() {
    if (!window.confirm(`Excluir “${a!.nome}”? Não dá para desfazer.`)) return
    excluir.mutate(id, { onSuccess: () => navigate('/aparelhos', { replace: true }) })
  }

  return (
    <>
      <Cabecalho voltar="/aparelhos" voltarNoHistorico titulo="Editar aparelho" />
      <Pagina>
        <FormAparelho
          key={id}
          inicial={a}
          botao="Salvar"
          salvando={ocupado}
          onSalvar={(dados) => atualizar.mutate({ id, ...dados }, { onSuccess: () => voltar('/aparelhos') })}
        >
          <Erro>{erro && mensagemDeErro(erro)}</Erro>
        </FormAparelho>

        <section className="mt-10 border-t border-borda pt-5">
          {a.exercicios.length > 0 ? (
            <>
              <Rotulo>Exercícios neste aparelho ({a.exercicios.length})</Rotulo>
              <ul className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-cartao">
                {a.exercicios.map((e) => (
                  <li key={e.id}>
                    <Link to={`/exercicios/${e.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-cartao-2">
                      <span className="min-w-0 flex-1 truncate">{e.nome}</span>
                      {e.arquivado && <span className="text-sm text-fraco">arquivado</span>}
                      <span className="text-2xl text-fraco">›</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-fraco">Para excluir o aparelho, troque o aparelho desses exercícios antes.</p>
            </>
          ) : (
            <button onClick={apagar} disabled={ocupado} className="h-12 w-full rounded-xl text-perigo active:bg-perigo/10 disabled:opacity-50">
              Excluir aparelho
            </button>
          )}
        </section>
      </Pagina>
    </>
  )
}

function FormAparelho({
  inicial, botao, salvando, onSalvar, children,
}: {
  inicial?: DadosAparelho
  botao: string
  salvando: boolean
  onSalvar: (dados: DadosAparelho) => void
  children?: ReactNode
}) {
  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [passo, setPasso] = useState(inicial ? numero(inicial.incremento_kg) : '5')
  const [observacao, setObservacao] = useState(inicial?.observacao ?? '')

  const passoKg = lerNumero(passo)
  const passoValido = passoKg !== null && passoKg > 0 && passoKg < 1000

  function salvar(e: FormEvent) {
    e.preventDefault()
    if (!passoValido) return
    onSalvar({ nome: nome.trim(), incremento_kg: passoKg, observacao: observacao.trim() || null })
  }

  return (
    <form onSubmit={salvar} className="space-y-5">
      {children}
      <Campo rotulo="Nome">
        <input required autoFocus={!inicial} value={nome} onChange={(e) => setNome(e.target.value)} className={CAMPO} placeholder="Ex.: Smith" />
      </Campo>
      <Campo
        rotulo="Passo do + / − (kg)"
        dica={
          passoValido ? (
            'Vale para os exercícios deste aparelho que não têm passo próprio.'
          ) : (
            <span className="text-perigo">Use um número maior que zero, como 2,5.</span>
          )
        }
      >
        <input required inputMode="decimal" value={passo} onChange={(e) => setPasso(e.target.value)} className={CAMPO} />
      </Campo>
      <Campo rotulo="Observação">
        <textarea
          rows={2}
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          className={AREA}
          placeholder="Ex.: vai até 100 kg, de 10 em 10"
        />
      </Campo>
      <BotaoPrimario type="submit" disabled={salvando || !nome.trim() || !passoValido}>
        {botao}
      </BotaoPrimario>
    </form>
  )
}
