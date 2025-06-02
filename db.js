import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltam as variáveis de ambiente SUPABASE_URL ou SUPABASE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
