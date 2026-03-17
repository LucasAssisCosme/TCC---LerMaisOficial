const usuarioModels = require("../models/usuarioModels");

module.exports = {
  formLogin(req, res) {
    res.json({ titulo: "Login" });
  },

  loginUsuario(req, res) {
    const { email, senha } = req.body;
    // Manda as informações do objeto para o model
    usuarioModels.login(email, senha, (erro, logado) => {
      if (erro) {
        return res.status(500).json({ erro: "erro no servidor" });
      }
      // Se não conseguiu logar, manda uma mensagem de erro
      if (!logado) {
        res.status(401).json({ erro: "Email ou senha inválidos" });
      }
      // Se conseguiu manda uma mensagem de confirmação
      else {
        res.json({ message: "Bem vindo", usuario: logado.nome });
      }
    });
  },

  usuarioCadastro(req, res) {
    //Reenderiza a pagina de cadastro
    res.json({ titulo: "Cadastro" });
  },
  salvarUsuario(req, res) {
    const {
      nome,
      email,
      senha,
      foto_perfil,
      bio,
      genero_favorito,
      tipo,
      apelido,
    } = req.body;

    //Manda as informações para o model
    usuarioModels.salvar(
      { nome, email, senha, foto_perfil, bio, genero_favorito, tipo, apelido },
      (erro, novoUsuario) => {
        //se deu erro, renderiza a mensagem de erro mostrando a mensagem
        if (erro) {
          return res.status(500).json({ mensagem: "Erro ao salvar o usuario" });
        }

        //Se deu certo renderiza a pagina de confirmação
        res.json({
          titulo: "Cadastro confirmado",
          tipo: "cadastro",
          novoUsuario,
        });
      },
    );
  },

  
  listarUsuarios(req, res) {
    //Acessar o model e resgatar as informações
    usuarioModels.listarTodos((erro, usuarios) => {
      if (erro) {
        return res.status(500).json({ mensagem: "Erro ao listar os usuarios" });
      }
      //Se deu certo, renderizar a pagina de lista usuarios
      res.json({
        titulo: "Lista de usuarios",
        usuarios,
      });
    });
  },
  buscarUsuario(req, res) {
    //Buscar id como parametro url
    const id = req.params.id;

    //Acessar model para realizar busca
    usuarioModels.buscarPorid(id, (erro, usuario) => {
      //Se deu erro na busca, informar
      //ou se não achou usuario
      if (erro || !usuario) {
        return res.status(500).json({ mensagem: "Erro ao buscar usuario" });
      }

      // Se achou usuario, renderiza pagina de ediçõa
      res.json({
        titulo: "Edição",
        usuario,
      });

      // res.json(req.body)
    });
  },
mudarSenhaUsuario(req, res) {

  const id = req.params.id

  const {
    email,
    novaSenha,
    confirmarSenha
  } = req.body

  // verifica se as senhas são iguais
  if (novaSenha !== confirmarSenha) {
    return res.status(400).json({
      mensagem: "As senhas não coincidem"
    })
  }

  usuarioModels.esqueceuSenha(
    email,
    novaSenha,
    id,
    (erro, resultado) => {

      if (erro) {
        return res.status(500).json({
          mensagem: erro.message
        })
      }

      res.json({
        titulo: "Nova senha confirmada",
        usuario: resultado
      })
    }
  )
},

  atualizarUsuario(req, res) {
    const id = req.params.id;
    const {
      nome,
      email,
      senha,
      foto_perfil,
      bio,
      genero_favorito,
      tipo,
      apelido,
    } = req.body;

    usuarioModels.atualizar(
      id,
      { nome, email, senha, foto_perfil, bio, genero_favorito, tipo, apelido },
      (erro) => {
        if (erro) {
          return res
            .status(500)
            .json({ mensagem: "Erro ao atualizar usuario" });
        }

        res.json({
          tipo: "edicao",
          titulo: "Edição confirmada",
        });
      },
    );
  },
  deletarUsuario(req, res) {
    const id = req.params.id;

    //Acessar model e solicitar a exclusão do usuario
    usuarioModels.deletar(id, (erro, sucesso) => {
      if (erro || !sucesso) {
        return res.status(500).json({ mensagem: "Erro ao deletar usuario" });
      }

      const deletado = { usuario: "Selecionado" };
      //Renderiza a tela de sucesso
      res.json({
        tipo: "excluir",
        titulo: "usuario deletado",
        deletado,
      });
    });
  },
};
