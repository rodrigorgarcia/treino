-- Sessões de 04/10 a 11/10/2026, registradas fora do app:
--   04/10 corrida de 5 km (recorde) · 09/10 sessões 39 e 40 · 11/10 inferiores.
-- Cria o exercício "Dorsiflexão com halter" (grupo Panturrilha).
--
-- Rodar UMA vez no SQL Editor do Supabase. Se estas sessões já existirem, cancela sem mudar nada.
-- Rosca bíceps com barra: "5 kg/lado" entra como 15 kg total (barra ~5 kg + 2 × 5 kg), como na S28.

do $$
declare
  v_user uuid;
  v_faltando text;
begin
  if (select count(*) from auth.users) <> 1 then
    raise exception 'Esperava exatamente 1 usuário em auth.users (há %).', (select count(*) from auth.users);
  end if;
  select id into v_user from auth.users;

  if exists (
    select 1 from public.sessoes
    where user_id = v_user
      and iniciada_em in ('2026-10-04 13:00-03', '2026-10-09 12:00-03', '2026-10-09 13:00-03', '2026-10-11 12:00-03')
  ) then
    raise exception 'Estas sessões já foram registradas; nada foi alterado.';
  end if;

  insert into public.exercicios (user_id, nome, grupo_id, aparelho_id, tipo, reps_por_lado, nota)
  select v_user, 'Dorsiflexão com halter', g.id, a.id, 'carga', false,
         'Tibial anterior, prevenção de canelite. Sentado, halter entre os pés, calcanhares apoiados, elevar as pontas dos pés.'
  from public.grupos g
  join public.aparelhos a on a.user_id = v_user and a.nome = 'Halteres'
  where g.user_id = v_user and g.nome = 'Panturrilha'
  on conflict (user_id, nome) do nothing;

  create temp table imp_sessoes (
    n int primary key, id uuid not null default gen_random_uuid(),
    iniciada_em timestamptz not null, duracao_min int, titulo text, observacao text
  ) on commit drop;

  insert into imp_sessoes (n, iniciada_em, duracao_min, titulo, observacao) values
    (1, '2026-10-04 13:00-03', 32, 'Corrida', 'Complementar: corrida de 5 km.'),
    (2, '2026-10-09 12:00-03', null, 'Treino Peito + Costas', 'Sessão 39: peito e costas.'),
    (3, '2026-10-09 13:00-03', null, 'Treino Tríceps + Bíceps + Peito', 'Sessão 40: tríceps, bíceps e peito.'),
    (4, '2026-10-11 12:00-03', 75, 'Treino Inferiores', E'Ordem: pelo índice. Sem cardio hoje.\n'
      'Hip thrust e abdução no cabo não realizados.\n'
      '⬆️ Progressão: leg press e panturrilha +60 → +70 kg; extensora fechou 3x12; afundo búlgaro fechou 3x10/lado.\n'
      '⚠️ Adução: salto de 28 → 37 kg derrubou as reps (3x3); voltar para 30 kg.\n'
      '⭐ Novo exercício: dorsiflexão com halter (16 kg), fortalece o tibial anterior (prevenção de canelite).');

  create temp table imp_execucoes (
    id uuid not null default gen_random_uuid(), n int not null, ordem int not null,
    exercicio text not null, dificuldade text, observacao text,
    reps int[], cargas numeric[], duracao_s int, distancia_m int
  ) on commit drop;

  insert into imp_execucoes (n, ordem, exercicio, dificuldade, observacao, reps, cargas, duracao_s, distancia_m) values
    -- 04/10 · corrida
    (1, 1, 'Corrida', null, '🏆 Novo recorde pessoal nos 5 km: 31:49 (anterior: 32:43, em 18/09).', '{}', null, 1909, 5010),
    -- 09/10 · sessão 39
    (2, 1, 'Remada baixa (barra)',          'dificil',   null, '{12,10,10}', '{40,40,40}', null, null),
    (2, 2, 'Remada baixa (triângulo)',      'dificil',   null, '{10,7,7}',   '{40,40,40}', null, null),
    (2, 3, 'Puxada alta (pegada aberta)',   'dificil',   null, '{8,7,5}',    '{40,40,40}', null, null),
    (2, 4, 'Puxada alta (pegada supinada)', 'dificil',   null, '{12,8,8}',   '{35,35,35}', null, null),
    (2, 5, 'Supino máquina',                'dificil',   null, '{12,12,9}',  '{20,20,20}', null, null),
    (2, 6, 'Voador (peck deck)',            'dificil',   null, '{12,10,8}',  '{35,35,35}', null, null),
    (2, 7, 'Crucifixo no cabo',             'dificil',   null, '{6,6,7}',    '{15,15,15}', null, null),
    (2, 8, 'Rosca martelo cruzada',         'na_medida', null, '{10,10,8}',  '{10,10,10}', null, null),
    -- 09/10 · sessão 40
    (3, 1, 'Tríceps unilateral (cabo)',     'dificil',   null, '{12,9,6}',   '{15,15,15}', null, null),
    (3, 2, 'Tríceps pushdown com barra',    'dificil',   null, '{12,10,8}',  '{40,40,40}', null, null),
    (3, 3, 'Tríceps francês (cabo)',        'dificil',   'Estreou 20 kg.', '{10,8,8}', '{20,20,20}', null, null),
    (3, 4, 'Rosca com barra (livre)',       'dificil',   '5 kg/lado + barra (~5 kg).', '{12,10,10}', '{15,15,15}', null, null),
    (3, 5, 'Supino inclinado com halteres', 'dificil',   null, '{10,10,10}', '{10,10,10}', null, null),
    (3, 6, 'Rosca inclinada (halteres)',    'dificil',   null, '{10,8,9}',   '{10,10,10}', null, null),
    -- 11/10 · inferiores
    (4, 1, 'Leg press 45°',                 'dificil',   null, '{10,10,10}', '{70,70,70}', null, null),
    (4, 2, 'Panturrilha no leg press',      'na_medida', null, '{12,12,12}', '{70,70,70}', null, null),
    (4, 3, 'Extensora',                     'dificil',   null, '{12,12,12}', '{57,57,57}', null, null),
    (4, 4, 'Flexora',                       'dificil',   null, '{10,10,10}', '{57,57,57}', null, null),
    (4, 5, 'Adução',                        'dificil',   'Salto de 28 → 37 kg derrubou as reps.', '{3,3,3}', '{37,37,37}', null, null),
    (4, 6, 'Abdução',                       'dificil',   null, '{12,12,12}', '{57,57,57}', null, null),
    (4, 7, 'Afundo búlgaro',                'dificil',   null, '{10,10,10}', '{7,7,7}',    null, null),
    (4, 8, 'Dorsiflexão com halter',        'na_medida', 'Estreia.', '{20,20,20}', '{16,16,16}', null, null);

  select string_agg(distinct e.exercicio, ', ') into v_faltando
  from imp_execucoes e
  where not exists (select 1 from public.exercicios x where x.user_id = v_user and x.nome = e.exercicio);
  if v_faltando is not null then
    raise exception 'Exercícios fora do catálogo: %', v_faltando;
  end if;

  insert into public.sessoes (id, user_id, iniciada_em, encerrada_em, titulo, observacao)
  select id, v_user, iniciada_em, iniciada_em + make_interval(mins => coalesce(duracao_min, 0)), titulo, observacao
  from imp_sessoes;

  insert into public.sessao_exercicios (id, user_id, sessao_id, exercicio_id, iniciado_em, dificuldade, observacao)
  select e.id, v_user, s.id, x.id, s.iniciada_em + make_interval(secs => e.ordem),
         e.dificuldade::public.dificuldade, e.observacao
  from imp_execucoes e
  join imp_sessoes s on s.n = e.n
  join public.exercicios x on x.user_id = v_user and x.nome = e.exercicio;

  insert into public.series (user_id, sessao_exercicio_id, numero, reps, carga_kg, registrada_em)
  select v_user, e.id, i, e.reps[i], e.cargas[i], se.iniciado_em
  from imp_execucoes e
  join public.sessao_exercicios se on se.id = e.id
  cross join lateral generate_subscripts(e.reps, 1) as i
  where cardinality(e.reps) > 0;

  insert into public.series (user_id, sessao_exercicio_id, numero, duracao_s, distancia_m, registrada_em)
  select v_user, e.id, 1, e.duracao_s, e.distancia_m, se.iniciado_em
  from imp_execucoes e
  join public.sessao_exercicios se on se.id = e.id
  where cardinality(e.reps) = 0;
end;
$$;

-- Conferência: as 4 sessões, com 1, 8, 6 e 8 exercícios.
select to_char(s.iniciada_em at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') as inicio, s.titulo,
       count(se.id) as exercicios
from public.sessoes s
left join public.sessao_exercicios se on se.sessao_id = s.id
where s.iniciada_em in ('2026-10-04 13:00-03', '2026-10-09 12:00-03', '2026-10-09 13:00-03', '2026-10-11 12:00-03')
group by s.id
order by s.iniciada_em;
