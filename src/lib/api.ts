// Leitura e escrita no Supabase, com cache do TanStack Query.

import { useMutation, useQuery, useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query'
import { supabase } from './supabase'
import type {
  Aparelho, AparelhoComExercicios, DetalheExercicio, Dificuldade, Execucao, Exercicio, Grupo, ItemCatalogo, Registro,
  ResumoSessao, Serie, Sessao,
} from './tipos'

async function rodar<T>(consulta: PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>): Promise<T> {
  const { data, error } = await consulta
  if (error) throw Object.assign(new Error(error.message), { code: error.code })
  return data as T
}

// Depois de salvar: marca tudo como desatualizado (recarrega o que está na tela) e já recarrega
// as `listas` para onde o app volta, para não mostrar o dado antigo.
// telaAtual = false ao excluir: a tela que some não precisa recarregar.
function recarregar(qc: QueryClient, listas: QueryKey[], telaAtual = true) {
  return Promise.all([
    qc.invalidateQueries({ refetchType: telaAtual ? 'active' : 'none' }),
    ...listas.map((queryKey) => qc.invalidateQueries({ queryKey, refetchType: 'all' })),
  ])
}

export const chaves = {
  sessaoAberta: ['sessao-aberta'] as const,
  sessoesRecentes: ['sessoes-recentes'] as const,
  catalogo: ['catalogo'] as const,
  exercicio: (id: string) => ['exercicio', id] as const,
  exercicioEdicao: (id: string) => ['exercicio-edicao', id] as const,
  execucoes: (sessaoId: string) => ['execucoes', sessaoId] as const,
  registro: (sessaoId: string, exercicioId: string) => ['registro', sessaoId, exercicioId] as const,
  grupos: ['grupos'] as const,
  aparelhos: ['aparelhos'] as const,
  aparelho: (id: string) => ['aparelho', id] as const,
  historico: ['historico'] as const,
  historicoExercicio: (id: string) => ['historico-exercicio', id] as const,
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

// Todas as vezes que o exercício foi feito (sessões encerradas), da mais recente para a mais antiga.
export function useHistoricoExercicio(id: string) {
  return useQuery({
    queryKey: chaves.historicoExercicio(id),
    queryFn: () =>
      rodar<Execucao[]>(
        supabase
          .from('v_execucoes')
          .select('*')
          .eq('exercicio_id', id)
          .not('sessao_encerrada_em', 'is', null)
          .gt('n_series', 0)
          .order('sessao_iniciada_em', { ascending: false }),
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

// Todos os exercícios, inclusive arquivados: a consulta mostra todos, a lista da sessão filtra.
export function useCatalogo() {
  return useQuery({
    queryKey: chaves.catalogo,
    queryFn: () => rodar<ItemCatalogo[]>(supabase.from('v_catalogo').select('*')),
    staleTime: 5 * 60_000,
  })
}

// Um exercício do catálogo, mesmo arquivado (para o histórico e a edição).
export function useExercicio(id: string) {
  return useQuery({
    queryKey: chaves.exercicio(id),
    queryFn: () => rodar<ItemCatalogo | null>(supabase.from('v_catalogo').select('*').eq('id', id).maybeSingle()),
  })
}

// O exercício como está na tabela (passo próprio pode ser null) e em quantas sessões aparece.
export function useExercicioEdicao(id: string) {
  return useQuery({
    queryKey: chaves.exercicioEdicao(id),
    queryFn: async () => {
      const [exercicio, usos] = await Promise.all([
        rodar<Exercicio | null>(
          supabase
            .from('exercicios')
            .select('id, nome, grupo_id, aparelho_id, tipo, reps_por_lado, incremento_kg, nota, arquivado')
            .eq('id', id)
            .maybeSingle(),
        ),
        supabase
          .from('sessao_exercicios')
          .select('id', { count: 'exact', head: true })
          .eq('exercicio_id', id)
          .then(({ count, error }) => {
            if (error) throw Object.assign(new Error(error.message), { code: error.code })
            return count ?? 0
          }),
      ])
      return { exercicio, usos }
    },
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
    queryFn: () =>
      rodar<Aparelho[]>(supabase.from('aparelhos').select('id, nome, incremento_kg, observacao, exercicios(count)').order('nome')),
    staleTime: Infinity,
  })
}

export function useAparelho(id: string) {
  return useQuery({
    queryKey: chaves.aparelho(id),
    queryFn: () =>
      rodar<AparelhoComExercicios | null>(
        supabase
          .from('aparelhos')
          .select('id, nome, incremento_kg, observacao, exercicios(id, nome, arquivado)')
          .eq('id', id)
          .order('nome', { referencedTable: 'exercicios' })
          .maybeSingle(),
      ),
  })
}

// ─── Sessão ──────────────────────────────────────────────────

// Sem plano: sessão livre. Com plano: treino programado, já com os exercícios escolhidos.
export function useIniciarSessao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (plano?: string[]) => {
      const dados: Partial<Sessao> = plano ? { titulo: null, modalidade: 'programado' } : { titulo: null }
      const sessao = await rodar<Sessao>(supabase.from('sessoes').insert(dados).select().single())
      if (plano?.length) await incluirNoPlano(sessao.id, plano)
      return sessao
    },
    onSuccess: (sessao) => qc.setQueryData(chaves.sessaoAberta, sessao),
    onError: () => qc.invalidateQueries({ queryKey: chaves.sessaoAberta }), // já havia uma aberta
  })
}

// Exercícios do treino programado, ainda sem séries. A ordem da sessão é a de iniciado_em:
// cada um entra 1 ms depois do anterior, na ordem em que foi marcado.
function incluirNoPlano(sessaoId: string, exercicios: string[]) {
  const agora = Date.now()
  return rodar(
    supabase.from('sessao_exercicios').insert(
      exercicios.map((exercicio_id, i) => ({ sessao_id: sessaoId, exercicio_id, iniciado_em: new Date(agora + i).toISOString() })),
    ),
  )
}

export function useAdicionarAoPlano(sessaoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (exercicios: string[]) => incluirNoPlano(sessaoId, exercicios),
    onSettled: () => qc.invalidateQueries({ queryKey: chaves.execucoes(sessaoId), refetchType: 'all' }),
  })
}

// Tirar um exercício da sessão em andamento pela lista: some na hora; o banco apaga em seguida
// (com as séries, se houver).
export function useTirarDaSessao(sessaoId: string) {
  const qc = useQueryClient()
  const chave = chaves.execucoes(sessaoId)
  return useMutation({
    mutationFn: ({ registroId }: { registroId: string; exercicioId: string }) =>
      rodar(supabase.from('sessao_exercicios').delete().eq('id', registroId)),
    onMutate: async ({ registroId }) => {
      await qc.cancelQueries({ queryKey: chave })
      qc.setQueryData<Execucao[]>(chave, (lista) => lista?.filter((x) => x.id !== registroId))
    },
    onSettled: (_dados, _erro, { exercicioId }) => aposMudarRegistro(qc, sessaoId, exercicioId),
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

// Depois de mudar um exercício da sessão: recarrega o registro e o "feitos hoje". O resto
// (detalhe, histórico, última vez) só fica marcado como desatualizado, para o caso de ser
// uma sessão passada; cada tela recarrega quando abrir.
function aposMudarRegistro(qc: QueryClient, sessaoId: string, exercicioId: string) {
  qc.invalidateQueries({ queryKey: chaves.registro(sessaoId, exercicioId) })
  qc.invalidateQueries({ queryKey: chaves.execucoes(sessaoId) })
  for (const queryKey of [
    chaves.sessaoDetalhe(sessaoId), chaves.historico, chaves.sessoesRecentes, chaves.catalogo,
    chaves.exercicio(exercicioId), chaves.historicoExercicio(exercicioId),
  ]) {
    qc.invalidateQueries({ queryKey, refetchType: 'none' })
  }
}

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
    onSettled: () => aposMudarRegistro(qc, sessaoId, exercicioId),
  })
}

export function useAtualizarSerie(sessaoId: string, exercicioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id: string } & ValoresSerie) => {
      const { id, ...valores } = v
      return rodar(supabase.from('series').update(valores).eq('id', id))
    },
    onSettled: () => aposMudarRegistro(qc, sessaoId, exercicioId),
  })
}

