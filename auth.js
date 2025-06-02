document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.btn-primary');
  if (!btn) {
    console.error('Botão ".btn-primary" não encontrado no DOM');
    return;
  }

  btn.addEventListener('click', async (e) => {
    e.preventDefault(); // evita o submit “nativo” do formulário

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('password').value.trim();

    if (!email || !senha) {
      alert('Preencha todos os campos.');
      return;
    }

    try {
      const response = await fetch('https://api.scarone.com.br/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Resposta não é JSON:', text);
        alert('Erro inesperado no servidor.');
        return;
      }

      if (!response.ok) {
        alert(data.mensagem || 'Email ou senha inválidos.');
      } else {
        window.location.href = '/Painel/painel.html';
      }
    } catch (err) {
      alert('Erro ao conectar com o servidor.');
      console.error(err);
    }
  });
});

