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

// Inicializa comportamentos quando a página estiver pronta
window.addEventListener('DOMContentLoaded', () => {
  initCadastroUsuario();
  initLogin();
  initRedefinirSenha();
buscarUsuarios()
})