import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import qs from 'qs';
import fs from 'fs';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;


app.use(cors());

let accessToken = null;
let refreshToken = null;

// ========== Função para salvar tokens no arquivo ==========
function saveTokens(data) {
  if (!data || !data.access_token || !data.refresh_token) {
    console.error('❌ Dados de token inválidos. Tokens não serão salvos:', data);
    return;
  }

  try {
    fs.writeFileSync('tokens.json', JSON.stringify({
      access_token: data.access_token,
      refresh_token: data.refresh_token
    }, null, 2));
    console.log('💾 Tokens salvos no arquivo com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao salvar tokens:', error.message);
  }
}

// ========== Função para carregar tokens ==========
function loadTokens() {
  const path = 'tokens.json';
  if (!fs.existsSync(path)) {
    console.log('ℹ️ Arquivo tokens.json não encontrado.');
    return;
  }

  const content = fs.readFileSync(path, 'utf8').trim();
  if (!content) {
    console.warn('⚠️ Arquivo tokens.json está vazio.');
    return;
  }

  try {
    const data = JSON.parse(content);
    if (data.access_token && data.refresh_token) {
      accessToken = data.access_token;
      refreshToken = data.refresh_token;
      console.log('✅ Tokens carregados do arquivo.');
    } else {
      console.warn('⚠️ Tokens incompletos no arquivo.');
    }
  } catch (error) {
    console.error('❌ Erro ao interpretar tokens.json:', error.message);
  }
}

// ========== Função para renovar o token ==========
async function refreshAccessToken() {
  if (!refreshToken) {
    console.warn('⚠️ Sem refresh token. Acesse /bling/login novamente.');
    return;
  }

  try {
    const response = await axios.post(
      'https://www.bling.com.br/Api/v3/oauth/token',
      qs.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64')
        }
      }
    );

    console.log('🔁 Novo token recebido:', response.data);

    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;
    saveTokens(response.data);
    console.log('🔁 Access token renovado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao renovar token:', error.response?.data || error.message);
  }
}

// ========== Função delay para respeitar limite de requisições ==========
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========== Prefixo para rotas Bling ==========
const blingRouter = express.Router();

// Rota para login Bling (OAuth)
blingRouter.get('/login', (req, res) => {
  const state = 'static-state-or-generate-dynamic';
  const redirectUrl = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${process.env.CLIENT_ID}&state=${state}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}`;
  res.redirect(redirectUrl);
});

// Rota de callback Bling
blingRouter.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Código de autorização não recebido.');
  }

  try {
    const response = await axios.post(
      'https://www.bling.com.br/Api/v3/oauth/token',
      qs.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.REDIRECT_URI
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64')
        }
      }
    );

    console.log('🔓 Tokens recebidos da Bling:', response.data);

    accessToken = response.data.access_token;
    refreshToken = response.data.refresh_token;
    saveTokens(response.data);

    res.send('✅ Autorização concluída com sucesso! Agora você pode acessar /bling/contas-a-pagar');
  } catch (error) {
    console.error('❌ Erro ao obter token:', error.response?.data || error.message);
    res.status(500).send('Erro ao obter token.');
  }
});

// Endpoint protegido para contas a pagar (paginação com delay)
blingRouter.get('/contas-a-pagar', async (req, res) => {
  if (!accessToken) {
    return res.status(401).send('Token de acesso não encontrado. Acesse /bling/login primeiro.');
  }

  const limite = 1000;
  let pagina = 1;
  let todasContas = [];
  let continuar = true;

  try {
    while (continuar) {
      const response = await axios.get('https://api.bling.com.br/Api/v3/contas/pagar', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json'
        },
        params: {
          pagina,
          limite,
          ...req.query  // mantém outros parâmetros da query string, se existirem
        }
      });

      const contas = response.data.data || [];

      if (contas.length === 0) {
        continuar = false;
      } else {
        todasContas = todasContas.concat(contas);
        pagina++;
        await delay(400); // Espera 400ms para respeitar limite de 3 requisições por segundo
      }
    }

    res.json(todasContas);
  } catch (error) {
    console.error('❌ Erro ao buscar contas:', error.response?.data || error.message);
    res.status(500).send('Erro ao buscar contas a pagar.');
  }
});

// Endpoint protegido para produtos (com paginação e delay)
blingRouter.get('/produtos', async (req, res) => {
  if (!accessToken) {
    return res.status(401).send('Token de acesso não encontrado. Acesse /bling/login primeiro.');
  }

  const limite = 1000;
  let pagina = 1;
  let todosProdutos = [];
  let continuar = true;

  try {
    while (continuar) {
      const response = await axios.get('https://api.bling.com.br/Api/v3/produtos', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json'
        },
        params: {
          pagina,
          limite,
          ...req.query  // permite filtros como nome, código, etc.
        }
      });

      const produtos = response.data.data || [];

      if (produtos.length === 0) {
        continuar = false;
      } else {
        todosProdutos = todosProdutos.concat(produtos);
        pagina++;
        await delay(400); // Bling limita a 3 requisições por segundo
      }
    }

    res.json(todosProdutos);
  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error.response?.data || error.message);
    res.status(500).send('Erro ao buscar produtos.');
  }
});
// Conectar o router do Bling à rota /bling
app.use('/bling', blingRouter);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

// Carrega os tokens na inicialização
loadTokens();
