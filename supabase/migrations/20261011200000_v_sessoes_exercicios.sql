-- Histórico: v_sessoes passa a trazer os nomes dos exercícios de cada sessão,
-- na ordem em que foram feitos, para a lista e a busca do app.
-- As colunas anteriores ficam iguais; "exercicios" entra no fim.

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
  coalesce(array_agg(e.nome order by se.iniciado_em) filter (where e.id is not null), '{}') as exercicios
from public.sessoes s
left join public.sessao_exercicios se on se.sessao_id = s.id
left join public.exercicios e on e.id = se.exercicio_id
left join public.grupos g on g.id = e.grupo_id
group by s.id;
