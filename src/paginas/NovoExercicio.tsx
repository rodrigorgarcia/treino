import { useNavigate, useSearchParams } from 'react-router'
import { FormExercicio } from '../componentes/FormExercicio'
import { Cabecalho, Carregando, Erro, Pagina } from '../componentes/ui'
import { mensagemDeErro, useAparelhos, useCriarExercicio, useGrupos } from '../lib/api'
import type { Regiao } from '../lib/tipos'

// Novo exercício no meio da sessão: cria e já abre o registro.
export default function NovoExercicio() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const grupos = useGrupos()
  const aparelhos = useAparelhos()
  const criar = useCriarExercicio()

  if (grupos.isPending || aparelhos.isPending) return <Carregando />
  const erro = criar.error ?? grupos.error ?? aparelhos.error

  return (
    <>
      <Cabecalho voltar="/sessao" titulo="Novo exercício" />
      <Pagina>
        <FormExercicio
          grupos={grupos.data ?? []}
          aparelhos={aparelhos.data ?? []}
          regiaoInicial={params.get('regiao') as Regiao | null}
          botao="Criar e registrar"
          salvando={criar.isPending}
          onSalvar={(dados) => criar.mutate(dados, { onSuccess: ({ id }) => navigate(`/sessao/exercicio/${id}`, { replace: true }) })}
        >
          <Erro>{erro && mensagemDeErro(erro)}</Erro>
        </FormExercicio>
      </Pagina>
    </>
  )
}
