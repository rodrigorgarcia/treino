-- Importação do histórico: 37 sessões, 307 exercícios.
-- Gerado por scripts/importar_log.py a partir de docs/referencia/treino_log.md. Não editar à mão.
--
-- Rodar UMA vez no SQL Editor do Supabase, depois de:
--   1. aplicar as migrações de supabase/migrations/;
--   2. criar o seu usuário (Authentication → Users → Add user).
-- Também roda o seed do catálogo. Cancela tudo se já houver sessões, para não duplicar.

do $$
declare
  v_user uuid;
  v_faltando text;
begin
  if (select count(*) from auth.users) <> 1 then
    raise exception 'Esperava exatamente 1 usuário em auth.users (há %).', (select count(*) from auth.users);
  end if;
  select id into v_user from auth.users;

  if exists (select 1 from public.sessoes where user_id = v_user) then
    raise exception 'Já existem sessões para este usuário; importação cancelada para não duplicar.';
  end if;

  perform public.seed_catalogo(v_user);

  create temp table imp_sessoes (
    n int primary key, id uuid not null default gen_random_uuid(),
    iniciada_em timestamptz not null, duracao_min int, titulo text, objetivo text, observacao text
  ) on commit drop;

  insert into imp_sessoes (n, iniciada_em, duracao_min, titulo, objetivo, observacao) values
    (1, '2026-04-05 12:00-03', null, 'Manutenção de Carga', 'Manutenção — volume reduzido, ritmo constante (dia seguinte a treino AB completo)', 'Ordem: Livre (academia cheia)'),
    (2, '2026-04-19 12:00-03', 50, 'Treino Misto', 'Manutenção de cargas (14 dias desde o último treino)', 'Ordem: Livre (academia cheia)'),
    (3, '2026-04-21 12:00-03', 45, 'Treino Foco — Grupos Alternativos', 'Foco em costas médias, bíceps, adutores e ombros (2 dias após treino misto)', 'Ordem: Livre
Ombros: grupo novo no log. Incluir mais exercícios de ombro nas próximas sessões (elevação frontal, desenvolvimento, etc.)'),
    (4, '2026-04-25 12:00-03', 50, 'Treino Misto', 'Testar progressões em 3 exercícios + consolidar os demais (4 dias de descanso)', 'Ordem: Livre'),
    (5, '2026-05-10 12:00-03', 50, 'Treino Misto', 'Progressão conservadora após 15 dias de descanso', 'Ordem: Livre
Extensora/Flexora: máquina vai até 100 kg, incrementos de 10 em 10 kg. Próximo salto após 35 kg = 45 kg.
Sem panturrilha e sem corrida hoje.'),
    (6, '2026-06-06 12:00-03', 60, 'Treino Misto', 'Manutenção após 27 dias de descanso + teste puxada alta 30 kg nas 3 séries', 'Ordem: Livre
Sem panturrilha hoje.'),
    (7, '2026-06-14 12:00-03', 50, 'Treino Variado', 'Mesmos grupos musculares do misto, movimentos livres diferentes (dia seguinte ao misto)', 'Ordem: Agrupado por equipamento
Stiff não realizado hoje. Primeira sessão com exercícios livres (barra + halteres) no log.
Sem corrida hoje.
Não realizados: Stiff.'),
    (8, '2026-06-20 12:00-03', 40, 'Treino Foco Inferiores', 'Foco em inferiores, sem cardio (6 dias desde o último)', 'Ordem: Livre
Correção registrada: Abdução (#4) foi feita com 35 kg (não 20 kg), fechando 12 reps na medida — atualização em relação ao plano inicial.
Panturrilha: variação unilateral testada hoje no leg press (diferente da máquina dedicada usada na sessão anterior).
Sem cardio hoje.'),
    (9, '2026-06-20 13:00-03', null, 'Treino de Estabilização + Cardio', 'Estabilizadores (mini trampolim) + cardio (Climbmill)', 'Sessão diferente do padrão: foco em estabilizadores unilaterais + cardio em climbmill, sem o bloco habitual de musculação.'),
    (10, '2026-06-21 12:00-03', null, 'Treino Organizado por Blocos', 'Treino organizado por equipamento (Crossover → Banco/halteres → Máquinas)', 'Ordem: Bloco 1 (Crossover) → Bloco 3 (Máquinas) → Bloco 2 (Banco + halteres)'),
    (11, '2026-06-25 12:00-03', null, 'Treino Foco Inferiores', 'Foco em inferiores', 'Ordem: Livre
Novo exercício: coice no cabo (cable kickback) para glúteo, usando o módulo móvel do crossover com cinta de tornozelo.'),
    (12, '2026-06-28 12:00-03', 50, 'Treino Superiores', 'Testar progressões em vários exercícios', 'Ordem: Bloco Cross Cable (1→3) → Remada (4) → Máquinas (5→6) → Banco + halteres (7→8)
Decisão estratégica do usuário: Voador (peck deck) fica retido em 25 kg propositalmente até a elevação lateral (cabo) atingir 12 reps consistentes nas 3 séries — mesmo que o Voador fique fácil antes disso. Essa regra foi salva na memória persistente.
Desenvolvimento não realizado hoje (substituído por corrida).
Não realizados: Desenvolvimento sentado (halteres).'),
    (13, '2026-07-25 12:00-03', null, 'Reativação + Treino Variado', 'Primeiro treino após 27 dias parado (resfriado). Volume reduzido, sem forçar.', 'Ordem: Livre
Primeiro treino de volta após 27 dias parado + resfriado. Agachamento sumô e hip thrust não realizados — encerrou mais cedo.
Sem cardio hoje.
Não realizados: Agachamento sumô, Elevação pélvica (hip thrust).'),
    (14, '2026-07-31 12:00-03', null, 'Ativação de Pernas + Braços', 'Ativação leve de pernas + foco em braços', 'Ordem: Livre
Elevação lateral: chegou em 10 reps — faltam 2 reps para liberar progressão do Voador (regra da memória).
Adução não realizada hoje.
Não realizados: Adução.'),
    (15, '2026-08-08 12:00-03', null, 'Treino Misto', 'Reativação mista com cargas conservadoras (8 dias desde o último)', 'Ordem: Livre
Extensora e Flexora substituídas por Adução e Abdução hoje.
Voador não realizado hoje.
Sem cardio hoje.
Não realizados: Voador (peck deck).'),
    (16, '2026-08-15 12:00-03', 45, 'Treino de Braços', 'Foco em braços, organizado por bloco de equipamento', 'Ordem: Seguiu o plano
Sem cardio hoje.'),
    (17, '2026-08-16 12:00-03', null, 'Treino Inferiores + Extras', 'Inferiores + estreia do agachamento sumô + exercícios extras', 'Ordem: Livre
⭐ Novos exercícios estreantes nesta sessão:
- Agachamento sumô (halteres) — padrão de força unilateral, inclinar tronco, pés afastados. Referência inicial: 12 kg na medida.
- Crunch com anilha (solo) — abdominal com carga, anilha posicionada atrás/acima da cabeça. Referência inicial: 4 kg na medida.
- Rosca alternada (halteres) — bíceps unilateral alternado. Referência inicial: 10 kg/lado, difícil.'),
    (18, '2026-08-20 12:00-03', null, 'Treino Superiores', 'Treino de superiores — ordem livre (academia cheia)', 'Sem cardio hoje.
⭐ Novo exercício: rosca bíceps por trás (cabo baixo) — unilateral, polia baixa, puxando de trás. Isola bem o pico do bíceps. Referência inicial: 10 kg/lado, difícil.
Voador: hold removido — carga permanente em 25 kg por decisão do usuário.
Sem cardio hoje.'),
    (19, '2026-08-23 12:00-03', null, 'Treino Inferiores', 'Inferiores com estreia do hip thrust (adiada) + progressões', 'Ordem: Livre
⚠️ Agachamento sumô: desconforto na virilha na 3ª série — interrompido. Revisar execução (joelhos, amplitude) antes de retomar.
Hip thrust: estreia adiada por precaução.
Não realizados: Elevação pélvica (hip thrust).'),
    (20, '2026-08-26 12:00-03', 45, 'Treino Superiores', 'Superiores baseado no último de 20/08', 'Ordem: Livre
Supino, Voador e Crunch não realizados hoje.
⭐ Novo exercício: crucifixo no cabo (cross) — peito, 10 kg, difícil. Referência inicial registrada.
Sem cardio hoje.
Não realizados: Supino máquina, Voador (peck deck), Crunch com anilha.'),
    (21, '2026-08-30 12:00-03', 45, 'Treino Inferiores', 'Inferiores + estreia do hip thrust na máquina', 'Ordem: Livre
Hip thrust: estreia na máquina (não banco+halter como planejado) em 20 kg — acima do esperado. Manter até estabilidade em 12 reps.
Agachamento sumô: não realizado hoje — continua com ⚠️ atenção à virilha.
Sem cardio hoje.
Não realizados: Agachamento sumô.'),
    (22, '2026-08-31 12:00-03', 40, 'Treino Superiores', 'Superiores enxuto', 'Ordem: Livre
Sem cardio hoje.
⭐ Novo aparelho: máquina de abdominal — referência inicial 27 kg, difícil.'),
    (23, '2026-09-02 12:00-03', null, 'Treino Inferiores', 'Inferiores — progressão em reps no leg press e panturrilha', 'Ordem: Livre
Hip thrust e agachamento sumô não realizados — faltou tempo.
Sem cardio hoje.
Não realizados: Elevação pélvica (hip thrust), Agachamento sumô.'),
    (24, '2026-09-04 12:00-03', null, 'Treino Cross Cable', 'Treino focado na Cross Cable — exercícios variados', 'Ordem: Livre
⭐ Novo exercício: voador no cabo (fly lateral) — polia na altura do ombro, braço estendido lateralmente. Trabalha peitoral médio. Referência: 5 kg, difícil.
⭐ Novo exercício: rosca bíceps na corda (cabo baixo) — corda no cabo baixo, puxada bilateral de baixo para cima.
⭐ Novo exercício: tríceps pushdown com barra (cabo) — igual tríceps corda mas com barra. Referência: 30 kg muito leve, subir para 35 kg.
Sem cardio hoje.'),
    (25, '2026-09-06 12:00-03', 50, 'Treino Inferiores', 'Inferiores completo', 'Ordem: Livre
Agachamento sumô não realizado hoje.
Sem cardio hoje.
Não realizados: Agachamento sumô.'),
    (26, '2026-09-09 12:00-03', null, 'Treino Cross Cable + Superiores', 'Foco em Cross Cable com exercícios de superiores', 'Ordem: Livre
Sem cardio hoje.'),
    (27, '2026-09-12 12:00-03', 50, 'Treino Inferiores', 'Inferiores completo', 'Ordem: Livre
Extensora, Flexora e Agachamento sumô não realizados hoje.
Sem cardio hoje.
Não realizados: Extensora, Flexora, Agachamento sumô.'),
    (28, '2026-09-13 12:00-03', 50, 'Treino Superiores + Ombros', 'Superiores com foco em ombros — 3 exercícios de ombro incluídos', 'Ordem: Livre
⭐ Novos exercícios estreantes:
- Elevação frontal no cabo — deltóide frontal, 5 kg/lado
- Crucifixo inverso/posterior no cabo — deltóide posterior, polia baixa, unilateral, 5 kg/lado
- Rosca bíceps com barra — barra + anilhas, 15 kg total (barra ~5 kg + 5 kg/lado)
Sem cardio hoje.'),
    (29, '2026-09-16 12:00-03', null, 'Treino Cross Cable + Superiores', 'Foco em Cross Cable com exercícios de superiores e ombros', 'Ordem: Livre
⭐ Novo exercício: face pull (cabo) — polia alta, de frente, corda até a testa. Trabalha deltóide posterior, trapézio e romboides. Referência: 25 kg fácil → 30 kg na próxima.
Sem cardio hoje.'),
    (30, '2026-09-19 12:00-03', null, 'Treino Superiores + Ombros', 'Superiores com seleção livre do índice', 'Ordem: Livre
⭐ Novos exercícios:
- Tríceps unilateral no cabo — assimetria D/E observada; braço direito mais fraco. Referência: 10 kg, difícil.
- Supino inclinado com halteres — 10 kg/lado, na medida. Manter até decisão de progredir.
- Rosca bíceps inclinada (halteres) — cadeira inclinada, maior amplitude. 8 kg/lado, difícil.
⚠️ Assimetria detectada: tríceps direito mais fraco que o esquerdo — monitorar evolução com exercícios unilaterais.
Sem cardio hoje.'),
    (31, '2026-09-20 12:00-03', null, 'Treino Inferiores', 'Inferiores — foco em progressão de reps', 'Ordem: Pelo índice
⭐ Novo exercício: abdução no cabo (perna) — tornozelo preso na polia baixa, abertura lateral da perna. Trabalha abdutores e glúteo médio. Referência: 5 kg, difícil, lado esquerdo mais limitante.
Sem cardio hoje.'),
    (32, '2026-09-22 12:00-03', null, 'Treino Ombros + Braços', 'Ombros completos + bíceps/tríceps na Cross Cable', 'Ordem: Livre
⭐ Novo exercício: desenvolvimento sentado (halteres) — ombros, 7 kg/lado, na medida. → 8 kg na próxima.
Rosca invertida substituída por rosca bíceps normal — braquial já coberto pela rosca martelo cruzada.
Tríceps corda e rosca na corda não realizados hoje.
Sem cardio hoje.'),
    (33, '2026-09-24 12:00-03', null, 'Treino Peito + Costas', 'Peito e costas com duas estreias na puxada e remada', 'Ordem: Livre
Voador e crucifixo no cabo não realizados hoje.
⭐ Puxada supinada: estreia em 30 kg (planejado 25 kg).
⭐ Remada com barra: estreia em 30 kg (planejado 25 kg).
Sem cardio hoje.'),
    (34, '2026-09-26 12:00-03', null, 'Treino Bíceps + Tríceps + Ombros', 'Braços e ombros', 'Ordem: Pelo índice
⭐ Novo exercício: voador no cabo bilateral (fly lateral) — ambos os cabos simultâneos na altura do ombro. Mais exigente que o unilateral. Referência: 5 kg, difícil.
Sem cardio hoje.'),
    (35, '2026-09-27 12:00-03', null, 'Treino Inferiores', 'Inferiores — progressão de carga em vários exercícios', 'Ordem: Pelo índice
Hip thrust (7) e abdução no cabo (9) não realizados hoje.
⬆️ Sessão de progressão de carga: leg press, panturrilha, extensora, flexora e abdução subiram de 50→60 kg / 47→57 kg.
Sem cardio hoje.'),
    (36, '2026-10-02 12:00-03', 180, 'Treino Superiores (Ombros, Braços, Peito, Costas)', null, 'Duração estimada: ~3h (sessão longa, dividida em blocos)
Sessão completa de superiores — ombros, tríceps, bíceps, peito e costas. Voador bilateral no cabo reclassificado de peito → ombros/costas (movimento de abertura lateral com polia na altura do ombro).
Novos exercícios registrados:
- #28 Remada pegada supinada (Remada sentada) — 30 kg, 3x10 (registrado sessão anterior)
- #29 Rosca inclinada (Halteres + cadeira) — estreia hoje
- #30 Rosca com barra (cabo) (Cross Cable) — estreia hoje
- #31 Rosca martelo cruzada (Halteres) — estreia hoje
Destaques:
- Tríceps pushdown: pronto para subir para 40 kg ⬆️
- Elevação frontal: pronto para subir para 6 kg/lado ⬆️
- Puxada supinada: subiu de 30 → 35 kg ⬆️
- Supino inclinado: subiu de 3x6 → 3x8 ⬆️
- Desenvolvimento: subiu de 7 → 8 kg/lado ⬆️
- Remada triângulo: testou 40 kg mas reps caíram — voltar para 35 kg
- Voador bilateral reclassificado: peito → ombros/costas (movimento lateral, polia altura do ombro)'),
    (37, '2026-10-04 12:00-03', null, 'Treino Inferiores', 'Inferiores — progressão de reps', 'Ordem: Pelo índice
Rosca bíceps com barra (barra + anilhas, 5 kg, 3x10, difícil) realizada nesta sessão — exercício de bíceps, registrado no índice de superiores como #32.
Hip thrust (7), afundo búlgaro (8) e abdução no cabo (9) não realizados.');

  create temp table imp_execucoes (
    id uuid not null default gen_random_uuid(), n int not null, ordem int not null,
    exercicio text not null, dificuldade text, observacao text,
    reps int[], cargas numeric[], duracao_s int, distancia_m int, andares int
  ) on commit drop;

  insert into imp_execucoes (n, ordem, exercicio, dificuldade, observacao, reps, cargas, duracao_s, distancia_m, andares) values
    (1, 1, 'Leg press 45°', 'na_medida', null, array[12, 12, 12]::int[], array[40, 40, 40]::numeric[], null, null, null),
    (1, 2, 'Flexora', 'na_medida', null, array[12, 12, 12]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (1, 3, 'Puxada alta (pegada aberta)', 'na_medida', null, array[12, 12, 12]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (1, 4, 'Supino máquina', 'na_medida', null, array[12, 12, 12]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (1, 5, 'Voador (peck deck)', 'na_medida', null, array[12, 12, 12]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (1, 6, 'Tríceps corda', 'dificil', null, array[12, 12, 12]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (1, 7, 'Corrida', null, 'Meta era: ~20 min / ~2,0 km', array[]::int[], null, 1380, null, null),
    (2, 1, 'Leg press 45°', 'na_medida', null, array[10, 10, 10]::int[], array[40, 40, 40]::numeric[], null, null, null),
    (2, 2, 'Panturrilha no leg press', 'na_medida', null, array[8, 8, 8]::int[], array[40, 40, 40]::numeric[], null, null, null),
    (2, 3, 'Extensora', 'na_medida', null, array[12, 12, 12]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (2, 4, 'Flexora', 'na_medida', null, array[12, 12, 12]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (2, 5, 'Puxada alta (pegada aberta)', 'na_medida', null, array[12, 12, 12]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (2, 6, 'Supino máquina', 'na_medida', null, array[12, 12, 12]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (2, 7, 'Voador (peck deck)', 'na_medida', null, array[12, 12, 12]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (2, 8, 'Tríceps corda', 'dificil', null, array[12, 12, 12]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (2, 9, 'Corrida', null, null, array[]::int[], null, 1800, 2900, null),
    (3, 1, 'Remada baixa (triângulo)', 'facil', null, array[12, 12, 12]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (3, 2, 'Puxada triângulo (bíceps)', 'facil', null, array[12, 12, 12]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (3, 3, 'Adução', 'dificil', null, array[10, 10, 10]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (3, 4, 'Rosca com barra (cabo baixo)', 'dificil', 'no limite', array[15, 15, 15]::int[], array[15, 15, 15]::numeric[], null, null, null),
    (3, 5, 'Elevação lateral (cabo)', 'muito_dificil', null, array[6, 6, 6]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (3, 6, 'Corrida', null, '🏆 Novo recorde!', array[]::int[], null, 1800, 3300, null),
    (4, 1, 'Leg press 45°', 'na_medida', null, array[12, 12, 12]::int[], array[40, 40, 40]::numeric[], null, null, null),
    (4, 2, 'Panturrilha no leg press', 'na_medida', null, array[8, 8, 8]::int[], array[40, 40, 40]::numeric[], null, null, null),
    (4, 3, 'Extensora', 'dificil', null, array[12, 12, 12]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (4, 4, 'Supino máquina', 'facil', null, array[12, 12, 12]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (4, 5, 'Voador (peck deck)', 'dificil', 'quase não deu', array[12, 12, 12]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (4, 6, 'Remada baixa (triângulo)', 'dificil', 'por pouco', array[12, 12, 12]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (4, 7, 'Tríceps corda', 'dificil', 'não completou', array[12, 12, 12]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (4, 8, 'Elevação lateral (cabo)', 'dificil', null, array[6, 6, 6]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (4, 9, 'Corrida', null, '🏆 Novo recorde!', array[]::int[], null, 1800, 3500, null),
    (5, 1, 'Leg press 45°', 'na_medida', null, array[12, 12, 12]::int[], array[40, 40, 40]::numeric[], null, null, null),
    (5, 2, 'Extensora', 'na_medida', null, array[12, 12, 12]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (5, 3, 'Flexora', 'na_medida', null, array[12, 12, 12]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (5, 4, 'Supino máquina', 'dificil', null, array[10, 10, 10]::int[], array[14, 14, 14]::numeric[], null, null, null),
    (5, 5, 'Puxada alta (pegada aberta)', 'dificil', 'última série', array[12, 12, 12]::int[], array[25, 25, 30]::numeric[], null, null, null),
    (5, 6, 'Remada baixa (triângulo)', 'na_medida', null, array[12, 12, 12]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (5, 7, 'Tríceps corda', 'dificil', 'completou!', array[12, 12, 12]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (5, 8, 'Elevação lateral (cabo)', 'dificil', null, array[6, 6, 6]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (6, 1, 'Leg press 45°', 'na_medida', null, array[12, 12, 12]::int[], array[40, 40, 40]::numeric[], null, null, null),
    (6, 2, 'Extensora', 'na_medida', null, array[12, 12, 12]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (6, 3, 'Flexora', 'na_medida', null, array[12, 12, 12]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (6, 4, 'Supino máquina', 'dificil', 'completou!', array[12, 12, 12]::int[], array[14, 14, 14]::numeric[], null, null, null),
    (6, 5, 'Puxada alta (pegada aberta)', 'dificil', 'não fechou 12 reps', array[8, 8, 8]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (6, 6, 'Remada baixa (triângulo)', 'na_medida', null, array[12, 12, 12]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (6, 7, 'Tríceps corda', 'dificil', null, array[12, 12, 12]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (6, 8, 'Elevação lateral (cabo)', 'na_medida', null, array[9, 9, 9]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (6, 9, 'Adução', 'dificil', 'não completou', array[9, 9, 9]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (6, 10, 'Abdução', 'facil', null, array[12, 12, 12]::int[], array[15, 15, 15]::numeric[], null, null, null),
    (6, 11, 'Corrida', null, 'sessão longa — ritmo reduzido', array[]::int[], null, 960, 1500, null),
    (7, 1, 'Agachamento livre', 'dificil', null, array[6, 6, 6]::int[], array[6, 6, 6]::numeric[], null, null, null),
    (7, 2, 'Crucifixo com halteres', 'dificil', 'no limite', array[10, 10, 10]::int[], array[8, 8, 8]::numeric[], null, null, null),
    (7, 3, 'Remada curvada', 'na_medida', null, array[12, 12, 12]::int[], array[8, 8, 8]::numeric[], null, null, null),
    (7, 4, 'Desenvolvimento sentado (halteres)', 'dificil', null, array[8, 8, 8]::int[], array[8, 8, 8]::numeric[], null, null, null),
    (7, 5, 'Tríceps francês (halter)', 'dificil', null, array[6, 6, 6]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (7, 6, 'Rosca martelo', 'dificil', 'no limite', array[10, 10, 10]::int[], array[8, 8, 8]::numeric[], null, null, null),
    (7, 7, 'Panturrilha na máquina', 'na_medida', null, array[12, 12, 12]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (8, 1, 'Leg press 45°', 'na_medida', null, array[12, 12, 12]::int[], array[45, 45, 45]::numeric[], null, null, null),
    (8, 2, 'Extensora', 'na_medida', null, array[12, 12, 12]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (8, 3, 'Flexora', 'na_medida', null, array[12, 12, 12]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (8, 4, 'Abdução', 'na_medida', null, array[12, 12, 12]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (8, 5, 'Adução', 'dificil', null, array[10, 10, 10]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (8, 6, 'Panturrilha unilateral no leg press', 'na_medida', null, array[6, 6, 6]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (9, 1, 'Saltos pausados unilaterais', 'na_medida', null, array[30]::int[], null, null, null, null),
    (9, 2, 'Climbmill', null, null, array[]::int[], null, 1200, null, 46),
    (10, 1, 'Puxada alta (corda)', 'na_medida', null, array[12, 12, 12]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (10, 2, 'Tríceps corda', 'na_medida', 'quase no limite', array[12, 12, 12]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (10, 3, 'Elevação lateral (cabo)', 'na_medida', null, array[8, 8, 8]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (10, 4, 'Desenvolvimento sentado (halteres)', 'dificil', null, array[8, 8, 8]::int[], array[8, 8, 8]::numeric[], null, null, null),
    (10, 5, 'Rosca martelo', 'dificil', null, array[8, 8, 8]::int[], array[8, 8, 8]::numeric[], null, null, null),
    (10, 6, 'Supino máquina', 'na_medida', null, array[12, 12, 12]::int[], array[15, 15, 15]::numeric[], null, null, null),
    (10, 7, 'Voador (peck deck)', 'na_medida', 'quase no limite', array[12, 12, 12]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (10, 8, 'Remada baixa (triângulo)', 'na_medida', null, array[12, 12, 12]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (10, 9, 'Corrida', null, null, array[]::int[], null, 1260, 2370, null),
    (11, 1, 'Leg press 45°', 'na_medida', null, array[12, 12, 12]::int[], array[45, 45, 45]::numeric[], null, null, null),
    (11, 2, 'Panturrilha no leg press', 'na_medida', null, array[12, 12, 12]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (11, 3, 'Extensora', 'na_medida', 'Correção: era 35 kg, o valor correto é 37 kg.', array[12, 12, 12]::int[], array[37, 37, 37]::numeric[], null, null, null),
    (11, 4, 'Flexora', null, 'Pirâmide', array[12, 12, 12]::int[], array[35, 35, 47]::numeric[], null, null, null),
    (11, 5, 'Abdução', 'dificil', null, array[10, 10, 10]::int[], array[47, 47, 47]::numeric[], null, null, null),
    (11, 6, 'Adução', 'dificil', null, array[12, 12, 12]::int[], array[22, 22, 22]::numeric[], null, null, null),
    (11, 7, 'Coice no cabo', 'na_medida', null, array[10, 10, 10]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (11, 8, 'Corrida', null, null, array[]::int[], null, 1440, 2700, null),
    (12, 1, 'Puxada alta (corda)', 'dificil', 'no final', array[12, 12, 12]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (12, 2, 'Tríceps corda', 'dificil', null, array[10, 10, 10]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (12, 3, 'Elevação lateral (cabo)', 'dificil', null, array[10, 10, 8]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (12, 4, 'Remada baixa (triângulo)', 'na_medida', 'consolidado', array[12, 12, 12]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (12, 5, 'Supino máquina', 'dificil', null, array[8, 8, 8]::int[], array[18, 18, 18]::numeric[], null, null, null),
    (12, 6, 'Voador (peck deck)', 'na_medida', null, array[12, 12, 12]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (12, 7, 'Rosca martelo', 'dificil', null, array[12, 10, 8]::int[], array[8, 8, 8]::numeric[], null, null, null),
    (12, 8, 'Corrida', null, null, array[]::int[], null, 1200, 2100, null),
    (13, 1, 'Tríceps corda', 'na_medida', null, array[12, 12, 12]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (13, 2, 'Rosca martelo', 'dificil', 'caiu na última série', array[12, 12, 5]::int[], array[8, 8, 8]::numeric[], null, null, null),
    (13, 3, 'Puxada triângulo (bíceps)', 'na_medida', 'Máquina não tinha 20 kg.', array[10, 10, 10]::int[], array[23, 23, 23]::numeric[], null, null, null),
    (13, 4, 'Rosca com barra (cabo baixo)', 'dificil', 'no limite', array[12, 12, 12]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (13, 5, 'Afundo búlgaro', 'dificil', null, array[6, 6, 6]::int[], array[6, 6, 6]::numeric[], null, null, null),
    (14, 1, 'Extensora unilateral', 'na_medida', null, array[10, 10, 10]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (14, 2, 'Puxada triângulo (bíceps)', 'facil', null, array[10, 10, 10]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (14, 3, 'Rosca com barra (cabo baixo)', 'na_medida', null, array[12, 12, 12]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (14, 4, 'Rosca martelo', null, 'Irregular', array[12, 6, 10]::int[], array[8, 8, 8]::numeric[], null, null, null),
    (14, 5, 'Tríceps corda', 'na_medida', null, array[12, 12, 12]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (14, 6, 'Tríceps francês (cabo)', 'na_medida', null, array[8, 8, 8]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (14, 7, 'Elevação lateral (cabo)', 'dificil', null, array[10, 10, 10]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (14, 8, 'Corrida', null, '🏆 Novo recorde!', array[]::int[], null, 2100, 3700, null),
    (15, 1, 'Leg press 45°', 'na_medida', null, array[12, 12, 12]::int[], array[40, 40, 40]::numeric[], null, null, null),
    (15, 2, 'Panturrilha no leg press', 'dificil', null, array[12, 12, 12]::int[], array[40, 40, 40]::numeric[], null, null, null),
    (15, 3, 'Adução', 'na_medida', null, array[12, 12, 12]::int[], array[22, 22, 22]::numeric[], null, null, null),
    (15, 4, 'Abdução', 'dificil', null, array[5, 5, 5, 5, 5, 5]::int[], array[37, 37, 37, 37, 37, 37]::numeric[], null, null, null),
    (15, 5, 'Puxada alta (pegada aberta)', 'dificil', 'no final', array[12, 10, 10]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (15, 6, 'Supino máquina', 'na_medida', null, array[12, 12, 12]::int[], array[15, 15, 15]::numeric[], null, null, null),
    (15, 7, 'Remada baixa (triângulo)', 'na_medida', null, array[12, 12, 12]::int[], array[25, 25, 30]::numeric[], null, null, null),
    (15, 8, 'Tríceps corda', 'dificil', null, array[8, 8, 8]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (16, 1, 'Remada baixa (triângulo)', 'na_medida', null, array[12, 12, 12]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (16, 2, 'Puxada triângulo (bíceps)', 'dificil', null, array[12, 12, 12]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (16, 3, 'Rosca com barra (cabo baixo)', 'dificil', 'decrescente', array[10, 9, 8]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (16, 4, 'Tríceps corda', 'dificil', 'decrescente', array[12, 10, 6]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (16, 5, 'Tríceps francês (cabo)', 'dificil', 'completou', array[10, 10, 10]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (16, 6, 'Elevação lateral (cabo)', 'dificil', 'irregular', array[10, 6, 6]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (16, 7, 'Rosca martelo', 'dificil', 'decrescente', array[10, 8, 6]::int[], array[8, 8, 8]::numeric[], null, null, null),
    (16, 8, 'Supino com halteres', 'facil', null, array[10, 10, 10]::int[], array[8, 8, 8]::numeric[], null, null, null),
    (17, 1, 'Leg press 45°', 'na_medida', null, array[12, 12, 12]::int[], array[47, 47, 47]::numeric[], null, null, null),
    (17, 2, 'Panturrilha no leg press', 'na_medida', null, array[12, 12, 12]::int[], array[45, 45, 45]::numeric[], null, null, null),
    (17, 3, 'Extensora', 'na_medida', null, array[12, 12, 12]::int[], array[37, 37, 37]::numeric[], null, null, null),
    (17, 4, 'Flexora', 'dificil', null, array[10, 10, 10]::int[], array[47, 47, 47]::numeric[], null, null, null),
    (17, 5, 'Adução', 'dificil', 'decrescente', array[12, 10, 5]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (17, 6, 'Abdução', 'na_medida', null, array[8, 8, 8]::int[], array[37, 37, 47]::numeric[], null, null, null),
    (17, 7, 'Agachamento sumô', 'na_medida', null, array[10, 10, 10]::int[], array[12, 12, 12]::numeric[], null, null, null),
    (17, 8, 'Crunch com anilha', 'na_medida', null, array[12, 12, 12]::int[], array[4, 4, 4]::numeric[], null, null, null),
    (17, 9, 'Rosca alternada (halteres)', 'dificil', null, array[12, 12, 12]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (17, 10, 'Corrida', null, 'manutenção', array[]::int[], null, 1800, 3540, null),
    (18, 1, 'Tríceps corda', 'dificil', 'ajuste de pegada', array[12, 10, 8]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (18, 2, 'Supino máquina', 'dificil', 'quase fechou', array[12, 12, 10]::int[], array[15, 15, 15]::numeric[], null, null, null),
    (18, 3, 'Remada baixa (triângulo)', 'dificil', null, array[12, 12, 9]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (18, 4, 'Puxada alta (pegada aberta)', 'dificil', null, array[12, 10, 10]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (18, 5, 'Voador (peck deck)', 'dificil', 'quase fechou', array[12, 12, 10]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (18, 6, 'Elevação lateral (cabo)', 'dificil', 'irregular', array[10, 8, 5]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (18, 7, 'Rosca por trás (cabo baixo)', 'dificil', null, array[8, 8, 8]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (18, 8, 'Crunch com anilha', 'na_medida', null, array[12, 12, 12]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (19, 1, 'Leg press 45°', 'na_medida', null, array[12, 12, 12]::int[], array[50, 50, 50]::numeric[], null, null, null),
    (19, 2, 'Panturrilha no leg press', 'na_medida', null, array[12, 12, 12]::int[], array[50, 50, 50]::numeric[], null, null, null),
    (19, 3, 'Extensora', 'falha', null, array[20, 14, 14]::int[], array[37, 37, 37]::numeric[], null, null, null),
    (19, 4, 'Flexora', 'na_medida', null, array[12, 12, 12]::int[], array[47, 47, 47]::numeric[], null, null, null),
    (19, 5, 'Agachamento sumô', null, 'Interrompido (desconforto na virilha)', array[12, 10, 0]::int[], array[14, 14, 14]::numeric[], null, null, null),
    (19, 6, 'Adução', 'na_medida', null, array[12, 12, 12]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (19, 7, 'Abdução', 'facil', null, array[12, 12, 12]::int[], array[47, 47, 47]::numeric[], null, null, null),
    (19, 8, 'Rosca alternada (halteres)', 'na_medida', null, array[12, 12, 12]::int[], array[8, 8, 8]::numeric[], null, null, null),
    (19, 9, 'Corrida', null, 'intervalo invertido — já aquecido · Protocolo: 5x corrida (4 min) + caminhada (2 min) + desaquecimento (2 min)', array[]::int[], null, 1860, 3600, null),
    (20, 1, 'Tríceps corda', 'dificil', 'decrescente', array[12, 10, 7]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (20, 2, 'Remada baixa (triângulo)', 'dificil', 'irregular', array[12, 10, 12]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (20, 3, 'Puxada alta (pegada aberta)', 'na_medida', null, array[12, 12, 12]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (20, 4, 'Elevação lateral (cabo)', 'dificil', null, array[10, 10, 7]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (20, 5, 'Rosca por trás (cabo baixo)', 'dificil', null, array[12, 12, 10]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (20, 6, 'Crucifixo no cabo', 'dificil', null, array[10, 8, 8]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (21, 1, 'Leg press 45°', 'na_medida', null, array[12, 12, 12]::int[], array[50, 50, 50]::numeric[], null, null, null),
    (21, 2, 'Panturrilha no leg press', 'na_medida', null, array[12, 12, 12]::int[], array[50, 50, 50]::numeric[], null, null, null),
    (21, 3, 'Extensora', 'na_medida', null, array[12, 12, 12]::int[], array[47, 47, 47]::numeric[], null, null, null),
    (21, 4, 'Flexora', 'dificil', 'completou', array[12, 12, 12]::int[], array[47, 47, 47]::numeric[], null, null, null),
    (21, 5, 'Adução', 'dificil', null, array[8, 8, 8]::int[], array[28, 28, 28]::numeric[], null, null, null),
    (21, 6, 'Abdução', 'dificil', 'no limite', array[15, 15, 15]::int[], array[47, 47, 47]::numeric[], null, null, null),
    (21, 7, 'Elevação pélvica (hip thrust)', 'na_medida', null, array[10, 10, 10]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (21, 8, 'Rosca martelo', 'dificil', null, array[10, 10, 8]::int[], array[9, 9, 9]::numeric[], null, null, null),
    (22, 1, 'Supino máquina', 'na_medida', null, array[12, 12, 12]::int[], array[15, 15, 15]::numeric[], null, null, null),
    (22, 2, 'Remada baixa (triângulo)', 'dificil', null, array[12, 12, 8]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (22, 3, 'Puxada alta (pegada aberta)', 'dificil', null, array[12, 10, 10]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (22, 4, 'Elevação lateral (cabo)', 'dificil', 'irregular', array[10, 8, 5]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (22, 5, 'Tríceps corda', 'dificil', 'no limite', array[12, 12, 12]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (22, 6, 'Rosca com barra (cabo baixo)', 'na_medida', null, array[12, 12, 12]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (22, 7, 'Abdominal na máquina', 'dificil', null, array[10, 8, 8]::int[], array[27, 27, 27]::numeric[], null, null, null),
    (23, 1, 'Leg press 45°', 'na_medida', null, array[15, 15, 15]::int[], array[50, 50, 50]::numeric[], null, null, null),
    (23, 2, 'Panturrilha no leg press', 'na_medida', null, array[15, 15, 15]::int[], array[50, 50, 50]::numeric[], null, null, null),
    (23, 3, 'Extensora', 'na_medida', null, array[12, 12, 12]::int[], array[47, 47, 47]::numeric[], null, null, null),
    (23, 4, 'Flexora', 'na_medida', null, array[12, 12, 12]::int[], array[47, 47, 47]::numeric[], null, null, null),
    (23, 5, 'Adução', 'dificil', 'decrescente', array[12, 7, 4]::int[], array[28, 28, 28]::numeric[], null, null, null),
    (23, 6, 'Abdução', 'na_medida', null, array[15, 15, 15]::int[], array[47, 47, 47]::numeric[], null, null, null),
    (24, 1, 'Tríceps corda', 'na_medida', null, array[12, 12, 12]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (24, 2, 'Rosca na corda (cabo baixo)', 'na_medida', null, array[12, 12, 12]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (24, 3, 'Elevação lateral (cabo)', 'dificil', 'irregular', array[10, 6, 6]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (24, 4, 'Voador no cabo (fly lateral)', 'dificil', null, array[8, 5, 5]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (24, 5, 'Rosca por trás (cabo baixo)', 'dificil', null, array[6, 6, 6]::int[], array[15, 15, 15]::numeric[], null, null, null),
    (24, 6, 'Tríceps pushdown com barra', 'na_medida', 'reps estendidas', array[20, 20, 10]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (24, 7, 'Crucifixo no cabo', 'na_medida', null, array[12, 12, 12]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (24, 8, 'Remada baixa (triângulo)', 'na_medida', null, array[12, 12, 12]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (24, 9, 'Puxada alta (pegada aberta)', 'na_medida', null, array[12, 12, 12]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (25, 1, 'Leg press 45°', 'na_medida', null, array[18, 18, 18]::int[], array[50, 50, 50]::numeric[], null, null, null),
    (25, 2, 'Panturrilha no leg press', 'na_medida', null, array[12, 12, 15]::int[], array[50, 50, 50]::numeric[], null, null, null),
    (25, 3, 'Extensora', 'na_medida', null, array[12, 12, 12]::int[], array[47, 47, 47]::numeric[], null, null, null),
    (25, 4, 'Flexora', 'na_medida', null, array[12, 12, 12]::int[], array[47, 47, 47]::numeric[], null, null, null),
    (25, 5, 'Adução', 'na_medida', null, array[12, 12, 12]::int[], array[28, 28, 28]::numeric[], null, null, null),
    (25, 6, 'Abdução', 'na_medida', null, array[15, 15, 15]::int[], array[47, 47, 47]::numeric[], null, null, null),
    (25, 7, 'Elevação pélvica (hip thrust)', 'dificil', 'completou', array[12, 12, 12]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (25, 8, 'Rosca martelo cruzada', 'dificil', 'até a falha', array[15, 14, 10]::int[], array[8, 8, 8]::numeric[], null, null, null),
    (25, 9, 'Abdominal na máquina', 'dificil', 'caiu na última', array[12, 12, 6]::int[], array[27, 27, 27]::numeric[], null, null, null),
    (26, 1, 'Tríceps corda', 'na_medida', null, array[14, 12, 12]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (26, 2, 'Rosca na corda (cabo baixo)', 'na_medida', null, array[12, 12, 12]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (26, 3, 'Elevação lateral (cabo)', 'dificil', null, array[10, 8, 8]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (26, 4, 'Voador no cabo (fly lateral)', 'dificil', null, array[10, 10, 10]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (26, 5, 'Rosca com barra (cabo baixo)', 'na_medida', null, array[12, 12, 12]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (26, 6, 'Remada baixa (triângulo)', 'dificil', null, array[12, 12, 10]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (26, 7, 'Supino máquina', 'falha', null, array[15, 15, 15]::int[], array[15, 15, 15]::numeric[], null, null, null),
    (26, 8, 'Rosca martelo cruzada', 'dificil', null, array[12, 10, 9]::int[], array[8, 8, 8]::numeric[], null, null, null),
    (26, 9, 'Puxada alta (pegada aberta)', 'na_medida', null, array[12, 12, 12]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (27, 1, 'Leg press 45°', 'na_medida', null, array[20, 20, 20]::int[], array[50, 50, 50]::numeric[], null, null, null),
    (27, 2, 'Panturrilha no leg press', 'na_medida', null, array[15, 15, 15]::int[], array[50, 50, 50]::numeric[], null, null, null),
    (27, 3, 'Adução', 'na_medida', null, array[12, 12, 12]::int[], array[28, 28, 28]::numeric[], null, null, null),
    (27, 4, 'Abdução', 'na_medida', null, array[15, 15, 15]::int[], array[47, 47, 47]::numeric[], null, null, null),
    (27, 5, 'Elevação pélvica (hip thrust)', 'na_medida', null, array[12, 12, 12]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (27, 6, 'Afundo búlgaro', 'dificil', null, array[10, 8, 6]::int[], array[7, 7, 7]::numeric[], null, null, null),
    (28, 1, 'Puxada alta (pegada aberta)', 'na_medida', null, array[12, 12, 12]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (28, 2, 'Remada baixa (triângulo)', 'na_medida', null, array[12, 12, 12]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (28, 3, 'Supino máquina', 'na_medida', null, array[15, 15, 15]::int[], array[16, 16, 16]::numeric[], null, null, null),
    (28, 4, 'Elevação frontal (cabo)', 'dificil', null, array[10, 10, 10]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (28, 5, 'Elevação lateral (cabo)', 'dificil', null, array[10, 10, 10]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (28, 6, 'Crucifixo inverso (cabo)', 'dificil', null, array[5, 4, 4]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (28, 7, 'Tríceps corda', 'na_medida', null, array[12, 12, 12]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (28, 8, 'Rosca martelo cruzada', 'na_medida', null, array[10, 10, 10]::int[], array[8, 8, 8]::numeric[], null, null, null),
    (28, 9, 'Rosca por trás (cabo baixo)', 'dificil', null, array[8, 8, 8]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (28, 10, 'Rosca com barra (livre)', 'dificil', null, array[8, 8, 8]::int[], array[15, 15, 15]::numeric[], null, null, null),
    (28, 11, 'Abdominal na máquina', 'dificil', 'completou!', array[12, 12, 12]::int[], array[27, 27, 27]::numeric[], null, null, null),
    (29, 1, 'Tríceps corda', 'dificil', null, array[15, 15, 10]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (29, 2, 'Elevação frontal (cabo)', 'dificil', null, array[10, 10, 10]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (29, 3, 'Elevação lateral (cabo)', 'dificil', null, array[10, 10, 8]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (29, 4, 'Crucifixo inverso (cabo)', 'dificil', null, array[4, 4, 4]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (29, 5, 'Voador no cabo (fly lateral)', 'dificil', 'no final', array[12, 12, 10]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (29, 6, 'Rosca na corda (cabo baixo)', 'falha', null, array[18, 18, 12]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (29, 7, 'Face pull (cabo)', 'facil', null, array[12, 12, 12]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (29, 8, 'Crucifixo no cabo', 'dificil', null, array[12, 7, 7]::int[], array[15, 15, 15]::numeric[], null, null, null),
    (29, 9, 'Remada baixa (triângulo)', 'dificil', 'reps crescendo', array[15, 13, 12]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (29, 10, 'Supino máquina', 'dificil', 'aumentando reps', array[15, 15, 10]::int[], array[16, 16, 16]::numeric[], null, null, null),
    (30, 1, 'Remada baixa (triângulo)', 'na_medida', null, array[15, 15, 12]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (30, 2, 'Puxada alta (pegada aberta)', 'na_medida', null, array[12, 12, 12]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (30, 3, 'Tríceps unilateral (cabo)', 'dificil', 'assimetria D/E', array[14, 10, 8]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (30, 4, 'Elevação lateral (cabo)', 'dificil', 'irregular', array[10, 8, 10]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (30, 5, 'Elevação frontal (cabo)', 'dificil', null, array[10, 10, 10]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (30, 6, 'Crucifixo inverso (cabo)', 'dificil', null, array[4, 4, 4]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (30, 7, 'Voador (peck deck)', 'dificil', null, array[10, 10, 10]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (30, 8, 'Rosca com barra (livre)', 'dificil', null, array[10, 10, 8]::int[], array[15, 15, 15]::numeric[], null, null, null),
    (30, 9, 'Supino inclinado com halteres', 'na_medida', null, array[12, 12, 12]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (30, 10, 'Rosca martelo cruzada', 'dificil', null, array[10, 8, 7]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (30, 11, 'Rosca inclinada (halteres)', 'dificil', null, array[8, 8, 8]::int[], array[8, 8, 8]::numeric[], null, null, null),
    (30, 12, 'Supino máquina', 'na_medida', null, array[15, 15, 15]::int[], array[16, 16, 16]::numeric[], null, null, null),
    (31, 1, 'Leg press 45°', 'na_medida', null, array[20, 20, 20]::int[], array[50, 50, 50]::numeric[], null, null, null),
    (31, 2, 'Panturrilha no leg press', 'na_medida', null, array[15, 15, 15]::int[], array[50, 50, 50]::numeric[], null, null, null),
    (31, 3, 'Extensora', 'na_medida', null, array[15, 15, 15]::int[], array[47, 47, 47]::numeric[], null, null, null),
    (31, 4, 'Flexora', 'na_medida', null, array[15, 15, 15]::int[], array[47, 47, 47]::numeric[], null, null, null),
    (31, 5, 'Adução', 'na_medida', null, array[12, 12, 15]::int[], array[28, 28, 28]::numeric[], null, null, null),
    (31, 6, 'Abdução', 'na_medida', null, array[15, 15, 15]::int[], array[47, 47, 47]::numeric[], null, null, null),
    (31, 7, 'Abdução no cabo', 'dificil', 'lado E limitante', array[10, 10, 10]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (32, 1, 'Elevação lateral (cabo)', 'dificil', null, array[8, 8, 8]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (32, 2, 'Elevação frontal (cabo)', 'na_medida', null, array[12, 12, 12]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (32, 3, 'Crucifixo inverso (cabo)', 'dificil', null, array[8, 8, 8]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (32, 4, 'Face pull (cabo)', 'na_medida', null, array[15, 15, 15]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (32, 5, 'Tríceps unilateral (cabo)', 'dificil', null, array[6, 6, 6]::int[], array[15, 15, 15]::numeric[], null, null, null),
    (32, 6, 'Tríceps francês (cabo)', 'dificil', 'irregular', array[12, 6, 8]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (32, 7, 'Rosca com barra (cabo baixo)', 'na_medida', null, array[15, 15, 15]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (32, 8, 'Desenvolvimento sentado (halteres)', 'na_medida', null, array[12, 12, 12]::int[], array[7, 7, 7]::numeric[], null, null, null),
    (32, 9, 'Rosca inclinada (halteres)', 'dificil', null, array[8, 6, 6]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (32, 10, 'Rosca martelo cruzada', 'dificil', null, array[6, 5, 5]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (32, 11, 'Rosca com barra (livre)', 'dificil', null, array[12, 7, 6]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (33, 1, 'Puxada alta (pegada aberta)', 'dificil', null, array[10, 10, 10]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (33, 2, 'Puxada alta (pegada supinada)', 'dificil', null, array[10, 10, 10]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (33, 3, 'Remada baixa (triângulo)', 'dificil', null, array[12, 12, 10]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (33, 4, 'Remada baixa (barra)', 'dificil', null, array[12, 12, 10]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (33, 5, 'Supino inclinado com halteres', 'dificil', null, array[6, 6, 4]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (33, 6, 'Supino máquina', 'dificil', null, array[12, 12, 10]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (33, 7, 'Rosca martelo cruzada', 'dificil', null, array[10, 10, 8]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (33, 8, 'Abdominal na máquina', 'dificil', 'completou!', array[12, 12, 12]::int[], array[27, 27, 27]::numeric[], null, null, null),
    (34, 1, 'Tríceps unilateral (cabo)', 'dificil', null, array[8, 8, 8]::int[], array[15, 15, 15]::numeric[], null, null, null),
    (34, 2, 'Elevação frontal (cabo)', 'dificil', null, array[10, 10, 10]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (34, 3, 'Voador no cabo bilateral', 'dificil', null, array[8, 8, 8]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (34, 4, 'Elevação lateral (cabo)', 'dificil', null, array[12, 8, 8]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (34, 5, 'Crucifixo inverso (cabo)', 'dificil', null, array[5, 5, 5]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (34, 6, 'Tríceps pushdown com barra', 'na_medida', null, array[12, 15, 15]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (34, 7, 'Tríceps francês (cabo)', 'dificil', 'completou', array[12, 12, 12]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (34, 8, 'Rosca inclinada (halteres)', 'dificil', null, array[6, 5, 4]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (34, 9, 'Rosca martelo cruzada', 'dificil', null, array[9, 8, 8]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (35, 1, 'Leg press 45°', 'dificil', null, array[12, 12, 12]::int[], array[60, 60, 60]::numeric[], null, null, null),
    (35, 2, 'Panturrilha no leg press', 'dificil', null, array[12, 12, 12]::int[], array[60, 60, 60]::numeric[], null, null, null),
    (35, 3, 'Extensora', 'dificil', null, array[10, 10, 10]::int[], array[57, 57, 57]::numeric[], null, null, null),
    (35, 4, 'Flexora', 'dificil', null, array[10, 10, 7]::int[], array[57, 57, 57]::numeric[], null, null, null),
    (35, 5, 'Adução', 'dificil', null, array[12, 10, 12]::int[], array[28, 28, 28]::numeric[], null, null, null),
    (35, 6, 'Abdução', 'dificil', null, array[10, 10, 10]::int[], array[57, 57, 57]::numeric[], null, null, null),
    (35, 7, 'Afundo búlgaro', 'dificil', null, array[8, 8, 8]::int[], array[7, 7, 7]::numeric[], null, null, null),
    (36, 1, 'Tríceps unilateral (cabo)', 'dificil', null, array[12, 10, 7]::int[], array[15, 15, 15]::numeric[], null, null, null),
    (36, 2, 'Tríceps pushdown com barra', 'na_medida', null, array[15, 12, 12]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (36, 3, 'Elevação frontal (cabo)', 'na_medida', null, array[12, 12, 12]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (36, 4, 'Voador no cabo bilateral', 'dificil', null, array[8, 10, 10]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (36, 5, 'Tríceps francês (cabo)', 'dificil', null, array[12, 10, 10]::int[], array[15, 15, 15]::numeric[], null, null, null),
    (36, 6, 'Elevação lateral (cabo)', 'dificil', null, array[10, 9, 9]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (36, 7, 'Crucifixo inverso (cabo)', null, '3x5~8 no log (entre 5 e 8 reps).', array[5, 5, 5]::int[], array[5, 5, 5]::numeric[], null, null, null),
    (36, 8, 'Desenvolvimento sentado (halteres)', 'dificil', null, array[10, 10, 10]::int[], array[8, 8, 8]::numeric[], null, null, null),
    (36, 9, 'Rosca martelo', 'dificil', null, array[12, 12, 10]::int[], array[12, 12, 12]::numeric[], null, null, null),
    (36, 10, 'Puxada alta (pegada aberta)', 'dificil', null, array[12, 12, 10]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (36, 11, 'Puxada alta (pegada supinada)', 'dificil', null, array[10, 10, 10]::int[], array[35, 35, 35]::numeric[], null, null, null),
    (36, 12, 'Remada baixa (triângulo)', 'dificil', null, array[6, 6, 6]::int[], array[40, 40, 40]::numeric[], null, null, null),
    (36, 13, 'Supino máquina', 'dificil', null, array[12, 10, 10]::int[], array[20, 20, 20]::numeric[], null, null, null),
    (36, 14, 'Supino inclinado com halteres', 'dificil', null, array[8, 8, 8]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (36, 15, 'Rosca inclinada (halteres)', 'dificil', null, array[10, 10, 8]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (36, 16, 'Crucifixo no cabo', 'dificil', null, array[6, 6, 6]::int[], array[15, 15, 15]::numeric[], null, null, null),
    (36, 17, 'Rosca com barra (cabo baixo)', 'dificil', null, array[10, 10, 10]::int[], array[25, 25, 25]::numeric[], null, null, null),
    (36, 18, 'Voador (peck deck)', 'dificil', null, array[12, 12, 10]::int[], array[30, 30, 30]::numeric[], null, null, null),
    (36, 19, 'Rosca martelo cruzada', 'dificil', null, array[12, 8, 7]::int[], array[10, 10, 10]::numeric[], null, null, null),
    (37, 1, 'Extensora', 'dificil', null, array[10, 10, 10]::int[], array[57, 57, 57]::numeric[], null, null, null),
    (37, 2, 'Flexora', 'dificil', null, array[10, 10, 10]::int[], array[57, 57, 57]::numeric[], null, null, null),
    (37, 3, 'Adução', 'na_medida', null, array[12, 12, 12]::int[], array[28, 28, 28]::numeric[], null, null, null),
    (37, 4, 'Abdução', 'dificil', null, array[12, 12, 12]::int[], array[57, 57, 57]::numeric[], null, null, null),
    (37, 5, 'Leg press 45°', 'dificil', null, array[10, 10, 10]::int[], array[60, 60, 60]::numeric[], null, null, null),
    (37, 6, 'Panturrilha no leg press', 'dificil', null, array[12, 12, 12]::int[], array[60, 60, 60]::numeric[], null, null, null),
    (37, 7, 'Rosca com barra (livre)', 'dificil', null, array[10, 10, 10]::int[], array[5, 5, 5]::numeric[], null, null, null);

  select string_agg(distinct e.exercicio, ', ') into v_faltando
  from imp_execucoes e
  where not exists (select 1 from public.exercicios x where x.user_id = v_user and x.nome = e.exercicio);
  if v_faltando is not null then
    raise exception 'Exercícios fora do catálogo: %', v_faltando;
  end if;

  insert into public.sessoes (id, user_id, iniciada_em, encerrada_em, titulo, objetivo, observacao)
  select id, v_user, iniciada_em, iniciada_em + make_interval(mins => coalesce(duracao_min, 0)),
         titulo, objetivo, observacao
  from imp_sessoes;

  insert into public.sessao_exercicios (id, user_id, sessao_id, exercicio_id, iniciado_em, dificuldade, observacao)
  select e.id, v_user, s.id, x.id, s.iniciada_em + make_interval(secs => e.ordem),
         e.dificuldade::public.dificuldade, e.observacao
  from imp_execucoes e
  join imp_sessoes s on s.n = e.n
  join public.exercicios x on x.user_id = v_user and x.nome = e.exercicio;

  -- Força: uma linha por série.
  insert into public.series (user_id, sessao_exercicio_id, numero, reps, carga_kg, registrada_em)
  select v_user, e.id, i, e.reps[i], e.cargas[i], se.iniciado_em
  from imp_execucoes e
  join public.sessao_exercicios se on se.id = e.id
  cross join lateral generate_subscripts(e.reps, 1) as i
  where cardinality(e.reps) > 0;

  -- Cardio: uma série com tempo, distância e andares.
  insert into public.series (user_id, sessao_exercicio_id, numero, duracao_s, distancia_m, andares, registrada_em)
  select v_user, e.id, 1, e.duracao_s, e.distancia_m, e.andares, se.iniciado_em
  from imp_execucoes e
  join public.sessao_exercicios se on se.id = e.id
  where cardinality(e.reps) = 0;
end;
$$;

-- Conferência: esperado 37 sessões, 307 exercícios.
select
  (select count(*) from public.sessoes)           as sessoes,
  (select count(*) from public.sessao_exercicios) as exercicios,
  (select count(*) from public.series)            as series;
