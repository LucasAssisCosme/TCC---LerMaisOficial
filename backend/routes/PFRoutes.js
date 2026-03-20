const express = require("express")
//criando uma variavel para gerenciar as rotas dos usuarios
const roteador = express.Router()

//Importando tudo que tem no arquivo de controller do usuario 
const PFControler = require("../controllers/PFControler")
const autenticacao = require("../middleware/autenticacao")
const { validarCadastroPF, validarAtualizacaoPF } = require("../middleware/validacao")


//Crud

//C = Criar novo usuario 
//Rota para solicitar a página de cadastro
roteador.get("/cadastrar", autenticacao.verificarToken, PFControler.parteFavoritaCadastro)
//Rota para enviar dados da página de cadastro
roteador.post("/cadastrar", autenticacao.verificarToken, validarCadastroPF, PFControler.salvarPF)



//R = Obter informações de usuarios
//Retorna as informações de todos os usuarios
roteador.get("/", autenticacao.verificarToken, PFControler.listarPF)
//Retorna as informações de um usuário apenas
roteador.get("/:id", autenticacao.verificarToken, PFControler.buscarPF)

// U = Atualizar um usuario

roteador.patch("/:id", autenticacao.verificarToken, validarAtualizacaoPF, PFControler.atualizarPF)

// D = Deletar um usuario

roteador.delete("/deletar/:id", autenticacao.verificarToken, PFControler.deletarPF)

module.exports = roteador