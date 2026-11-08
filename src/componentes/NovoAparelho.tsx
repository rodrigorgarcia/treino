import { useState, type KeyboardEvent } from 'react'
import { mensagemDeErro, useCriarAparelho } from '../lib/api'
import { CAMPO } from '../lib/estilos'
import { lerNumero } from '../lib/formato'
import { BotaoSecundario, Campo, Erro } from './ui'

// Criar um aparelho sem sair do formulário do exercício. Não é um <form>, porque fica dentro do
// formulário do exercício: Enter nos campos cria o aparelho em vez de salvar o exercício.
export function NovoAparelho({ onCriado, onCancelar }: { onCriado: (id: string) => void; onCancelar: () => void }) {
  const criar = useCriarAparelho()
  const [nome, setNome] = useState('')
  const [passo, setPasso] = useState('5')
  const [observacao, setObservacao] = useState('')

  const passoKg = lerNumero(passo)
  const passoValido = passoKg !== null && passoKg > 0 && passoKg < 1000
  const pronto = nome.trim() !== '' && passoValido && !criar.isPending

  function salvar() {
    if (!pronto) return
    criar.mutate(
      { nome: nome.trim(), incremento_kg: passoKg!, observacao: observacao.trim() || null },
      { onSuccess: ({ id }) => onCriado(id) },
    )
  }

  function enter(e: KeyboardEvent) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    salvar()
  }

  return (
    <section aria-label="Novo aparelho" className="space-y-4 rounded-2xl border border-acento/30 bg-cartao p-4">
      <div className="font-medium">Novo aparelho</div>
      <Erro>{criar.error && mensagemDeErro(criar.error)}</Erro>
      <Campo rotulo="Nome do aparelho">
        <input
          autoFocus
          value={nome}
          onChange={(e) => {
            setNome(e.target.value)
            criar.reset() // o aviso de nome repetido some ao mudar o nome
          }}
          onKeyDown={enter}
          className={CAMPO}
          placeholder="Ex.: Smith"
        />
      </Campo>
      <Campo
        rotulo="Passo do aparelho (kg)"
        dica={passoValido ? 'Quanto o + / − muda a carga nos exercícios dele.' : <span className="text-perigo">Use um número maior que zero, como 2,5.</span>}
      >
        <input inputMode="decimal" value={passo} onChange={(e) => setPasso(e.target.value)} onKeyDown={enter} className={CAMPO} />
      </Campo>
      <Campo rotulo="Observação do aparelho">
        <input
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          onKeyDown={enter}
          className={CAMPO}
          placeholder="Ex.: vai até 100 kg, de 10 em 10"
        />
      </Campo>
      <div className="flex gap-3">
        <BotaoSecundario type="button" className="flex-1" onClick={onCancelar}>
          Cancelar
        </BotaoSecundario>
        <BotaoSecundario type="button" className="flex-1 border-acento/40 text-acento" disabled={!pronto} onClick={salvar}>
          Criar aparelho
        </BotaoSecundario>
      </div>
    </section>
  )
}
