const usuarioModels = require("../models/usuarioModels");
const autenticacao = require("../middleware/autenticacao");
const multerConfig = require("../config/multer");
const env = require("../config/env");
const path = require("path");
const fs = require("fs");

function limparArquivoTemporarioUpload(file) {
  if (!file || !file.path) {
    return;
  }

  try {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  } catch (erro) {
    console.error("[UPLOAD] Erro ao limpar arquivo temporario:", erro);
  }
}

function responderApelidoDuplicado(res, apelido, usuarioIgnoradoId = null) {
  usuarioModels.gerarSugestoesApelido(
    apelido,
    (erroSugestao, sugestoes) => {
      if (erroSugestao) {
        console.error("[APELIDO] Erro ao gerar sugestoes:", erroSugestao);
      }

      res.status(409).json({
        mensagem: "Esse username já está em uso.",
        campo: "apelido",
        sugestoes: Array.isArray(sugestoes) ? sugestoes : [],
      });
    },
    usuarioIgnoradoId,
  );
}

module.exports = {
  formLogin(req, res) {
    res.json({ titulo: "Login" });
  },

  loginUsuario(req, res) {
    const { email, senha } = req.body;

    usuarioModels.login(email, senha, (erro, logado) => {
      if (erro) {
        return res.status(500).json({ erro: "erro no servidor" });
      }

      if (!logado) {
        return res.status(401).json({ erro: "Email ou senha inválidos" });
      }

      const token = autenticacao.gerarToken(logado);
      return res.json({ message: "Bem vindo", usuario: logado, token });
    });
  },

  usuarioCadastro(req, res) {
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
      apelido,
    } = req.body;

    const tipoUsuario = "aluno";
    const apelidoLimpo = String(apelido || "").trim();

    usuarioModels.buscarPorApelido(apelidoLimpo, (erroApelido, usuarioExistente) => {
      if (erroApelido) {
        console.error("[APELIDO] Erro ao validar username:", erroApelido);
        return res.status(500).json({ mensagem: "Erro ao validar username" });
      }

      if (usuarioExistente) {
        return responderApelidoDuplicado(res, apelidoLimpo);
      }

      usuarioModels.salvar(
        {
          nome,
          email,
          senha,
          foto_perfil,
          bio,
          genero_favorito,
          tipo: tipoUsuario,
          apelido: apelidoLimpo,
        },
        (erro, novoUsuario) => {
          if (erro) {
            return res.status(500).json({ mensagem: "Erro ao salvar o usuario" });
          }

          return res.json({
            titulo: "Cadastro confirmado",
            tipo: "cadastro",
            novoUsuario,
          });
        },
      );
    });
  },

  listarUsuarios(req, res) {
    usuarioModels.listarTodos((erro, usuarios) => {
      if (erro) {
        return res.status(500).json({ mensagem: "Erro ao listar os usuarios" });
      }

      return res.json({
        titulo: "Lista de usuarios",
        usuarios,
      });
    });
  },

  buscarUsuario(req, res) {
    const id = req.params.id;

    usuarioModels.buscarPorid(id, (erro, usuario) => {
      if (erro || !usuario) {
        return res.status(500).json({ mensagem: "Erro ao buscar usuario" });
      }

      return res.json({
        titulo: "Edição",
        usuario,
      });
    });
  },

  mudarSenhaUsuario(req, res) {
    const id = req.params.id;
    const { email, novaSenha, confirmarSenha } = req.body;

    if (novaSenha !== confirmarSenha) {
      return res.status(400).json({
        mensagem: "As senhas não coincidem",
      });
    }

    usuarioModels.esqueceuSenha(email, novaSenha, id, (erro, resultado) => {
      if (erro) {
        return res.status(500).json({
          mensagem: erro.message,
        });
      }

      return res.json({
        titulo: "Nova senha confirmada",
        usuario: resultado,
      });
    });
  },

  mudarSenhaUsuarioPorEmail(req, res) {
    const { email, novaSenha, confirmarSenha } = req.body;

    if (!email || !novaSenha || !confirmarSenha) {
      return res.status(400).json({ mensagem: "Email e senhas são obrigatórios" });
    }

    if (novaSenha !== confirmarSenha) {
      return res.status(400).json({ mensagem: "As senhas não coincidem" });
    }

    usuarioModels.esqueceuSenhaPorEmail(email, novaSenha, (erro, resultado) => {
      if (erro) {
        return res.status(500).json({ mensagem: erro.message });
      }

      if (!resultado) {
        return res.status(404).json({ mensagem: "Email ou usuário não encontrado" });
      }

      return res.json({ titulo: "Nova senha confirmada", usuario: resultado });
    });
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

    const apelidoLimpo = String(apelido || "").trim();
    const dados = { nome, email, bio, genero_favorito, apelido: apelidoLimpo };

    const continuarAtualizacao = () => {
      if (req.file) {
        try {
          const caminhoTemporario = path.join(multerConfig.uploadDir, req.file.filename);
          const nomeArquivoFinal = multerConfig.verificarImagemDuplicada(caminhoTemporario);

          if (nomeArquivoFinal) {
            dados.foto_perfil = env.buildPublicPath(env.profileUploadSubdir, nomeArquivoFinal);
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

      return usuarioModels.atualizar(id, dados, (erroAtualizar, usuarioAtualizado) => {
        if (erroAtualizar) {
          console.log("[ERRO] Ao atualizar:", erroAtualizar.message);
          return res.status(500).json({ mensagem: "Erro ao atualizar usuario" });
        }

        console.log("[SUCESSO] Usuário atualizado");
        console.log("[DEBUG] dados.foto_perfil:", dados.foto_perfil);
        console.log("[DEBUG] env.publicApiBaseUrl:", env.publicApiBaseUrl);
        
        // Construir foto_url com cache-bust
        let fotoUrl = null;
        if (dados.foto_perfil) {
          // Garantir que o caminho comece com /
          const caminhoFoto = dados.foto_perfil.startsWith('/') ? dados.foto_perfil : `/${dados.foto_perfil}`;
          fotoUrl = env.buildPublicUrl(caminhoFoto);
          console.log("[DEBUG] fotoUrl gerada:", fotoUrl);
          
          // Adicionar cache-bust
          fotoUrl = fotoUrl + (fotoUrl.includes("?") ? "&" : "?") + "v=" + Date.now();
          console.log("[DEBUG] fotoUrl final com cache-bust:", fotoUrl);
        }
        
        return res.json({
          tipo: "edicao",
          titulo: "Edição confirmada",
          foto_url: fotoUrl,
          usuario: {
            ...usuarioAtualizado,
            foto_perfil: fotoUrl || usuarioAtualizado?.foto_perfil,
          },
        });
      });
    };

    if (!apelidoLimpo) {
      return continuarAtualizacao();
    }

    return usuarioModels.buscarPorApelido(apelidoLimpo, (erroApelido, usuarioExistente) => {
      if (erroApelido) {
        console.error("[APELIDO] Erro ao validar username:", erroApelido);
        limparArquivoTemporarioUpload(req.file);
        return res.status(500).json({ mensagem: "Erro ao validar username" });
      }

      if (usuarioExistente) {
        limparArquivoTemporarioUpload(req.file);
        return responderApelidoDuplicado(res, apelidoLimpo, id);
      }

      return continuarAtualizacao();
    }, id);
  },

  deletarUsuario(req, res) {
    const id = req.params.id;

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

      return res.json({
        tipo: "excluir",
        titulo: "usuario deletado",
        deletado,
      });
    });
  },

  // Obter dados do usuário logado
  obterUsuarioLogado(req, res) {
    const usuarioId = req.usuario?.id;

    if (!usuarioId) {
      return res.status(401).json({ mensagem: "Não autorizado" });
    }

    usuarioModels.buscarPorId(usuarioId, (erro, usuario) => {
      if (erro) {
        console.error("[obterUsuarioLogado] Erro:", erro);
        return res.status(500).json({ mensagem: "Erro ao obter dados do usuário" });
      }

      if (!usuario) {
        return res.status(404).json({ mensagem: "Usuário não encontrado" });
      }

      res.json({ usuario });
    });
  },

  // Listar TODOS os usuários (apenas para bibliotecários)
  listarTodosUsuarios(req, res) {
    const usuarioId = req.usuario?.id;
    const usuarioTipo = req.usuario?.tipo;

    // Verificar se é bibliotecário
    if (usuarioTipo !== "bibliotecario") {
      return res.status(403).json({ mensagem: "Acesso negado. Apenas bibliotecários podem listar usuários." });
    }

    usuarioModels.listarTodos((erro, usuarios) => {
      if (erro) {
        console.error("[listarTodosUsuarios] Erro:", erro);
        return res.status(500).json({ mensagem: "Erro ao listar usuários" });
      }

      res.json({ usuarios: usuarios || [] });
    });
  },

  // Mudar tipo de usuário (apenas para bibliotecários)
  mudarTipoUsuario(req, res) {
    const id = req.params.id;
    const { tipo } = req.body;
    const usuarioLogadoTipo = req.usuario?.tipo;

    // Verificar se é bibliotecário
    if (usuarioLogadoTipo !== "bibliotecario") {
      return res.status(403).json({ mensagem: "Acesso negado. Apenas bibliotecários podem alterar tipos de usuário." });
    }

    // Validar tipo
    if (!tipo || !["aluno", "bibliotecario"].includes(tipo)) {
      return res.status(400).json({ mensagem: "Tipo de usuário inválido" });
    }

    usuarioModels.atualizarTipo(id, tipo, (erro) => {
      if (erro) {
        console.error("[mudarTipoUsuario] Erro:", erro);
        return res.status(500).json({ mensagem: "Erro ao atualizar tipo de usuário" });
      }

      res.json({ 
        mensagem: "Tipo de usuário atualizado com sucesso",
        novoTipo: tipo 
      });
    });
  },
};