export function useApagarSerie(sessaoId: string, exercicioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rodar(supabase.from('series').delete().eq('id', id)),
    onSettled: () => aposMudarRegistro(qc, sessaoId, exercicioId),
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
    onSettled: () => aposMudarRegistro(qc, sessaoId, exercicioId),
  })
}

// Tira o exercício da sessão, com as séries.
export function useRemoverDaSessao(sessaoId: string, exercicioId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (registroId: string) => rodar(supabase.from('sessao_exercicios').delete().eq('id', registroId)),
    onSettled: () => aposMudarRegistro(qc, sessaoId, exercicioId),
  })
}

// ─── Sessões passadas ────────────────────────────────────────

export function useAtualizarSessao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...campos }: Pick<Sessao, 'id' | 'titulo' | 'objetivo' | 'observacao' | 'iniciada_em' | 'encerrada_em'>) =>
      rodar(supabase.from('sessoes').update(campos).eq('id', id)),
    onSuccess: (_, { id }) => recarregar(qc, [chaves.sessaoDetalhe(id), chaves.historico, chaves.sessoesRecentes]),
  })
}

export function useExcluirSessao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rodar(supabase.from('sessoes').delete().eq('id', id)),
    onSuccess: () => recarregar(qc, [chaves.historico, chaves.sessoesRecentes], false),
  })
}

