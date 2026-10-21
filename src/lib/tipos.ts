// Formato das linhas que o app lê do banco (tabelas e views de supabase/migrations).

export type Regiao = 'superiores' | 'inferiores' | 'core' | 'cardio'
export type TipoExercicio = 'carga' | 'carga_por_lado' | 'carga_adicional' | 'peso_corporal' | 'cardio'
export type Dificuldade = 'facil' | 'na_medida' | 'dificil' | 'muito_dificil' | 'falha'

// livre: os exercícios entram conforme são feitos. programado: a sessão começa com uma lista
// escolhida antes (exercícios ainda sem séries) e só encerra sem nenhum zerado.
export type Modalidade = 'livre' | 'programado'

export interface Sessao {
  id: string
  iniciada_em: string
  encerrada_em: string | null
  titulo: string | null
  objetivo: string | null
  observacao: string | null
  modalidade: Modalidade // migração 20261021120000
}

// v_sessoes
export interface ResumoSessao extends Sessao {
  duracao: string | null // intervalo do Postgres, ex.: "00:50:00"
  n_exercicios: number
  regioes: Regiao[]
  exercicios?: string[] // nomes, na ordem em que foram feitos (migração 20261011200000)
  cardio?: ResumoCardio[] // migração 20261011210000
}

export interface ResumoCardio {
  nome: string
  duracao_s: number | null
  distancia_m: number | null
  andares: number | null
}

// sessao_exercicios com o exercício e as séries, para o detalhe da sessão
export interface DetalheExercicio {
  id: string
  iniciado_em: string
  dificuldade: Dificuldade | null
  observacao: string | null
  exercicios: {
    id: string
    nome: string
    tipo: TipoExercicio
    reps_por_lado: boolean
    grupos: { nome: string; regiao: Regiao }
    aparelhos: { nome: string } | null
  }
  series: Omit<Serie, 'id'>[]
}

// v_catalogo
export interface ItemCatalogo {
  id: string
  nome: string
  tipo: TipoExercicio
  reps_por_lado: boolean
  nota: string | null
  arquivado: boolean
  incremento_kg: number
  grupo_id: string
  grupo: string
  regiao: Regiao
  grupo_ordem: number
  aparelho_id: string | null
  aparelho: string | null
  ultima_em: string | null
  ultima_reps: (number | null)[] | null
  ultima_cargas_kg: (number | null)[] | null
  ultima_duracao_s: number | null
  ultima_distancia_m: number | null
  ultima_andares: number | null
  ultima_dificuldade: Dificuldade | null
  ultima_observacao: string | null
}

// v_execucoes
export interface Execucao {
  id: string
  sessao_id: string
  exercicio_id: string
  sessao_iniciada_em: string
  iniciado_em: string
  dificuldade: Dificuldade | null
  observacao: string | null
  n_series: number
  reps: (number | null)[]
  cargas_kg: (number | null)[]
  duracao_s: number | null
  distancia_m: number | null
  andares: number | null
}

export interface Serie {
  id: string
  numero: number
  reps: number | null
  carga_kg: number | null
  duracao_s: number | null
  distancia_m: number | null
  andares: number | null
}

// sessao_exercicios + séries, para a tela de log
export interface Registro {
  id: string
  dificuldade: Dificuldade | null
  observacao: string | null
  series: Serie[]
}

export interface Grupo {
  id: string
  nome: string
  regiao: Regiao
  ordem: number
}

export interface Aparelho {
  id: string
  nome: string
  incremento_kg: number
  observacao: string | null
  exercicios?: { count: number }[] // quantos exercícios usam o aparelho (inclui arquivados)
}

// Aparelho com os exercícios que o usam, para a tela de edição.
export interface AparelhoComExercicios extends Omit<Aparelho, 'exercicios'> {
  exercicios: { id: string; nome: string; arquivado: boolean }[]
}

// Tabela exercicios, como o formulário de edição lê e grava.
export interface Exercicio {
  id: string
  nome: string
  grupo_id: string
  aparelho_id: string | null
  tipo: TipoExercicio
  reps_por_lado: boolean
  incremento_kg: number | null // null = usa o passo do aparelho
  nota: string | null
  arquivado: boolean
}
