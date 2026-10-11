// Leitura e escrita no Supabase, com cache do TanStack Query.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import type {
  Aparelho, DetalheExercicio, Dificuldade, Execucao, Grupo, ItemCatalogo, Registro, ResumoSessao, Serie, Sessao,
  TipoExercicio,
} from './tipos'

async function rodar<T>(consulta: PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>): Promise<T> {
  const { data, error } = await consulta
  if (error) throw Object.assign(new Error(error.message), { code: error.code })
  return data as T
}

export const chaves = {
  sessaoAberta: ['sessao-aberta'] as const,
  sessoesRecentes: ['sessoes-recentes'] as const,
  catalogo: ['catalogo'] as const,
  execucoes: (sessaoId: string) => ['execucoes', sessaoId] as const,
  registro: (sessaoId: string, exercicioId: string) => ['registro', sessaoId, exercicioId] as const,
  grupos: ['grupos'] as const,
  aparelhos: ['aparelhos'] as const,
  historico: ['historico'] as const,
  sessaoDetalhe: (id: string) => ['sessao-detalhe', id] as const,
}

// ─── Leitura ─────────────────────────────────────────────────

export function useSessaoAberta() {
  return useQuery({
    queryKey: chaves.sessaoAberta,
    queryFn: () => rodar<Sessao | null>(supabase.from('sessoes').select('*').is('encerrada_em', null).maybeSingle()),
  })
}

export function useSessoesRecentes() {
  return useQuery({
    queryKey: chaves.sessoesRecentes,
    queryFn: () =>
      rodar<ResumoSessao[]>(
        supabase.from('v_sessoes').select('*').not('encerrada_em', 'is', null).order('iniciada_em', { ascending: false }).limit(5),
      ),
  })
}

// Todas as sessões encerradas, da mais recente para a mais antiga.
export function useHistorico() {
  return useQuery({
    queryKey: chaves.historico,
    queryFn: () =>
      rodar<ResumoSessao[]>(
        supabase.from('v_sessoes').select('*').not('encerrada_em', 'is', null).order('iniciada_em', { ascending: false }),
      ),
  })
}

export function useSessaoDetalhe(id: string) {
  return useQuery({
    queryKey: chaves.sessaoDetalhe(id),
    queryFn: async () => {
      const [sessao, exercicios] = await Promise.all([
        rodar<ResumoSessao | null>(supabase.from('v_sessoes').select('*').eq('id', id).maybeSingle()),
        rodar<DetalheExercicio[]>(
          supabase
            .from('sessao_exercicios')
            .select(
              'id, iniciado_em, dificuldade, observacao, ' +
                'exercicios(id, nome, tipo, reps_por_lado, grupos(nome, regiao), aparelhos(nome)), ' +
                'series(numero, reps, carga_kg, duracao_s, distancia_m, andares)',
            )
            .eq('sessao_id', id)
            .order('iniciado_em')
            .order('numero', { referencedTable: 'series' }),
        ),
      ])
      return { sessao, exercicios }
    },
  })
}

export function useCatalogo() {
  return useQuery({
    queryKey: chaves.catalogo,
    queryFn: () => rodar<ItemCatalogo[]>(supabase.from('v_catalogo').select('*').eq('arquivado', false)),
    staleTime: 5 * 60_000,
  })
}

export function useExecucoes(sessaoId: string) {
  return useQuery({
    queryKey: chaves.execucoes(sessaoId),
    queryFn: () =>
      rodar<Execucao[]>(supabase.from('v_execucoes').select('*').eq('sessao_id', sessaoId).order('iniciado_em')),
  })
}

export function useRegistro(sessaoId: string, exercicioId: string) {
  return useQuery({
    queryKey: chaves.registro(sessaoId, exercicioId),
    queryFn: () =>
      rodar<Registro | null>(
        supabase
          .from('sessao_exercicios')
          .select('id, dificuldade, observacao, series(id, numero, reps, carga_kg, duracao_s, distancia_m, andares)')
          .eq('sessao_id', sessaoId)
          .eq('exercicio_id', exercicioId)
          .order('numero', { referencedTable: 'series' })
          .maybeSingle(),
      ),
  })
}

export function useGrupos() {
  return useQuery({
    queryKey: chaves.grupos,
    queryFn: () => rodar<Grupo[]>(supabase.from('grupos').select('id, nome, regiao, ordem').order('ordem')),
    staleTime: Infinity,
  })
}

export function useAparelhos() {
  return useQuery({
    queryKey: chaves.aparelhos,
    queryFn: () => rodar<Aparelho[]>(supabase.from('aparelhos').select('id, nome, incremento_kg').order('nome')),
    staleTime: Infinity,
  })
}

// ─── Sessão ──────────────────────────────────────────────────