// ─── Catálogo ────────────────────────────────────────────────

export type DadosExercicio = Omit<Exercicio, 'id' | 'arquivado'>
export type DadosAparelho = Pick<Aparelho, 'nome' | 'incremento_kg' | 'observacao'>

export function useCriarExercicio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: DadosExercicio) => rodar<{ id: string }>(supabase.from('exercicios').insert(v).select('id').single()),
    // Espera o catálogo recarregar para a tela de log já encontrar o exercício novo.
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.catalogo, refetchType: 'all' }),
  })
}

export function useAtualizarExercicio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...campos }: { id: string } & Partial<DadosExercicio & { arquivado: boolean }>) =>
      rodar(supabase.from('exercicios').update(campos).eq('id', id)),
    onSuccess: (_, { id }) => recarregar(qc, [chaves.catalogo, chaves.exercicio(id)]),
  })
}

// Só funciona para exercício nunca usado; o banco recusa os outros (use arquivar).
export function useExcluirExercicio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rodar(supabase.from('exercicios').delete().eq('id', id)),
    onSuccess: () => recarregar(qc, [chaves.catalogo], false),
  })
}

export function useCriarAparelho() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: DadosAparelho) => rodar<{ id: string }>(supabase.from('aparelhos').insert(v).select('id').single()),
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.aparelhos, refetchType: 'all' }),
  })
}

export function useAtualizarAparelho() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...campos }: { id: string } & DadosAparelho) => rodar(supabase.from('aparelhos').update(campos).eq('id', id)),
    onSuccess: () => recarregar(qc, [chaves.aparelhos, chaves.catalogo]),
  })
}

export function useExcluirAparelho() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rodar(supabase.from('aparelhos').delete().eq('id', id)),
    onSuccess: () => recarregar(qc, [chaves.aparelhos], false),
  })
}

export function mensagemDeErro(erro: unknown): string {
  const e = erro as { message?: string; code?: string } | null
  if (e?.code === '23505') return 'Já existe um registro com esse nome.'
  if (e?.code === '23503') return 'Não dá para excluir: ainda está em uso.'
  if (e?.message?.includes('Failed to fetch')) return 'Sem conexão com o servidor. Tente de novo.'
  return e?.message ?? 'Algo deu errado.'
}
