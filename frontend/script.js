const API_BASE_URL = "http://localhost:3000";

// ==================== UPLOAD DE IMAGEM ====================
async function uploadImagemLivro(arquivo) {
  try {
    const formData = new FormData();
    formData.append("imagemFile", arquivo);

    const response = await fetch("http://localhost:3000/upload-livro-capa", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.sucesso) {
      throw new Error(data.mensagem || "Erro ao fazer upload");
    }

    return normalizarUrlMidia(data.url);
  } catch (erro) {
    console.error("[uploadImagemLivro] Erro:", erro);
    throw erro;
  }
}

function normalizarUrlMidia(url) {
  if (!url || typeof url !== "string") {
    return "";
  }

  const urlLimpa = url.trim();
  if (!urlLimpa) {
    return "";
  }

  if (/^https?:\/\//i.test(urlLimpa) || urlLimpa.startsWith("data:")) {
    return urlLimpa;
  }

  if (urlLimpa.startsWith("/")) {
    return `${API_BASE_URL}${urlLimpa}`;
  }

  return `${API_BASE_URL}/${urlLimpa.replace(/^\.?\//, "")}`;
}

// ==================== VALIDAR SENHA ====================
function validarSenha(senha) {
// ValidaÃ§Ãµes bÃ¡sicas
if (!senha || typeof senha !== "string") {
  return {
    valida: false,
    mensagem: "Senha invÃ¡lida",
  };
}

// Verificar comprimento (8 a 32 caracteres)
if (senha.length < 8 || senha.length > 32) {
  return {
    valida: false,
    mensagem: "Senha deve ter entre 8 e 32 caracteres",
  };
}

// Verificar espaÃ§os
if (/\s/.test(senha)) {
  return { valida: false, mensagem: "Senha nÃ£o pode conter espaÃ§os" };
}

// Verificar acentuaÃ§Ã£o
const semAcentos = senha.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
if (semAcentos !== senha) {
  return { valida: false, mensagem: "Senha nÃ£o pode conter acentuaÃ§Ã£o" };
}

// Verificar letra maiÃºscula
if (!/[A-Z]/.test(senha)) {
  return {
    valida: false,
    mensagem: "Senha deve conter pelo menos uma letra maiÃºscula",
  };
}

// Verificar letra minÃºscula
if (!/[a-z]/.test(senha)) {
  return {
    valida: false,
    mensagem: "Senha deve conter pelo menos uma letra minÃºscula",
  };
}

// Verificar nÃºmero
if (!/\d/.test(senha)) {
  return {
    valida: false,
    mensagem: "Senha deve conter pelo menos um nÃºmero",
  };
}

// Verificar sÃ­mbolo (caracteres especiais permitidos)
if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
  return {
    valida: false,
    mensagem: `Senha deve conter pelo menos um sÃ­mbolo: !@#$%^&*()_+-=[]{};\\':"\\|,.<>/?`,
  };
}

return { valida: true, mensagem: "Senha vÃ¡lida" };

}

async function cadastrarUsuario(formData) {
  try {
    const senha = formData.get("senha");

    // Validar senha
    const validacaoSenha = validarSenha(senha);
    if (!validacaoSenha.valida) {
      alert(validacaoSenha.mensagem);
      return;
    }

    const payload = {
      nome: formData.get("nome"),
      email: formData.get("email"),
      senha: senha,
      tipo: formData.get("tipo_usuario") || "aluno",
      genero_favorito: formData.get("genero_favorito"),
      apelido: formData.get("apelido"),
    };

    const resposta = await fetch("http://localhost:3000/usuario/cadastrar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resposta.ok) {
      const erroBody = await resposta.json().catch(() => ({}));
      throw new Error(erroBody.mensagem || `Erro ${resposta.status}`);
    }

    const data = await resposta.json();
    alert("Cadastro realizado com sucesso!");

    // Auto-login apÃ³s cadastro bem-sucedido
    try {
      const loginFormData = new FormData();
      loginFormData.append("email", formData.get("email"));
      loginFormData.append("senha", senha);

      await loginUsuario(loginFormData, true); // true = auto-login, nÃ£o mostra alert
    } catch (loginError) {
      console.error("Erro no auto-login:", loginError);
      // Se auto-login falhar, redireciona para login manual
      setTimeout(() => {
        window.location.href = "/frontend/login.html";
      }, 500);
    }

    return data;
  } catch (error) {
    console.error("Erro ao cadastrar usuÃ¡rio:", error);
    alert("Erro ao cadastrar usuÃ¡rio: " + (error.message || error));
    throw error;
  }
}

async function cadastrarLivro(formData) {
  try {
    const token = getToken();
    if (!token) {
      alert("VocÃª precisa estar logado para cadastrar livros");
      window.location.href = "/frontend/login.html";
      return;
    }

    const usuarioId = getUsuarioLogadoId();
    if (!usuarioId) {
      alert("Erro: ID do usuÃ¡rio nÃ£o encontrado");
      return;
    }

    // Verificar se hÃ¡ arquivo de imagem (obrigatÃ³rio)
    const arquivoImagem = document.getElementById("inputImagemLivro")?.files[0];
    if (!arquivoImagem) {
      alert("Por favor, selecione uma imagem para o livro");
      return;
    }

    let urlImagem;

    // Fazer upload da imagem
    try {
      urlImagem = await uploadImagemLivro(arquivoImagem);
      if (!urlImagem) {
        throw new Error("URL da imagem nÃ£o foi retornada");
      }
    } catch (erro) {
      alert("Erro ao fazer upload da imagem: " + erro.message);
      return;
    }

    const payload = {
      titulo: formData.get("nome"),
      autor: formData.get("autor"),
      genero: formData.get("assunto"),
      ano: parseInt(formData.get("ano")),
      numero_paginas: parseInt(formData.get("paginas")),
      descricao: formData.get("descricao"),
      imagem_capa: urlImagem,
      editora: formData.get("editora"),
      tipo_usuario: getUsuarioLogadoTipo(),
    };

    // Frontend guard: campo ano dentro do intervalo aceito pelo backend
    if (
      !payload.ano ||
      payload.ano < 1000 ||
      payload.ano > new Date().getFullYear()
    ) {
      alert(
        "Ano invÃ¡lido. Use um ano entre 1000 e " +
          new Date().getFullYear() +
          ".",
      );
      return;
    }

    if (!payload.numero_paginas || payload.numero_paginas < 1) {
      alert("NÃºmero de pÃ¡ginas invÃ¡lido.");
      return;
    }

    console.log("Enviando dados do livro:", payload);

    const resposta = await fetch("http://localhost:3000/livros/cadastrar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
      if (resposta.status === 400 && data.detalhes) {
        const detalhes = data.detalhes
          .map((d) => `${d.param}: ${d.msg}`)
          .join(" | ");
        throw new Error(`Erro 400 - validaÃ§Ã£o: ${detalhes}`);
      }
      throw new Error(data.mensagem || `Erro ${resposta.status}`);
    }

    console.log("Livro cadastrado com sucesso:", data);

    alert("Livro cadastrado com sucesso!");

    // Redirecionar para a pÃ¡gina inicial
    window.location.href = "/frontend/src/pages/index.html";
  } catch (error) {
    console.error("Erro ao cadastrar livro:", error);
    alert("Erro ao cadastrar livro: " + (error.message || error));
  }
}

function initCadastroUsuario() {
  const form = document.querySelector("form.cadastro-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    await cadastrarUsuario(formData);
  });
}

function initCadastroLivro() {
  const form = document.querySelector("form.cadastro-livro-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    await cadastrarLivro(formData);
  });
}

