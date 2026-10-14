import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { ListaExercicios } from '../componentes/ListaExercicios'
import { BotaoPrimario, BotaoSecundario, Cabecalho, Campo, Carregando, Erro, Pagina, Rotulo } from '../componentes/ui'
import { mensagemDeErro, useAtualizarSessao, useCatalogo, useExcluirSessao, useSessaoDetalhe } from '../lib/api'
import { AREA, CAMPO } from '../lib/estilos'
import { deCampoDataHora, diaSemanaCurto, lerNumero, paraCampoDataHora, resumoDetalhe } from '../lib/formato'
import type { ResumoSessao } from '../lib/tipos'
import { useVoltar } from '../lib/useVoltar'

// Corrigir uma sessão encerrada: exercícios (cada um abre a tela de registro), dados da sessão e excluir.
export default function EditarSessao() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const veioDoDetalhe = (useLocation().state as { doDetalhe?: boolean } | null)?.doDetalhe ?? false
  const detalhe = useSessaoDetalhe(id)
  const excluir = useExcluirSessao()

  if (detalhe.isPending) return <Carregando />
  const sessao = detalhe.data?.sessao
  const exercicios = detalhe.data?.exercicios ?? []
  if (sessao && !sessao.encerrada_em) return <Navigate to="/sessao" replace />

  function apagar() {
    if (!sessao) return
    const aviso = `Excluir a sessão de ${diaSemanaCurto(sessao.iniciada_em)}? Todos os exercícios e séries dela serão apagados. Não dá para desfazer.`
    if (!window.confirm(aviso)) return
    // Pula também o detalhe da sessão apagada: volta para a lista de onde ela foi aberta.
    excluir.mutate(id, {
      onSuccess: () => {
        const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
        if (veioDoDetalhe && idx >= 2) navigate(-2)
        else navigate('/sessoes', { replace: true })
      },
    })
  }

  return (
    <>
      <Cabecalho voltar={`/sessoes/${id}`} voltarNoHistorico titulo="Editar sessão" />
      <Pagina>
        <Erro>{(detalhe.error || excluir.error) && mensagemDeErro(detalhe.error ?? excluir.error)}</Erro>
        {!sessao && !detalhe.error && <p className="text-fraco">Sessão não encontrada.</p>}
        {sessao && (
          <>
            <Rotulo>Exercícios ({exercicios.length})</Rotulo>
            <ul className="mb-3 divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-cartao">
              {exercicios.map((x) => (
                <li key={x.id}>
                  <Link to={`/sessoes/${id}/exercicio/${x.exercicios.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-cartao-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{x.exercicios.nome}</div>
                      <div className="truncate text-sm text-fraco tabular-nums">{x.series.length ? resumoDetalhe(x) : 'sem séries'}</div>
                    </div>
                    <span className="text-sm text-fraco">corrigir</span>
                  </Link>
                </li>
              ))}
              {exercicios.length === 0 && <li className="px-4 py-3 text-fraco">Nenhum exercício registrado.</li>}
            </ul>
            <BotaoSecundario className="mb-8 w-full" onClick={() => navigate(`/sessoes/${id}/adicionar`)}>
              + Adicionar exercício esquecido
            </BotaoSecundario>

            <FormSessao key={sessao.id} sessao={sessao} />

            <section className="mt-10 border-t border-borda pt-5">
              <button
                onClick={apagar}
                disabled={excluir.isPending}
                className="h-12 w-full rounded-xl text-perigo active:bg-perigo/10 disabled:opacity-50"
              >
                Excluir sessão
              </button>
            </section>
          </>
        )}
      </Pagina>
    </>
  )
}

function FormSessao({ sessao }: { sessao: ResumoSessao }) {
  const voltar = useVoltar()
  const atualizar = useAtualizarSessao()
  const minutosIniciais = Math.round((Date.parse(sessao.encerrada_em!) - Date.parse(sessao.iniciada_em)) / 60_000)
  const [titulo, setTitulo] = useState(sessao.titulo ?? '')
  const [inicio, setInicio] = useState(paraCampoDataHora(sessao.iniciada_em))
  const [duracao, setDuracao] = useState(String(minutosIniciais))
  const [objetivo, setObjetivo] = useState(sessao.objetivo ?? '')
  const [observacao, setObservacao] = useState(sessao.observacao ?? '')

  const minutos = lerNumero(duracao)
  const duracaoValida = minutos !== null && Number.isInteger(minutos) && minutos >= 0 && minutos <= 24 * 60
  const valido = duracaoValida && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(inicio)

  function salvar(e: FormEvent) {
    e.preventDefault()
    if (!valido) return
    const iniciada = deCampoDataHora(inicio)
    atualizar.mutate(
      {
        id: sessao.id,
        titulo: titulo.trim() || null,
        objetivo: objetivo.trim() || null,
        observacao: observacao.trim() || null,
        iniciada_em: iniciada,
        encerrada_em: new Date(Date.parse(iniciada) + minutos! * 60_000).toISOString(),
      },
      { onSuccess: () => voltar(`/sessoes/${sessao.id}`) },
    )
  }

  return (
    <form onSubmit={salvar} className="space-y-5">
      <Rotulo>Dados da sessão</Rotulo>
      <Erro>{atualizar.error && mensagemDeErro(atualizar.error)}</Erro>
      <Campo rotulo="Título">
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className={CAMPO} placeholder="Ex.: Treino Inferiores" />
      </Campo>
      <div className="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-3">
        <Campo rotulo="Início">
          <input type="datetime-local" required value={inicio} onChange={(e) => setInicio(e.target.value)} className={`${CAMPO} min-w-0`} />
        </Campo>
        <Campo rotulo="Duração (min)">
          <input inputMode="numeric" required value={duracao} onChange={(e) => setDuracao(e.target.value)} className={`${CAMPO} min-w-0`} />
        </Campo>
      </div>
      {!duracaoValida && <p className="-mt-3 text-sm text-perigo">Duração em minutos, de 0 a 1440.</p>}
      <Campo rotulo="Objetivo">
        <textarea rows={2} value={objetivo} onChange={(e) => setObjetivo(e.target.value)} className={AREA} />
      </Campo>
      <Campo rotulo="Observações">
        <textarea rows={3} value={observacao} onChange={(e) => setObservacao(e.target.value)} className={AREA} />
      </Campo>
      <BotaoPrimario type="submit" disabled={atualizar.isPending || !valido}>
        Salvar dados da sessão
      </BotaoPrimario>
    </form>
  )
}

// Escolher um exercício para incluir numa sessão passada; a escolha substitui esta tela no histórico.
export function AdicionarNaSessao() {
  const { id = '' } = useParams()
  const catalogo = useCatalogo()
  return (
    <>
      <Cabecalho voltar={`/sessoes/${id}/editar`} voltarNoHistorico titulo="Adicionar exercício" />
      <Pagina>
        <Erro>{catalogo.error && mensagemDeErro(catalogo.error)}</Erro>
        <ListaExercicios
          catalogo={catalogo.data?.filter((e) => !e.arquivado)}
          carregando={catalogo.isPending}
          link={(e) => `/sessoes/${id}/exercicio/${e.id}`}
          substituir
        />
      </Pagina>
    </>
  )
}
