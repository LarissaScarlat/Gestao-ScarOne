import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = "https://bbxzznnrzclvozkxdoxx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJieHp6bm5yemNsdm96a3hkb3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NDgwNjEsImV4cCI6MjA2MzQyNDA2MX0.qgDPlTcgHPS8pufUoh0u015vj-tPuAKUdUwHuVrpreY";
const supabase = createClient(supabaseUrl, supabaseKey);

// Seu código de adicionar e consultar aqui...


document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("addBtn");
  const skuInput = document.getElementById("skuInput");
  const qtyInput = document.getElementById("qtyInput");
  const tbody = document.querySelector("#produtosTable tbody");

  addBtn.addEventListener("click", async () => {
    const sku = skuInput.value.trim();
    const quantidade = parseInt(qtyInput.value);

    if (!sku || quantidade <= 0) {
      alert("Preencha um SKU válido e uma quantidade maior que zero.");
      return;
    }

    // Buscar no Supabase
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .eq("sku", sku)
      .single();

    if (error || !data) {
      alert("Produto não encontrado no banco de dados.");
      return;
    }

    // Criar nova linha na tabela
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${data.sku}</td>
      <td>${data.marca}</td>
      <td>—</td>
      <td class="quantidade-cell">${quantidade}</td>
      <td><img src="${data.foto}" alt="Foto do produto ${data.sku}" width="50" /></td>
      <td>
        <button class="edit-btn" title="Editar" style="background:none; border:none; cursor:pointer; color:#007bff; font-size:16px;">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="delete-btn" title="Excluir" style="background:none; border:none; cursor:pointer; color:#dc3545; font-size:16px; margin-left:10px;">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);

    // Botões de ação
    const editBtn = tr.querySelector(".edit-btn");
    const deleteBtn = tr.querySelector(".delete-btn");
    const quantidadeCell = tr.querySelector(".quantidade-cell");

    editBtn.addEventListener("click", () => {
      if (editBtn.dataset.editing === "true") {
        const input = quantidadeCell.querySelector("input");
        const novaQtd = parseInt(input.value);
        if (!novaQtd || novaQtd <= 0) {
          alert("Quantidade inválida");
          return;
        }
        quantidadeCell.textContent = novaQtd;
        editBtn.dataset.editing = "false";
        editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
      } else {
        const atualQtd = quantidadeCell.textContent;
        quantidadeCell.innerHTML = `<input type="number" min="1" value="${atualQtd}" style="width: 60px;" />`;
        editBtn.dataset.editing = "true";
        editBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
      }
    });

    deleteBtn.addEventListener("click", () => {
      if (confirm("Deseja realmente excluir este produto?")) {
        tr.remove();
      }
    });

    // Limpar campos
    skuInput.value = "";
    qtyInput.value = 1;
  });
});
