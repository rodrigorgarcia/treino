import type { ItemCatalogo, Serie } from './tipos'

// Regra para subir a carga: na última vez, pelo menos duas séries com 12 reps ou mais e mais uma
// com 10 ou mais. Sugere a maior carga daquela vez mais um passo; some quando uma série de hoje
// já passou dela.
export function sugestaoDeSubirCarga(
  ex: ItemCatalogo,
  hoje: Pick<Serie, 'carga_kg'>[],
): { reps: number[]; carga: number | null } | null {
  if (ex.tipo === 'cardio' || ex.tipo === 'peso_corporal' || !ex.ultima_reps) return null
  const reps = ex.ultima_reps.map((r) => r ?? 0)
  const [a = 0, b = 0, c = 0] = [...reps].sort((x, y) => y - x)
  if (a < 12 || b < 12 || c < 10) return null
  const cargas = (ex.ultima_cargas_kg ?? []).filter((k): k is number => k !== null)
  if (cargas.length === 0) return { reps, carga: null }
  const maior = Math.max(...cargas)
  if (hoje.some((s) => s.carga_kg !== null && s.carga_kg > maior)) return null
  return { reps, carga: Math.round((maior + ex.incremento_kg) * 100) / 100 }
}