async function loginUsuario(formData, isAutoLogin = false) {
  try {
    const payload = {
      email: formData.get("email"),
      senha: formData.get("senha"),
    };

    const resposta = await fetch("http://localhost:3000/usuario/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resposta.ok) {
      const erroBody = await resposta.json().catch(() => ({}));
      throw new Error(erroBody.erro || `Erro ${resposta.status}`);
    }

    const data = await resposta.json();

    // Salva usuÃ¡rio logado para usar biblioteca/ranking
    if (data.usuario && data.usuario.id) {
      const userId = String(data.usuario.id).trim();
      localStorage.setItem("usuarioLogadoId", userId);

      const tipo = normalizarTipo(String(data.usuario.tipo || "aluno"));
      localStorage.setItem("usuarioLogadoTipo", tipo);

      console.log("[Login realizado]", {
        usuarioId: userId,
        usuarioTipo: tipo,
      });

      // Atualiza acesso aos recursos baseado no tipo de usuÃ¡rio
      atualizarAcessoCadastroLivro();
    }

    // Salva o token JWT
    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    // SÃ³ mostra alert se nÃ£o for auto-login
    if (!isAutoLogin) {
      alert("Login realizado com sucesso!");
    }

    // Redireciona para a pÃ¡gina principal (ajuste conforme sua estrutura)
    setTimeout(() => {
      window.location.href = "/frontend/src/pages/index.html";
    }, 500);

    return data;
  } catch (error) {
    console.error("Erro ao logar:", error);
    alert("Erro ao logar: " + (error.message || error));
    throw error;
  }
}

function initLogin() {
  const form = document.querySelector("form.login-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    await loginUsuario(formData);
  });
}

async function redefinirSenha(formData) {
  try {
    const novaSenha = formData.get("nova_senha");
    const confirmarSenha = formData.get("senha");

    // Validar nova senha
    const validacaoSenha = validarSenha(novaSenha);
    if (!validacaoSenha.valida) {
      alert(validacaoSenha.mensagem);
      return;
    }

    // Validar se as senhas coincidem
    if (novaSenha !== confirmarSenha) {
      alert("As senhas nÃ£o coincidem");
      return;
    }

    const payload = {
      email: formData.get("email"),
      novaSenha: novaSenha,
      confirmarSenha: confirmarSenha,
    };

    const resposta = await fetch(
      "http://localhost:3000/usuario/esqueceuSenha",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!resposta.ok) {
      const erroBody = await resposta.json().catch(() => ({}));
      throw new Error(erroBody.mensagem || `Erro ${resposta.status}`);
    }

    const data = await resposta.json();
    alert("Senha redefinida com sucesso!");
    setTimeout(() => {
      window.location.href = "/frontend/login.html";
    }, 500);
    return data;
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    alert("Erro ao redefinir senha: " + (error.message || error));
    throw error;
  }
}

function initRedefinirSenha() {
  const form = document.querySelector("form.redefinir-form");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    await redefinirSenha(formData);
  });
}

function getStatusTag(progresso) {
  switch (progresso) {
    case "lido":
      return { ribbonClass: "ribbon-lido", label: "Lido" };
    case "lendo":
      return { ribbonClass: "ribbon-lendo", label: "Lendo" };
    case "quero_ler":
    default:
      return { ribbonClass: "ribbon-quero", label: "Quero ler" };
  }
}

function getUsuarioLogadoId() {
  const id = localStorage.getItem("usuarioLogadoId");
  return id ? id.trim() : null;
}

