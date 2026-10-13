import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { ListaExercicios } from '../componentes/ListaExercicios'
import { BotaoSecundario, Cabecalho, Cronometro, Erro, Pagina, Rotulo } from '../componentes/ui'
import { mensagemDeErro, useCatalogo, useExecucoes } from '../lib/api'
import type { Execucao } from '../lib/tipos'
import { useSessao } from './useSessao'

export default function Sessao() {
  const sessao = useSessao()
  const navigate = useNavigate()
  const catalogo = useCatalogo()
  const execucoes = useExecucoes(sessao.id)

  const feitos = useMemo(() => {
    const mapa = new Map<string, Execucao>()
    for (const e of execucoes.data ?? []) if (e.n_series > 0) mapa.set(e.exercicio_id, e)
    return mapa
  }, [execucoes.data])

  const feitosHoje = (catalogo.data ?? []).filter((e) => feitos.has(e.id))

  return (
    <>
      <Cabecalho
        voltar="/"
        titulo={
          <>
            Sessão · <Cronometro desde={sessao.iniciada_em} />
          </>
        }
        direita={
          <button onClick={() => navigate('/sessao/encerrar')} className="h-10 rounded-xl px-3 font-medium text-acento">
            Encerrar
          </button>
        }
      />
      <Pagina>
        <Erro>{(catalogo.error || execucoes.error) && mensagemDeErro(catalogo.error ?? execucoes.error)}</Erro>

        {feitosHoje.length > 0 && (
          <section className="mb-5">
            <Rotulo>Feitos hoje ({feitosHoje.length})</Rotulo>
            <div className="flex flex-wrap gap-2">
              {feitosHoje
                .sort((a, b) => feitos.get(a.id)!.iniciado_em.localeCompare(feitos.get(b.id)!.iniciado_em))
                .map((e) =>
                  feitos.get(e.id)!.dificuldade ? (
                    <Link
                      key={e.id}
                      to={`/sessao/exercicio/${e.id}`}
                      className="rounded-full border border-acento/40 bg-acento/10 px-3 py-2 text-sm text-acento"
                    >
                      ✓ {e.nome}
                    </Link>
                  ) : (
                    // falta dizer "Como foi?": obrigatório para encerrar a sessão
                    <Link
                      key={e.id}
                      to={`/sessao/exercicio/${e.id}`}
                      className="rounded-full border border-alerta/50 bg-alerta/10 px-3 py-2 text-sm text-alerta"
                    >
                      {e.nome} · como foi?
                    </Link>
                  ),
                )}
            </div>
          </section>
        )}

        <ListaExercicios
          catalogo={catalogo.data}
          carregando={catalogo.isPending}
          link={(e) => `/sessao/exercicio/${e.id}`}
          feitos={feitos}
          rodape={(regiao) => (
            <BotaoSecundario className="w-full" onClick={() => navigate(`/sessao/novo-exercicio?regiao=${regiao}`)}>
              + Novo exercício
            </BotaoSecundario>
          )}
        />
      </Pagina>
    </>
  )
}
