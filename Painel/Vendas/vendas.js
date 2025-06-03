const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Função para buscar dados do Mercado Livre
async function getOrderDetails(orderId, accessToken) {
    const url = `https://api.mercadolibre.com/orders/${orderId}`;

    const response = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    const order = response.data;

    return {
        numeroVenda: order.id,
        skuProduto: order.order_items.map(item => item.item.seller_sku).join(', '),
        precoVenda: order.total_amount,
        descontoEnvio: order.shipping ? order.shipping.cost : 0,
        tarifaVenda: order.fee_amount
    };
}

// Endpoint REST
app.get('/api/pedido/:orderId', async (req, res) => {
    const orderId = req.params.orderId;
    const accessToken = 'uLFHBGcWuLh2hNU0Wmhjnb9XiJupBlAV';  // Substitua pelo real

    try {
        const dadosPedido = await getOrderDetails(orderId, accessToken);
        res.json(dadosPedido);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar pedido', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

