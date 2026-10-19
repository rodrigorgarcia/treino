import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { Carregando } from './componentes/ui'
import { useSessaoAberta } from './lib/api'
import { SessaoAbertaContext } from './lib/sessaoAberta'
import { supabase } from './lib/supabase'
import Aparelhos from './paginas/Aparelhos'
import EditarAparelho from './paginas/EditarAparelho'
import EditarExercicio from './paginas/EditarExercicio'
import EditarSessao, { AdicionarNaSessao } from './paginas/EditarSessao'
import Encerrar from './paginas/Encerrar'
import ExercicioHistorico from './paginas/ExercicioHistorico'
import Exercicios from './paginas/Exercicios'
import Inicio from './paginas/Inicio'
import Login from './paginas/Login'
import LogExercicio, { LogExercicioPassado } from './paginas/LogExercicio'
import NovoExercicio from './paginas/NovoExercicio'
import Sessao from './paginas/Sessao'
import SessaoDetalhe from './paginas/SessaoDetalhe'
import SessaoLayout from './paginas/SessaoLayout'
import Sessoes from './paginas/Sessoes'

export default function App() {
  const qc = useQueryClient()
  const [sessaoAuth, setSessaoAuth] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessaoAuth(data.session))
    const { data } = supabase.auth.onAuthStateChange((evento, sessao) => {
      setSessaoAuth(sessao)
      if (evento === 'SIGNED_OUT') qc.clear()
    })
    return () => data.subscription.unsubscribe()
  }, [qc])

  if (sessaoAuth === undefined) return <Carregando />
  if (sessaoAuth === null) return <Login />

  return (
    <ComSessaoAberta>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/sessoes" element={<Sessoes />} />
        <Route path="/sessoes/:id" element={<SessaoDetalhe />} />
        <Route path="/sessoes/:id/editar" element={<EditarSessao />} />
        <Route path="/sessoes/:id/adicionar" element={<AdicionarNaSessao />} />
        <Route path="/sessoes/:id/exercicio/:exercicioId" element={<LogExercicioPassado />} />
        <Route path="/exercicios" element={<Exercicios />} />
        <Route path="/exercicios/novo" element={<EditarExercicio />} />
        <Route path="/exercicios/:id" element={<ExercicioHistorico />} />
        <Route path="/exercicios/:id/editar" element={<EditarExercicio />} />
        <Route path="/aparelhos" element={<Aparelhos />} />
        <Route path="/aparelhos/novo" element={<EditarAparelho />} />
        <Route path="/aparelhos/:id" element={<EditarAparelho />} />
        <Route path="/sessao" element={<SessaoLayout />}>
          <Route index element={<Sessao />} />
          <Route path="exercicio/:exercicioId" element={<LogExercicio />} />
          <Route path="novo-exercicio" element={<NovoExercicio />} />
          <Route path="encerrar" element={<Encerrar />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ComSessaoAberta>
  )
}

// Deixa o início da sessão em andamento disponível para o cronômetro no topo das telas.
function ComSessaoAberta({ children }: { children: ReactNode }) {
  const aberta = useSessaoAberta()
  return <SessaoAbertaContext.Provider value={aberta.data?.iniciada_em ?? null}>{children}</SessaoAbertaContext.Provider>
}
