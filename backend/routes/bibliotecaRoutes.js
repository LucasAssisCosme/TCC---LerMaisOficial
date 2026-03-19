const express = require("express")
const router = express.Router()

const bibliotecaController = require("../controllers/bibliotecaControler")
const autenticacao = require("../middleware/autenticacao")

router.get("/cadastrar", autenticacao.verificarToken, bibliotecaController.cadastrarStatus)

router.post("/cadastrar", autenticacao.verificarToken, bibliotecaController.salvarStatus)

router.get("/", autenticacao.verificarToken, bibliotecaController.listarTodos)

router.get("/usuario/:usuarioId", autenticacao.verificarToken, bibliotecaController.listarPorUsuario)

router.get("/:id", autenticacao.verificarToken, bibliotecaController.buscarStatus)

router.patch("/:id", autenticacao.verificarToken, bibliotecaController.atualizarStatus)

router.delete("/deletar/:id", autenticacao.verificarToken, bibliotecaController.deletarStatus)

module.exports = router