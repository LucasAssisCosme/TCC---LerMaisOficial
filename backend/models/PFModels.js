const conn = require("../config/banco")

module.exports = {

    guardar: ({ usuario_id, livro_id, trecho }, callback) => {

        const sql = `
        INSERT INTO partes_favoritas(usuario_id, livro_id, trecho)
        VALUES (?, ?, ?)
        `

        const valores = [usuario_id, livro_id, trecho]

        conn.query(sql, valores, (erro, resultados) => {

            if (erro) {
                return callback(erro, null)
            }

            const novaPF = {
                id: resultados.insertId,
                usuario_id,
                livro_id,
                trecho
            }

            callback(null, novaPF)
        })

    },

    listarTodasPF: (callback) => {

        const sql = `SELECT * FROM partes_favoritas`

        conn.query(sql, (erro, resultados) => {

            if (erro) {
                return callback(erro, null)
            }

            callback(null, resultados)

        })

    },

    buscarPFporID: (id, callback) => {

        const sql = `SELECT * FROM partes_favoritas WHERE id = ?`

        const valores = [id]

        conn.query(sql, valores, (erro, resultado) => {

            if (erro) {
                return callback(erro, null)
            }

            callback(null, resultado[0] || null)

        })

    },

    atualizarPF: (id, dados, callback) => {

        const camposValidos = {}

        Object.keys(dados).forEach(key => {
            if (dados[key] !== undefined && dados[key] !== "") {
                camposValidos[key] = dados[key]
            }
        })

        if (Object.keys(camposValidos).length === 0) {
            return callback(new Error("Nenhum campo válido para atualizar"), null)
        }

        const setClause = Object.keys(camposValidos)
            .map(key => `${key} = ?`)
            .join(", ")

        const valores = Object.values(camposValidos)

        valores.push(id)

        const sql = `UPDATE partes_favoritas SET ${setClause} WHERE id = ?`

        conn.query(sql, valores, (erro, resultado) => {

            if (erro) {
                return callback(erro, null)
            }

            callback(null, { id, ...camposValidos })

        })

    },

    deletarPF: (id, callback) => {

        const sql = `DELETE FROM partes_favoritas WHERE id = ?`

        const valor = [id]

        conn.query(sql, valor, (erro, resultado) => {

            if (erro) {
                return callback(erro, null)
            }

            callback(null, resultado.affectedRows > 0)

        })

    }

}