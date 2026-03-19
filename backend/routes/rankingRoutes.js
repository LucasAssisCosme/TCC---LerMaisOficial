const express = require("express");
const rankingController = require("../controllers/rankingController");
const autenticacao = require("../middleware/autenticacao");
const roteador = express.Router();

roteador.get("/paginometro/:id", autenticacao.verificarToken, rankingController.obterPaginometro);
roteador.get("/top", autenticacao.verificarToken, rankingController.obterTopRanking);

module.exports = roteador;
