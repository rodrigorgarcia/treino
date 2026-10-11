# Treino

App (PWA) para registrar treinos de academia: iniciar sessão, registrar cada exercício série a série com botões + / −, ver a última execução e consultar o histórico. Banco em Postgres no Supabase.

- **Plano completo:** [docs/PLANO.md](docs/PLANO.md)
- **Banco:** [supabase/migrations/](supabase/migrations/), com schema, RLS, views e catálogo inicial de 55 exercícios
- **Histórico:** [supabase/importacao/historico.sql](supabase/importacao/historico.sql), gerado de [docs/referencia/treino_log.md](docs/referencia/treino_log.md) por [scripts/importar_log.py](scripts/importar_log.py)

Status: banco aplicado no Supabase. Falta rodar a migração da remada supinada e importar o histórico (ver [docs/PLANO.md](docs/PLANO.md), seção 12).
