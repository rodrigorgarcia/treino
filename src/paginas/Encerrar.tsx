import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Deslizavel } from '../componentes/Deslizavel'
import { BotaoPrimario, BotaoSecundario, Cabecalho, Carregando, Cronometro, Erro, Pagina, Rotulo } from '../componentes/ui'
import { mensagemDeErro, useCatalogo, useDescartarSessao, useEncerrarSessao, useExecucoes } from '../lib/api'
import { contarExercicios, resumoSeries, rotuloDificuldade, tituloSugerido } from '../lib/formato'
import { ItemDoTreinoLinha } from './SessaoProgramada'
import { useSessao } from './useSessao'
import { useTirarDoTreino } from './useTreino'

export default function Encerrar() {
  const sessao = useSessao()
  const navigate = useNavigate()
  const catalogo = useCatalogo()
  const execucoes = useExecucoes(sessao.id)
  const encerrar = useEncerrarSessao()
  const descartar = useDescartarSessao()
  const tirar = useTirarDoTreino(sessao.id)

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
  const semDificuldade = feitos.filter((f) => !f.x.dificuldade) // "Como foi?" é obrigatório
  // Treino programado: só encerra sem exercício zerado (fazer ou tirar do treino).
  const zerados =
    sessao.modalidade === 'programado'
      ? (execucoes.data ?? []).flatMap((x, i) => {
          const ex = porId.get(x.exercicio_id)
          return ex && x.n_series === 0 ? [{ x, ex, numero: i + 1 }] : []
        })
      : []
  const erro = encerrar.error ?? descartar.error ?? tirar.erro ?? catalogo.error ?? execucoes.error
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
            {zerados.length > 0 && (
              <section className="mb-6 rounded-2xl border border-alerta/40 bg-alerta/10 p-4" data-testid="zerados">
                <div className="mb-1 font-medium text-alerta">Falta fazer</div>
                <p className="mb-3 text-sm text-suave">
                  Para encerrar, faça cada um ou tire do treino (deslize para a esquerda):
                </p>
                <ul className="divide-y divide-borda overflow-hidden rounded-xl border border-alerta/40 bg-cartao">
                  {zerados.map((item) => (
                    <li key={item.x.id}>
                      <Deslizavel {...tirar.linha(item)}>
                        <ItemDoTreinoLinha item={item} numero={item.numero} />
                      </Deslizavel>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {semDificuldade.length > 0 && (
              <section className="mb-6 rounded-2xl border border-alerta/40 bg-alerta/10 p-4" data-testid="sem-dificuldade">
                <div className="mb-1 font-medium text-alerta">Falta dizer como foi</div>
                <p className="mb-3 text-sm text-suave">Para encerrar, escolha “Como foi?” em cada exercício:</p>
                <ul className="space-y-2">
                  {semDificuldade.map(({ x, ex }) => (
                    <li key={x.id}>
                      <Link
                        to={`/sessao/exercicio/${ex.id}`}
                        className="flex items-center justify-between rounded-xl border border-alerta/40 bg-cartao px-4 py-3 active:bg-cartao-2"
                      >
                        <span className="font-medium">{ex.nome}</span>
                        <span className="text-sm text-alerta">responder ›</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

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
              disabled={encerrar.isPending || semDificuldade.length > 0 || zerados.length > 0}
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
