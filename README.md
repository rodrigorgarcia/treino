# Treino

App (PWA) para registrar treinos de academia: iniciar sessão, registrar cada exercício série a série com botões + / −, ver a última execução e consultar o histórico. Banco em Postgres no Supabase.

- **Plano completo:** [docs/PLANO.md](docs/PLANO.md)
- **Banco:** [supabase/migrations/](supabase/migrations/), com schema, RLS, views e catálogo inicial de 55 exercícios
- **Histórico:** [supabase/importacao/historico.sql](supabase/importacao/historico.sql), gerado de [docs/referencia/treino_log.md](docs/referencia/treino_log.md) por [scripts/importar_log.py](scripts/importar_log.py)

## Rodar

```sh
cp .env.example .env.local   # preencha URL e chave publishable do Supabase
npm install
npm run dev
```

`npm run build` gera o PWA em `dist/`. Para publicar no Netlify, veja [docs/PLANO.md](docs/PLANO.md), seção 13.

## Status

- Fase 0 (banco) e fase 1 (Supabase + histórico importado) prontas.
- Fase 2 (registro) pronta e em produção em https://treinorrg.netlify.app.
- Fase 3 (consulta e edição) pronta: histórico com busca, detalhe e correção de sessões passadas, histórico por exercício com gráfico de evolução e edição do catálogo (exercícios e aparelhos).
