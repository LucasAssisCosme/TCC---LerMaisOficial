const usuarioModels = require("../models/usuarioModels");
const autenticacao = require("../middleware/autenticacao");
const multerConfig = require("../config/multer");
const path = require('path');
const fs = require('fs');

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
        const token = autenticacao.gerarToken(logado);
        res.json({ message: "Bem vindo", usuario: logado, token });
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
    const tipoUsuario = ['aluno', 'bibliotecaria'].includes(tipo) ? tipo : 'aluno';

    //Manda as informações para o model
    usuarioModels.salvar(
      { nome, email, senha, foto_perfil, bio, genero_favorito, tipo: tipoUsuario, apelido },
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

mudarSenhaUsuarioPorEmail(req, res) {
  const { email, novaSenha, confirmarSenha } = req.body

  if (!email || !novaSenha || !confirmarSenha) {
    return res.status(400).json({ mensagem: "Email e senhas são obrigatórios" })
  }

  if (novaSenha !== confirmarSenha) {
    return res.status(400).json({ mensagem: "As senhas não coincidem" })
  }

  usuarioModels.esqueceuSenhaPorEmail(email, novaSenha, (erro, resultado) => {
    if (erro) {
      return res.status(500).json({ mensagem: erro.message })
    }

    if (!resultado) {
      return res.status(404).json({ mensagem: "Email ou usuário não encontrado" })
    }

    res.json({ titulo: "Nova senha confirmada", usuario: resultado })
  })
},

  atualizarUsuario(req, res) {
    const id = req.params.id;
    const {
      nome,
      email,
      bio,
      genero_favorito,
      apelido,
    } = req.body;

    console.log("[ATUALIZAR] ID:", id);
    console.log("[ATUALIZAR] Req.body:", req.body);
    console.log("[ATUALIZAR] Req.file:", req.file);

    // Preparar dados para atualização
    const dados = { nome, email, bio, genero_favorito, apelido };
    
    // Se houver arquivo, verificar se é duplicado antes de adicionar
    if (req.file) {
      try {
        // Verificar se imagem duplicada já existe
        const caminhoTemporario = path.join(multerConfig.uploadDir, req.file.filename);
        const nomeArquivoFinal = multerConfig.verificarImagemDuplicada(caminhoTemporario);
        
        if (nomeArquivoFinal) {
          dados.foto_perfil = `/backend/uploads/perfis/${nomeArquivoFinal}`;
          console.log("[ATUALIZAR] Arquivo (verificado de duplicatas):", dados.foto_perfil);
        } else {
          console.error("[ATUALIZAR] Erro ao verificar duplicatas");
          return res.status(500).json({ mensagem: "Erro ao processar imagem" });
        }
      } catch (erro) {
        console.error("[ATUALIZAR] Erro ao processar arquivo:", erro);
        return res.status(500).json({ mensagem: "Erro ao processar arquivo" });
      }
    }

    usuarioModels.atualizar(id, dados, (erro) => {
      if (erro) {
        console.log("[ERRO] Ao atualizar:", erro.message);
        return res.status(500).json({ mensagem: "Erro ao atualizar usuario" });
      }

      console.log("[SUCESSO] Usuário atualizado");
      res.json({
        tipo: "edicao",
        titulo: "Edição confirmada",
        foto_url: dados.foto_perfil ? `${req.protocol}://${req.get('host')}${dados.foto_perfil}` : null
      });
    });
  },
  deletarUsuario(req, res) {
    const id = req.params.id;

    //Acessar model e solicitar a exclusão do usuario
    usuarioModels.deletar(id, (erro, sucesso) => {
      if (erro) {
        console.error("[deletarUsuario] Erro ao deletar usuario:", erro);
        return res
          .status(500)
          .json({ mensagem: "Erro ao deletar usuario", erro: erro.message });
      }

      if (!sucesso) {
        return res.status(404).json({ mensagem: "Usuario nao encontrado" });
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
