import { createClient } from '@supabase/supabase-js'

// Aceita também a "API URL" da tela Data API do Supabase, que vem com /rest/v1/ no final.
const url = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
const chave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

if (!url || !chave) {
  throw new Error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY (veja .env.example).')
}

export const supabase = createClient(url, chave)
