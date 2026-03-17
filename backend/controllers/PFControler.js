const PFModels = require("../models/PFModels")

module.exports = {

    parteFavoritaCadastro(req, res) {
        res.json({ titulo: "Cadastro Parte Favorita" })
    },

    salvarPF(req, res) {

        const { usuario_id, livro_id, trecho } = req.body

        PFModels.guardar({ usuario_id, livro_id, trecho }, (erro, novaPF) => {

            if (erro) {
                console.error("falha ao inserir parte favorita:", erro.sqlMessage)
                return res.status(500).json({ mensagem: "Erro ao salvar parte favorita" })
            }

            res.json({
                titulo: "Cadastro confirmado",
                tipo: "cadastro",
                novaPF
            })

        })

    },

    listarPF(req, res) {

        PFModels.listarTodasPF((erro, partes) => {

            if (erro) {
                return res.status(500).json({ mensagem: "Erro ao ver lista de partes favoritas" })
            }

            res.json({
                titulo: "Lista partes favoritas",
                partes
            })

        })

    },

    buscarPF(req, res) {

        const id = req.params.id

        PFModels.buscarPFporID(id, (erro, parte) => {

            if (erro || !parte) {
                return res.status(500).json({ mensagem: "Erro ao buscar parte favorita" })
            }

            res.json({
                titulo: "Edição",
                parte
            })

        })

    },

    atualizarPF(req, res) {

        const id = req.params.id
        const { trecho } = req.body

        PFModels.atualizarPF(id, { trecho }, (erro) => {

            if (erro) {
                return res.status(500).json({ mensagem: "Erro ao atualizar parte favorita" })
            }

            res.json({
                tipo: "edicao",
                titulo: "Edição confirmada"
            })

        })

    },

    deletarPF(req, res) {

        const id = req.params.id

        PFModels.deletarPF(id, (erro, sucesso) => {

            if (erro || !sucesso) {
                return res.status(500).json({ mensagem: "Erro ao deletar parte favorita" })
            }

            const deletado = { parte_favorita: "Selecionada" }

            res.json({
                tipo: "excluir",
                titulo: "Parte favorita deletada",
                deletado
            })

        })

    }

}