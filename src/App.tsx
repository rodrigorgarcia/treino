import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { Carregando } from './componentes/ui'
import { supabase } from './lib/supabase'
import Encerrar from './paginas/Encerrar'
import Inicio from './paginas/Inicio'
import Login from './paginas/Login'
import LogExercicio from './paginas/LogExercicio'
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
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/sessoes" element={<Sessoes />} />
      <Route path="/sessoes/:id" element={<SessaoDetalhe />} />
      <Route path="/sessao" element={<SessaoLayout />}>
        <Route index element={<Sessao />} />
        <Route path="exercicio/:exercicioId" element={<LogExercicio />} />
        <Route path="novo-exercicio" element={<NovoExercicio />} />
        <Route path="encerrar" element={<Encerrar />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
