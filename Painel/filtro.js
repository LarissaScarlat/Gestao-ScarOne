const btnFiltro = document.getElementById('btn-filtro');
const painelFiltro = document.getElementById('painel-filtro');
const setaFiltro = document.getElementById('seta-filtro');
const abas = document.querySelectorAll('.aba');
const calendarioContainer = document.getElementById('calendario-container');
const input = document.getElementById('datepicker');

let calendario = null;

// Função para obter a semana ISO
function getISOWeek(date) {
  const temp = new Date(date);
  temp.setHours(0, 0, 0, 0);
  temp.setDate(temp.getDate() + 3 - (temp.getDay() + 6) % 7);
  const week1 = new Date(temp.getFullYear(), 0, 4);
  return 1 + Math.round(((temp - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

// Função para iniciar o calendário de acordo com a aba
function iniciarCalendario(tipo) {
  if (calendario) calendario.destroy();

  if (tipo === 'dia') {
    calendario = flatpickr("#datepicker", {
      dateFormat: "d/m/Y",
      locale: "pt"
    });

  } else if (tipo === 'semana') {
    calendario = flatpickr("#datepicker", {
      dateFormat: "W",
      locale: "pt",
      onChange: function (selectedDates, dateStr, instance) {
        const week = getISOWeek(selectedDates[0]);
        const year = selectedDates[0].getFullYear();
        instance.input.value = `Semana ${week}, ${year}`;
      }
    });

  } else if (tipo === 'mes') {
    calendario = flatpickr("#datepicker", {
      locale: "pt",
      plugins: [
        new monthSelectPlugin({
          shorthand: false,
          dateFormat: "F Y",
          theme: "light"
        })
      ]
    });
  }

  calendarioContainer.style.display = 'block';
}

// Mostrar ou ocultar o painel ao clicar no botão de filtro
btnFiltro.addEventListener('click', () => {
  const isHidden = painelFiltro.style.display === 'none' || painelFiltro.style.display === '';
  painelFiltro.style.display = isHidden ? 'block' : 'none';
  setaFiltro.classList.toggle('seta-ativa');

  if (isHidden) {
    iniciarCalendario('dia'); // padrão ao abrir
    abas.forEach(a => a.classList.remove('active'));
    document.querySelector('.aba[data-tipo="dia"]').classList.add('active');
  } else {
    calendarioContainer.style.display = 'none';
  }
});

// Clique nas abas para alterar tipo de calendário
abas.forEach(aba => {
  aba.addEventListener('click', () => {
    abas.forEach(a => a.classList.remove('active'));
    aba.classList.add('active');
    const tipo = aba.dataset.tipo;
    iniciarCalendario(tipo);
    console.log('Período selecionado:', tipo);
  });
});
