import dotenv from 'dotenv';
dotenv.config(); 

import express from 'express';
import cors from 'cors'; // ✅ use apenas isso
import supabase from './db.js';

const app = express();
const PORT = process.env.PORT || 3000

const allowedOrigins = [
  'https://scarone.com.br',
  'https://www.scarone.com.br',
  'https://api.scarone.com.br',  // importante para chamadas frontend → backend
];


app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origem ${origin} não permitida`));
    }
  },
  credentials: true
}));


app.use(express.json());

app.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('senha', senha)
      .maybeSingle();

    if (error) {
      console.error('Erro Supabase:', error);
      return res.status(500).json({ mensagem: 'Erro interno ao consultar usuário.' });
    }

    if (!data) {
      return res.status(401).json({ mensagem: 'Usuário ou senha inválidos.' });
    }

    return res.status(200).json({ mensagem: 'Login realizado com sucesso!' });
  } catch (err) {
    console.error('Erro no /auth:', err);
    res.status(500).json({ mensagem: 'Erro interno no servidor.' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
