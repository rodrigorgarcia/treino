// Sugestão de instalar o app na tela de início.
// Android/Chrome: o navegador avisa que dá para instalar com o evento `beforeinstallprompt`,
// que pode chegar antes do React montar; por isso ele é guardado aqui, no carregamento.
// iPhone: não existe esse evento; só dá para instalar pelo menu Compartilhar.
import { useSyncExternalStore } from 'react'

interface EventoInstalar extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type EstadoInstalacao = 'instalado' | 'botao' | 'ios' | 'nada'

let evento: EventoInstalar | null = null
let instalado = false
const ouvintes = new Set<() => void>()
const avisar = () => ouvintes.forEach((f) => f())

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault() // o app mostra o próprio aviso
  evento = e as EventoInstalar
  avisar()
})
window.addEventListener('appinstalled', () => {
  evento = null
  instalado = true
  avisar()
})

function rodandoInstalado(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function ehIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function estado(): EstadoInstalacao {
  if (instalado || rodandoInstalado()) return 'instalado'
  if (evento) return 'botao'
  return ehIOS() ? 'ios' : 'nada'
}

function assinar(f: () => void) {
  ouvintes.add(f)
  return () => ouvintes.delete(f)
}

export function useInstalacao() {
  return useSyncExternalStore(assinar, estado)
}

// Abre o diálogo do navegador (só no estado 'botao').
export async function instalar() {
  if (!evento) return
  const e = evento
  await e.prompt()
  const { outcome } = await e.userChoice
  evento = null
  if (outcome === 'accepted') instalado = true
  avisar()
}
