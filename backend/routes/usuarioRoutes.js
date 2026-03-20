//Importação ((pegar)) do modulo express
const express = require("express")
//criando uma variavel para gerenciar as rotas dos usuarios
const roteador = express.Router()

//Importando tudo que tem no arquivo de controller do usuario 
const usuarioControler = require("../controllers/usuarioControler")
const autenticacao = require("../middleware/autenticacao")
const { 
  validarCadastroUsuario, 
  validarLoginUsuario, 
  validarRedefinirSenha, 
  validarIdUsuario 
} = require("../middleware/validacao")

//Crud
roteador.get("/login", usuarioControler.formLogin)
//Rota para enviar dados da página de login
roteador.post("/login", validarLoginUsuario, usuarioControler.loginUsuario)
//C = Criar novo usuario 
//Rota para solicitar a página de cadastro
roteador.get("/cadastrar", usuarioControler.usuarioCadastro)
roteador.post("/cadastrar", validarCadastroUsuario, usuarioControler.salvarUsuario)
//Rota para enviar dados da página de cadastro
//Retorna as informações de todos os usuarios
roteador.get("/", autenticacao.verificarToken, usuarioControler.listarUsuarios)
//Retorna as informações de um usuário apenas

roteador.get("/:id", autenticacao.verificarToken, validarIdUsuario, usuarioControler.buscarUsuario)
//Rota mudar senha (por ID + email)
roteador.post("/esqueceuSenha/:id", validarRedefinirSenha, usuarioControler.mudarSenhaUsuario)

//Rota mudar senha (por email)
roteador.post("/esqueceuSenha", validarRedefinirSenha, usuarioControler.mudarSenhaUsuarioPorEmail)

//R = Obter informações de usuarios
//Retorna as informações de todos os usuarios

// U = Atualizar um usuario

roteador.patch("/:id", autenticacao.verificarToken, usuarioControler.atualizarUsuario)

// D = Deletar um usuario

roteador.delete("/deletar/:id", autenticacao.verificarToken, usuarioControler.deletarUsuario)



//Criando a exportação desse arquivo 
module.exports = roteador