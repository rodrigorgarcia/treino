import { useState } from 'react'
import { useNavigate } from 'react-router'
import { BotaoPrimario, BotaoSecundario, Cabecalho, Carregando, Cronometro, Erro, Pagina, Rotulo } from '../componentes/ui'
import { mensagemDeErro, useCatalogo, useDescartarSessao, useEncerrarSessao, useExecucoes } from '../lib/api'
import { contarExercicios, resumoSeries, rotuloDificuldade, tituloSugerido } from '../lib/formato'
import { useSessao } from './useSessao'

export default function Encerrar() {
  const sessao = useSessao()
  const navigate = useNavigate()
  const catalogo = useCatalogo()
  const execucoes = useExecucoes(sessao.id)
  const encerrar = useEncerrarSessao()
  const descartar = useDescartarSessao()

  const [titulo, setTitulo] = useState<string | null>(sessao.titulo)
  const [objetivo, setObjetivo] = useState(sessao.objetivo ?? '')
  const [observacao, setObservacao] = useState(sessao.observacao ?? '')

  if (catalogo.isPending || execucoes.isPending) return <Carregando />

  const porId = new Map((catalogo.data ?? []).map((e) => [e.id, e]))
  const feitos = (execucoes.data ?? [])
    .filter((x) => x.n_series > 0)
    .flatMap((x) => {
      const ex = porId.get(x.exercicio_id)
      return ex ? [{ x, ex }] : []
    })
  const sugerido = tituloSugerido(feitos.map((f) => f.ex.regiao))
  const erro = encerrar.error ?? descartar.error ?? catalogo.error ?? execucoes.error
  const campo = 'w-full rounded-xl border border-borda bg-cartao px-4 py-3 outline-none focus:border-acento'

  return (
    <>
      <Cabecalho voltar="/sessao" titulo="Encerrar sessão" />
      <Pagina>
        <Erro>{erro && mensagemDeErro(erro)}</Erro>
        <p className="mb-4 text-suave">
          Duração: <Cronometro desde={sessao.iniciada_em} /> · {contarExercicios(feitos.length)}
        </p>

        {feitos.length === 0 ? (
          <section className="space-y-3">
            <p>Nenhum exercício registrado nesta sessão.</p>
            <BotaoSecundario
              className="w-full text-perigo"
              disabled={descartar.isPending}
              onClick={() => descartar.mutate(sessao.id, { onSuccess: () => navigate('/', { replace: true }) })}
            >
              Descartar sessão
            </BotaoSecundario>
            <BotaoSecundario className="w-full" onClick={() => navigate('/sessao')}>
              Voltar para a sessão
            </BotaoSecundario>
          </section>
        ) : (
          <>
            <ul className="mb-6 divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-cartao">
              {feitos.map(({ x, ex }) => (
                <li key={x.id} className="px-4 py-3">
                  <div className="font-medium">{ex.nome}</div>
                  <div className="text-sm text-suave">
                    {resumoSeries(ex, { reps: x.reps, cargas: x.cargas_kg, duracao_s: x.duracao_s, distancia_m: x.distancia_m, andares: x.andares })}
                    {x.dificuldade && ` · ${rotuloDificuldade(x.dificuldade)}`}
                  </div>
                </li>
              ))}
            </ul>

            <div className="mb-6 space-y-4">
              <label className="block">
                <Rotulo>Título</Rotulo>
                <input value={titulo ?? sugerido} onChange={(e) => setTitulo(e.target.value)} className={campo} />
              </label>
              <label className="block">
                <Rotulo>Objetivo (opcional)</Rotulo>
                <input value={objetivo} onChange={(e) => setObjetivo(e.target.value)} className={campo} placeholder="Ex.: progressão de carga" />
              </label>
              <label className="block">
                <Rotulo>Observação (opcional)</Rotulo>
                <textarea rows={3} value={observacao} onChange={(e) => setObservacao(e.target.value)} className={campo} />
              </label>
            </div>

            <BotaoPrimario
              disabled={encerrar.isPending}
              onClick={() =>
                encerrar.mutate(
                  {
                    id: sessao.id,
                    titulo: (titulo ?? sugerido).trim() || null,
                    objetivo: objetivo.trim() || null,
                    observacao: observacao.trim() || null,
                  },
                  { onSuccess: () => navigate('/', { replace: true }) },
                )
              }
            >
              Encerrar sessão
            </BotaoPrimario>
          </>
        )}
      </Pagina>
    </>
  )
}
