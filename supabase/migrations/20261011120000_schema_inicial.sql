-- Treino — schema inicial
--
-- Catálogo:  grupos ─┐
--            aparelhos ─┴─> exercicios
-- Registro:  sessoes ─> sessao_exercicios ─> series
--
-- Todas as tabelas têm user_id (default auth.uid()) e RLS "só o dono".

-- ─────────────────────────────────────────────────────────────
-- Tipos
-- ─────────────────────────────────────────────────────────────

create type public.regiao as enum ('superiores', 'inferiores', 'core', 'cardio');

-- Como a carga do exercício é lida e exibida.
create type public.tipo_exercicio as enum (
  'carga',            -- "30 kg"       (pilha da máquina, cabo, barra total)
  'carga_por_lado',   -- "15 kg/lado"  (cada halter, cada lado do chest press)
  'carga_adicional',  -- "+50 kg"      (leg press: só as anilhas, sem o carrinho)
  'peso_corporal',    -- só repetições
  'cardio'            -- tempo, distância, andares
);

create type public.dificuldade as enum ('facil', 'na_medida', 'dificil', 'muito_dificil', 'falha');

-- ─────────────────────────────────────────────────────────────
-- Catálogo
-- ─────────────────────────────────────────────────────────────

create table public.grupos (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome    text not null,
  regiao  public.regiao not null,
  ordem   smallint not null default 0,
  unique (user_id, nome)
);

create table public.aparelhos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome          text not null,
  incremento_kg numeric(5, 2) not null default 5 check (incremento_kg > 0),  -- passo dos botões + / −
  observacao    text,                                                       -- "vai até 100 kg, de 10 em 10"
  unique (user_id, nome)
);

create table public.exercicios (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome          text not null,
  grupo_id      uuid not null references public.grupos (id),
  aparelho_id   uuid references public.aparelhos (id),
  tipo          public.tipo_exercicio not null default 'carga',
  reps_por_lado boolean not null default false,              -- exibe "10/lado" ("/perna" nos inferiores)
  incremento_kg numeric(5, 2) check (incremento_kg > 0),     -- null = usa o do aparelho
  indice        smallint,                                     -- número no seu índice (#16)
  nota          text,                                         -- nota fixa exibida na tela de log
  arquivado     boolean not null default false,
  criado_em     timestamptz not null default now(),
  unique (user_id, nome)
);

create index exercicios_grupo_id_idx on public.exercicios (grupo_id);
create index exercicios_aparelho_id_idx on public.exercicios (aparelho_id);

-- ─────────────────────────────────────────────────────────────
-- Registro
-- ─────────────────────────────────────────────────────────────

create table public.sessoes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  iniciada_em  timestamptz not null default now(),
  encerrada_em timestamptz,                    -- null = sessão em andamento
  titulo       text,                           -- "Treino Inferiores"
  objetivo     text,
  observacao   text,
  check (encerrada_em is null or encerrada_em >= iniciada_em)
);

-- No máximo uma sessão em andamento por usuário.
create unique index sessoes_uma_em_andamento on public.sessoes (user_id) where encerrada_em is null;
create index sessoes_user_iniciada_idx on public.sessoes (user_id, iniciada_em desc);

-- Um exercício feito dentro de uma sessão. Voltar ao mesmo exercício
-- na mesma sessão continua o mesmo registro (unique).
create table public.sessao_exercicios (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sessao_id    uuid not null references public.sessoes (id) on delete cascade,
  exercicio_id uuid not null references public.exercicios (id),
  iniciado_em  timestamptz not null default now(),   -- define a ordem dentro da sessão
  dificuldade  public.dificuldade,                   -- avaliação ao concluir o exercício
  observacao   text,                                 -- "ajuste de pegada", "caiu na última"
  unique (sessao_id, exercicio_id)
);

create index sessao_exercicios_exercicio_id_idx on public.sessao_exercicios (exercicio_id);

-- Cada série. Força usa reps + carga_kg; cardio usa duracao_s / distancia_m / andares.
-- carga_kg segue o tipo do exercício (total, por lado ou adicional).
create table public.series (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sessao_exercicio_id uuid not null references public.sessao_exercicios (id) on delete cascade,
  numero              smallint not null check (numero > 0),   -- preenchido automaticamente se omitido
  reps                smallint check (reps >= 0),
  carga_kg            numeric(6, 2) check (carga_kg >= 0),
  duracao_s           integer check (duracao_s >= 0),
  distancia_m         integer check (distancia_m >= 0),
  andares             smallint check (andares >= 0),
  registrada_em       timestamptz not null default now(),
  constraint series_numero_unico unique (sessao_exercicio_id, numero) deferrable initially immediate,
  check (reps is not null or duracao_s is not null or distancia_m is not null)
);

