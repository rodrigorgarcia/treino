#!/usr/bin/env python3
"""Converte o log de treinos em markdown num SQL de importação para o Supabase.

Uso:
    python3 scripts/importar_log.py [docs/referencia/treino_log.md] [supabase/importacao/historico.sql]

As regras de conversão estão em docs/PLANO.md, seção 7. Casos que não seguem
o padrão do log ficam nas tabelas ALIASES / SOBRESCRITAS / EXTRAS abaixo.
"""

import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ENTRADA = RAIZ / "docs/referencia/treino_log.md"
SAIDA = RAIZ / "supabase/importacao/historico.sql"
CATALOGO_SQL = sorted((RAIZ / "supabase/migrations").glob("*.sql"))

# Nome no log → nome no catálogo (só os que mudam).
ALIASES = {
    "Puxada alta": "Puxada alta (pegada aberta)",
    "Puxada aberta": "Puxada alta (pegada aberta)",
    "Puxada supinada": "Puxada alta (pegada supinada)",
    "Puxada alta (com corda)": "Puxada alta (corda)",
    "Remada baixa cabo": "Remada baixa (triângulo)",
    "Remada baixa cabo (triângulo)": "Remada baixa (triângulo)",
    "Remada triângulo": "Remada baixa (triângulo)",
    "Remada baixa cabo (barra)": "Remada baixa (barra)",
    "Panturrilha (leg press)": "Panturrilha no leg press",
    "Panturrilha (bilateral)": "Panturrilha no leg press",
    "Panturrilha (unilateral)": "Panturrilha unilateral no leg press",
    "Panturrilha (máquina)": "Panturrilha na máquina",
    "Extensora (unilateral alternada)": "Extensora unilateral",
    "Adução (fechar)": "Adução",
    "Abdução (abrir)": "Abdução",
    "Abdução no cabo (perna)": "Abdução no cabo",
    "Coice no cabo (glúteo)": "Coice no cabo",
    "Saltos pausados (unilateral)": "Saltos pausados unilaterais",
    "Crucifixo": "Crucifixo com halteres",
    "Crucifixo no cabo (cross)": "Crucifixo no cabo",
    "Crucifixo (cabo)": "Crucifixo no cabo",
    "Supino inclinado (halteres)": "Supino inclinado com halteres",
    "Elevação lateral": "Elevação lateral (cabo)",
    "Elevação frontal no cabo": "Elevação frontal (cabo)",
    "Crucifixo inverso/posterior no cabo": "Crucifixo inverso (cabo)",
    "Crucifixo inverso/posterior (cabo)": "Crucifixo inverso (cabo)",
    "Desenvolvimento": "Desenvolvimento sentado (halteres)",
    "Voador no cabo bilateral (fly lateral)": "Voador no cabo bilateral",
    "Rosca bíceps (cabo baixo)": "Rosca com barra (cabo baixo)",
    "Rosca bíceps com barra (cabo baixo)": "Rosca com barra (cabo baixo)",
    "Rosca com barra (cabo)": "Rosca com barra (cabo baixo)",
    "Rosca bíceps na corda (cabo baixo)": "Rosca na corda (cabo baixo)",
    "Rosca bíceps por trás (cabo baixo)": "Rosca por trás (cabo baixo)",
    "Rosca martelo alternado": "Rosca martelo",
    "Rosca martelo cruzada (halteres)": "Rosca martelo cruzada",
    "Rosca martelo cruzada alternada": "Rosca martelo cruzada",
    "Rosca bíceps cruzada (halteres)": "Rosca martelo cruzada",
    "Rosca bíceps inclinada (halteres)": "Rosca inclinada (halteres)",
    "Rosca bíceps inclinada": "Rosca inclinada (halteres)",
    "Rosca inclinada": "Rosca inclinada (halteres)",
    "Tríceps francês": "Tríceps francês (halter)",
    "Tríceps unilateral no cabo": "Tríceps unilateral (cabo)",
    "Tríceps pushdown com barra (cabo)": "Tríceps pushdown com barra",
    "Tríceps pushdown c/ barra": "Tríceps pushdown com barra",
    "Abdominal (máquina)": "Abdominal na máquina",
}

