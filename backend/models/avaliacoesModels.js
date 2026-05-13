const conn = require("../config/banco")

module.exports = {

    guardar: ({ usuario_id, livro_id, estrelas }, callback) => {

        const sql = `
        INSERT INTO avaliacoes(usuario_id, livro_id, estrelas)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
            id = LAST_INSERT_ID(id),
            estrelas = VALUES(estrelas)
        `

        const valores = [usuario_id, livro_id, estrelas]

        conn.query(sql, valores, (erro, resultados) => {

            if (erro) {
                return callback(erro, null)
            }

            const avaliacaoSalva = {
                id: resultados.insertId,
                usuario_id,
                livro_id,
                estrelas
            }

            callback(null, avaliacaoSalva)
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

    listarPublicasPorLivro: (livroId, callback) => {

        const sql = `
        SELECT
            avaliacoes.id,
            avaliacoes.usuario_id,
            avaliacoes.livro_id,
            avaliacoes.estrelas,
            usuarios.nome AS usuario_nome,
            usuarios.apelido AS usuario_apelido,
            usuarios.foto_perfil,
            resenha_atual.texto AS resenha,
            favorita_atual.trecho AS parte_favorita
        FROM avaliacoes
        JOIN usuarios
            ON usuarios.id = avaliacoes.usuario_id
        LEFT JOIN (
            SELECT resenha.id, resenha.usuario_id, resenha.livro_id, resenha.texto
            FROM resenha
            INNER JOIN (
                SELECT usuario_id, livro_id, MAX(id) AS id_mais_recente
                FROM resenha
                GROUP BY usuario_id, livro_id
            ) resenha_mais_recente
                ON resenha.id = resenha_mais_recente.id_mais_recente
        ) resenha_atual
            ON resenha_atual.usuario_id = avaliacoes.usuario_id
            AND resenha_atual.livro_id = avaliacoes.livro_id
        LEFT JOIN (
            SELECT partes_favoritas.id, partes_favoritas.usuario_id, partes_favoritas.livro_id, partes_favoritas.trecho
            FROM partes_favoritas
            INNER JOIN (
                SELECT usuario_id, livro_id, MAX(id) AS id_mais_recente
                FROM partes_favoritas
                GROUP BY usuario_id, livro_id
            ) favorita_mais_recente
                ON partes_favoritas.id = favorita_mais_recente.id_mais_recente
        ) favorita_atual
            ON favorita_atual.usuario_id = avaliacoes.usuario_id
            AND favorita_atual.livro_id = avaliacoes.livro_id
        WHERE avaliacoes.livro_id = ?
        ORDER BY avaliacoes.id DESC
        `

        conn.query(sql, [livroId], (erro, resultado) => {

            if (erro) {
                return callback(erro, null)
            }

            callback(null, resultado)
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
