import { useState, type FormEvent, type ReactNode } from 'react'
import type { DadosExercicio } from '../lib/api'
import { AREA, CAMPO } from '../lib/estilos'
import { REGIOES, TIPOS, lerNumero, numero } from '../lib/formato'
import type { Aparelho, Grupo, Regiao, TipoExercicio } from '../lib/tipos'
import { BotaoPrimario, Campo } from './ui'

interface Props {
  grupos: Grupo[]
  aparelhos: Aparelho[]
  inicial?: DadosExercicio // ao editar
  regiaoInicial?: Regiao | null // ao criar: já escolhe um grupo da região aberta
  usos?: number // vezes que o exercício já foi feito, para avisar ao trocar o tipo
  botao: string
  salvando: boolean
  maisOpcoesAbertas?: boolean
  onSalvar: (dados: DadosExercicio) => void
  children?: ReactNode // mensagens de erro, acima dos campos
}

// Formulário de exercício, usado ao criar (na sessão ou no catálogo) e ao editar.
export function FormExercicio({
  grupos, aparelhos, inicial, regiaoInicial, usos = 0, botao, salvando, maisOpcoesAbertas = false, onSalvar, children,
}: Props) {
  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [grupoId, setGrupoId] = useState(
    inicial?.grupo_id ?? grupos.find((g) => g.regiao === regiaoInicial)?.id ?? grupos[0]?.id ?? '',
  )
  const [aparelhoId, setAparelhoId] = useState(inicial?.aparelho_id ?? '')
  const [tipo, setTipo] = useState<TipoExercicio>(inicial?.tipo ?? (regiaoInicial === 'cardio' ? 'cardio' : 'carga'))
  const [porLado, setPorLado] = useState(inicial?.reps_por_lado ?? false)
  const [passo, setPasso] = useState(inicial?.incremento_kg != null ? numero(inicial.incremento_kg) : '')
  const [nota, setNota] = useState(inicial?.nota ?? '')

  const aparelho = aparelhos.find((a) => a.id === aparelhoId)
  const usaCarga = tipo !== 'cardio' && tipo !== 'peso_corporal'
  const passoKg = lerNumero(passo)
  const passoInvalido = usaCarga && passoKg !== null && !(passoKg > 0 && passoKg < 1000)
  const rotuloTipo = TIPOS.find((t) => t.valor === tipo)?.rotulo

  function salvar(e: FormEvent) {
    e.preventDefault()
    onSalvar({
      nome: nome.trim(),
      grupo_id: grupoId,
      aparelho_id: aparelhoId || null,
      tipo,
      reps_por_lado: tipo !== 'cardio' && porLado,
      incremento_kg: usaCarga ? passoKg : (inicial?.incremento_kg ?? null),
      nota: nota.trim() || null,
    })
  }

  return (
    <form onSubmit={salvar} className="space-y-5">
      {children}
      <Campo rotulo="Nome">
        <input
          required
          autoFocus={!inicial}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={CAMPO}
          placeholder="Ex.: Remada unilateral (halter)"
        />
      </Campo>
      <Campo rotulo="Grupo">
        <select value={grupoId} onChange={(e) => setGrupoId(e.target.value)} className={CAMPO}>
          {REGIOES.map((r) => (
            <optgroup key={r.valor} label={r.rotulo}>
              {grupos
                .filter((g) => g.regiao === r.valor)
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </Campo>
      <Campo rotulo="Aparelho">
        <select value={aparelhoId} onChange={(e) => setAparelhoId(e.target.value)} className={CAMPO}>
          <option value="">Nenhum</option>
          {aparelhos.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </select>
      </Campo>
      <Campo
        rotulo="Como anotar a carga"
        dica={
          usos > 0 &&
          inicial &&
          tipo !== inicial.tipo && (
            <span className="text-alerta">
              Já feito {usos === 1 ? '1 vez' : `${usos} vezes`}: os números registrados não mudam, só passam a ser
              exibidos como “{rotuloTipo}”.
            </span>
          )
        }
      >
        <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoExercicio)} className={CAMPO}>
          {TIPOS.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.rotulo}
            </option>
          ))}
        </select>
      </Campo>
      {tipo !== 'cardio' && (
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={porLado} onChange={(e) => setPorLado(e.target.checked)} className="h-6 w-6 accent-acento" />
          <span>Reps contadas por lado (unilateral)</span>
        </label>
      )}

      <details open={maisOpcoesAbertas} className="group">
        <summary className="cursor-pointer list-none py-1 [&::-webkit-details-marker]:hidden text-sm font-medium text-suave">
          <span className="inline-block transition-transform group-open:rotate-90">›</span> Mais opções
          <span className="font-normal text-fraco"> · {usaCarga ? 'passo e nota' : 'nota'}</span>
        </summary>
        <div className="mt-4 space-y-5">
          {usaCarga && (
            <Campo
              rotulo="Passo do + / − (kg)"
              dica={
                passoInvalido ? (
                  <span className="text-perigo">Use um número maior que zero.</span>
                ) : aparelho ? (
                  `Vazio = o passo do aparelho (${numero(aparelho.incremento_kg)} kg).`
                ) : (
                  'Vazio = 1 kg.'
                )
              }
            >
              <input
                inputMode="decimal"
                value={passo}
                onChange={(e) => setPasso(e.target.value)}
                className={CAMPO}
                placeholder={aparelho ? `${numero(aparelho.incremento_kg)} (do aparelho)` : '1'}
              />
            </Campo>
          )}
          <Campo rotulo="Nota fixa" dica="Aparece em destaque na tela de registro.">
            <textarea
              rows={2}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className={AREA}
              placeholder="Ex.: banco na posição 4"
            />
          </Campo>
        </div>
      </details>

      <BotaoPrimario type="submit" disabled={salvando || !nome.trim() || !grupoId || passoInvalido}>
        {botao}
      </BotaoPrimario>
    </form>
  )
}
