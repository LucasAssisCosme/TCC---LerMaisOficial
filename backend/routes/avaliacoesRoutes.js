const express = require("express")
const router = express.Router()

const avaliacoesController = require("../controllers/avaliacoesControler")

router.get("/cadastrar", avaliacoesController.cadastrarAvaliacao)

router.post("/cadastrar", avaliacoesController.salvarAvaliacao)

router.get("/", avaliacoesController.listarTodas)

router.get("/:id", avaliacoesController.buscarAvaliacao)

router.patch("/:id", avaliacoesController.atualizarAvaliacao)

router.delete("/deletar/:id", avaliacoesController.deletarAvaliacao)

module.exports = router