const avaliacoesModels = require("../models/avaliacoesModels")

module.exports = {
     
    cadastrarAvaliacao(req, res){
        res.json({ titulo: "Cadastro de avaliação" })
    },

    salvarAvaliacao(req, res) {

        const { usuario_id, livro_id, estrelas } = req.body

        avaliacoesModels.guardar({ usuario_id, livro_id, estrelas }, (erro, novaAvaliacao) => {

            if (erro) {
                return res.status(500).json({ mensagem: "Erro ao salvar avaliação" })
            }

            res.json({
                titulo: "Avaliação salva",
                novaAvaliacao
            })
        })
    },

    listarTodas(req, res) {

        avaliacoesModels.listaTodos((erro, avaliacoes) => {

            if (erro) {
                return res.status(500).json({ mensagem: "Erro ao listar avaliações" })
            }

            res.json({
                titulo: "Lista de avaliações",
                avaliacoes
            })
        })
    },

    buscarAvaliacao(req, res) {

        const id = req.params.id

        avaliacoesModels.listarPorId(id, (erro, avaliacao) => {

            if (erro || !avaliacao) {
                return res.status(500).json({ mensagem: "Erro ao buscar avaliação" })
            }

            res.json({
                titulo: "Avaliação encontrada",
                avaliacao
            })
        })
    },

    buscarAvaliacaoPorUsuarioLivro(req, res) {
        const { usuarioId, livroId } = req.params

        avaliacoesModels.buscarPorUsuarioLivro(usuarioId, livroId, (erro, avaliacao) => {
            if (erro) {
                return res.status(500).json({ mensagem: "Erro ao buscar avaliação" })
            }

            res.json({
                titulo: "Avaliação encontrada",
                avaliacao: avaliacao || null
            })
        })
    },

    listarPublicasPorLivro(req, res) {
        const { livroId } = req.params

        avaliacoesModels.listarPublicasPorLivro(livroId, (erro, avaliacoes) => {
            if (erro) {
                return res.status(500).json({ mensagem: "Erro ao buscar avaliações públicas" })
            }

            res.json({
                titulo: "Avaliações públicas do livro",
                avaliacoes: avaliacoes || []
            })
        })
    },

    atualizarAvaliacao(req, res) {

        const id = req.params.id
        const { estrelas } = req.body

        avaliacoesModels.atualizar(id, estrelas, (erro) => {

            if (erro) {
                return res.status(500).json({ mensagem: "Erro ao atualizar avaliação" })
            }

            res.json({
                titulo: "Avaliação atualizada"
            })
        })
    },

    deletarAvaliacao(req, res) {

        const id = req.params.id

        avaliacoesModels.deletar(id, (erro, sucesso) => {

            if (erro || !sucesso) {
                return res.status(500).json({ mensagem: "Erro ao deletar avaliação" })
            }

            res.json({
                titulo: "Avaliação deletada"
            })
        })
    }

}
