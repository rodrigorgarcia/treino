import { Link, useNavigate } from 'react-router'
import { SugestaoInstalar } from '../componentes/SugestaoInstalar'
import { BotaoPrimario, Carregando, Cronometro, Erro, Pagina, Rotulo } from '../componentes/ui'
import { mensagemDeErro, useIniciarSessao, useSessaoAberta, useSessoesRecentes } from '../lib/api'
import { contarExercicios, dataCurta, formatarDuracao, haQuanto, horaCurta, minutosDoIntervalo } from '../lib/formato'
import { supabase } from '../lib/supabase'
import { useAgora } from '../lib/useAgora'

const SEIS_HORAS = 6 * 60 * 60_000

export default function Inicio() {
  const navigate = useNavigate()
  const aberta = useSessaoAberta()
  const recentes = useSessoesRecentes()
  const iniciar = useIniciarSessao()
  const agora = useAgora()

  if (aberta.isPending) return <Carregando />
  const sessao = aberta.data
  const ultima = recentes.data?.[0]

  return (
    <Pagina>
      <div className="pt-[env(safe-area-inset-top)]">
        <h1 className="mt-4 mb-6 text-3xl font-bold">Treino</h1>
        <Erro>{(aberta.error || iniciar.error) && mensagemDeErro(aberta.error ?? iniciar.error)}</Erro>

        {sessao ? (
          <section className="mb-8 rounded-3xl border border-acento/30 bg-cartao p-5">
            <div className="mb-1 text-sm text-suave">Sessão em andamento</div>
            <div className="mb-4 text-2xl font-semibold">
              Desde {horaCurta(sessao.iniciada_em)} · <Cronometro desde={sessao.iniciada_em} />
            </div>
            {agora - Date.parse(sessao.iniciada_em) > SEIS_HORAS && (
              <p className="mb-4 rounded-xl bg-alerta/10 px-3 py-2 text-sm text-alerta">
                Aberta há mais de 6 horas. Esqueceu de encerrar?{' '}
                <button className="font-semibold underline" onClick={() => navigate('/sessao/encerrar')}>
                  Encerrar agora
                </button>
              </p>
            )}
            <BotaoPrimario onClick={() => navigate('/sessao')}>Continuar sessão</BotaoPrimario>
          </section>
        ) : (
          <section className="mb-8">
            <BotaoPrimario
              className="h-20 text-xl"
              disabled={iniciar.isPending}
              onClick={() => iniciar.mutate(undefined, { onSuccess: () => navigate('/sessao') })}
            >
              {iniciar.isPending ? 'Iniciando…' : 'Iniciar sessão'}
            </BotaoPrimario>
            {ultima && (
              <p className="mt-3 text-center text-sm text-suave">
                Último treino {haQuanto(ultima.iniciada_em)} · {ultima.titulo ?? 'sem título'}
              </p>
            )}
          </section>
        )}

        <SugestaoInstalar />

        <div className="flex items-baseline justify-between">
          <Rotulo>Sessões recentes</Rotulo>
          <Link to="/sessoes" className="mb-2 text-sm font-medium text-acento">
            Ver todas
          </Link>
        </div>
        {recentes.isPending && <p className="text-fraco">Carregando…</p>}
        <ul className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-cartao">
          {recentes.data?.map((s) => {
            const minutos = minutosDoIntervalo(s.duracao)
            return (
              <li key={s.id}>
                <Link to={`/sessoes/${s.id}`} className="block px-4 py-3 active:bg-cartao-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-medium">{s.titulo ?? 'Sessão'}</span>
                    <span className="shrink-0 text-sm text-suave tabular-nums">{dataCurta(s.iniciada_em)}</span>
                  </div>
                  <div className="text-sm text-fraco">
                    {contarExercicios(s.n_exercicios)}{minutos > 0 && ` · ${formatarDuracao(minutos)}`}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>

        <Link
          to="/exercicios"
          className="mt-4 block rounded-2xl border border-borda bg-cartao px-4 py-3 text-center font-medium active:bg-cartao-2"
        >
          Exercícios e evolução
        </Link>

        <button onClick={() => supabase.auth.signOut()} className="mt-10 w-full py-3 text-sm text-fraco">
          Sair
        </button>
      </div>
    </Pagina>
  )
}
