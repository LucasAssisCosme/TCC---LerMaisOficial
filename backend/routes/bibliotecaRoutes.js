const express = require("express")
const router = express.Router()

const bibliotecaController = require("../controllers/bibliotecaControler")

router.get("/cadastrar", bibliotecaController.cadastrarStatus)

router.post("/cadastrar", bibliotecaController.salvarStatus)

router.get("/", bibliotecaController.listarTodos)

router.get("/:id", bibliotecaController.buscarStatus)

router.patch("/:id", bibliotecaController.atualizarStatus)

router.delete("/deletar/:id", bibliotecaController.deletarStatus)

module.exports = router