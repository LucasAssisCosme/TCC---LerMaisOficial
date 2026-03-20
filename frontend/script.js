
// Função para validar senha conforme requisitos
function validarSenha(senha) {
  // Validações básicas
  if (!senha || typeof senha !== 'string') {
    return { valida: false, mensagem: 'Senha inválida' };
  }

  // Verificar comprimento (8 a 32 caracteres)
  if (senha.length < 8 || senha.length > 32) {
    return { valida: false, mensagem: 'Senha deve ter entre 8 e 32 caracteres' };
  }

  // Verificar espaços
  if (/\s/.test(senha)) {
    return { valida: false, mensagem: 'Senha não pode conter espaços' };
  }

  // Verificar acentuação
  const semAcentos = senha.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (semAcentos !== senha) {
    return { valida: false, mensagem: 'Senha não pode conter acentuação' };
  }

  // Verificar letra maiúscula
  if (!/[A-Z]/.test(senha)) {
    return { valida: false, mensagem: 'Senha deve conter pelo menos uma letra maiúscula' };
  }

  // Verificar letra minúscula
  if (!/[a-z]/.test(senha)) {
    return { valida: false, mensagem: 'Senha deve conter pelo menos uma letra minúscula' };
  }

  // Verificar número
  if (!/\d/.test(senha)) {
    return { valida: false, mensagem: 'Senha deve conter pelo menos um número' };
  }

  // Verificar símbolo (caracteres especiais permitidos)
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
    return { valida: false, mensagem: `Senha deve conter pelo menos um símbolo: !@#$%^&*()_+-=[]{};\\':"\\|,.<>/?` };
  }

  return { valida: true, mensagem: 'Senha válida' };
}

