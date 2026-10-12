// Tipos e escala comuns aos gráficos de evolução.

export interface Ponto {
  t: number // data, em ms
  data: string // "04/10"
  detalhe: string // ex.: "12+10+8 · 57 kg"
}

// Uma medida ao longo dos pontos.
export interface Serie {
  titulo: string
  valores: (number | null)[] // um por ponto; null = sem valor nessa sessão
  formatar: (v: number) => string // tooltip e rótulo: "57 kg"
  formatarEixo: (v: number) => string
  passos?: number[] // passos permitidos no eixo (ex.: tempo em 15 s, 30 s, 1 min…)
}

// Passo "redondo" (1, 2, 2,5, 5 × 10^n, ou um dos `permitidos`) para ~3 divisões do eixo.
export function passoBonito(amplitude: number, permitidos?: number[]): number {
  const bruto = amplitude / 3
  if (permitidos?.length) return permitidos.find((p) => p >= bruto) ?? permitidos[permitidos.length - 1]
  const potencia = 10 ** Math.floor(Math.log10(bruto))
  const fator = [1, 2, 2.5, 5, 10].find((f) => f * potencia >= bruto) ?? 10
  return fator * potencia
}
