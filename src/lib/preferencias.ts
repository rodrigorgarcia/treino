// Preferências de tela lembradas no aparelho (aba, agrupamento…). Sem armazenamento, só não lembra.

export function lerPreferencia<T extends string>(chave: string, padrao: T): T {
  try {
    return (localStorage.getItem(chave) as T) || padrao
  } catch {
    return padrao
  }
}

export function salvarPreferencia(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor)
  } catch {
    /* sem armazenamento: só não lembra */
  }
}
