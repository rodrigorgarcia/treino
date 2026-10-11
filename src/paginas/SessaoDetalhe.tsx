import { useParams } from 'react-router'
import { Cabecalho, Carregando, Erro, Pagina, Rotulo } from '../componentes/ui'
import { mensagemDeErro, useSessaoDetalhe } from '../lib/api'
import { contarExercicios, dataLonga, formatarDuracao, minutosDoIntervalo, resumoSeries, rotuloDificuldade } from '../lib/formato'
import type { DetalheExercicio } from '../lib/tipos'

export default function SessaoDetalhe() {
  const { id = '' } = useParams()
  const detalhe = useSessaoDetalhe(id)

  if (detalhe.isPending) return <Carregando />
  const sessao = detalhe.data?.sessao
  const exercicios = detalhe.data?.exercicios ?? []
  const minutos = minutosDoIntervalo(sessao?.duracao ?? null)

  return (
    <>
      <Cabecalho voltar="/sessoes" voltarNoHistorico titulo={sessao?.titulo ?? 'Sessão'} />
      <Pagina>
        <Erro>{detalhe.error && mensagemDeErro(detalhe.error)}</Erro>
        {!sessao && !detalhe.error && <p className="text-fraco">Sessão não encontrada.</p>}
        {sessao && (
          <>
            <p className="mb-4 text-suave">
              {dataLonga(sessao.iniciada_em)}
              {minutos > 0 && ` · ${formatarDuracao(minutos)}`} · {contarExercicios(sessao.n_exercicios)}
            </p>

            {sessao.objetivo && (
              <section className="mb-4">
                <Rotulo>Objetivo</Rotulo>
                <p className="whitespace-pre-line">{sessao.objetivo}</p>
              </section>
            )}

            <ul className="mb-5 divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-cartao">
              {exercicios.map((x) => (
                <ItemExercicio key={x.id} x={x} />
              ))}
              {exercicios.length === 0 && <li className="px-4 py-3 text-fraco">Nenhum exercício registrado.</li>}
            </ul>

            {sessao.observacao && (
              <section className="mb-4">
                <Rotulo>Observações</Rotulo>
                <p className="text-sm whitespace-pre-line text-suave">{sessao.observacao}</p>
              </section>
            )}
          </>
        )}
      </Pagina>
    </>
  )
}

function ItemExercicio({ x }: { x: DetalheExercicio }) {
  const ex = x.exercicios
  const info = { tipo: ex.tipo, reps_por_lado: ex.reps_por_lado, regiao: ex.grupos.regiao }
  const resumo = resumoSeries(info, {
    reps: x.series.map((s) => s.reps),
    cargas: x.series.map((s) => s.carga_kg),
    duracao_s: x.series.reduce((t, s) => t + (s.duracao_s ?? 0), 0) || null,
    distancia_m: x.series.reduce((t, s) => t + (s.distancia_m ?? 0), 0) || null,
    andares: x.series.reduce((t, s) => t + (s.andares ?? 0), 0) || null,
  })
  const dificuldade = rotuloDificuldade(x.dificuldade)
  return (
    <li className="px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0">
          <span className="font-medium">
            {ex.tipo === 'cardio' && '🏃 '}
            {ex.nome}
          </span>
          <span className="ml-2 text-sm text-suave tabular-nums">{resumo}</span>
        </span>
        {dificuldade && <span className="shrink-0 text-sm text-suave">{dificuldade}</span>}
      </div>
      <div className="text-xs text-fraco">{ex.aparelhos?.nome ?? ex.grupos.nome}</div>
      {x.observacao && <div className="mt-1 text-sm text-fraco italic">“{x.observacao}”</div>}
    </li>
  )
}
