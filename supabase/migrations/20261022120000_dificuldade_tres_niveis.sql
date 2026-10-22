-- "Como foi?" passa a ter 3 níveis: Fácil, Na medida e Difícil. O que estava marcado como
-- "Muito difícil" ou "Falha" vira "Difícil".
--
-- O Postgres não remove valores de um enum sem recriar o tipo (e as views que usam a coluna),
-- então muito_dificil e falha continuam no tipo, mas a restrição abaixo impede usá-los.
update public.sessao_exercicios
set dificuldade = 'dificil'
where dificuldade in ('muito_dificil', 'falha');

alter table public.sessao_exercicios
  add constraint sessao_exercicios_dificuldade_tres_niveis
  check (dificuldade is null or dificuldade in ('facil', 'na_medida', 'dificil'));

comment on type public.dificuldade is
  'Em uso: facil, na_medida, dificil. muito_dificil e falha viraram dificil em 22/10/2026 e são barrados por sessao_exercicios_dificuldade_tres_niveis.';
