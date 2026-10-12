-- Histórico: v_sessoes traz também o resumo do cardio de cada sessão
-- (nome, duração, distância, andares), para o cartão do histórico mostrar a corrida.
--
-- Definição completa da view: funciona tanto depois de 20261011200000 quanto
-- direto sobre a versão original (as colunas novas entram no fim).

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
  ), '[]'::jsonb) as cardio
from public.sessoes s
left join public.sessao_exercicios se on se.sessao_id = s.id
left join public.exercicios e on e.id = se.exercicio_id
left join public.grupos g on g.id = e.grupo_id
group by s.id;
