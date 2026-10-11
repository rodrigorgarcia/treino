-- Catálogo inicial, consolidado a partir do log de treinos (sessões 1–37).
--
-- Rodar uma vez, no SQL Editor do Supabase, depois do primeiro login:
--   select public.seed_catalogo('<seu user id>');
-- O user id está em Authentication → Users. Pode rodar de novo sem duplicar.
--
-- Incrementos (passo dos botões + / −) foram inferidos das cargas usadas no log;
-- ajuste no app quando o aparelho for diferente.

create function public.seed_catalogo(p_user_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into public.grupos (user_id, nome, regiao, ordem) values
    (p_user_id, 'Peito',         'superiores',  10),
    (p_user_id, 'Costas',        'superiores',  20),
    (p_user_id, 'Ombros',        'superiores',  30),
    (p_user_id, 'Bíceps',        'superiores',  40),
    (p_user_id, 'Tríceps',       'superiores',  50),
    (p_user_id, 'Quadríceps',    'inferiores',  60),
    (p_user_id, 'Posterior',     'inferiores',  70),
    (p_user_id, 'Glúteos',       'inferiores',  80),
    (p_user_id, 'Adutores',      'inferiores',  90),
    (p_user_id, 'Abdutores',     'inferiores', 100),
    (p_user_id, 'Panturrilha',   'inferiores', 110),
    (p_user_id, 'Estabilização', 'inferiores', 120),
    (p_user_id, 'Abdômen',       'core',       130),
    (p_user_id, 'Cardio',        'cardio',     140)
  on conflict (user_id, nome) do nothing;

  insert into public.aparelhos (user_id, nome, incremento_kg, observacao) values
    (p_user_id, 'Leg press',              5,   'Carga = só as anilhas (+), sem o carrinho.'),
    (p_user_id, 'Extensora/Flexora',      10,  'Vai até 100 kg, de 10 em 10 kg.'),
    (p_user_id, 'Cadeira adutora',        2.5, null),
    (p_user_id, 'Cadeira abdutora',       10,  null),
    (p_user_id, 'Polia alta',             5,   null),
    (p_user_id, 'Remada sentada',         5,   null),
    (p_user_id, 'Chest press',            1,   'Carga anotada por lado.'),
    (p_user_id, 'Voador (peck deck)',     5,   null),
    (p_user_id, 'Cross Cable',            5,   'Crossover. Uma das máquinas não tem 20 kg (usa 23).'),
    (p_user_id, 'Máquina de panturrilha', 5,   null),
    (p_user_id, 'Máquina de abdominal',   2.5, null),
    (p_user_id, 'Máquina de hip thrust',  5,   null),
    (p_user_id, 'Halteres',               1,   'Inclui banco regulável e cadeira inclinada.'),
    (p_user_id, 'Barra livre',            2,   'Barra ~5 kg + anilhas; carga anotada como total.'),
    (p_user_id, 'Anilha (solo)',          1,   null),
    (p_user_id, 'Mini trampolim',         1,   null),
    (p_user_id, 'Esteira',                1,   null),
    (p_user_id, 'Climbmill',              1,   null)
  on conflict (user_id, nome) do nothing;

  insert into public.exercicios (user_id, nome, grupo_id, aparelho_id, tipo, reps_por_lado, indice, nota)
  select p_user_id, v.nome, g.id, a.id, v.tipo::public.tipo_exercicio, v.reps_por_lado, v.indice, v.nota
  from (values
    -- nome                                   grupo            aparelho                  tipo               por lado  índice  nota
    ('Supino máquina',                        'Peito',         'Chest press',            'carga_por_lado',  false,    17,     null),
    ('Voador (peck deck)',                    'Peito',         'Voador (peck deck)',     'carga',           false,    18,     null),
    ('Supino inclinado com halteres',         'Peito',         'Halteres',               'carga_por_lado',  false,    19,     null),
    ('Crucifixo no cabo',                     'Peito',         'Cross Cable',            'carga_por_lado',  false,    20,     null),
    ('Supino com halteres',                   'Peito',         'Halteres',               'carga_por_lado',  false,    null,   null),
    ('Crucifixo com halteres',                'Peito',         'Halteres',               'carga_por_lado',  false,    null,   null),
    ('Voador no cabo (fly lateral)',          'Peito',         'Cross Cable',            'carga',           false,    null,   null),

    ('Puxada alta (pegada aberta)',           'Costas',        'Polia alta',             'carga',           false,    null,   null),
    ('Puxada alta (pegada supinada)',         'Costas',        'Polia alta',             'carga',           false,    25,     null),
    ('Puxada alta (corda)',                   'Costas',        'Cross Cable',            'carga',           false,    null,   null),
    ('Remada baixa (triângulo)',              'Costas',        'Remada sentada',         'carga',           false,    22,     null),
    ('Remada baixa (barra)',                  'Costas',        'Remada sentada',         'carga',           false,    28,     null),
    ('Remada curvada',                        'Costas',        'Barra livre',            'carga',           false,    null,   null),

    ('Elevação lateral (cabo)',               'Ombros',        'Cross Cable',            'carga',           false,    1,      null),
    ('Elevação frontal (cabo)',               'Ombros',        'Cross Cable',            'carga_por_lado',  false,    2,      null),
    ('Crucifixo inverso (cabo)',              'Ombros',        'Cross Cable',            'carga_por_lado',  false,    3,      null),
    ('Desenvolvimento sentado (halteres)',    'Ombros',        'Halteres',               'carga_por_lado',  false,    5,      null),
    ('Voador no cabo bilateral',              'Ombros',        'Cross Cable',            'carga',           false,    21,     null),
    ('Face pull (cabo)',                      'Ombros',        'Cross Cable',            'carga',           false,    null,   null),

    ('Rosca com barra (cabo baixo)',          'Bíceps',        'Cross Cable',            'carga',           false,    30,     null),
    ('Rosca na corda (cabo baixo)',           'Bíceps',        'Cross Cable',            'carga',           false,    null,   null),
    ('Rosca por trás (cabo baixo)',           'Bíceps',        'Cross Cable',            'carga_por_lado',  false,    null,   null),
    ('Puxada triângulo (bíceps)',             'Bíceps',        'Cross Cable',            'carga',           false,    null,   null),
    ('Rosca martelo',                         'Bíceps',        'Halteres',               'carga_por_lado',  false,    null,   null),
    ('Rosca martelo cruzada',                 'Bíceps',        'Halteres',               'carga',           true,     31,     null),
    ('Rosca alternada (halteres)',            'Bíceps',        'Halteres',               'carga_por_lado',  false,    null,   null),
    ('Rosca inclinada (halteres)',            'Bíceps',        'Halteres',               'carga_por_lado',  false,    29,     null),
    ('Rosca com barra (livre)',               'Bíceps',        'Barra livre',            'carga',           false,    32,     null),

    ('Tríceps corda',                         'Tríceps',       'Cross Cable',            'carga',           false,    null,   null),
    ('Tríceps pushdown com barra',            'Tríceps',       'Cross Cable',            'carga',           false,    14,     null),
    ('Tríceps francês (cabo)',                'Tríceps',       'Cross Cable',            'carga',           false,    15,     null),
    ('Tríceps unilateral (cabo)',             'Tríceps',       'Cross Cable',            'carga',           false,    16,     'Assimetria: braço direito mais fraco — equalizar.'),
    ('Tríceps francês (halter)',              'Tríceps',       'Halteres',               'carga',           false,    null,   null),

    ('Leg press 45°',                         'Quadríceps',    'Leg press',              'carga_adicional', false,    1,      null),
    ('Extensora',                             'Quadríceps',    'Extensora/Flexora',      'carga',           false,    3,      null),
    ('Extensora unilateral',                  'Quadríceps',    'Extensora/Flexora',      'carga',           true,     null,   null),
    ('Afundo búlgaro',                        'Quadríceps',    'Halteres',               'carga_por_lado',  true,     8,      null),
    ('Agachamento sumô',                      'Quadríceps',    'Halteres',               'carga',           false,    null,   '⚠️ Desconforto na virilha em 23/08 — carga menor e atenção à amplitude.'),
    ('Agachamento livre',                     'Quadríceps',    'Barra livre',            'carga',           false,    null,   null),

    ('Flexora',                               'Posterior',     'Extensora/Flexora',      'carga',           false,    4,      null),
    ('Stiff',                                 'Posterior',     'Barra livre',            'carga',           false,    null,   null),

    ('Elevação pélvica (hip thrust)',         'Glúteos',       'Máquina de hip thrust',  'carga',           false,    7,      null),
    ('Coice no cabo',                         'Glúteos',       'Cross Cable',            'carga',           false,    null,   null),

    ('Adução',                                'Adutores',      'Cadeira adutora',        'carga',           false,    5,      null),
    ('Abdução',                               'Abdutores',     'Cadeira abdutora',       'carga',           false,    6,      null),
    ('Abdução no cabo',                       'Abdutores',     'Cross Cable',            'carga',           false,    9,      'Lado esquerdo mais limitante.'),

    ('Panturrilha no leg press',              'Panturrilha',   'Leg press',              'carga_adicional', false,    2,      null),
    ('Panturrilha unilateral no leg press',   'Panturrilha',   'Leg press',              'carga_por_lado',  true,     null,   null),
    ('Panturrilha na máquina',                'Panturrilha',   'Máquina de panturrilha', 'carga',           false,    null,   null),

    ('Saltos pausados unilaterais',           'Estabilização', 'Mini trampolim',         'peso_corporal',   true,     null,   null),

    ('Abdominal na máquina',                  'Abdômen',       'Máquina de abdominal',   'carga',           false,    null,   null),
    ('Crunch com anilha',                     'Abdômen',       'Anilha (solo)',          'carga',           false,    null,   null),

    ('Corrida',                               'Cardio',        'Esteira',                'cardio',          false,    null,   null),
    ('Climbmill',                             'Cardio',        'Climbmill',              'cardio',          false,    null,   null)
  ) as v(nome, grupo, aparelho, tipo, reps_por_lado, indice, nota)
  join public.grupos g on g.user_id = p_user_id and g.nome = v.grupo
  left join public.aparelhos a on a.user_id = p_user_id and a.nome = v.aparelho
  on conflict (user_id, nome) do nothing;
end;
$$;

-- Só pelo SQL Editor (role postgres); o app não chama.
revoke execute on function public.seed_catalogo(uuid) from public, anon, authenticated;
