const resenhaModels = require("../models/resenhaModels")

module.exports = {
    resenhaCadastro(req, res) {
        res.json({ titulo: "Cadastro" })
    },
criarResenha(req, res) {

  const {
    usuario_id,
    livro_id,
    texto
  } = req.body

  resenhaModels.criarResenha(
    { usuario_id, livro_id, texto },
    (erro, resultado) => {

      if (erro) {
        return res.status(500).json({
          mensagem: "Erro ao criar resenha"
        })
      }

      res.json({
        mensagem: "Resenha criada com sucesso",
        resenha: resultado
      })
    }
  )
}, 
   listarResenhas(req, res) {

  resenhaModels.listarResenhas((erro, resultado) => {

    if (erro) {
      return res.status(500).json({
        mensagem: "Erro ao buscar resenhas"
      })
    }

    res.json({
      resenhas: resultado
    })
  })
},
   buscarResenhaPorId(req, res) {

  const id = req.params.id

  resenhaModels.buscarResenhaPorId(
    id,
    (erro, resultado) => {

      if (erro) {
        return res.status(404).json({
          mensagem: erro.message
        })
      }

      res.json({
        resenha: resultado
      })
    }
  )
},
    atualizarResenha(req, res) {

  const id = req.params.id
  const { texto } = req.body

  resenhaModels.atualizarResenha(
    id,
    texto,
    (erro, resultado) => {

      if (erro) {
        return res.status(500).json({
          mensagem: erro.message
        })
      }

      res.json({
        mensagem: "Resenha atualizada com sucesso",
        resenha: resultado
      })
    }
  )
},
   deletarResenha(req, res) {

  const id = req.params.id

  resenhaModels.deletarResenha(
    id,
    (erro, resultado) => {

      if (erro) {
        return res.status(404).json({
          mensagem: erro.message
        })
      }

      res.json({
        mensagem: "Resenha deletada com sucesso",
        resenha: resultado
      })
    }
  )
}
}