async function cadastrarUsuario(formData) {
  try {
    const senha = formData.get('senha');

    // Validar senha
    const validacaoSenha = validarSenha(senha);
    if (!validacaoSenha.valida) {
      alert(validacaoSenha.mensagem);
      return;
    }

    const payload = {
      nome: formData.get('nome'),
      email: formData.get('email'),
      senha: senha,
      tipo: formData.get('tipo_usuario') || 'aluno',
      genero_favorito: formData.get('genero_favorito'),
      apelido: formData.get('apelido')
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

    // Auto-login após cadastro bem-sucedido
    try {
      const loginFormData = new FormData();
      loginFormData.append('email', formData.get('email'));
      loginFormData.append('senha', senha);
      
      await loginUsuario(loginFormData, true); // true = auto-login, não mostra alert
    } catch (loginError) {
      console.error('Erro no auto-login:', loginError);
      // Se auto-login falhar, redireciona para login manual
      setTimeout(() => {
        window.location.href = '/frontend/login.html';
      }, 500);
    }

    return data;
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    alert('Erro ao cadastrar usuário: ' + (error.message || error));
    throw error;
  }
}

async function cadastrarLivro(formData) {
  try {
    const token = getToken();
    if (!token) {
      alert('Você precisa estar logado para cadastrar livros');
      window.location.href = '/frontend/login.html';
      return;
    }

    const usuarioId = getUsuarioLogadoId();
    if (!usuarioId) {
      alert('Erro: ID do usuário não encontrado');
      return;
    }

    const payload = {
      titulo: formData.get('nome'),
      autor: formData.get('autor'),
      genero: formData.get('assunto'),
      ano: parseInt(formData.get('ano')),
      numero_paginas: parseInt(formData.get('paginas')),
      descricao: formData.get('descricao'),
      imagem_capa: formData.get('imagem'),
      editora: formData.get('editora'),
      tipo_usuario: getUsuarioLogadoTipo()
    };

    // Frontend guard: campo ano dentro do intervalo aceito pelo backend
    if (!payload.ano || payload.ano < 1000 || payload.ano > new Date().getFullYear()) {
      alert('Ano inválido. Use um ano entre 1000 e ' + new Date().getFullYear() + '.');
      return;
    }

    if (!payload.numero_paginas || payload.numero_paginas < 1) {
      alert('Número de páginas inválido.');
      return;
    }

    console.log('Enviando dados do livro:', payload);

    const resposta = await fetch('http://localhost:3000/livros/cadastrar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
      if (resposta.status === 400 && data.detalhes) {
        const detalhes = data.detalhes.map(d => `${d.param}: ${d.msg}`).join(' | ');
        throw new Error(`Erro 400 - validação: ${detalhes}`);
      }
      throw new Error(data.mensagem || `Erro ${resposta.status}`);
    }

    console.log('Livro cadastrado com sucesso:', data);

    alert('Livro cadastrado com sucesso!');

    // Redirecionar para a página inicial
    window.location.href = '/frontend/src/pages/index.html';

  } catch (error) {
    console.error('Erro ao cadastrar livro:', error);
    alert('Erro ao cadastrar livro: ' + (error.message || error));
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

function initCadastroLivro() {
  const form = document.querySelector('form.cadastro-livro-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    await cadastrarLivro(formData);
  });
}

async function loginUsuario(formData, isAutoLogin = false) {
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

      // Atualiza acesso aos recursos baseado no tipo de usuário
      atualizarAcessoCadastroLivro();
    }

    // Salva o token JWT
    if (data.token) {
      localStorage.setItem('token', data.token);
    }

    // Só mostra alert se não for auto-login
    if (!isAutoLogin) {
      alert('Login realizado com sucesso!');
    }

    // Redireciona para a página principal (ajuste conforme sua estrutura)
    setTimeout(() => {
      window.location.href =  '/frontend/src/pages/index.html';
    }, 500);

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
    const novaSenha = formData.get('nova_senha');
    const confirmarSenha = formData.get('senha');

    // Validar nova senha
    const validacaoSenha = validarSenha(novaSenha);
    if (!validacaoSenha.valida) {
      alert(validacaoSenha.mensagem);
      return;
    }

    // Validar se as senhas coincidem
    if (novaSenha !== confirmarSenha) {
      alert('As senhas não coincidem');
      return;
    }

    const payload = {
      email: formData.get('email'),
      novaSenha: novaSenha,
      confirmarSenha: confirmarSenha
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
    setTimeout(() => {
      window.location.href =  '/frontend/login.html';
    }, 500);
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
  
  // Limpa o intervalo de atualização se estiver ativo
  if (bibliotecaAutoRefreshId !== null) {
    clearInterval(bibliotecaAutoRefreshId);
    bibliotecaAutoRefreshId = null;
  }
  
  setTimeout(() => {
    window.location.href = '/frontend/login.html';
  }, 300);
}

function isBibliotecariaLogada() {
  const tipo = getUsuarioLogadoTipo();
  const libera = ['bibliotecaria', 'bibliotecario', 'professor', 'bibliotecaria', 'bibliotecario'].includes(tipo);
  return libera;
}

function atualizarAcessoCadastroLivro() {
  const podeCadastrar = isBibliotecariaLogada();

  // Seleciona todos os links que contenham "cadastroLivro.html" no href
  const links = document.querySelectorAll('a[href*="cadastroLivro.html"]');

  links.forEach((link) => {
    if (podeCadastrar) {
      link.style.display = '';
      link.parentElement.style.display = ''; // Mostra também o elemento pai (li)
    } else {
      link.style.display = 'none';
      link.parentElement.style.display = 'none'; // Esconde também o elemento pai (li)
    }
  });

  // Verifica se usuário não autorizado está na página de cadastro
  if (!podeCadastrar && window.location.href.includes('cadastroLivro.html')) {
    alert('Acesso negado: apenas bibliotecárias podem cadastrar livros.');
    window.location.href = '/frontend/src/pages/index.html';
  }
}

let bibliotecaAutoRefreshId = null;
let bibliotecaCachedBooks = [];
let bibliotecaCachedStatus = [];
let paginasCarregadas = new Set();

async function atualizarBibliotecaELista() {
  // Verifica se os elementos necessários existem
  const inputSearch = document.querySelector('.books-grid input[type="search"]');
  const row = document.querySelector('.books-grid .row');
  if (!inputSearch || !row) return;
  
  const [livrosDaBiblioteca, bibliotecaStatus] = await Promise.all([fetchBiblioteca()]);
  bibliotecaCachedBooks = livrosDaBiblioteca;
  bibliotecaCachedStatus = livrosDaBiblioteca.map(livro => ({
    livro_id: livro.livro_id,
    progresso: livro.progresso
  }));

  const termo = inputSearch ? inputSearch.value.trim().toLowerCase() : '';

  if (termo) {
    const filtrados = livrosDaBiblioteca.filter((livro) =>
      livro.titulo.toLowerCase().includes(termo) || livro.autor.toLowerCase().includes(termo)
    );
    renderBooks(filtrados, bibliotecaCachedStatus);
  } else {
    renderBooks(livrosDaBiblioteca, bibliotecaCachedStatus);
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

async function salvarStatusBiblioteca(usuarioId, livroId, progresso = 'quero_ler') {
  try {
    // Validações no frontend
    const uId = parseInt(usuarioId);
    const lId = parseInt(livroId);
    
    if (!uId || !lId) {
      console.error('Dados inválidos:', { usuarioId, livroId });
      alert('Erro: IDs inválidos. Abra o console para detalhes.');
      return null;
    }

    if (!['lido', 'lendo', 'quero_ler'].includes(progresso)) {
      alert('Erro: Progresso inválido. Use: lido, lendo ou quero_ler');
      return null;
    }

    const token = getToken();
    if (!token) {
      alert('Você precisa estar logado');
      logout();
      return null;
    }

    const payload = {
      usuario_id: uId,
      livro_id: lId,
      progresso: progresso
    };

    console.log('[Frontend] Enviando status:', payload);

    const resposta = await fetch('http://localhost:3000/biblioteca/cadastrar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    console.log('[Frontend] Status HTTP:', resposta.status);

    if (resposta.status === 401 || resposta.status === 403) {
      alert('Sessão expirada. Faça login novamente.');
      logout();
      return null;
    }

    const data = await resposta.json();

    if (!resposta.ok) {
      console.error('[Frontend] Erro na resposta:', data);
      const mensagem = data.mensagem || `Erro ${resposta.status}`;
      alert('Erro ao salvar: ' + mensagem);
      return null;
    }

    console.log('[Frontend] Status salvo com sucesso:', data);
    alert('Livro adicionado à biblioteca!');

    // Dispara evento para atualizar biblioteca
    document.dispatchEvent(new Event('StatusLivroAlterado'));

    return data;
  } catch (error) {
    console.error('[Frontend] Erro ao salvar status:', error);
    alert('Erro: ' + error.message);
    return null;
  }
}

function renderBooks(books, bibliotecaStatus) {
  const row = document.querySelector('.books-grid .row');
  const countEl = document.querySelector('.books-header h3');
  if (!row) return;

  const statusMap = new Map();
  bibliotecaStatus.forEach((item) => {
    statusMap.set(item.livro_id, item.progresso);
  });

  row.innerHTML = '';

  books.forEach((book) => {
    const progresso = statusMap.get(book.livro_id) || 'quero_ler';
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
  const rankElem = document.querySelector('.ranking-text.mb-2');
  if (rankElem) {
    rankElem.innerHTML = `Você está em <strong>${posicao}º lugar</strong> no ranking de mais páginas lidas da sua universidade!`;
  }

  const pageMeterElem = document.querySelector('.overview-card .badge.bg-light.text-dark');
  if (pageMeterElem) {
    pageMeterElem.textContent = `Paginômetro ${totalPaginas}`;
  }
}

async function initBibliotecaGrid() {
  // Verifica se os elementos da biblioteca existem
  const inputSearch = document.querySelector('.books-grid input[type="search"]');
  const row = document.querySelector('.books-grid .row');

  if (!inputSearch || !row) return;

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

  // Listener para atualizar biblioteca quando um livro é adicionado
  document.addEventListener('LivroAdicionado', async () => {
    await atualizarBibliotecaELista();
  });

  // Listener para atualizar biblioteca quando o status de um livro é alterado
  document.addEventListener('StatusLivroAlterado', async () => {
    await atualizarBibliotecaELista();
  });
}


// Inicializa comportamentos quando a página estiver pronta
window.addEventListener('DOMContentLoaded', () => {
  // Identifica qual página está sendo carregada
  const currentPage = window.location.pathname;
  paginasCarregadas.add(currentPage);

  // Evita carregar mais de uma vez na mesma página
  if (paginasCarregadas.size > 1) return;

  initCadastroUsuario();
  initLogin();
  initRedefinirSenha();
  initCadastroLivro();
  atualizarAcessoCadastroLivro();
  
  // Apenas inicializa biblioteca se o usuário estiver logado (tem token)
  const token = getToken();
  const usuarioId = getUsuarioLogadoId();
  if (token && usuarioId) {
    initBibliotecaGrid();
  }
})