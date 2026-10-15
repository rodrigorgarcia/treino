-- O número do índice (#16) deixou de ser usado: o app não mostra mais o número e
-- as listas ficam em ordem alfabética dentro de cada grupo.
-- Esta migração só limpa os valores. A coluna continua, sem uso, para não precisar
-- recriar as views que a leem (v_catalogo).

update public.exercicios set indice = null where indice is not null;

comment on column public.exercicios.indice is 'Sem uso desde 15/10/2026: o app não mostra nem ordena por ele.';
