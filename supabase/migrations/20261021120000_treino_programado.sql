-- Treino programado: a sessão começa com uma lista de exercícios escolhidos antes, ainda sem
-- séries, e só encerra quando nenhum deles estiver zerado. 'livre' é a sessão de sempre.
-- A ordem do plano usa sessao_exercicios.iniciado_em, como na sessão livre.
alter table public.sessoes
  add column modalidade text not null default 'livre'
  check (modalidade in ('livre', 'programado'));

-- v_sessoes ganha a modalidade (coluna nova no fim; o resto é igual a 20261011210000).
create or replace view public.v_sessoes
with (security_invoker = true) as
select
  s.id,
  s.iniciada_em,
  s.encerrada_em,
  s.titulo,
  s.objetivo,
  s.observacao,
  s.encerrada_em - s.iniciada_em as duracao,
  count(se.id)::int as n_exercicios,
  coalesce(array_agg(distinct g.regiao) filter (where g.id is not null), '{}') as regioes,
  coalesce(array_agg(e.nome order by se.iniciado_em) filter (where e.id is not null), '{}') as exercicios,
  coalesce((
    select jsonb_agg(
             jsonb_build_object('nome', ce.nome, 'duracao_s', x.duracao_s, 'distancia_m', x.distancia_m, 'andares', x.andares)
             order by x.iniciado_em)
    from public.v_execucoes x
    join public.exercicios ce on ce.id = x.exercicio_id
    where x.sessao_id = s.id and ce.tipo = 'cardio'
  ), '[]'::jsonb) as cardio,
  s.modalidade
from public.sessoes s
left join public.sessao_exercicios se on se.sessao_id = s.id
left join public.exercicios e on e.id = se.exercicio_id
left join public.grupos g on g.id = e.grupo_id
group by s.id;
