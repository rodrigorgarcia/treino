-- Acerto das corridas com a lista de referência (20 corridas, 29/03 a 04/10/2026).
--   · Remove a "Corrida/Caminhada" de 05/04 (23 min, sem distância).
--   · Move para a data da lista, como sessão "Corrida" própria, as corridas que estavam em
--     sessões de academia com outra data: 06/06 → 13/06, 25/06 → 27/06, 31/07 → 01/08.
--     As séries e observações vão junto.
--   · Acrescenta as que faltavam: 29/03, 04/04, 07/08, 09/08, 14/08, 18/08, 05/09, 06/09, 18/09.
--
-- Rodar UMA vez no SQL Editor do Supabase. Cancela tudo se já tiver rodado ou se algo
-- no banco não estiver como esperado. No fim, lista todas as corridas para conferência.

do $$
declare
  v_user uuid;
  v_corrida uuid;
  v_qtd int;
begin
  if (select count(*) from auth.users) <> 1 then
    raise exception 'Esperava exatamente 1 usuário em auth.users (há %).', (select count(*) from auth.users);
  end if;
  select id into v_user from auth.users;
  select id into v_corrida from public.exercicios where user_id = v_user and nome = 'Corrida';

  if exists (select 1 from public.sessoes where user_id = v_user and iniciada_em = '2026-03-29 13:00-03') then
    raise exception 'Este acerto já foi aplicado; nada foi alterado.';
  end if;

  -- Corridas em sessões de academia, pela data local da sessão.
  create temp table corridas_log on commit drop as
  select se.id, (s.iniciada_em at time zone 'America/Sao_Paulo')::date as dia
  from public.sessao_exercicios se
  join public.sessoes s on s.id = se.sessao_id
  where se.user_id = v_user and se.exercicio_id = v_corrida
    and (s.iniciada_em at time zone 'America/Sao_Paulo')::date in ('2026-04-05', '2026-06-06', '2026-06-25', '2026-07-31');

  select count(*) into v_qtd from corridas_log;
  if v_qtd <> 4 then
    raise exception 'Esperava 4 corridas em 05/04, 06/06, 25/06 e 31/07; achei %. Nada foi alterado.', v_qtd;
  end if;

  -- 1. Remove a de 05/04 (as séries vão junto).
  delete from public.sessao_exercicios where id in (select id from corridas_log where dia = '2026-04-05');

  -- 2. Novas sessões "Corrida": as movidas e as que faltavam.
  create temp table novas (
    dia date primary key, id uuid not null default gen_random_uuid(),
    duracao_s int, distancia_m int, observacao text, mover_de date
  ) on commit drop;

  insert into novas (dia, duracao_s, distancia_m, observacao, mover_de) values
    ('2026-03-29', 1301, 2130, null, null),                                  -- 21:41
    ('2026-04-04', 1500, 2500, null, null),                                  -- ~25 min
    ('2026-06-13', null, null, null, '2026-06-06'),                          -- 1,5 km · 16 min
    ('2026-06-27', null, null, null, '2026-06-25'),                          -- 2,7 km · 24 min
    ('2026-08-01', null, null, null, '2026-07-31'),                          -- 3,7 km · 35 min 🏆
    ('2026-08-07', 2520, 5020, null, null),                                  -- 42:00
    ('2026-08-09', 2368, 5020, null, null),                                  -- 39:28
    ('2026-08-14', 2079, 5000, null, null),                                  -- 34:39
    ('2026-08-18', 2058, 5000, null, null),                                  -- 34:18
    ('2026-09-05', 2008, 5000, '🏆 Recorde nos 5 km: 33:28.', null),
    ('2026-09-06', 2029, 5000, null, null),                                  -- 33:49
    ('2026-09-18', 1963, 5010, null, null);                                  -- 32:43

  -- Duração das movidas = a da série que já está no banco.
  update novas n
  set duracao_s = sr.duracao_s
  from corridas_log c
  join public.series sr on sr.sessao_exercicio_id = c.id
  where c.dia = n.mover_de;

  insert into public.sessoes (id, user_id, iniciada_em, encerrada_em, titulo)
  select id, v_user,
         (dia + time '13:00') at time zone 'America/Sao_Paulo',
         (dia + time '13:00') at time zone 'America/Sao_Paulo' + make_interval(mins => ceil(duracao_s / 60.0)::int),
         'Corrida'
  from novas;

  -- 3. Move as corridas de 06/06, 25/06 e 31/07 para as novas sessões.
  update public.sessao_exercicios se
  set sessao_id = n.id,
      iniciado_em = ((n.dia + time '13:00') at time zone 'America/Sao_Paulo') + interval '1 second'
  from corridas_log c
  join novas n on n.mover_de = c.dia
  where se.id = c.id;

  update public.series sr
  set registrada_em = ((n.dia + time '13:00') at time zone 'America/Sao_Paulo') + interval '1 second'
  from corridas_log c
  join novas n on n.mover_de = c.dia
  where sr.sessao_exercicio_id = c.id;

  -- 4. Registra as que faltavam.
  insert into public.sessao_exercicios (user_id, sessao_id, exercicio_id, iniciado_em, observacao)
  select v_user, n.id, v_corrida, ((n.dia + time '13:00') at time zone 'America/Sao_Paulo') + interval '1 second', n.observacao
  from novas n
  where n.mover_de is null;

  insert into public.series (user_id, sessao_exercicio_id, numero, duracao_s, distancia_m, registrada_em)
  select v_user, se.id, 1, n.duracao_s, n.distancia_m, se.iniciado_em
  from novas n
  join public.sessao_exercicios se on se.sessao_id = n.id and se.exercicio_id = v_corrida
  where n.mover_de is null;
end;
$$;

-- Conferência: todas as corridas do banco, em ordem (esperado: as 20 da lista).
select row_number() over (order by s.iniciada_em) as "#",
       to_char(s.iniciada_em at time zone 'America/Sao_Paulo', 'DD/MM') as data,
       replace(to_char(sr.distancia_m / 1000.0, 'FM990.00'), '.', ',') || ' km' as distancia,
       case when sr.duracao_s % 60 = 0 then (sr.duracao_s / 60) || ' min'
            else (sr.duracao_s / 60) || ':' || lpad((sr.duracao_s % 60)::text, 2, '0') end as tempo,
       s.titulo as sessao,
       se.observacao
from public.series sr
join public.sessao_exercicios se on se.id = sr.sessao_exercicio_id
join public.sessoes s on s.id = se.sessao_id
join public.exercicios e on e.id = se.exercicio_id
where e.nome = 'Corrida'
order by s.iniciada_em;
