//Importação ((pegar)) do modulo express
const express = require("express")
//criando uma variavel para gerenciar as rotas dos usuarios
const roteador = express.Router()

//Importando tudo que tem no arquivo de controller do usuario 
const livrosControler = require("../controllers/livrosControler")


//Crud

//C = Criar novo usuario 
//Rota para solicitar a página de cadastro
roteador.get("/cadastrar", livrosControler.livroCadastro)
//Rota para enviar dados da página de cadastro
roteador.post("/cadastrar", livrosControler.salvarLivro)



//R = Obter informações de usuarios
//Retorna as informações de todos os usuarios
roteador.get("/", livrosControler.listarLivros)
//Retorna as informações de um usuário apenas
roteador.get("/:id", livrosControler.buscarLivro)

// U = Atualizar um usuario

roteador.patch("/:id", livrosControler.atualizarLivro)

// D = Deletar um usuario

roteador.delete("/deletar/:id", livrosControler.deletarLivro)



//Criando a exportação desse arquivo 
module.exports = roteador