# Linhas fora do padrão: (sessão, exercício do catálogo) → campos que substituem os lidos.
SOBRESCRITAS = {
    (9, "Saltos pausados unilaterais"): {"reps": [30], "cargas": None},
    (13, "Puxada triângulo (bíceps)"): {"obs_extra": "Máquina não tinha 20 kg."},
    (11, "Extensora"): {"obs_extra": "Correção: era 35 kg, o valor correto é 37 kg."},
    (36, "Crucifixo inverso (cabo)"): {"reps": [5, 5, 5], "obs_extra": "3x5~8 no log (entre 5 e 8 reps)."},
}

# Exercícios feitos que só aparecem nas notas da sessão.
EXTRAS = {
    37: [{"exercicio": "Rosca com barra (livre)", "reps": [10, 10, 10], "cargas": [5, 5, 5],
          "dificuldade": "dificil", "obs": None}],
}

DIFICULDADES = [
    ("Muito difícil", "muito_dificil"),
    ("Até a falha", "falha"),
    ("Na medida", "na_medida"),
    ("Difícil", "dificil"),
    ("Fácil", "facil"),
]


def nomes_do_catalogo():
    nomes = set()
    for arquivo in CATALOGO_SQL:
        nomes |= set(re.findall(r"^\s+\('([^']+)',\s+'[^']+',\s+'[^']+',\s+'(?:carga|peso|cardio)",
                                arquivo.read_text(encoding="utf-8"), re.M))
    return nomes


CATALOGO = nomes_do_catalogo()


def canonico(nome, aparelho):
    if nome == "Rosca bíceps com barra":
        return "Rosca com barra (livre)" if "Barra" in aparelho else "Rosca com barra (cabo baixo)"
    nome = ALIASES.get(nome, nome)
    if nome not in CATALOGO:
        raise ValueError(f"exercício fora do catálogo: {nome!r}")
    return nome


def limpar(texto):
    return texto.replace("**", "").strip()


def ler_reps(series, reps):
    reps = re.sub(r"/(lado|perna)$", "", reps.strip())
    series = series.strip()
    if re.fullmatch(r"\d+(\+\d+)+", reps):
        return [int(r) for r in reps.split("+")]
    if m := re.fullmatch(r"(\d+)x(\d+)", reps):
        return [int(m[2])] * int(m[1])
    if re.fullmatch(r"\d+", reps) and re.fullmatch(r"\d+(\+\d+)?", series):
        return [int(reps)] * sum(int(s) for s in series.split("+"))
    if re.fullmatch(r"\d+x\d+(\+\d+x\d+)+", series):            # "2x10+1x8"
        return [int(r) for n, r in re.findall(r"(\d+)x(\d+)", series) for _ in range(int(n))]
    if reps == "decrescente" and re.fullmatch(r"\d+(\+\d+)+", series):
        return [int(r) for r in series.split("+")]
    raise ValueError(f"reps não reconhecidas: séries={series!r} reps={reps!r}")


def ler_cargas(carga, series, n):
    carga = carga.strip()
    valores = [float(v.replace(",", ".")) for v in re.findall(r"(\d+(?:,\d+)?)\s*kg", carga)]
    if not valores:
        raise ValueError(f"carga não reconhecida: {carga!r}")
    if " + " in carga:                                          # "25 kg + 30 kg (última série)"
        a, b = (int(s) for s in series.split("+"))
        cargas = [valores[0]] * a + [valores[1]] * b
    else:
        cargas = [valores[0]] * n                                # "14 kg/lado (28 kg total)" → 14
    if len(cargas) != n:
        raise ValueError(f"cargas ({carga!r}) não batem com {n} séries")
    return cargas


def ler_dificuldade(texto):
    texto = texto.strip()
    if texto in ("", "—"):
        return None, None
    for rotulo, valor in DIFICULDADES:
        if texto.startswith(rotulo):
            resto = texto[len(rotulo):].strip()
            return valor, (resto[1:-1] if resto.startswith("(") and resto.endswith(")") else resto) or None
    return None, texto                                           # Irregular, Pirâmide, Interrompido (…)


def ler_sessoes(texto):
    blocos = re.split(r"^## Sessão ", texto, flags=re.M)[1:]
    return [ler_sessao(b) for b in blocos]


