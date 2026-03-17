async function buscarUsuarios ()  {
    try {
        const resposta = await fetch('http://localhost:3000/usuario/')
        const json = await resposta.json()

    } catch (error) {   
        console.log(error)
    }
}
async function cadastrarUsuario(formData) {
  try {
    const payload = {
      nome: formData.get('nome'),
      email: formData.get('email'),
      senha: formData.get('senha'),
      tipo: formData.get('tipo_usuario') || 'aluno',
      // Campos adicionais opcionais (ajuste conforme sua UI)
      foto_perfil: null,
      bio: null,
      genero_favorito: null,
      apelido: null
    };

    const resposta = await fetch('http://localhost:3000/usuario/cadastrar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!resposta.ok) {
      const erroBody = await resposta.json().catch(() => ({}));
      throw new Error(erroBody.mensagem || `Erro ${resposta.status}`);
    }

    const data = await resposta.json();
    alert('Cadastro realizado com sucesso!');

    // Redireciona para a tela de login (ajuste se necessário)
    window.location.href = '/frontend/src/pages/index.html';

    return data;
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    alert('Erro ao cadastrar usuário: ' + (error.message || error));
    throw error;
  }
}

function initCadastroUsuario() {
  const form = document.querySelector('form.cadastro-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    await cadastrarUsuario(formData);
  });
}

async function loginUsuario(formData) {
  try {
    const payload = {
      email: formData.get('email'),
      senha: formData.get('senha'),
    };

    const resposta = await fetch('http://localhost:3000/usuario/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!resposta.ok) {
      const erroBody = await resposta.json().catch(() => ({}));
      throw new Error(erroBody.erro || `Erro ${resposta.status}`);
    }

    const data = await resposta.json();

    alert('Login realizado com sucesso!');

    // Redireciona para a página principal (ajuste conforme sua estrutura)
    window.location.href =  '/frontend/src/pages/index.html';

    return data;
  } catch (error) {
    console.error('Erro ao logar:', error);
    alert('Erro ao logar: ' + (error.message || error));
    throw error;
  }
}

function initLogin() {
  const form = document.querySelector('form.login-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    await loginUsuario(formData);
  });
}

async function redefinirSenha(formData) {
  try {
    const payload = {
      email: formData.get('email'),
      novaSenha: formData.get('nova_senha'),
      confirmarSenha: formData.get('senha')
    };

    const resposta = await fetch('http://localhost:3000/usuario/esqueceuSenha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!resposta.ok) {
      const erroBody = await resposta.json().catch(() => ({}));
      throw new Error(erroBody.mensagem || `Erro ${resposta.status}`);
    }

    const data = await resposta.json();
    alert('Senha redefinida com sucesso!');
    window.location.href =  '/frontend/login.html';
    return data;
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    alert('Erro ao redefinir senha: ' + (error.message || error));
    throw error;
  }
}

function initRedefinirSenha() {
  const form = document.querySelector('form.redefinir-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    await redefinirSenha(formData);
  });
}

function getStatusTag(progresso) {
  switch (progresso) {
    case 'lido':
      return { ribbonClass: 'ribbon-lido', label: 'Lido' };
    case 'lendo':
      return { ribbonClass: 'ribbon-lendo', label: 'Lendo' };
    case 'quero_ler':
    default:
      return { ribbonClass: 'ribbon-quero', label: 'Quero ler' };
  }
}

async function fetchBiblioteca() {
  try {
    const resposta = await fetch('http://localhost:3000/biblioteca/');
    if (!resposta.ok) throw new Error(`Erro ${resposta.status}`);
    const data = await resposta.json();
    return data.status || [];
  } catch (error) {
    console.error('Erro ao buscar biblioteca:', error);
    return [];
  }
}

async function fetchLivros() {
  try {
    const resposta = await fetch('http://localhost:3000/livros/');
    if (!resposta.ok) throw new Error(`Erro ${resposta.status}`);
    const data = await resposta.json();
    return data.livros || [];
  } catch (error) {
    console.error('Erro ao buscar livros:', error);
    return [];
  }
}

function renderBooks(books, bibliotecaStatus) {
  const row = document.querySelector('.books-grid .row');
  const countEl = document.querySelector('.books-grid h3');
  if (!row) return;

  const statusMap = new Map();
  bibliotecaStatus.forEach((item) => {
    statusMap.set(item.livro_id, item.progresso);
  });

  row.innerHTML = '';

  books.forEach((book) => {
    const progresso = statusMap.get(book.id) || 'quero_ler';
    const status = getStatusTag(progresso);
    const capa = book.imagem_capa && book.imagem_capa.trim()
      ? book.imagem_capa
      : `https://via.placeholder.com/320x460/333/fff?text=${encodeURIComponent(book.titulo)}`;

    const card = `
      <div class="col-6 col-md-4 col-lg-3 col-xl-2">
        <article class="book-card">
          <div class="book-ribbon ${status.ribbonClass}" aria-hidden="true"></div>
          <div class="book-cover" style="background-image:url('${capa}');" aria-label="Capa do livro ${book.titulo}"></div>
          <div class="book-info p-3">
            <h4 class="book-title mb-1">${book.titulo}</h4>
            <p class="book-author mb-0">${book.autor}</p>
            <small class="text-white-50">${status.label}</small>
          </div>
        </article>
      </div>`;

    row.insertAdjacentHTML('beforeend', card);
  });

  if (countEl) {
    countEl.textContent = `${books.length} itens encontrados`;
  }
}

async function fetchRanking(usuarioId = 1) {
  try {
    const resposta = await fetch(`http://localhost:3000/ranking/paginometro/${usuarioId}`);
    if (!resposta.ok) throw new Error(`Erro ${resposta.status}`);
    return await resposta.json();
  } catch (error) {
    console.error('Erro ao buscar ranking:', error);
    return null;
  }
}

function renderRank(posicao, totalPaginas) {
  const rankElem = document.querySelector('.overview-card .mb-2');
  if (rankElem) {
    rankElem.innerHTML = `Você está em <strong>${posicao}º lugar</strong> no ranking de mais páginas lidas da sua universidade!`;
  }

  const pageMeterElem = document.querySelector('.overview-card .badge.bg-light.text-dark');
  if (pageMeterElem) {
    pageMeterElem.textContent = `Paginômetro ${totalPaginas}`;
  }
}

async function initBibliotecaGrid() {
  const [books, bibliotecaStatus] = await Promise.all([fetchLivros(), fetchBiblioteca()]);
  renderBooks(books, bibliotecaStatus);

  const ranking = await fetchRanking(1); // substituir pelo ID do usuário logado se disponível
  if (ranking) {
    renderRank(ranking.posicao_ranking || 1, ranking.total_paginas || 0);
  }

  const inputSearch = document.querySelector('.books-grid input[type="search"]');
  if (!inputSearch) return;

  inputSearch.addEventListener('input', () => {
    const termo = inputSearch.value.trim().toLowerCase();
    const filtrados = books.filter((book) =>
      book.titulo.toLowerCase().includes(termo) || book.autor.toLowerCase().includes(termo)
    );
    renderBooks(filtrados, bibliotecaStatus);
  });
}

// Inicializa comportamentos quando a página estiver pronta
window.addEventListener('DOMContentLoaded', () => {
  initCadastroUsuario();
  initLogin();
  initRedefinirSenha();
  initBibliotecaGrid();
  buscarUsuarios();
})