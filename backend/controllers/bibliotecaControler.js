const bibliotecaModels = require("../models/bibliotecaModels")

module.exports = {

    cadastrarStatus(req, res){
        res.json({ titulo: "Cadastro de status" })
    },

    salvarStatus(req, res) {

        const { usuario_id, livro_id, progresso } = req.body

        bibliotecaModels.guardar({ usuario_id, livro_id, progresso }, (erro, novoStatus) => {

            if (erro) {
                return res.status(500).json({ mensagem: "Erro ao salvar status" })
            }

            res.json({
                titulo: "Status salvo",
                novoStatus
            })
        })
    },

    listarTodos(req, res) {

        bibliotecaModels.listaTodos((erro, status) => {

            if (erro) {
                return res.status(500).json({ mensagem: "Erro ao listar biblioteca" })
            }

            res.json({
                titulo: "Todos os status",
                status
            })
        })
    },

    listarPorUsuario(req, res) {
        const usuarioId = req.params.usuarioId;

        bibliotecaModels.listaPorUsuario(usuarioId, (erro, status) => {
            if (erro) {
                return res.status(500).json({ mensagem: "Erro ao listar biblioteca do usuário" })
            }

            res.json({
                titulo: "Status do usuário",
                status
            })
        })
    },

    buscarStatus(req, res) {

        const id = req.params.id

        bibliotecaModels.listarStatusPorid(id, (erro, status) => {

            if (erro || !status) {
                return res.status(500).json({ mensagem: "Erro ao buscar status" })
            }

            res.json({
                titulo: "Status encontrado",
                status
            })
        })
    },

    atualizarStatus(req, res) {

        const id = req.params.id
        const { progresso } = req.body

        bibliotecaModels.atualizarProgresso(id, progresso, (erro) => {

            if (erro) {
                return res.status(500).json({ mensagem: "Erro ao atualizar status" })
            }

            res.json({
                titulo: "Status atualizado"
            })
        })
    },

    deletarStatus(req, res) {

        const id = req.params.id

        bibliotecaModels.deletar(id, (erro, sucesso) => {

            if (erro || !sucesso) {
                return res.status(500).json({ mensagem: "Erro ao deletar status" })
            }

            res.json({
                titulo: "Status deletado"
            })
        })
    }

}