def ler_sessao(bloco):
    linhas = bloco.splitlines()
    m = re.match(r"(\d+) — (\d{2})/(\d{2})/(\d{4})\s*\|\s*(.*)$", linhas[0])
    n, dia, mes, ano, resto = int(m[1]), m[2], m[3], m[4], m[5]
    partes = [p.strip() for p in resto.split("|")]
    sessao = {
        "n": n, "data": f"{ano}-{mes}-{dia}", "titulo": partes[0], "objetivo": None,
        "duracao_min": None, "obs": [], "execucoes": [], "nao_realizados": [],
    }
    for p in partes[1:]:
        if dm := re.fullmatch(r"~(\d+)\s*min", p):
            sessao["duracao_min"] = int(dm[1])

    cabecalho = None
    secao = None          # None | "cardio" | título de uma seção de bullets
    cardio = None
    for linha in linhas[1:]:
        linha = linha.rstrip()
        if not linha or linha == "---":
            continue
        if linha.startswith("|"):
            colunas = [c.strip() for c in linha.strip("|").split("|")]
            if colunas[0] == "#":
                cabecalho = colunas
            elif not set(colunas[0]) <= set("-"):
                ler_linha(sessao, dict(zip(cabecalho, colunas)))
            continue
        if linha.startswith("### "):
            titulo = linha[4:].strip()
            if titulo[0] in "🏃🧗":
                secao = "cardio"
                cardio = {"titulo": titulo[1:].strip(), "campos": {}}
                sessao["cardio"] = cardio
            else:
                secao = titulo
                sessao["obs"].append(f"{titulo}:")
            continue
        if secao == "cardio" and (cm := re.match(r"- \*\*(.+?):\*\*\s*(.*)$", linha)):
            cardio["campos"][cm[1]] = cm[2].strip()
            continue
        if secao and secao != "cardio" and linha.startswith("- "):
            sessao["obs"].append(limpar(linha))
            continue
        if om := re.match(r"\*\*(Objetivo|Ordem|Observação|Duração estimada):\*\*\s*(.*)$", linha):
            campo, valor = om[1], om[2].strip()
            if campo == "Objetivo":
                sessao["objetivo"] = valor
            elif campo == "Observação":
                sessao["obs"].append(valor)
            else:
                sessao["obs"].append(f"{campo}: {valor}")
                if hm := re.match(r"~(\d+)h", valor):
                    sessao["duracao_min"] = int(hm[1]) * 60
            continue
        if linha.startswith(">"):
            nota = limpar(linha.lstrip("> "))
            sessao["obs"].append(nota.removeprefix("📝").strip())
            continue
        if linha.startswith("**") and linha.endswith("**"):
            sessao["obs"].append(limpar(linha))
            continue
        raise ValueError(f"sessão {n}: linha não reconhecida: {linha!r}")

    if cardio:
        sessao["execucoes"].append(ler_cardio(cardio))
    for extra in EXTRAS.get(n, []):
        sessao["execucoes"].append(dict(extra))
    if sessao["nao_realizados"]:
        sessao["obs"].append("Não realizados: " + ", ".join(sessao["nao_realizados"]) + ".")

    vistos = [e["exercicio"] for e in sessao["execucoes"]]
    duplicados = {x for x in vistos if vistos.count(x) > 1}
    if duplicados:
        raise ValueError(f"sessão {n}: exercício repetido: {duplicados}")
    return sessao


def ler_linha(sessao, col):
    n = sessao["n"]
    exercicio = canonico(col["Exercício"], col["Aparelho"])
    if any("Não realizado" in v for v in col.values()):
        sessao["nao_realizados"].append(exercicio)
        return
    s = SOBRESCRITAS.get((n, exercicio), {})
    dificuldade, obs = ler_dificuldade(col.get("Dificuldade", ""))
    if "reps" in s:
        reps = s["reps"]
    else:
        reps = ler_reps(col.get("Séries", ""), col["Reps"])     # a sessão 36 não tem coluna Séries
    if "cargas" in s:
        cargas = s["cargas"]
    else:
        cargas = ler_cargas(col["Carga"], col.get("Séries", ""), len(reps))
        if exercicio == "Supino máquina" and "/lado" not in col["Carga"]:
            cargas = [c / 2 for c in cargas]                     # S1–S4: "20 kg" era o total
    if "obs_extra" in s:
        obs = f"{obs} · {s['obs_extra']}" if obs else s["obs_extra"]
    sessao["execucoes"].append({
        "exercicio": exercicio, "reps": reps, "cargas": cargas,
        "dificuldade": dificuldade, "obs": obs,
    })