function normalizarTipo(tipo) {
  if (!tipo || typeof tipo !== "string") return "aluno";
  return tipo
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function getUsuarioLogadoTipo() {
  return normalizarTipo(localStorage.getItem("usuarioLogadoTipo") || "aluno");
}

function getToken() {
  return localStorage.getItem("token");
}

function logout() {
  localStorage.removeItem("usuarioLogadoId");
  localStorage.removeItem("usuarioLogadoTipo");
  localStorage.removeItem("token");

  // Limpa o intervalo de atualizaÃ§Ã£o se estiver ativo
  if (bibliotecaAutoRefreshId !== null) {
    clearInterval(bibliotecaAutoRefreshId);
    bibliotecaAutoRefreshId = null;
  }

  setTimeout(() => {
    window.location.href = "/frontend/login.html";
  }, 300);
}

function isBibliotecariaLogada() {
  const tipo = getUsuarioLogadoTipo();
  const libera = [
    "bibliotecaria",
    "bibliotecario",
    "professor",
    "bibliotecaria",
    "bibliotecario",
  ].includes(tipo);
  return libera;
}

function atualizarAcessoCadastroLivro() {
  const podeCadastrar = isBibliotecariaLogada();

  // Seleciona todos os links que contenham "cadastroLivro.html" no href
  const links = document.querySelectorAll('a[href*="cadastroLivro.html"]');

  links.forEach((link) => {
    if (podeCadastrar) {
      link.style.display = "";
      link.parentElement.style.display = ""; // Mostra tambÃ©m o elemento pai (li)
    } else {
      link.style.display = "none";
      link.parentElement.style.display = "none"; // Esconde tambÃ©m o elemento pai (li)
    }
  });

  // Verifica se usuÃ¡rio nÃ£o autorizado estÃ¡ na pÃ¡gina de cadastro
  if (!podeCadastrar && window.location.href.includes("cadastroLivro.html")) {
    alert("Acesso negado: apenas bibliotecÃ¡rias podem cadastrar livros.");
    window.location.href = "/frontend/src/pages/index.html";
  }
}

let bibliotecaAutoRefreshId = null;
let bibliotecaCachedBooks = [];
let bibliotecaCachedStatus = [];
let paginasCarregadas = new Set();

async function atualizarBibliotecaELista() {
  // Verifica se os elementos necessÃ¡rios existem
  const inputSearch = document.querySelector(
    '.books-grid input[type="search"]',
  );
  const row = document.querySelector(".books-grid .row");
  if (!inputSearch || !row) {
    console.warn("[Biblioteca] Elementos da grid nÃ£o encontrados!");
    return;
  }

  console.log("[atualizarBibliotecaELista] Buscando livros...");

  // Tenta buscar biblioteca do usuÃ¡rio primeiro
  let livrosDaBiblioteca = await fetchBiblioteca();

  // Se nÃ£o houver livros na biblioteca, tenta buscar todos os livros
  if (livrosDaBiblioteca.length === 0) {
    console.log(
      "[atualizarBibliotecaELista] Nenhum livro na biblioteca, buscando todos os livros...",
    );
    const todosOsLivros = await fetchLivrosPublicos();
    livrosDaBiblioteca = todosOsLivros;
  }

  console.log("[Biblioteca] Livros carregados:", {
    quantidade: livrosDaBiblioteca.length,
    dados: livrosDaBiblioteca,
  });

  bibliotecaCachedBooks = livrosDaBiblioteca;
  bibliotecaCachedStatus = livrosDaBiblioteca.map((livro) => ({
    livro_id: livro.livro_id || livro.id,
    progresso: livro.progresso || "quero_ler",
  }));

  const termo = inputSearch ? inputSearch.value.trim().toLowerCase() : "";

  if (termo) {
    const filtrados = livrosDaBiblioteca.filter(
      (livro) =>
        (livro.titulo || livro.nome || "").toLowerCase().includes(termo) ||
        (livro.autor || "").toLowerCase().includes(termo),
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
    renderRank("-", "-");
  }
}

async function fetchBiblioteca() {
  try {
    const usuarioId = getUsuarioLogadoId();
    const token = getToken();

    console.log("[fetchBiblioteca] Iniciando busca com ", {
      usuarioId,
      temToken: !!token,
    });

    if (!token) {
      console.error("Token nÃ£o encontrado! Redirecionando para login.");
      logout();
      return [];
    }

    if (!usuarioId) {
      console.error("ID do usuÃ¡rio nÃ£o encontrado!");
      return [];
    }

    const url = `http://localhost:3000/biblioteca/usuario/${usuarioId}`;
    console.log("[fetchBiblioteca] Fazendo requisiÃ§Ã£o para:", url);

    const resposta = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("[fetchBiblioteca] Status HTTP:", resposta.status);

    if (resposta.status === 401 || resposta.status === 403) {
      alert("SessÃ£o expirada. FaÃ§a login novamente.");
      logout();
      return [];
    }

    if (!resposta.ok) {
      const erro = await resposta.text();
      console.error("[fetchBiblioteca] Erro na resposta:", erro);
      throw new Error(`Erro ${resposta.status}`);
    }

    const data = await resposta.json();
    console.log("[fetchBiblioteca] Dados recebidos:", data);

    // A resposta pode vir como { status: [...] } ou { biblioteca: [...] } ou direto [...]
    const livros = data.status || data.biblioteca || data.livros || data || [];
    console.log("[fetchBiblioteca] Livros extraÃ­dos:", livros);

    return livros;
  } catch (error) {
    console.error("Erro ao buscar biblioteca:", error);
    return [];
  }
}

async function fetchLivrosPublicos() {
  try {
    console.log("[fetchLivrosPublicos] Buscando livros pÃºblicos...");

    const resposta = await fetch("http://localhost:3000/livros/");

    console.log("[fetchLivrosPublicos] Status HTTP:", resposta.status);

    if (!resposta.ok) {
      const erro = await resposta.text();
      console.error("[fetchLivrosPublicos] Erro na resposta:", erro);
      throw new Error(`Erro ${resposta.status}`);
    }

    const data = await resposta.json();
    console.log("[fetchLivrosPublicos] Dados recebidos:", data);

    // A resposta pode vir em diferentes formatos
    // Tenta extrair os livros de vÃ¡rias estruturas possÃ­veis
    let livros = [];

    if (Array.isArray(data)) {
      livros = data;
    } else if (data.livros && Array.isArray(data.livros)) {
      livros = data.livros;
    } else if (data.status && Array.isArray(data.status)) {
      livros = data.status;
    } else if (data.biblioteca && Array.isArray(data.biblioteca)) {
      livros = data.biblioteca;
    } else if (data.data && Array.isArray(data.data)) {
      livros = data.data;
    }

    console.log("[fetchLivrosPublicos] Livros extraÃ­dos:", {
      quantidade: livros.length,
      livros,
    });

    return livros;
  } catch (error) {
    console.error(
      "[fetchLivrosPublicos] Erro ao buscar livros pÃºblicos:",
      error,
    );
    return [];
  }
}

async function fetchLivros() {
  try {
    const resposta = await fetch("http://localhost:3000/livros/");
    if (!resposta.ok) throw new Error(`Erro ${resposta.status}`);
    const data = await resposta.json();
    return data.livros || [];
  } catch (error) {
    console.error("Erro ao buscar livros:", error);
    return [];
  }
}

async function carregarPerfil() {
  try {
    const id = getUsuarioLogadoId();
    const token = getToken();

    // Se nÃ£o estiver logado, redirecionar para login
    if (!id || !token) {
      alert("VocÃª precisa estar logado para acessar o perfil!");
      window.location.href = "/frontend/login.html";
      return;
    }

    const response = await fetch(`http://localhost:3000/usuario/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }

    const data = await response.json();

    console.log("Perfil carregado:", data.usuario);

    document.getElementById("nome").value = data.usuario.nome || "";
    document.getElementById("bio").value = data.usuario.bio || "";
    document.getElementById("email").value = data.usuario.email || "";
    document.getElementById("apelido").value = data.usuario.apelido || "";
    document.getElementById("genero").value =
      data.usuario.genero_favorito || "";

    // Se houver foto de perfil, carregar em todos os elementos
    if (data.usuario.foto_perfil) {
      // Atualizar foto no header
      const fotoHeader = document.querySelector(".info-perfil .perfil img");
      if (fotoHeader) {
        fotoHeader.src = data.usuario.foto_perfil;
      }

      // Atualizar foto no formulÃ¡rio principal
      const fotoMain = document.getElementById("fotoPerfilMain");
      if (fotoMain) {
        fotoMain.src = data.usuario.foto_perfil;
      }
    }

  } catch (erro) {
    console.error("Erro ao carregar perfil:", erro);
    alert("Erro ao carregar perfil: " + erro.message);
  }
}

function desabilitarCampos() {
  document.getElementById("nome").disabled = true;
  document.getElementById("bio").disabled = true;
  document.getElementById("email").disabled = true;
  document.getElementById("apelido").disabled = true;
  document.getElementById("genero").disabled = true;
  document.getElementById("inputFoto").disabled = true;
}

function habilitarEdicao() {
  document.getElementById("nome").disabled = false;
  document.getElementById("bio").disabled = false;
  document.getElementById("email").disabled = false;
  document.getElementById("apelido").disabled = false;
  document.getElementById("genero").disabled = false;
  document.getElementById("inputFoto").disabled = false;

  // Adicionar preview de imagem ao selecionar arquivo
  const inputFoto = document.getElementById("inputFoto");
  inputFoto.addEventListener(
    "change",
    function (event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          // Atualizar a foto principal
          const fotoMain = document.getElementById("fotoPerfilMain");
          if (fotoMain) {
            fotoMain.src = e.target.result;
          }

          // Atualizar a foto do header
          const fotoHeader = document.querySelector(".info-perfil .perfil img");
          if (fotoHeader) {
            fotoHeader.src = e.target.result;
          }
        };
        reader.readAsDataURL(file);
      }
    },
    { once: true },
  ); // Usar { once: true } para evitar listeners duplicados

  // mostrar botÃµes
  document.querySelector(".btn-salvar").style.display = "inline-block";
  document.querySelector(".btn-cancelar").style.display = "inline-block";

  // esconder botÃ£o editar
  const btnEditar = document.querySelector(".btn-editar");
  if (btnEditar) btnEditar.style.display = "none";
}

async function salvarPerfil() {
  try {
    const id = getUsuarioLogadoId();
    const token = getToken();

    const formData = new FormData();
    formData.append("nome", document.getElementById("nome").value);
    formData.append("bio", document.getElementById("bio").value);
    formData.append("email", document.getElementById("email").value);
    formData.append("apelido", document.getElementById("apelido").value);
    formData.append("genero_favorito", document.getElementById("genero").value);

    // Se houver arquivo, adicionar
    const file = document.getElementById("inputFoto").files[0];
    if (file) {
      formData.append("foto_perfil", file);
    }

    const response = await fetch(`http://localhost:3000/usuario/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const erro = await response.json().catch(() => ({}));
      throw new Error(erro.mensagem || "Erro ao salvar");
    }

    const resultado = await response.json();
    alert("Perfil atualizado com sucesso! ðŸ˜");

    console.log("[salvarPerfil] Resultado:", resultado);

    // Atualizar foto no header se foi enviada
    if (resultado.foto_url || resultado.usuario?.foto_perfil) {
      const novaFoto = resultado.foto_url || resultado.usuario?.foto_perfil;

      // Atualizar foto no header
      const fotoHeader = document.querySelector(".info-perfil .perfil img");
      if (fotoHeader) {
        fotoHeader.src = novaFoto;
        console.log("[salvarPerfil] Foto do header atualizada");
      }

      // Atualizar foto no formulÃ¡rio principal
      const fotoMain = document.getElementById("fotoPerfilMain");
      if (fotoMain) {
        fotoMain.src = novaFoto;
        console.log("[salvarPerfil] Foto principal atualizada");
      }
    }

    // volta pra pÃ¡gina de perfil
    desabilitarCampos();

    document.querySelector(".btn-salvar").style.display = "none";
    document.querySelector(".btn-cancelar").style.display = "none";

    const btnEditar = document.querySelector(".btn-editar");
    if (btnEditar) btnEditar.style.display = "inline-block";

    // Recarregar dados para garantir sincronizaÃ§Ã£o
    setTimeout(() => {
      carregarPerfil();
    }, 500);
  } catch (erro) {
    console.error(erro);
    alert("Erro ao salvar perfil: " + erro.message);
  }
}

function cancelarEdicao() {
  desabilitarCampos();
  carregarPerfil(); // recarrega dados originais

  document.querySelector(".btn-salvar").style.display = "none";
  document.querySelector(".btn-cancelar").style.display = "none";

  const btnEditar = document.querySelector(".btn-editar");
  if (btnEditar) btnEditar.style.display = "inline-block";
}

async function salvarStatusBiblioteca(
  usuarioId,
  livroId,
  progresso = "quero_ler",
) {
  try {
    // ValidaÃ§Ãµes no frontend
    const uId = parseInt(usuarioId);
    const lId = parseInt(livroId);

    if (!uId || !lId) {
      console.error("Dados invÃ¡lidos:", { usuarioId, livroId });
      alert("Erro: IDs invÃ¡lidos. Abra o console para detalhes.");
      return null;
    }

    if (!["lido", "lendo", "quero_ler"].includes(progresso)) {
      alert("Erro: Progresso invÃ¡lido. Use: lido, lendo ou quero_ler");
      return null;
    }

    const token = getToken();
    if (!token) {
      alert("VocÃª precisa estar logado");
      logout();
      return null;
    }

    const payload = {
      usuario_id: uId,
      livro_id: lId,
      progresso: progresso,
    };

    console.log("[Frontend] Enviando status:", payload);

    const resposta = await fetch("http://localhost:3000/biblioteca/cadastrar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("[Frontend] Status HTTP:", resposta.status);

    if (resposta.status === 401 || resposta.status === 403) {
      alert("SessÃ£o expirada. FaÃ§a login novamente.");
      logout();
      return null;
    }

    const data = await resposta.json();

    if (!resposta.ok) {
      console.error("[Frontend] Erro na resposta:", data);
      const mensagem = data.mensagem || `Erro ${resposta.status}`;
      console.error("[Frontend] Erro ao salvar:", mensagem);
      alert("Erro ao salvar: " + mensagem);
      return null;
    }

    console.log("[Frontend] Status salvo com sucesso:", data);
    alert("Livro adicionado Ã  biblioteca!");

    // Dispara evento para atualizar biblioteca com pequeno delay
    setTimeout(() => {
      console.log("[Frontend] Disparando evento StatusLivroAlterado...");
      document.dispatchEvent(new Event("StatusLivroAlterado"));
    }, 100);

    return data;
  } catch (error) {
    console.error("[Frontend] Erro ao salvar status:", error);
    alert("Erro: " + error.message);
    return null;
  }
}

function renderBooks(books, bibliotecaStatus) {
  const row = document.querySelector(".books-grid .row");
  const countEl = document.querySelector(".books-header h3");

  console.log("[renderBooks] Renderizando livros:", {
    quantidade: books.length,
    temRow: !!row,
    temCountEl: !!countEl,
    primeirLivro: books[0],
  });

  if (!row) {
    console.error("[renderBooks] .books-grid .row nÃ£o encontrado!");
    return;
  }

  const statusMap = new Map();
  const statusValidos = ["lido", "lendo", "quero_ler"];

  bibliotecaStatus.forEach((item) => {
    if (item.livro_id) {
      statusMap.set(item.livro_id, item.progresso);
    } else if (item.id) {
      statusMap.set(item.id, item.progresso);
    }
  });

  row.innerHTML = "";

  // Filtrar apenas livros com status vÃ¡lido
  const livrosFiltrados = books.filter((book) => {
    const livroId = book.livro_id || book.id;
    const progresso = statusMap.get(livroId) || book.progresso || "quero_ler";
    return statusValidos.includes(progresso);
  });

  console.log(
    "[renderBooks] Livros filtrados com status vÃ¡lido:",
    livrosFiltrados.length,
  );

  if (livrosFiltrados.length === 0) {
    console.warn("[renderBooks] Nenhum livro para renderizar!");
    row.innerHTML =
      '<p style="grid-column: 1/-1; text-align: center; color: white; padding: 40px; font-size: 18px;">Nenhum livro encontrado na sua biblioteca. Adicione livros na pÃ¡gina de avaliaÃ§Ã£o!</p>';
  } else {
    livrosFiltrados.forEach((book) => {
      try {
        // Trata diferentes estruturas de IDs
        const livroId = book.livro_id || book.id;
        const titulo = book.titulo || book.nome || "Sem tÃ­tulo";
        const autor = book.autor || book.author || "Desconhecido";
        const capa =
          book.imagem_capa ||
          book.capa ||
          book.image ||
          "https://gabrielchalita.com.br/wp-content/uploads/2019/12/semcapa.png";

        const progresso =
          statusMap.get(livroId) || book.progresso || "quero_ler";
        const status = getStatusTag(progresso);

        let capaUrl = normalizarUrlMidia(
          capa && capa.trim()
            ? capa
            : "https://gabrielchalita.com.br/wp-content/uploads/2019/12/semcapa.png",
        );

        // Remover qualquer versÃ£o anterior (com ?v=) e adicionar cache-buster novo
        capaUrl = capaUrl.split("?")[0];
        if (!capaUrl.includes("?")) {
          capaUrl += "?v=" + Date.now();
        }

        const card = `
          <div class="col-6 col-md-4 col-lg-3 col-xl-2" data-livro-id="${livroId}">
            <article class="book-card" style="cursor: pointer;" onclick="irParaAvaliacao(${livroId})">
              <div class="book-ribbon ${status.ribbonClass}" aria-hidden="true"></div>
              <div class="book-cover" style="background-image:url('${capaUrl}');" aria-label="Capa do livro ${titulo}"></div>
              <div class="book-info p-3">
                <h4 class="book-title mb-1">${titulo}</h4>
                <p class="book-author mb-0">${autor}</p>
                <small class="text-white-50">${status.label}</small>
              </div>
            </article>
          </div>`;

        row.insertAdjacentHTML("beforeend", card);
      } catch (error) {
        console.error("[renderBooks] Erro ao renderizar livro:", {
          livro: book,
          erro: error,
        });
      }
    });
  }

  if (countEl) {
    countEl.textContent = `${livrosFiltrados.length} itens encontrados`;
  }
}

async function fetchRanking(usuarioId = 1) {
  try {
    const token = getToken();
    if (!token) {
      console.error("Token nÃ£o encontrado! Redirecionando para login.");
      logout();
      return null;
    }
    const resposta = await fetch(
      `http://localhost:3000/ranking/paginometro/${usuarioId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (resposta.status === 401 || resposta.status === 403) {
      alert("SessÃ£o expirada. FaÃ§a login novamente.");
      logout();
      return null;
    }
    if (!resposta.ok) throw new Error(`Erro ${resposta.status}`);
    return await resposta.json();
  } catch (error) {
    console.error("Erro ao buscar ranking:", error);
    return null;
  }
}

function renderRank(posicao, totalPaginas) {
  const rankElem = document.querySelector(".ranking-text.mb-2");
  if (rankElem) {
    rankElem.innerHTML = `VocÃª estÃ¡ em <strong>${posicao}Âº lugar</strong> no ranking de mais pÃ¡ginas lidas da sua universidade!`;
  }

  const pageMeterElem = document.querySelector(
    ".overview-card .badge.bg-light.text-dark",
  );
  if (pageMeterElem) {
    pageMeterElem.textContent = `PaginÃ´metro ${totalPaginas}`;
  }
}

async function initBibliotecaGrid() {
  // Verifica se os elementos da biblioteca existem
  const inputSearch = document.querySelector(
    '.books-grid input[type="search"]',
  );
  const row = document.querySelector(".books-grid .row");

  console.log("[initBibliotecaGrid] Inicializando biblioteca com:", {
    temInputSearch: !!inputSearch,
    temRow: !!row,
  });

  if (!inputSearch || !row) {
    console.error(
      "[initBibliotecaGrid] Elementos da biblioteca nÃ£o encontrados!",
    );
    return;
  }

  if (inputSearch) {
    inputSearch.addEventListener("input", () => {
      const termo = inputSearch.value.trim().toLowerCase();
      console.log("[initBibliotecaGrid] Filtro ativado com termo:", termo);
      const filtrados = bibliotecaCachedBooks.filter(
        (book) =>
          book.titulo.toLowerCase().includes(termo) ||
          book.autor.toLowerCase().includes(termo),
      );
      renderBooks(filtrados, bibliotecaCachedStatus);
    });
  }

  console.log("[initBibliotecaGrid] Chamando atualizarBibliotecaELista...");
  await atualizarBibliotecaELista();

  // Listener para atualizar biblioteca quando um livro Ã© adicionado
  document.addEventListener("LivroAdicionado", async () => {
    console.log("[initBibliotecaGrid] Evento LivroAdicionado disparado");
    await atualizarBibliotecaELista();
  });

  // Listener para atualizar biblioteca quando o status de um livro Ã© alterado
  document.addEventListener("StatusLivroAlterado", async () => {
    console.log(
      "[initBibliotecaGrid] Evento StatusLivroAlterado disparado - recarregando biblioteca...",
    );
    await atualizarBibliotecaELista();
  });

  // Listener global para atualizar biblioteca em qualquer pÃ¡gina
  document.addEventListener("StatusLivroAlterado", async () => {
    console.log(
      "[Global] Evento StatusLivroAlterado - tentando atualizar elementos da biblioteca se visÃ­veis",
    );

    // Se estiver na pÃ¡gina de biblioteca
    const row = document.querySelector(".books-grid .row");
    if (row) {
      console.log("[Global] Atualizando biblioteca.html em tempo real...");
      await atualizarBibliotecaELista();
    }

    // Se estiver na pÃ¡gina de AvaliaÃ§Ã£o, recarregar dados
    if (window.location.href.includes("Avaliacao.html")) {
      console.log("[Global] Recarregando dados da AvaliaÃ§Ã£o...");
      await carregarDadosLivroAvaliacao();
    }
  });
}

// ======================== FUNÃ‡Ã•ES DE AVALIAÃ‡ÃƒO E LIVROS ========================

let livroAtualId = null;
let livroAtualDados = null;
let avaliacaoAtual = 0;

// Redireciona para pÃ¡gina de avaliaÃ§Ã£o
function irParaAvaliacao(livroId) {
  if (livroId) {
    localStorage.setItem("livroAtualId", livroId);
  }
  window.location.href = "/frontend/src/pages/Avaliacao.html";
}

// Redireciona para pÃ¡gina de informaÃ§Ãµes
function irParaInformacoes() {
  const livroId = localStorage.getItem("livroAtualId");
  if (livroId) {
    window.location.href = "/frontend/src/pages/informacoes.html";
  }
}

// Carrega dados do livro na pÃ¡gina de avaliaÃ§Ã£o
async function carregarDadosLivroAvaliacao() {
  try {
    const livroId = localStorage.getItem("livroAtualId");
    if (!livroId) {
      alert("Livro nÃ£o especificado");
      return;
    }

    console.log("[carregarDadosLivroAvaliacao] Carregando livro ID:", livroId);

    const token = getToken();
    const usuarioId = getUsuarioLogadoId();

    // Buscar dados do livro
    const respostaLivro = await fetch(
      `http://localhost:3000/livros/${livroId}`,
    );
    if (!respostaLivro.ok) throw new Error("Erro ao buscar livro");

    const dataLivro = await respostaLivro.json();
    const livro = normalizarDadosLivro(dataLivro.livro);
    livroAtualDados = livro;
    preencherFormularioEdicaoLivro(livro);
    configurarPreviewCapaLivro();

    console.log("[carregarDadosLivroAvaliacao] Livro carregado:", {
      titulo: livro.titulo,
      imagem_capa_original: livro.imagem_capa,
    });

    // Atualizar UI
    document.getElementById("tituloLivro").textContent = livro.titulo || "";
    document.getElementById("descricaoLivro").textContent =
      livro.descricao || "";

    if (livro.imagem_capa && livro.imagem_capa.trim()) {
      // Remover qualquer versÃ£o anterior (com ?v=)
      let capa = normalizarUrlMidia(livro.imagem_capa).split("?")[0];

      // Adicionar cache-buster novo
      capa += "?v=" + Date.now();

      console.log(
        "[carregarDadosLivroAvaliacao] URL final com cache-buster:",
        capa,
      );

      document.getElementById("capaLivro").src = capa;
    }

    livroAtualId = livroId;

    // Mostra botÃµes apenas para bibliotecÃ¡rias
    if (isBibliotecariaLogada()) {
      const acoesDiv = document.getElementById("acoesLivro");
      if (acoesDiv) {
        acoesDiv.style.display = "flex";
      }
    }

    // Se usuÃ¡rio logado, buscar dados
    if (token && usuarioId) {
      // Carregar status current da biblioteca
      try {
        const resposta = await fetch(
          `http://localhost:3000/biblioteca/usuario/${usuarioId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (resposta.ok) {
          const data = await resposta.json();
          const biblioteca = data.status || [];
          const livroStatus = biblioteca.find(
            (l) => l.livro_id === parseInt(livroId),
          );

          if (livroStatus) {
            const select = document.getElementById("statusLivro");
            if (select) {
              select.value = livroStatus.progresso;
              console.log(
                "[carregarDadosLivroAvaliacao] Status carregado:",
                livroStatus.progresso,
              );
            }
          }
        }
      } catch (e) {
        console.log(
          "[carregarDadosLivroAvaliacao] Livro ainda nÃ£o estÃ¡ na biblioteca",
        );
      }

      try {
        const respostaResenha = await fetch(
          `http://localhost:3000/resenha/usuario/${usuarioId}/livro/${livroId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (respostaResenha.ok) {
          const dataResenha = await respostaResenha.json();
          if (dataResenha.resenha) {
            document.getElementById("resenhaTexto").textContent =
              dataResenha.resenha.texto || "";
            document.getElementById("resenhaInput").value =
              dataResenha.resenha.texto || "";
          }
        }
      } catch (e) {
        console.log("Sem resenha salva");
      }

      try {
        const respostaFavorita = await fetch(
          `http://localhost:3000/livros/${livroId}/favorita/${usuarioId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (respostaFavorita.ok) {
          const dataFavorita = await respostaFavorita.json();
          if (dataFavorita.favorita) {
            document.getElementById("favoritaTexto").textContent =
              dataFavorita.favorita.parte_favorita || "";
            document.getElementById("favoritaInput").value =
              dataFavorita.favorita.parte_favorita || "";
          }
        }
      } catch (e) {
        console.log("Sem favorita salva");
      }

      try {
        const respostaAvaliacao = await fetch(
          `http://localhost:3000/avaliacoes/usuario/${usuarioId}/livro/${livroId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (respostaAvaliacao.ok) {
          const dataAvaliacao = await respostaAvaliacao.json();
          if (dataAvaliacao.avaliacao) {
            avaliacaoAtual = dataAvaliacao.avaliacao.estrelas || 0;
            atualizarEstrelas(avaliacaoAtual);
          }
        }
      } catch (e) {
        console.log("Sem avaliaÃ§Ã£o salva");
      }
    }

    setupEstrelasListeners();
  } catch (erro) {
    console.error("Erro ao carregar livro:", erro);
    alert("Erro ao carregar livro");
  }
}

// Setup de listeners das estrelas
function setupEstrelasListeners() {
  const estrelas = document.querySelectorAll("#avaliacaoEstrelas .star");

  estrelas.forEach((star) => {
    star.style.cursor = "pointer";
    star.addEventListener("click", function () {
      const valor = parseInt(this.dataset.value);
      salvarAvaliacao(valor);
    });

    star.addEventListener("mouseover", function () {
      const valor = parseInt(this.dataset.value);
      atualizarEstrelas(valor);
    });
  });

  document
    .getElementById("avaliacaoEstrelas")
    .addEventListener("mouseleave", function () {
      atualizarEstrelas(avaliacaoAtual);
    });
}

// Atualiza visualmente as estrelas
function atualizarEstrelas(valor) {
  const estrelas = document.querySelectorAll("#avaliacaoEstrelas .star");
  estrelas.forEach((star, index) => {
    if (index < valor) {
      star.style.opacity = "1";
    } else {
      star.style.opacity = "0.3";
    }
  });
}

// Salva avaliaÃ§Ã£o no servidor
async function salvarAvaliacao(estrelas) {
  try {
    const token = getToken();
    const usuarioId = getUsuarioLogadoId();

    if (!token || !usuarioId || !livroAtualId) {
      alert("VocÃª precisa estar logado");
      return;
    }

    const payload = {
      usuario_id: parseInt(usuarioId),
      livro_id: parseInt(livroAtualId),
      estrelas: estrelas,
    };

    const response = await fetch("http://localhost:3000/avaliacoes/cadastrar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      avaliacaoAtual = estrelas;
      atualizarEstrelas(estrelas);
      console.log("AvaliaÃ§Ã£o salva!");
    }
  } catch (erro) {
    console.error("Erro ao salvar avaliaÃ§Ã£o:", erro);
  }
}

// Atualiza status na biblioteca ao mudar o select
async function atualizarStatusBibliotecaOuSalvar() {
  const select = document.getElementById("statusLivro");
  const progresso = select.value;

  if (!progresso) {
    console.log(
      "[atualizarStatusBibliotecaOuSalvar] Nenhum status selecionado",
    );
    return;
  }

  const usuarioId = getUsuarioLogadoId();
  const livroId = localStorage.getItem("livroAtualId");

  if (!usuarioId || !livroId) {
    alert("UsuÃ¡rio ou livro nÃ£o encontrado");
    return;
  }

  console.log("[atualizarStatusBibliotecaOuSalvar] Atualizando status:", {
    usuarioId,
    livroId,
    progresso,
  });

  const resultado = await salvarStatusBiblioteca(usuarioId, livroId, progresso);

  if (resultado) {
    console.log("[atualizarStatusBibliotecaOuSalvar] Status salvo com sucesso");
    // Manter a seleÃ§Ã£o no select
    select.value = progresso;

    // Atualizar paginÃ´metro se o livro foi marcado como "lido"
    if (progresso === "lido") {
      await atualizarPaginometro(usuarioId);
    }
  } else {
    // Resetar a seleÃ§Ã£o se falhar
    select.value = "";
  }
}

// Atualiza o paginÃ´metro apÃ³s marcar livro como lido
async function atualizarPaginometro(usuarioId) {
  try {
    console.log(
      "[atualizarPaginometro] Atualizando paginÃ´metro para usuÃ¡rio:",
      usuarioId,
    );

    const ranking = await fetchRanking(usuarioId);
    if (ranking) {
      console.log("[atualizarPaginometro] Ranking obtido:", ranking);

      // Atualizar elemento na biblioteca.html (se estiver aberto)
      const pageMeterElem = document.querySelector(
        ".overview-card .badge.bg-light.text-dark",
      );
      if (pageMeterElem) {
        pageMeterElem.textContent = `PaginÃ´metro ${ranking.total_paginas || 0}`;
        console.log(
          "[atualizarPaginometro] PaginÃ´metro atualizado para:",
          ranking.total_paginas,
        );
      } else {
        console.log(
          "[atualizarPaginometro] Elemento do paginÃ´metro nÃ£o encontrado (pode estar em outra pÃ¡gina)",
        );
      }

      // Atualizar ranking tambÃ©m
      const rankElem = document.querySelector(".ranking-text.mb-2");
      if (rankElem) {
        rankElem.innerHTML = `VocÃª estÃ¡ em <strong>${ranking.posicao_ranking || 1}Âº lugar</strong> no ranking de mais pÃ¡ginas lidas da sua universidade!`;
        console.log(
          "[atualizarPaginometro] Ranking atualizado para posiÃ§Ã£o:",
          ranking.posicao_ranking,
        );
      }
    }
  } catch (error) {
    console.error(
      "[atualizarPaginometro] Erro ao atualizar paginÃ´metro:",
      error,
    );
  }
}

// EdiÃ§Ã£o de Resenha
function habilitarEdicaoResenha() {
  const p = document.getElementById("resenhaTexto");
  const textarea = document.getElementById("resenhaInput");
  const botoes = document.getElementById("botoesResenha");

  textarea.value = p.textContent;
  p.style.display = "none";
  textarea.style.display = "block";
  botoes.style.display = "block";

  document.querySelector(".secao:nth-child(1) .btn-editar").style.display =
    "none";
}

function cancelarResenha() {
  const p = document.getElementById("resenhaTexto");
  const textarea = document.getElementById("resenhaInput");
  const botoes = document.getElementById("botoesResenha");

  p.style.display = "block";
  textarea.style.display = "none";
  botoes.style.display = "none";

  document.querySelector(".secao:nth-child(1) .btn-editar").style.display =
    "block";
}

async function salvarResenha() {
  try {
    const token = getToken();
    const usuarioId = getUsuarioLogadoId();
    const texto = document.getElementById("resenhaInput").value;

    if (!token || !usuarioId || !livroAtualId) {
      alert("Erro ao salvar");
      return;
    }

    const payload = {
      usuario_id: parseInt(usuarioId),
      livro_id: parseInt(livroAtualId),
      texto: texto,
    };

    const response = await fetch("http://localhost:3000/resenha/cadastrar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      document.getElementById("resenhaTexto").textContent = texto;
      cancelarResenha();
      alert("Resenha salva!");
    }
  } catch (erro) {
    console.error("Erro ao salvar resenha:", erro);
  }
}

// EdiÃ§Ã£o de Favorita
function habilitarEdicaoFavorita() {
  const p = document.getElementById("favoritaTexto");
  const textarea = document.getElementById("favoritaInput");
  const botoes = document.getElementById("botoesFavorita");

  textarea.value = p.textContent;
  p.style.display = "none";
  textarea.style.display = "block";
  botoes.style.display = "block";

  document.querySelector(".secao:nth-child(2) .btn-editar").style.display =
    "none";
}

function cancelarFavorita() {
  const p = document.getElementById("favoritaTexto");
  const textarea = document.getElementById("favoritaInput");
  const botoes = document.getElementById("botoesFavorita");

  p.style.display = "block";
  textarea.style.display = "none";
  botoes.style.display = "none";

  document.querySelector(".secao:nth-child(2) .btn-editar").style.display =
    "block";
}

async function salvarFavorita() {
  try {
    const token = getToken();
    const usuarioId = getUsuarioLogadoId();
    const texto = document.getElementById("favoritaInput").value;

    if (!token || !usuarioId || !livroAtualId) {
      alert("Erro ao salvar");
      return;
    }

    const payload = {
      usuario_id: parseInt(usuarioId),
      livro_id: parseInt(livroAtualId),
      parte_favorita: texto,
    };

    const response = await fetch(
      "http://localhost:3000/livros/favorita/cadastrar",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );

    if (response.ok) {
      document.getElementById("favoritaTexto").textContent = texto;
      cancelarFavorita();
      alert("Favorita salva!");
    }
  } catch (erro) {
    console.error("Erro ao salvar favorita:", erro);
  }
}

// ==================== EDITAR LIVRO ====================
function obterElementoLivro(...ids) {
  for (const id of ids) {
    const elemento = document.getElementById(id);
    if (elemento) {
      return elemento;
    }
  }

  return null;
}

function obterTextoLivro(...ids) {
  const elemento = obterElementoLivro(...ids);
  if (!elemento) return "";
  return (elemento.textContent || elemento.innerText || "").trim();
}

function normalizarDadosLivro(livro) {
  return {
    titulo: livro?.titulo || "",
    autor: livro?.autor || "",
    genero: livro?.genero || "",
    ano: livro?.ano || "",
    numero_paginas: livro?.numero_paginas || "",
    editora: livro?.editora || "",
    descricao: livro?.descricao || "",
    imagem_capa: livro?.imagem_capa || "",
  };
}

function obterDadosLivroDaTela() {
  return normalizarDadosLivro({
    titulo: obterTextoLivro("tituloLivro", "tituloInfo"),
    autor: obterTextoLivro("autorInfo").replace(/^Autor:\s*/i, ""),
    genero: obterTextoLivro("generoInfo").replace(/^GÃªnero:\s*/i, ""),
    ano: obterTextoLivro("anoInfo").replace(/^Ano:\s*/i, ""),
    numero_paginas: obterTextoLivro("paginasInfo").replace(/^PÃ¡ginas:\s*/i, ""),
    editora: obterTextoLivro("editoraInfo").replace(/^Editora:\s*/i, ""),
    descricao: obterTextoLivro("descricaoLivro", "descricaoInfo"),
    imagem_capa:
      obterElementoLivro("capaLivro", "capaCapa")?.getAttribute("src") || "",
  });
}

function preencherFormularioEdicaoLivro(livro) {
  const dados = normalizarDadosLivro(livro);

  const tituloInput = document.getElementById("tituloLivroEdit");
  if (tituloInput) tituloInput.value = dados.titulo;

  const descricaoInput = document.getElementById("descricaoLivroEdit");
  if (descricaoInput) descricaoInput.value = dados.descricao;

  const autorInput = document.getElementById("autorLivroEdit");
  if (autorInput) autorInput.value = dados.autor;

  const generoInput = document.getElementById("generoLivroEdit");
  if (generoInput) generoInput.value = dados.genero;

  const anoInput = document.getElementById("anoLivroEdit");
  if (anoInput) anoInput.value = dados.ano;

  const paginasInput = document.getElementById("paginasLivroEdit");
  if (paginasInput) paginasInput.value = dados.numero_paginas;

  const editoraInput = document.getElementById("editoraLivroEdit");
  if (editoraInput) editoraInput.value = dados.editora;

  const capaInput = document.getElementById("capaLivroFileEdit");
  if (capaInput) capaInput.value = "";
}

function preencherVisualizacaoLivro(livro) {
  const dados = normalizarDadosLivro(livro);

  const tituloEl = obterElementoLivro("tituloLivro", "tituloInfo");
  if (tituloEl) {
    tituloEl.textContent = dados.titulo || "";
  }

  const descricaoEl = obterElementoLivro("descricaoLivro", "descricaoInfo");
  if (descricaoEl) {
    descricaoEl.textContent = dados.descricao || "";
  }

  const autorInfo = document.getElementById("autorInfo");
  if (autorInfo) {
    autorInfo.textContent = dados.autor ? `Autor: ${dados.autor}` : "Autor: N/A";
  }

  const generoInfo = document.getElementById("generoInfo");
  if (generoInfo) {
    generoInfo.textContent = dados.genero
      ? `GÃªnero: ${dados.genero}`
      : "GÃªnero: N/A";
  }

  const anoInfo = document.getElementById("anoInfo");
  if (anoInfo) {
    anoInfo.textContent = dados.ano ? `Ano: ${dados.ano}` : "Ano: N/A";
  }

  const paginasInfo = document.getElementById("paginasInfo");
  if (paginasInfo) {
    paginasInfo.textContent = dados.numero_paginas
      ? `PÃ¡ginas: ${dados.numero_paginas}`
      : "PÃ¡ginas: N/A";
  }

  const editoraInfo = document.getElementById("editoraInfo");
  if (editoraInfo) {
    editoraInfo.textContent = dados.editora
      ? `Editora: ${dados.editora}`
      : "Editora: N/A";
  }

  const capaEl = obterElementoLivro("capaLivro", "capaCapa");
  if (capaEl && dados.imagem_capa) {
    let capa = normalizarUrlMidia(dados.imagem_capa).split("?")[0];
    capa += `?v=${Date.now()}`;
    capaEl.src = capa;
  }
}

function alternarModoEdicaoLivro(ativo) {
  const infoVisualizacao = document.getElementById("infoVisualizacao");
  const infoEdicao = document.getElementById("infoEdicao");
  const acoesLivro = document.getElementById("acoesLivro");
  const acoesEdicao = document.getElementById("acoesEdicao");
  const acoesLivroLeitor = document.getElementById("acoesLivroLeitor");
  const capaEdicaoInfo = document.getElementById("capaEdicaoInfo");

  if (infoVisualizacao) {
    infoVisualizacao.style.display = ativo ? "none" : "block";
  }

  if (infoEdicao) {
    infoEdicao.style.display = ativo ? "block" : "none";
  }

  if (capaEdicaoInfo) {
    capaEdicaoInfo.style.display = ativo ? "flex" : "none";
  }

  if (acoesEdicao) {
    acoesEdicao.style.display = ativo ? "flex" : "none";
  }

  if (ativo) {
    if (acoesLivro) acoesLivro.style.display = "none";
    if (acoesLivroLeitor) acoesLivroLeitor.style.display = "none";
    return;
  }

  if (isBibliotecariaLogada()) {
    if (acoesLivro) acoesLivro.style.display = "flex";
    if (acoesLivroLeitor) acoesLivroLeitor.style.display = "none";
  } else {
    if (acoesLivro) acoesLivro.style.display = "none";
    if (acoesLivroLeitor) acoesLivroLeitor.style.display = "flex";
  }
}

function configurarPreviewCapaLivro() {
  const inputCapaFile = document.getElementById("capaLivroFileEdit");
  const imagemCapa = obterElementoLivro("capaLivro", "capaCapa");

  if (!inputCapaFile || !imagemCapa) {
    return;
  }

  if (inputCapaFile.dataset.previewConfigurado === "true") {
    return;
  }

  inputCapaFile.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      imagemCapa.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  inputCapaFile.dataset.previewConfigurado = "true";
}

async function habilitarEdicaoLivro() {
  if (!isBibliotecariaLogada()) {
    alert("Acesso negado. Apenas bibliotecarias podem editar livros.");
    return;
  }

  const dadosBase = livroAtualDados || obterDadosLivroDaTela();
  preencherFormularioEdicaoLivro(dadosBase);
  configurarPreviewCapaLivro();
  alternarModoEdicaoLivro(true);

  console.log("[habilitarEdicaoLivro] Modo de edicao ativado");
}

async function salvarAlteracoesLivro() {
  const livroId = localStorage.getItem("livroAtualId");
  if (!livroId) {
    alert("Livro nao encontrado");
    return;
  }

  const tituloInput = document.getElementById("tituloLivroEdit");
  const descricaoInput = document.getElementById("descricaoLivroEdit");
  const autorInput = document.getElementById("autorLivroEdit");
  const generoInput = document.getElementById("generoLivroEdit");
  const anoInput = document.getElementById("anoLivroEdit");
  const paginasInput = document.getElementById("paginasLivroEdit");
  const editoraInput = document.getElementById("editoraLivroEdit");
  const capaInput = document.getElementById("capaLivroFileEdit");
  const capaFile = capaInput ? capaInput.files[0] : null;

  const titulo = tituloInput ? tituloInput.value.trim() : "";
  const descricao = descricaoInput ? descricaoInput.value.trim() : "";
  const autor = autorInput ? autorInput.value.trim() : null;
  const genero = generoInput ? generoInput.value.trim() : null;
  const anoTexto = anoInput ? anoInput.value.trim() : null;
  const paginasTexto = paginasInput ? paginasInput.value.trim() : null;
  const editora = editoraInput ? editoraInput.value.trim() : null;

  if (!titulo) {
    alert("Titulo e obrigatorio!");
    return;
  }

  if (!descricao) {
    alert("Descricao e obrigatoria!");
    return;
  }

  const payload = {
    titulo,
    descricao,
  };

  if (autorInput) {
    if (!autor) {
      alert("Autor e obrigatorio!");
      return;
    }
    payload.autor = autor;
  }

  if (generoInput) {
    if (!genero) {
      alert("Genero e obrigatorio!");
      return;
    }
    payload.genero = genero;
  }

  if (anoInput) {
    const ano = Number(anoTexto);
    const anoAtual = new Date().getFullYear();
    if (!Number.isInteger(ano) || ano < 1000 || ano > anoAtual) {
      alert(`Ano invalido. Use um ano entre 1000 e ${anoAtual}.`);
      return;
    }
    payload.ano = ano;
  }

  if (paginasInput) {
    const paginas = Number(paginasTexto);
    if (!Number.isInteger(paginas) || paginas < 1) {
      alert("Numero de paginas invalido.");
      return;
    }
    payload.numero_paginas = paginas;
  }

  if (editoraInput && editora) {
    payload.editora = editora;
  }

  try {
    const token = getToken();
    if (!token) {
      alert("Voce precisa estar logado");
      return;
    }

    let imagemUrl = null;

    if (capaFile) {
      try {
        imagemUrl = await uploadImagemLivro(capaFile);
        if (!imagemUrl) {
          throw new Error("URL da imagem nao foi retornada");
        }
        console.log("[salvarAlteracoesLivro] Upload realizado:", imagemUrl);
      } catch (erro) {
        alert("Erro ao fazer upload da imagem: " + erro.message);
        return;
      }
    }

    if (imagemUrl) {
      payload.imagem_capa = normalizarUrlMidia(imagemUrl);
    }

    console.log("[salvarAlteracoesLivro] Enviando dados:", payload);

    const response = await fetch(`http://localhost:3000/livros/${livroId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("[salvarAlteracoesLivro] Status HTTP:", response.status);

    const resultData = await response.json().catch(() => ({}));
    console.log("[salvarAlteracoesLivro] Resposta do servidor:", resultData);

    if (!response.ok) {
      const detalhesValidacao = Array.isArray(resultData.detalhes)
        ? resultData.detalhes
            .map((detalhe) => `${detalhe.path || detalhe.param}: ${detalhe.msg}`)
            .join(" | ")
        : "";
      const erro =
        detalhesValidacao ||
        resultData.mensagem ||
        resultData.erro ||
        `Erro ${response.status}`;
      console.error("[salvarAlteracoesLivro] Erro na resposta:", erro);
      throw new Error(erro);
    }

    livroAtualDados = normalizarDadosLivro({
      ...livroAtualDados,
      ...payload,
      imagem_capa: payload.imagem_capa || livroAtualDados?.imagem_capa || "",
    });

    preencherVisualizacaoLivro(livroAtualDados);
    preencherFormularioEdicaoLivro(livroAtualDados);
    cancelarEdicaoLivro();

    alert("Livro atualizado com sucesso!");

    console.log("[salvarAlteracoesLivro] Recarregando biblioteca...");
    setTimeout(() => {
      atualizarBibliotecaELista();
    }, 500);
  } catch (erro) {
    console.error("[salvarAlteracoesLivro] Erro completo:", erro);
    alert("Erro ao salvar alteracoes: " + erro.message);
  }
}

function cancelarEdicaoLivro() {
  const dadosBase = livroAtualDados || obterDadosLivroDaTela();
  preencherVisualizacaoLivro(dadosBase);
  preencherFormularioEdicaoLivro(dadosBase);
  alternarModoEdicaoLivro(false);

  console.log("[cancelarEdicaoLivro] Modo de edicao cancelado");
}

// ==================== DELETAR LIVRO ====================
async function deletarLivro() {
  if (!isBibliotecariaLogada()) {
    alert("Acesso negado. Apenas bibliotecÃ¡rias podem deletar livros.");
    return;
  }

  const livroId = localStorage.getItem("livroAtualId");
  if (!livroId) {
    alert("Livro nÃ£o encontrado");
    return;
  }

  // Confirmar deleÃ§Ã£o
  const confirmar = confirm(
    "Tem certeza que deseja deletar este livro? Esta aÃ§Ã£o nÃ£o pode ser desfeita.",
  );
  if (!confirmar) {
    return;
  }

  try {
    const token = getToken();
    if (!token) {
      alert("VocÃª precisa estar logado");
      return;
    }

    console.log("[deletarLivro] Deletando livro ID:", livroId);

    const response = await fetch(`http://localhost:3000/livros/${livroId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("[deletarLivro] Status HTTP:", response.status);

    if (!response.ok) {
      const erro = await response.json().catch(() => ({}));
      throw new Error(erro.mensagem || `Erro ${response.status}`);
    }

    const resultado = await response.json();
    console.log("[deletarLivro] Livro deletado com sucesso:", resultado);

    alert("Livro deletado com sucesso!");

    // Redireciona para biblioteca apÃ³s deletar
    setTimeout(() => {
      window.location.href = "/frontend/src/pages/biblioteca.html";
    }, 500);
  } catch (erro) {
    console.error("[deletarLivro] Erro ao deletar livro:", erro);
    alert("Erro ao deletar livro: " + erro.message);
  }
}

// Carrega dados na pÃ¡gina de informaÃ§Ãµes
async function carregarDadosLivroInformacoes() {
  try {
    const livroId = localStorage.getItem("livroAtualId");
    if (!livroId) {
      alert("Livro nao especificado");
      return;
    }

    console.log(
      "[carregarDadosLivroInformacoes] Carregando livro ID:",
      livroId,
    );

    const response = await fetch(`http://localhost:3000/livros/${livroId}`);
    if (!response.ok) throw new Error("Erro ao buscar livro");

    const data = await response.json();
    const livro = normalizarDadosLivro(data.livro);

    livroAtualDados = livro;
    preencherVisualizacaoLivro(livro);
    preencherFormularioEdicaoLivro(livro);
    configurarPreviewCapaLivro();
    alternarModoEdicaoLivro(false);
  } catch (erro) {
    console.error("Erro ao carregar livro:", erro);
  }
}

// Carrega foto de perfil do usuÃ¡rio no header em todas as pÃ¡ginas
async function carregarFotoPerfilHeader() {
  try {
    const id = getUsuarioLogadoId();
    const token = getToken();

    // Se nÃ£o estiver logado, nÃ£o tenta carregar
    if (!id || !token) {
      return;
    }

    const response = await fetch(`http://localhost:3000/usuario/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();

    // Atualiza a imagem de perfil no header se houver foto
    if (data.usuario && data.usuario.foto_perfil) {
      const imagemHeader = document.querySelector(".info-perfil .perfil img");
      if (imagemHeader) {
        imagemHeader.src = data.usuario.foto_perfil;
        console.log(
          "[carregarFotoPerfilHeader] Foto carregada:",
          data.usuario.foto_perfil,
        );
      }

      // Se estiver na pÃ¡gina de perfil, atualizar tambÃ©m a foto principal
      const fotoMain = document.getElementById("fotoPerfilMain");
      if (fotoMain) {
        fotoMain.src = data.usuario.foto_perfil;
      }
    }
  } catch (erro) {
    console.error("Erro ao carregar foto de perfil:", erro);
  }
}

// Setup de listeners para upload de imagem
function setupImageUpload() {
  // Listener para input do header (inputFotoPerfil)
  const inputFotoPerfil = document.getElementById("inputFotoPerfil");
  if (inputFotoPerfil && !inputFotoPerfil.hasAttribute("data-listener-added")) {
    inputFotoPerfil.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
          // Atualiza foto do header
          const fotoHeader = document.querySelector(".info-perfil .perfil img");
          if (fotoHeader) {
            fotoHeader.src = event.target.result;
          }

          // Atualiza foto principal
          const fotoMain = document.getElementById("fotoPerfilMain");
          if (fotoMain) {
            fotoMain.src = event.target.result;
          }
        };
        reader.readAsDataURL(file);
      }
    });
    inputFotoPerfil.setAttribute("data-listener-added", "true");
  }

  // Listener para input da pÃ¡gina de perfil (inputFoto)
  const inputFoto = document.getElementById("inputFoto");
  if (inputFoto && !inputFoto.hasAttribute("data-listener-added")) {
    inputFoto.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
          // Atualiza foto do header
          const fotoHeader = document.querySelector(".info-perfil .perfil img");
          if (fotoHeader) {
            fotoHeader.src = event.target.result;
          }

          // Atualiza foto principal
          const fotoMain = document.getElementById("fotoPerfilMain");
          if (fotoMain) {
            fotoMain.src = event.target.result;
          }
        };
        reader.readAsDataURL(file);
      }
    });
    inputFoto.setAttribute("data-listener-added", "true");
  }
}

// Inicializa comportamentos quando a pÃ¡gina estiver pronta
window.addEventListener("DOMContentLoaded", () => {
  // Identifica qual pÃ¡gina estÃ¡ sendo carregada
  const currentPage = window.location.pathname;
  paginasCarregadas.add(currentPage);

  console.log("[DOMContentLoaded] PÃ¡gina carregada:", currentPage);

  if (currentPage.includes("/frontend/src/pages/perfil.html")) {
    carregarPerfil();
    desabilitarCampos();

    // esconder botÃµes no inÃ­cio
    const btnSalvar = document.querySelector(".btn-salvar");
    const btnCancelar = document.querySelector(".btn-cancelar");

    if (btnSalvar) btnSalvar.style.display = "none";
    if (btnCancelar) btnCancelar.style.display = "none";
  }

  // Evita carregar mais de uma vez na mesma pÃ¡gina
  if (paginasCarregadas.size > 1) {
    console.log("[DOMContentLoaded] PÃ¡gina jÃ¡ carregada, ignorando...");
    return;
  }

  initCadastroUsuario();
  initLogin();
  initRedefinirSenha();
  initCadastroLivro();
  atualizarAcessoCadastroLivro();

  if (currentPage.includes("/frontend/src/pages/perfil.html")) {
    carregarPerfil();
    desabilitarCampos();
  }

  // Apenas inicializa biblioteca se o usuÃ¡rio estiver logado (tem token)
  const token = getToken();
  const usuarioId = getUsuarioLogadoId();

  console.log("[DOMContentLoaded] Verificando biblioteca com:", {
    temToken: !!token,
    usuarioId,
  });

  if (token && usuarioId) {
    console.log("[DOMContentLoaded] Inicializando biblioteca grid...");
    initBibliotecaGrid();
  } else {
    console.warn("[DOMContentLoaded] UsuÃ¡rio nÃ£o logado ou token ausente!");
  }

  // Carrega dados da pÃ¡gina de avaliaÃ§Ã£o
  if (currentPage.includes("/frontend/src/pages/Avaliacao.html")) {
    carregarDadosLivroAvaliacao();
  }

  // Carrega dados da pÃ¡gina de informaÃ§Ãµes
  if (currentPage.includes("/frontend/src/pages/informacoes.html")) {
    carregarDadosLivroInformacoes();
  }

  // Carrega foto de perfil
  carregarFotoPerfilHeader();

  // Setup de uploads de imagem
  setupImageUpload();
});

