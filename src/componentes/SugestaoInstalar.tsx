import { useState } from 'react'
import { instalar, useInstalacao } from '../lib/instalacao'

const CHAVE = 'treino.instalar.dispensado'
const TRINTA_DIAS = 30 * 24 * 60 * 60_000

function dispensadoRecentemente(): boolean {
  try {
    return Date.now() - Number(localStorage.getItem(CHAVE) ?? 0) < TRINTA_DIAS
  } catch {
    return false
  }
}

// Ícone de Compartilhar do iOS (quadrado com seta para cima).
function IconeCompartilhar() {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="Compartilhar" className="mx-0.5 inline h-4 w-4 -translate-y-px align-middle">
      <path d="M12 3v12M8 7l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 11H5v10h14V11h-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Aviso para instalar o app: botão no Android, passo a passo no iPhone. Some depois de
// instalado ou por 30 dias se dispensado.
export function SugestaoInstalar() {
  const estado = useInstalacao()
  const [dispensado, setDispensado] = useState(dispensadoRecentemente)

  if (dispensado || estado === 'instalado' || estado === 'nada') return null

  function dispensar() {
    try {
      localStorage.setItem(CHAVE, String(Date.now()))
    } catch {
      /* sem armazenamento: só esconde agora */
    }
    setDispensado(true)
  }

  return (
    <section className="mb-6 rounded-2xl border border-acento/30 bg-cartao p-4" data-testid="instalar">
      <div className="flex items-start gap-3">
        <img src="/icone-192.png" alt="" className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <div className="font-medium">Instale o Treino no celular</div>
          {estado === 'ios' ? (
            <p className="mt-1 text-sm text-suave">
              Toque em Compartilhar <IconeCompartilhar /> (no Safari, pode estar no menu ⋯) e depois em{' '}
              <span className="font-medium text-texto">Adicionar à Tela de Início</span>.
            </p>
          ) : (
            <p className="mt-1 text-sm text-suave">Abre direto da tela de início, em tela cheia, como um aplicativo.</p>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button onClick={dispensar} className="h-11 px-3 text-sm text-fraco">
          Agora não
        </button>
        {estado === 'botao' && (
          <button onClick={() => instalar()} className="h-11 rounded-xl bg-acento px-5 font-semibold text-acento-escuro active:opacity-80">
            Instalar
          </button>
        )}
      </div>
    </section>
  )
}
