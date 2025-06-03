// produtos.js

document.addEventListener('DOMContentLoaded', async () => {
  const tabela = document.getElementById('corpoTabelaProdutos');

  try {
const resposta = await fetch('https://api.scarone.com.br/bling/produtos');



    const produtos = await resposta.json();

    produtos.forEach(produto => {
      const linha = document.createElement('tr');

      linha.innerHTML = `
        <td>${produto.nome || '-'}</td>
        <td>${produto.variacoes?.map(v => v.nome)?.join(', ') || '-'}</td>
        <td>${produto.codigo || '-'}</td>
        <td>R$ ${produto.precoCusto?.toFixed(2) || '0,00'}</td>
        <td>R$ ${produto.preco || '0,00'}</td>
        <td>${produto.estoqueAtual || 0}</td>
        <td>${produto.integracoes?.map(i => i.nome)?.join(', ') || '-'}</td>
        <td>${produto.situacao || '-'}</td>
      `;

      tabela.appendChild(linha);
    });
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    const erroLinha = document.createElement('tr');
    erroLinha.innerHTML = `<td colspan="8">Erro ao carregar os produtos.</td>`;
    tabela.appendChild(erroLinha);
  }
});
