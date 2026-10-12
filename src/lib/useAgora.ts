import { useEffect, useState } from 'react'

// Relógio que re-renderiza a cada 15 s.
export function useAgora(): number {
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 15_000)
    return () => clearInterval(t)
  }, [])
  return agora
}
