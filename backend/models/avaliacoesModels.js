const conn = require("../config/banco")

module.exports = {

    guardar: ({ usuario_id, livro_id, estrelas }, callback) => {

        const sql = `
        INSERT INTO avaliacoes(usuario_id, livro_id, estrelas)
        VALUES (?, ?, ?)
        `

        const valores = [usuario_id, livro_id, estrelas]

        conn.query(sql, valores, (erro, resultados) => {

            if (erro) {
                return callback(erro, null)
            }

            const novaAvaliacao = {
                id: resultados.insertId,
                usuario_id,
                livro_id,
                estrelas
            }

            callback(null, novaAvaliacao)
        })
    },

    listaTodos: (callback) => {

        const sql = `SELECT * FROM avaliacoes`

        conn.query(sql, (erro, resultados) => {

            if (erro) {
                return callback(erro, null)
            }

            callback(null, resultados)
        })
    },

    listarPorId: (id, callback) => {

        const sql = `SELECT * FROM avaliacoes WHERE id = ?`

        conn.query(sql, [id], (erro, resultado) => {

            if (erro) {
                return callback(erro, null)
            }

            callback(null, resultado[0] || null)
        })
    },

    buscarPorUsuarioLivro: (usuarioId, livroId, callback) => {

        const sql = `SELECT * FROM avaliacoes WHERE usuario_id = ? AND livro_id = ?`

        conn.query(sql, [usuarioId, livroId], (erro, resultado) => {

            if (erro) {
                return callback(erro, null)
            }

            callback(null, resultado[0] || null)
        })
    },

    atualizar: (id, estrelas, callback) => {

        const sql = `
        UPDATE avaliacoes SET estrelas = ?
        WHERE id = ?
        `

        conn.query(sql, [estrelas, id], (erro, resultado) => {

            if (erro) {
                return callback(erro, null)
            }

            callback(null, resultado.affectedRows > 0)
        })
    },

    deletar: (id, callback) => {

        const sql = `DELETE FROM avaliacoes WHERE id = ?`

        conn.query(sql, [id], (erro, resultado) => {

            if (erro) {
                return callback(erro, null)
            }

            callback(null, resultado.affectedRows > 0)
        })
    }

}