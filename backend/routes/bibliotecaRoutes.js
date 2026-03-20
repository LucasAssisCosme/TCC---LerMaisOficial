const express = require("express")
const router = express.Router()

const bibliotecaController = require("../controllers/bibliotecaControler")
const autenticacao = require("../middleware/autenticacao")
const { validarStatusBiblioteca } = require("../middleware/validacao")

router.get("/cadastrar", autenticacao.verificarToken, bibliotecaController.cadastrarStatus)

router.post("/cadastrar", autenticacao.verificarToken, validarStatusBiblioteca, bibliotecaController.salvarStatus)

router.get("/", autenticacao.verificarToken, bibliotecaController.listarTodos)

router.get("/usuario/:usuarioId", autenticacao.verificarToken, bibliotecaController.listarPorUsuario)

router.get("/:id", autenticacao.verificarToken, bibliotecaController.buscarStatus)

router.patch("/:id", autenticacao.verificarToken, validarStatusBiblioteca, bibliotecaController.atualizarStatus)

router.delete("/deletar/:id", autenticacao.verificarToken, bibliotecaController.deletarStatus)

module.exports = router