const express = require("express")
const router = express.Router()

const avaliacoesController = require("../controllers/avaliacoesControler")
const autenticacao = require("../middleware/autenticacao")
const { validarAvaliacao, validarIdLivro } = require("../middleware/validacao")

router.get("/cadastrar", autenticacao.verificarToken, avaliacoesController.cadastrarAvaliacao)

router.post("/cadastrar", autenticacao.verificarToken, validarAvaliacao, avaliacoesController.salvarAvaliacao)

router.get("/", avaliacoesController.listarTodas)

router.get("/:id", validarIdLivro, avaliacoesController.buscarAvaliacao)

router.patch("/:id", autenticacao.verificarToken, validarAvaliacao, avaliacoesController.atualizarAvaliacao)

router.get("/usuario/:usuarioId/livro/:livroId", autenticacao.verificarToken, avaliacoesController.buscarAvaliacaoPorUsuarioLivro)

router.delete("/deletar/:id", autenticacao.verificarToken, validarIdLivro, avaliacoesController.deletarAvaliacao)

module.exports = router