-- numero = próxima série do exercício quando o cliente não informa.
create function public.series_numerar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.numero is null then
    select coalesce(max(numero), 0) + 1 into new.numero
    from public.series
    where sessao_exercicio_id = new.sessao_exercicio_id;
  end if;
  return new;
end;
$$;

create trigger series_numerar
before insert on public.series
for each row execute function public.series_numerar();

-- Apagar a série 2 de 3 renumera a 3 para 2.
create function public.series_renumerar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.series
  set numero = numero - 1
  where sessao_exercicio_id = old.sessao_exercicio_id
    and numero > old.numero;
  return null;
end;
$$;

create trigger series_renumerar
after delete on public.series
for each row execute function public.series_renumerar();

-- ─────────────────────────────────────────────────────────────
-- RLS: cada usuário só vê e altera o que é seu
-- ─────────────────────────────────────────────────────────────

alter table public.grupos            enable row level security;
alter table public.aparelhos         enable row level security;
alter table public.exercicios        enable row level security;
alter table public.sessoes           enable row level security;
alter table public.sessao_exercicios enable row level security;
alter table public.series            enable row level security;

create policy dono on public.grupos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy dono on public.aparelhos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy dono on public.exercicios for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy dono on public.sessoes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy dono on public.sessao_exercicios for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy dono on public.series for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update, delete on
  public.grupos, public.aparelhos, public.exercicios,
  public.sessoes, public.sessao_exercicios, public.series
to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Views de leitura (security_invoker: respeitam o RLS de quem consulta)
-- ─────────────────────────────────────────────────────────────

-- Uma linha por exercício feito em uma sessão, com as séries em arrays.
-- Ex.: reps = {12,10,8}, cargas_kg = {30,30,30}
create view public.v_execucoes
with (security_invoker = true) as
select
  se.id,
  se.sessao_id,
  se.exercicio_id,
  s.iniciada_em  as sessao_iniciada_em,
  s.encerrada_em as sessao_encerrada_em,
  se.iniciado_em,
  se.dificuldade,
  se.observacao,
  count(sr.id)::int as n_series,
  coalesce(array_agg(sr.reps     order by sr.numero) filter (where sr.id is not null), '{}') as reps,
  coalesce(array_agg(sr.carga_kg order by sr.numero) filter (where sr.id is not null), '{}') as cargas_kg,
  sum(sr.duracao_s)::int   as duracao_s,
  sum(sr.distancia_m)::int as distancia_m,
  sum(sr.andares)::int     as andares
from public.sessao_exercicios se
join public.sessoes s on s.id = se.sessao_id
left join public.series sr on sr.sessao_exercicio_id = se.id
group by se.id, s.id;

-- Última execução de cada exercício em sessões já encerradas
-- (a sessão em andamento não conta como "última vez").
create view public.v_ultima_execucao
with (security_invoker = true) as
select distinct on (exercicio_id) *
from public.v_execucoes
where sessao_encerrada_em is not null
  and n_series > 0
order by exercicio_id, sessao_iniciada_em desc, iniciado_em desc;

-- Catálogo pronto para a tela de navegação: exercício + grupo + aparelho + última vez.
create view public.v_catalogo
with (security_invoker = true) as
select
  e.id,
  e.nome,
  e.tipo,
  e.reps_por_lado,
  e.indice,
  e.nota,
  e.arquivado,
  coalesce(e.incremento_kg, a.incremento_kg, 1) as incremento_kg,
  g.id    as grupo_id,
  g.nome  as grupo,
  g.regiao,
  g.ordem as grupo_ordem,
  a.id    as aparelho_id,
  a.nome  as aparelho,
  u.sessao_iniciada_em as ultima_em,
  u.reps               as ultima_reps,
  u.cargas_kg          as ultima_cargas_kg,
  u.duracao_s          as ultima_duracao_s,
  u.distancia_m        as ultima_distancia_m,
  u.andares            as ultima_andares,
  u.dificuldade        as ultima_dificuldade,
  u.observacao         as ultima_observacao
from public.exercicios e
join public.grupos g on g.id = e.grupo_id
left join public.aparelhos a on a.id = e.aparelho_id
left join public.v_ultima_execucao u on u.exercicio_id = e.id;

-- Lista de sessões para a consulta.
create view public.v_sessoes
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
  coalesce(array_agg(distinct g.regiao) filter (where g.id is not null), '{}') as regioes
from public.sessoes s
left join public.sessao_exercicios se on se.sessao_id = s.id
left join public.exercicios e on e.id = se.exercicio_id
left join public.grupos g on g.id = e.grupo_id
group by s.id;

grant select on public.v_execucoes, public.v_ultima_execucao, public.v_catalogo, public.v_sessoes
to authenticated;
