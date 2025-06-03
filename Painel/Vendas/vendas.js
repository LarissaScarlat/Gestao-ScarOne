const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Função para buscar pedidos de hoje
async function getTodayOrders(accessToken) {
    const today = new Date();
    const dateFrom = today.toISOString().split('T')[0] + 'T00:00:00.000-00:00';
    const dateTo = today.toISOString().split('T')[0] + 'T23:59:59.999-00:00';

    const url = `https://api.mercadolibre.com/orders/search?seller=ME&date_created.from=${dateFrom}&date_created.to=${dateTo}&order.status=paid`;

    const response = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    // Para cada pedido, extrair os dados que queremos
    const pedidos = response.data.results.map(order => ({
        numeroVenda: order.id,
        skuProduto: order.order_items.map(item => item.item.seller_sku).join(', '),
        precoVenda: order.total_amount,
        descontoEnvio: order.shipping ? order.shipping.cost : 0,
        tarifaVenda: order.fee_amount
    }));

    return pedidos;
}

// Endpoint REST para pedidos de hoje
app.get('/api/pedidos-hoje', async (req, res) => {
    const accessToken = 'uLFHBGcWuLh2hNU0Wmhjnb9XiJupBlAV'; // Substitua pelo seu token real

    try {
        const pedidos = await getTodayOrders(accessToken);
        res.json(pedidos);
    } catch (error) {
        console.error('Erro ao buscar pedidos de hoje:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Erro ao buscar pedidos de hoje' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});


