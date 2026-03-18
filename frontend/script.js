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

    // Salva usuário logado para usar biblioteca/ranking
    if (data.usuario && data.usuario.id) {
      const userId = String(data.usuario.id).trim();
      localStorage.setItem('usuarioLogadoId', userId);

      const tipo = normalizarTipo(String(data.usuario.tipo || 'aluno'));
      localStorage.setItem('usuarioLogadoTipo', tipo);

      console.log('[Login realizado]', { usuarioId: userId, usuarioTipo: tipo });
    }

    // Salva o token JWT
    if (data.token) {
      localStorage.setItem('token', data.token);
    }

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

function getUsuarioLogadoId() {
  const id = localStorage.getItem('usuarioLogadoId');
  return id ? id.trim() : null;
}

function normalizarTipo(tipo) {
  if (!tipo || typeof tipo !== 'string') return 'aluno';
  return tipo
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function getUsuarioLogadoTipo() {
  return normalizarTipo(localStorage.getItem('usuarioLogadoTipo') || 'aluno');
}

function getToken() {
  return localStorage.getItem('token');
}

function logout() {
  localStorage.removeItem('usuarioLogadoId');
  localStorage.removeItem('usuarioLogadoTipo');
  localStorage.removeItem('token');
  window.location.href = '/frontend/login.html';
}

function isBibliotecariaLogada() {
  const tipo = getUsuarioLogadoTipo();
  const libera = ['bibliotecaria', 'bibliotecario', 'professor', 'bibliotecaria', 'bibliotecario'].includes(tipo);
  console.log('[Acesso Pedido]', { tipo, libera, usuarioLogadoId: getUsuarioLogadoId() });
  return libera;
}

function atualizarAcessoCadastroLivro() {
  const podeCadastrar = isBibliotecariaLogada();

  document.querySelectorAll('a[href*="cadastroLivro.html"]').forEach((link) => {
    if (podeCadastrar) {
      link.style.display = '';
    } else {
      link.style.display = 'none';
    }
  });

  if (!podeCadastrar && window.location.href.includes('cadastroLivro.html')) {
    alert('Acesso negado: apenas bibliotecárias podem cadastrar livros.');
    window.location.href = '/frontend/src/pages/index.html';
  }

  // Ajusta texto de navbar para usuários não bibliotecários
  if (!podeCadastrar) {
    document.querySelectorAll('.nav-links a, .mobile-menu a').forEach((link) => {
      if (link.getAttribute('href')?.includes('cadastroLivro.html')) {
        link.style.display = 'none';
      }
    });
  }
}

let bibliotecaAutoRefreshId = null;
let bibliotecaCachedBooks = [];
let bibliotecaCachedStatus = [];

async function atualizarBibliotecaELista() {
  const [books, bibliotecaStatus] = await Promise.all([fetchLivros(), fetchBiblioteca()]);
  bibliotecaCachedBooks = books;
  bibliotecaCachedStatus = bibliotecaStatus;

  const inputSearch = document.querySelector('.books-grid input[type="search"]');
  const termo = inputSearch ? inputSearch.value.trim().toLowerCase() : '';

  if (termo) {
    const filtrados = books.filter((book) =>
      book.titulo.toLowerCase().includes(termo) || book.autor.toLowerCase().includes(termo)
    );
    renderBooks(filtrados, bibliotecaStatus);
  } else {
    renderBooks(books, bibliotecaStatus);
  }

  const usuarioId = getUsuarioLogadoId();
  if (usuarioId) {
    const ranking = await fetchRanking(usuarioId);
    if (ranking) {
      renderRank(ranking.posicao_ranking || 1, ranking.total_paginas || 0);
    }
  } else {
    renderRank('-', '-');
  }
}


async function fetchBiblioteca() {
  try {
    const usuarioId = getUsuarioLogadoId();
    const token = getToken();
    if (!token) {
      console.error('Token não encontrado! Redirecionando para login.');
      logout();
      return [];
    }
    const resposta = await fetch(`http://localhost:3000/biblioteca/usuario/${usuarioId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (resposta.status === 401 || resposta.status === 403) {
      alert('Sessão expirada. Faça login novamente.');
      logout();
      return [];
    }
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
      : 'https://gabrielchalita.com.br/wp-content/uploads/2019/12/semcapa.png';

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
    const token = getToken();
    if (!token) {
      console.error('Token não encontrado! Redirecionando para login.');
      logout();
      return null;
    }
    const resposta = await fetch(`http://localhost:3000/ranking/paginometro/${usuarioId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (resposta.status === 401 || resposta.status === 403) {
      alert('Sessão expirada. Faça login novamente.');
      logout();
      return null;
    }
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
  const inputSearch = document.querySelector('.books-grid input[type="search"]');

  if (inputSearch) {
    inputSearch.addEventListener('input', () => {
      const termo = inputSearch.value.trim().toLowerCase();
      const filtrados = bibliotecaCachedBooks.filter((book) =>
        book.titulo.toLowerCase().includes(termo) || book.autor.toLowerCase().includes(termo)
      );
      renderBooks(filtrados, bibliotecaCachedStatus);
    });
  }

  await atualizarBibliotecaELista();

  if (bibliotecaAutoRefreshId !== null) {
    clearInterval(bibliotecaAutoRefreshId);
  }

  bibliotecaAutoRefreshId = setInterval(async () => {
    await atualizarBibliotecaELista();
  }, 1000);
}


// Inicializa comportamentos quando a página estiver pronta
window.addEventListener('DOMContentLoaded', () => {
  initCadastroUsuario();
  initLogin();
  initRedefinirSenha();
  atualizarAcessoCadastroLivro();
  initBibliotecaGrid();
  buscarUsuarios();
})