def ler_cardio(cardio):
    campos = cardio["campos"]
    obs = []
    if pm := re.search(r"\((.+)\)", cardio["titulo"]):
        obs.append(pm[1])
    exercicio = "Climbmill" if "Climbmill" in campos.get("Aparelho", "") else "Corrida"
    duracao = int(re.match(r"(\d+)\s*min", campos["Duração"])[1]) * 60
    distancia = None
    if "Distância" in campos:
        dm = re.match(r"(\d+(?:,\d+)?)\s*km\s*(.*)$", campos["Distância"])
        distancia = round(float(dm[1].replace(",", ".")) * 1000)
        if dm[2]:
            obs.append(dm[2].strip("()").strip())
    andares = int(campos["Andares"]) if "Andares" in campos else None
    if "Meta era" in campos:
        obs.append(f"Meta era: {campos['Meta era']}")
    if "Protocolo" in campos:
        obs.append(f"Protocolo: {campos['Protocolo']}")
    return {
        "exercicio": exercicio, "reps": [], "cargas": None, "dificuldade": None,
        "obs": " · ".join(obs) or None, "duracao_s": duracao, "distancia_m": distancia, "andares": andares,
    }


# ─────────────────────────────────────────────────────────────
# SQL
# ─────────────────────────────────────────────────────────────

def lit(v):
    if v is None:
        return "null"
    if isinstance(v, (int, float)):
        return f"{v:g}"
    return "'" + str(v).replace("'", "''") + "'"


def arr(vs, tipo):
    if vs is None:
        return "null"
    return f"array[{', '.join(lit(v) for v in vs)}]::{tipo}[]"


def gerar_sql(sessoes):
    horas_no_dia = {}
    linhas_s, linhas_e = [], []
    for s in sessoes:
        hora = 12 + horas_no_dia.get(s["data"], 0)              # duas sessões no mesmo dia: 12h, 13h
        horas_no_dia[s["data"]] = horas_no_dia.get(s["data"], 0) + 1
        obs = "\n".join(s["obs"]) or None
        linhas_s.append(
            f"    ({s['n']}, '{s['data']} {hora}:00-03', {lit(s['duracao_min'])}, "
            f"{lit(s['titulo'])}, {lit(s['objetivo'])}, {lit(obs)})")
        for ordem, e in enumerate(s["execucoes"], 1):
            linhas_e.append(
                f"    ({s['n']}, {ordem}, {lit(e['exercicio'])}, {lit(e['dificuldade'])}, {lit(e['obs'])}, "
                f"{arr(e['reps'], 'int')}, {arr(e['cargas'], 'numeric')}, "
                f"{lit(e.get('duracao_s'))}, {lit(e.get('distancia_m'))}, {lit(e.get('andares'))})")

    n_exec = len(linhas_e)
    return f"""-- Importação do histórico: {len(sessoes)} sessões, {n_exec} exercícios.
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
{",\n".join(linhas_s)};

  create temp table imp_execucoes (
    id uuid not null default gen_random_uuid(), n int not null, ordem int not null,
    exercicio text not null, dificuldade text, observacao text,
    reps int[], cargas numeric[], duracao_s int, distancia_m int, andares int
  ) on commit drop;

  insert into imp_execucoes (n, ordem, exercicio, dificuldade, observacao, reps, cargas, duracao_s, distancia_m, andares) values
{",\n".join(linhas_e)};

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

-- Conferência: esperado {len(sessoes)} sessões, {n_exec} exercícios.
select
  (select count(*) from public.sessoes)           as sessoes,
  (select count(*) from public.sessao_exercicios) as exercicios,
  (select count(*) from public.series)            as series;
"""


def main():
    entrada = Path(sys.argv[1]) if len(sys.argv) > 1 else ENTRADA
    saida = Path(sys.argv[2]) if len(sys.argv) > 2 else SAIDA
    sessoes = ler_sessoes(entrada.read_text(encoding="utf-8"))
    saida.write_text(gerar_sql(sessoes), encoding="utf-8")
    n_exec = sum(len(s["execucoes"]) for s in sessoes)
    n_series = sum(max(len(e["reps"]), 1) for s in sessoes for e in s["execucoes"])
    print(f"{len(sessoes)} sessões, {n_exec} exercícios, {n_series} séries → {saida}")


if __name__ == "__main__":
    main()
