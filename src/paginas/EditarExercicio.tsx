import { useNavigate, useParams, useSearchParams } from 'react-router'
import { FormExercicio } from '../componentes/FormExercicio'
import { BotaoSecundario, Cabecalho, Carregando, Erro, Pagina, Rotulo } from '../componentes/ui'
import {
  mensagemDeErro, useAparelhos, useAtualizarExercicio, useCriarExercicio, useExcluirExercicio, useExercicioEdicao, useGrupos,
} from '../lib/api'
import type { Regiao } from '../lib/tipos'
import { useVoltar } from '../lib/useVoltar'

// Sem :id, cria um exercício novo no catálogo (/exercicios/novo).
export default function EditarExercicio() {
  const { id } = useParams()
  return id ? <Editar id={id} /> : <Criar />
}

function Criar() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const grupos = useGrupos()
  const aparelhos = useAparelhos()
  const criar = useCriarExercicio()

  if (grupos.isPending || aparelhos.isPending) return <Carregando />
  const erro = criar.error ?? grupos.error ?? aparelhos.error

  return (
    <>
      <Cabecalho voltar="/exercicios" voltarNoHistorico titulo="Novo exercício" />
      <Pagina>
        <FormExercicio
          grupos={grupos.data ?? []}
          aparelhos={aparelhos.data ?? []}
          regiaoInicial={params.get('regiao') as Regiao | null}
          botao="Criar exercício"
          salvando={criar.isPending}
          onSalvar={(dados) => criar.mutate(dados, { onSuccess: ({ id }) => navigate(`/exercicios/${id}`, { replace: true }) })}
        >
          <Erro>{erro && mensagemDeErro(erro)}</Erro>
        </FormExercicio>
      </Pagina>
    </>
  )
}

function Editar({ id }: { id: string }) {
  const navigate = useNavigate()
  const voltar = useVoltar()
  const edicao = useExercicioEdicao(id)
  const grupos = useGrupos()
  const aparelhos = useAparelhos()
  const atualizar = useAtualizarExercicio()
  const excluir = useExcluirExercicio()

  if (edicao.isPending || grupos.isPending || aparelhos.isPending) return <Carregando />
  const ex = edicao.data?.exercicio
  const usos = edicao.data?.usos ?? 0
  const erro = atualizar.error ?? excluir.error ?? edicao.error ?? grupos.error ?? aparelhos.error
  const ocupado = atualizar.isPending || excluir.isPending

  if (!ex) {
    return (
      <>
        <Cabecalho voltar="/exercicios" voltarNoHistorico titulo="Editar exercício" />
        <Pagina>
          <Erro>{erro && mensagemDeErro(erro)}</Erro>
          {!erro && <p className="text-fraco">Exercício não encontrado.</p>}
        </Pagina>
      </>
    )
  }

  function arquivar(arquivado: boolean) {
    atualizar.mutate({ id, arquivado })
  }

  function apagar() {
    if (!window.confirm(`Excluir “${ex!.nome}”? Não dá para desfazer.`)) return
    excluir.mutate(id, { onSuccess: () => navigate('/exercicios', { replace: true }) })
  }

  return (
    <>
      <Cabecalho voltar={`/exercicios/${id}`} voltarNoHistorico titulo="Editar exercício" />
      <Pagina>
        {ex.arquivado && (
          <p className="mb-4 rounded-xl border border-borda bg-cartao-2 px-3 py-2 text-sm text-suave">
            Arquivado: não aparece na lista da sessão; continua na consulta de exercícios.
          </p>
        )}
        <FormExercicio
          key={id}
          grupos={grupos.data ?? []}
          aparelhos={aparelhos.data ?? []}
          inicial={ex}
          usos={usos}
          botao="Salvar"
          salvando={ocupado}
          maisOpcoesAbertas
          onSalvar={(dados) => atualizar.mutate({ id, ...dados }, { onSuccess: () => voltar(`/exercicios/${id}`) })}
        >
          <Erro>{erro && mensagemDeErro(erro)}</Erro>
        </FormExercicio>

        <section className="mt-10 border-t border-borda pt-5">
          <Rotulo>{ex.arquivado ? 'Arquivado' : 'Arquivar'}</Rotulo>
          {ex.arquivado ? (
            <BotaoSecundario className="w-full" disabled={ocupado} onClick={() => arquivar(false)}>
              Reativar
            </BotaoSecundario>
          ) : (
            <>
              <BotaoSecundario className="w-full" disabled={ocupado} onClick={() => arquivar(true)}>
                Arquivar
              </BotaoSecundario>
              <p className="mt-1.5 text-sm text-fraco">Some da lista da sessão; continua na consulta de exercícios, com o histórico, e dá para reativar.</p>
            </>
          )}
          {usos === 0 ? (
            <button onClick={apagar} disabled={ocupado} className="mt-4 h-12 w-full rounded-xl text-perigo active:bg-perigo/10 disabled:opacity-50">
              Excluir exercício
            </button>
          ) : (
            <p className="mt-4 text-sm text-fraco">
              Já feito {usos === 1 ? '1 vez' : `${usos} vezes`}, por isso não dá para excluir.
            </p>
          )}
        </section>
      </Pagina>
    </>
  )
}
