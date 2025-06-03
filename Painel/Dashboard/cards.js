async function fetchTodosGastos(filtros = {}) {
  const params = new URLSearchParams(filtros).toString();
  const url = `https://bling.scarone.com.br/bling/contas-a-pagar?${params}`;
  console.log('Buscando dados em:', url);
  const response = await fetch(url);
  console.log('Status da resposta:', response.status);
  if (!response.ok) throw new Error('Erro ao buscar dados da API');
  const data = await response.json();
  console.log('Dados recebidos:', data);
  return data;
}

// Atualiza os cards de valores
function atualizarCards(valores) {
  document.querySelector('.card-verde h2').textContent = `R$ ${valores.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  document.querySelector('.card-azul h2').textContent = `R$ ${valores.investimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  document.querySelector('.card-vermelho h2').textContent = `R$ ${valores.gastos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  document.querySelector('.card-roxo h2').textContent = `R$ ${valores.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

let chartInstance = null;

function renderGrafico(valoresGrafico) {
  const ctx = document.getElementById('graficoFaturamentoLucro')?.getContext('2d');
  if (!ctx) return console.error('Canvas do gráfico não encontrado');

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: valoresGrafico.meses,
      datasets: [
        {
          label: 'Faturamento',
          data: valoresGrafico.faturamento,
          backgroundColor: '#4CAF50'
        },
        {
          label: 'Investimento',
          data: valoresGrafico.investimento,
          backgroundColor: '#2196F3'
        },
        {
          label: 'Gastos',
          data: valoresGrafico.gastos,
          backgroundColor: '#F44336'
        },
        {
          label: 'Lucro',
          data: valoresGrafico.lucro,
          backgroundColor: '#9C27B0'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Análise Financeira',
          font: { size: 18, weight: 'bold' }
        },
        legend: { position: 'bottom' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

async function carregarDados() {
  console.log('carregarDados executado');
  try {
    const dataInicioInput = document.getElementById('dataInicio').value;
    const dataFimInput = document.getElementById('dataFim').value;
    const hoje = new Date().toISOString().split('T')[0];

    console.log('Datas:', dataInicioInput, dataFimInput);

    const filtros = {
      dataEmissaoInicial: dataInicioInput || hoje,
      dataEmissaoFinal: dataFimInput || hoje
    };

    const dados = await fetchTodosGastos(filtros);
    console.log('Dados recebidos da API:', dados);

    if (!Array.isArray(dados)) throw new Error('Resposta inesperada da API');

    const dataInicio = new Date(filtros.dataEmissaoInicial);
    const dataFim = new Date(filtros.dataEmissaoFinal);

    const dadosFiltrados = dados.filter(conta => {
      const valor = Number(conta.valor);
      const vencimentoDate = new Date(conta.vencimento);
      return (
        valor > 0 &&
        Number(conta.situacao) === 2 &&
        conta.vencimento &&
        vencimentoDate >= dataInicio &&
        vencimentoDate <= dataFim
      );
    });

    console.log('Dados filtrados:', dadosFiltrados);

    // 🟦 Filtra contas que parecem ser de compra de mercadorias/fornecedores
    const comprasDeMercadorias = dadosFiltrados.filter(conta => {
      const desc = (conta.descricao || '').toLowerCase();
      const categoria = (conta.categoria || '').toLowerCase();
      return (
        desc.includes('fornecedor') ||
        desc.includes('compra') ||
        categoria.includes('mercadoria') ||
        categoria.includes('compra')
      );
    });

    const totalInvestimento = comprasDeMercadorias.reduce((acc, conta) => acc + Number(conta.valor), 0);

    const gastosMensais = {};
    dadosFiltrados.forEach(conta => {
      const data = new Date(conta.vencimento);
      const mesAno = `${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
      gastosMensais[mesAno] = (gastosMensais[mesAno] || 0) + Number(conta.valor);
    });

    const meses = Object.keys(gastosMensais).sort((a, b) => {
      const [mA, yA] = a.split('/').map(Number);
      const [mB, yB] = b.split('/').map(Number);
      return new Date(yA, mA - 1) - new Date(yB, mB - 1);
    });

    const totalGastos = Object.values(gastosMensais).reduce((acc, val) => acc + val, 0);

    const valoresCards = {
      faturamento: totalGastos * 1.8, // Supondo 80% de lucro sobre gastos
      investimento: totalInvestimento,
      gastos: totalGastos,
      lucro: totalGastos * 1.8 - totalGastos - totalInvestimento
    };

    console.log('valoresCards:', valoresCards);

    const numMeses = meses.length || 1;
    const valoresGrafico = {
      meses,
      faturamento: Array(numMeses).fill(valoresCards.faturamento / numMeses),
      investimento: Array(numMeses).fill(valoresCards.investimento / numMeses),
      gastos: meses.map(m => gastosMensais[m]),
      lucro: Array(numMeses).fill(valoresCards.lucro / numMeses)
    };

    console.log('valoresGrafico:', valoresGrafico);

    atualizarCards(valoresCards);
    renderGrafico(valoresGrafico);

  } catch (error) {
    console.error('Erro ao carregar dados:', error.message);
    alert('Erro ao carregar dados. Veja o console.');
    atualizarCards({ faturamento: 0, investimento: 0, gastos: 0, lucro: 0 });
    renderGrafico({ meses: [], faturamento: [], investimento: [], gastos: [], lucro: [] });
  }
}

document.getElementById('btnBuscar')?.addEventListener('click', carregarDados);
window.addEventListener('load', carregarDados);

// Atualiza os dados a cada 60 segundos
setInterval(carregarDados, 60000);
