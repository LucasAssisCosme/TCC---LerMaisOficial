const rankingModels = require("../models/rankingModels");

module.exports = {
  obterPaginometro: (req, res) => {
    const { id } = req.params;

    rankingModels.getTotalPaginasLidas(id, (erro, total) => {
      if (erro) {
        return res.status(500).json({ mensagem: erro.message });
      }

      rankingModels.getPosicaoRanking(id, (erro, posicao) => {
        if (erro) {
          return res.status(500).json({ mensagem: erro.message });
        }

        res.json({
          total_paginas: total,
          posicao_ranking: posicao
        });
      });
    });
  },

  obterTopRanking: (req, res) => {
    const limite = req.query.limite || 10;

    rankingModels.getTopRanking(limite, (erro, ranking) => {
      if (erro) {
        return res.status(500).json({ mensagem: erro.message });
      }

      // Adicionar posição ao resultado
      const rankingComPosicao = ranking.map((usuario, index) => ({
        ...usuario,
        posicao: index + 1
      }));

      res.json(rankingComPosicao);
    });
  }
};
