//Importação ((pegar)) do modulo express
const express = require("express")
//criando uma variavel para gerenciar as rotas dos usuarios
const roteador = express.Router()

//Importando tudo que tem no arquivo de controller do usuario 
const livrosControler = require("../controllers/livrosControler")
const autenticacao = require("../middleware/autenticacao")
const { 
  validarCadastroLivro, 
  validarAtualizacaoLivro, 
  validarIdLivro 
} = require("../middleware/validacao")



//Crud

//C = Criar novo usuario 
//Rota para solicitar a página de cadastro
roteador.get("/cadastrar", livrosControler.livroCadastro)
//Rota para enviar dados da página de cadastro
roteador.post("/cadastrar", autenticacao.verificarToken, validarCadastroLivro, livrosControler.salvarLivro)

//R = Obter informações de usuarios
//Retorna as informações de todos os usuarios
roteador.get("/", livrosControler.listarLivros)
//Retorna as informações de um usuário apenas
roteador.get("/:id", validarIdLivro, livrosControler.buscarLivro)

// U = Atualizar um usuario

roteador.patch("/:id", autenticacao.verificarToken, validarAtualizacaoLivro, livrosControler.atualizarLivro)

roteador.post("/favorita/cadastrar", autenticacao.verificarToken, livrosControler.salvarFavorita)

roteador.get("/:livroId/favorita/:usuarioId", autenticacao.verificarToken, livrosControler.buscarFavorita)

// D = Deletar um livro

roteador.delete("/:id", autenticacao.verificarToken, validarIdLivro, livrosControler.deletarLivro)
roteador.delete("/deletar/:id", autenticacao.verificarToken, validarIdLivro, livrosControler.deletarLivro)



//Criando a exportação desse arquivo 
module.exports = roteador