const express = require("express")
//criando uma variavel para gerenciar as rotas dos usuarios
const roteador = express.Router()

//Importando tudo que tem no arquivo de controller do usuario 
const resenhaControler = require("../controllers/resenhaControler")


//Crud

//C = Criar novo usuario 
//Rota para solicitar a página de cadastro
roteador.get("/cadastrar", resenhaControler.resenhaCadastro)
//Rota para enviar dados da página de cadastro
roteador.post("/cadastrar", resenhaControler.criarResenha)


//R = Obter informações de usuarios
//Retorna as informações de todos os usuarios
roteador.get("/", resenhaControler.listarResenhas)
//Retorna as informações de um usuário apenas
roteador.get("/:id", resenhaControler.buscarResenhaPorId)

// U = Atualizar um usuario

roteador.patch("/:id", resenhaControler.atualizarResenha)

// D = Deletar um usuario

roteador.delete("/deletar/:id", resenhaControler.deletarResenha)



//Criando a exportação desse arquivo 
module.exports = roteador