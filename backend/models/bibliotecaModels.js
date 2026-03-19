const conn = require("../config/banco")

module.exports = {

    guardar: ({ usuario_id, livro_id, progresso }, callback) => {

        const sql = `
        INSERT INTO biblioteca(usuario_id, livro_id, progresso)
        VALUES (?, ?, ?)
        `

        const valores = [usuario_id, livro_id, progresso]

        conn.query(sql, valores, (erro, resultados) => {

            if (erro) {
                return callback(erro, null)
            }

            const novoRegistro = {
                id: resultados.insertId,
                usuario_id,
                livro_id,
                progresso
            }

            callback(null, novoRegistro)
        })
    },

    listaTodos: (callback) => {

        const sql = `SELECT * FROM biblioteca`

        conn.query(sql, (erro, resultados) => {

            if (erro) {
                return callback(erro, null)
            }

            callback(null, resultados)
        })
    },

    listaPorUsuario: (usuario_id, callback) => {
        const sql = `SELECT * FROM biblioteca WHERE usuario_id = ?`

        conn.query(sql, [usuario_id], (erro, resultados) => {
            if (erro) {
                return callback(erro, null)
            }

            callback(null, resultados)
        })
    },

    listarStatusPorid: (id, callback) => {

        const sql = `SELECT * FROM biblioteca WHERE id = ?`

        const valores = [id]

        conn.query(sql, valores, (erro, resultado) => {

            if (erro) {
                return callback(erro, null)
            }

            callback(null, resultado[0] || null)
        })
    },

    atualizarProgresso: (id, progresso, callback) => {

        const sql = `
        UPDATE biblioteca SET progresso = ?
        WHERE id = ?
        `

        const valores = [progresso, id]

        conn.query(sql, valores, (erro, resultado) => {

            if (erro) {
                return callback(erro, null)
            }

            callback(null, resultado.affectedRows > 0)
        })
    },

    deletar: (id, callback) => {

        const sql = `DELETE FROM biblioteca WHERE id = ?`

        conn.query(sql, [id], (erro, resultado) => {

            if (erro) {
                return callback(erro, null)
            }

            callback(null, resultado.affectedRows > 0)
        })
    }

}