export function useIniciarSessao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => rodar<Sessao>(supabase.from('sessoes').insert({ titulo: null }).select().single()),
    onSuccess: (sessao) => qc.setQueryData(chaves.sessaoAberta, sessao),
    onError: () => qc.invalidateQueries({ queryKey: chaves.sessaoAberta }), // já havia uma aberta
  })
}

export function useEncerrarSessao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id: string; titulo: string | null; objetivo: string | null; observacao: string | null }) =>
      rodar(
        supabase
          .from('sessoes')
          .update({ encerrada_em: new Date().toISOString(), titulo: v.titulo, objetivo: v.objetivo, observacao: v.observacao })
          .eq('id', v.id),
      ),
    onSuccess: () => qc.invalidateQueries(),
  })
}

export function useDescartarSessao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rodar(supabase.from('sessoes').delete().eq('id', id)),
    onSuccess: () => qc.invalidateQueries(),
  })
}

// ─── Séries ──────────────────────────────────────────────────

export interface ValoresSerie {
  reps: number | null
  carga_kg: number | null
  duracao_s: number | null
  distancia_m: number | null
  andares: number | null
}

export function useRegistrarSerie(sessaoId: string, exercicioId: string) {
  const qc = useQueryClient()
  const chave = chaves.registro(sessaoId, exercicioId)
  return useMutation({
    mutationFn: async (valores: ValoresSerie) => {
      let registroId = qc.getQueryData<Registro | null>(chave)?.id
      if (!registroId) {
        const criado = await rodar<{ id: string }>(
          supabase
            .from('sessao_exercicios')
            .upsert({ sessao_id: sessaoId, exercicio_id: exercicioId }, { onConflict: 'sessao_id,exercicio_id' })
            .select('id')
            .single(),
        )
        registroId = criado.id
      }
      return rodar<Serie>(supabase.from('series').insert({ sessao_exercicio_id: registroId, ...valores }).select().single())
    },
    // A série aparece na hora; o banco confirma em segundo plano.
    onMutate: async (valores) => {
      await qc.cancelQueries({ queryKey: chave })
      const anterior = qc.getQueryData<Registro | null>(chave)
      const series = anterior?.series ?? []
      const provisoria: Serie = { id: `provisoria-${Date.now()}`, numero: series.length + 1, ...valores }
      const otimista: Registro = {
        id: anterior?.id ?? '',
        dificuldade: anterior?.dificuldade ?? null,
        observacao: anterior?.observacao ?? null,
        series: [...series, provisoria],
      }
      qc.setQueryData(chave, otimista)
      return { anterior }
    },
    onError: (_erro, _valores, contexto) => qc.setQueryData(chave, contexto?.anterior),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: chave })
      qc.invalidateQueries({ queryKey: chaves.execucoes(sessaoId) })
    },
  })
}

export function useAtualizarSerie(sessaoId: string, exercicioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id: string } & ValoresSerie) => {
      const { id, ...valores } = v
      return rodar(supabase.from('series').update(valores).eq('id', id))
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: chaves.registro(sessaoId, exercicioId) })
      qc.invalidateQueries({ queryKey: chaves.execucoes(sessaoId) })
    },
  })
}

export function useApagarSerie(sessaoId: string, exercicioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rodar(supabase.from('series').delete().eq('id', id)),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: chaves.registro(sessaoId, exercicioId) })
      qc.invalidateQueries({ queryKey: chaves.execucoes(sessaoId) })
    },
  })
}

export function useConcluirExercicio(sessaoId: string, exercicioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { registroId: string; dificuldade: Dificuldade | null; observacao: string | null }) =>
      rodar(
        supabase
          .from('sessao_exercicios')
          .update({ dificuldade: v.dificuldade, observacao: v.observacao })
          .eq('id', v.registroId),
      ),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: chaves.registro(sessaoId, exercicioId) })
      qc.invalidateQueries({ queryKey: chaves.execucoes(sessaoId) })
    },
  })
}

// ─── Catálogo ────────────────────────────────────────────────

export interface NovoExercicio {
  nome: string
  grupo_id: string
  aparelho_id: string | null
  tipo: TipoExercicio
  reps_por_lado: boolean
}

export function useCriarExercicio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: NovoExercicio) => rodar<{ id: string }>(supabase.from('exercicios').insert(v).select('id').single()),
    // Espera o catálogo recarregar para a tela de log já encontrar o exercício novo.
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.catalogo, refetchType: 'all' }),
  })
}

export function mensagemDeErro(erro: unknown): string {
  const e = erro as { message?: string; code?: string } | null
  if (e?.code === '23505') return 'Já existe um registro com esse nome.'
  if (e?.message?.includes('Failed to fetch')) return 'Sem conexão com o servidor. Tente de novo.'
  return e?.message ?? 'Algo deu errado.'
}
