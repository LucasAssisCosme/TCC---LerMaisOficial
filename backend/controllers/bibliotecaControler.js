const bibliotecaModels = require("../models/bibliotecaModels")

module.exports = {

    cadastrarStatus(req, res){
        res.json({ titulo: "Cadastro de status" })
    },

    salvarStatus(req, res) {

        const { usuario_id, livro_id, progresso } = req.body

        console.log('[Biblioteca] Tentando salvar status:', { usuario_id, livro_id, progresso });

        // Validar dados
        if (!usuario_id || !livro_id || !progresso) {
            console.error('[Biblioteca] Dados incompletos:', { usuario_id, livro_id, progresso });
            return res.status(400).json({ mensagem: "usuario_id, livro_id e progresso são obrigatórios" })
        }

        if (!['lido', 'lendo', 'quero_ler'].includes(progresso)) {
            console.error('[Biblioteca] Progresso inválido:', progresso);
            return res.status(400).json({ mensagem: "Progresso deve ser: lido, lendo ou quero_ler" })
        }

        bibliotecaModels.guardar({ usuario_id, livro_id, progresso }, (erro, novoStatus) => {

            if (erro) {
                console.error('[Biblioteca] Erro ao salvar:', erro.message || erro.sqlMessage || erro);
                
                // Verifica se é erro de violação de constraint (livro já adicionado)
                if (erro.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ mensagem: "Este livro já está na sua biblioteca" })
                }
                
                return res.status(500).json({ mensagem: "Erro ao salvar status", erro: erro.message })
            }

            console.log('[Biblioteca] Status salvo com sucesso:', novoStatus);
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
                titulo: "Livros do usuário",
                status: status
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