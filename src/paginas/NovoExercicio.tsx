import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { BotaoPrimario, Cabecalho, Carregando, Erro, Pagina, Rotulo } from '../componentes/ui'
import { mensagemDeErro, useAparelhos, useCriarExercicio, useGrupos } from '../lib/api'
import { REGIOES, TIPOS } from '../lib/formato'
import type { TipoExercicio } from '../lib/tipos'

export default function NovoExercicio() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const grupos = useGrupos()
  const aparelhos = useAparelhos()
  const criar = useCriarExercicio()

  const regiaoInicial = params.get('regiao')
  const [nome, setNome] = useState('')
  const [grupoId, setGrupoId] = useState('')
  const [aparelhoId, setAparelhoId] = useState('')
  const [tipo, setTipo] = useState<TipoExercicio>('carga')
  const [porLado, setPorLado] = useState(false)

  if (grupos.isPending || aparelhos.isPending) return <Carregando />
  const grupoEscolhido = grupoId || grupos.data?.find((g) => g.regiao === regiaoInicial)?.id || grupos.data?.[0]?.id || ''

  function salvar(e: FormEvent) {
    e.preventDefault()
    criar.mutate(
      { nome: nome.trim(), grupo_id: grupoEscolhido, aparelho_id: aparelhoId || null, tipo, reps_por_lado: porLado },
      { onSuccess: ({ id }) => navigate(`/sessao/exercicio/${id}`, { replace: true }) },
    )
  }

  const campo = 'h-12 w-full rounded-xl border border-borda bg-cartao px-3 outline-none focus:border-acento'

  return (
    <>
      <Cabecalho voltar="/sessao" titulo="Novo exercício" />
      <Pagina>
        <form onSubmit={salvar} className="space-y-5">
          <Erro>{(criar.error || grupos.error || aparelhos.error) && mensagemDeErro(criar.error ?? grupos.error ?? aparelhos.error)}</Erro>
          <label className="block">
            <Rotulo>Nome</Rotulo>
            <input required autoFocus value={nome} onChange={(e) => setNome(e.target.value)} className={campo} placeholder="Ex.: Remada unilateral (halter)" />
          </label>
          <label className="block">
            <Rotulo>Grupo</Rotulo>
            <select value={grupoEscolhido} onChange={(e) => setGrupoId(e.target.value)} className={campo}>
              {REGIOES.map((r) => (
                <optgroup key={r.valor} label={r.rotulo}>
                  {grupos.data
                    ?.filter((g) => g.regiao === r.valor)
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nome}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="block">
            <Rotulo>Aparelho</Rotulo>
            <select value={aparelhoId} onChange={(e) => setAparelhoId(e.target.value)} className={campo}>
              <option value="">Nenhum</option>
              {aparelhos.data?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <Rotulo>Como anotar a carga</Rotulo>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoExercicio)} className={campo}>
              {TIPOS.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.rotulo}
                </option>
              ))}
            </select>
          </label>
          {tipo !== 'cardio' && (
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={porLado} onChange={(e) => setPorLado(e.target.checked)} className="h-6 w-6 accent-acento" />
              <span>Reps contadas por lado (unilateral)</span>
            </label>
          )}
          <BotaoPrimario type="submit" disabled={criar.isPending || !nome.trim()}>
            Criar e registrar
          </BotaoPrimario>
        </form>
      </Pagina>
    </>
  )
}
