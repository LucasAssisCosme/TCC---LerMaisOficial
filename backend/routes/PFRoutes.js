const express = require("express")
//criando uma variavel para gerenciar as rotas dos usuarios
const roteador = express.Router()

//Importando tudo que tem no arquivo de controller do usuario 
const PFControler = require("../controllers/PFControler")


//Crud

//C = Criar novo usuario 
//Rota para solicitar a página de cadastro
roteador.get("/cadastrar", PFControler.parteFavoritaCadastro)
//Rota para enviar dados da página de cadastro
roteador.post("/cadastrar", PFControler.salvarPF)



//R = Obter informações de usuarios
//Retorna as informações de todos os usuarios
roteador.get("/", PFControler.listarPF)
//Retorna as informações de um usuário apenas
roteador.get("/:id", PFControler.buscarPF)

// U = Atualizar um usuario

roteador.patch("/:id", PFControler.atualizarPF)

// D = Deletar um usuario

roteador.delete("/deletar/:id", PFControler.deletarPF)

module.exports = roteador