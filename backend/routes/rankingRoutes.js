const express = require("express");
const rankingController = require("../controllers/rankingController");
const roteador = express.Router();

roteador.get("/paginometro/:id", rankingController.obterPaginometro);
roteador.get("/top", rankingController.obterTopRanking);

module.exports = roteador;
