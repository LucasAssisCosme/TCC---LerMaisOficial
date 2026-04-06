const conn = require("../config/banco")

module.exports = {
     criarResenha: ({usuario_id, livro_id, texto}, callback) => {

  const sqlBuscarExistente = `
    SELECT id
    FROM resenha
    WHERE usuario_id = ? AND livro_id = ?
    ORDER BY id DESC
    LIMIT 1
  `

  conn.query(sqlBuscarExistente, [usuario_id, livro_id], (erroBusca, resultadoBusca) => {

    if (erroBusca) {
      return callback(erroBusca, null)
    }

    if (resultadoBusca.length > 0) {
      const idExistente = resultadoBusca[0].id
      const sqlAtualizar = `UPDATE resenha SET texto = ? WHERE id = ?`

      conn.query(sqlAtualizar, [texto, idExistente], (erroAtualizar) => {
        if (erroAtualizar) {
          return callback(erroAtualizar, null)
        }

        callback(null, {
          id: idExistente,
          usuario_id,
          livro_id,
          texto
        })
      })

      return
    }

    const sql = `INSERT INTO resenha (usuario_id, livro_id, texto) VALUES (?, ?, ?)`
    const valores = [usuario_id, livro_id, texto]

    conn.query(sql, valores, (erro, resultado) => {

      if (erro) {
        return callback(erro, null)
      }

      const novaResenha = {
        id: resultado.insertId,
        usuario_id,
        livro_id,
        texto
      }

      callback(null, novaResenha)
    })
  })
},
     //Busca todos os produtos pelo banco
    listarResenhas: (callback) => {

  const sql = `
  SELECT 
  resenha.id,
  usuarios.nome AS usuario,
  livros.titulo AS livro,
  resenha.texto
  FROM resenha
  JOIN usuarios ON resenha.usuario_id = usuarios.id
  JOIN livros ON resenha.livro_id = livros.id
  `

  conn.query(sql, (erro, resultado) => {

    if (erro) {
      return callback(erro, null)
    }

    callback(null, resultado)
  })
},
     //Buscar usuario especifico pelo banco
   buscarResenhaPorId: (id, callback) => {

  const sql = `
  SELECT 
  resenha.id,
  usuarios.nome AS usuario,
  livros.titulo AS livro,
  resenha.texto
  FROM resenha
  JOIN usuarios ON resenha.usuario_id = usuarios.id
  JOIN livros ON resenha.livro_id = livros.id
  WHERE resenha.id = ?
  `

  conn.query(sql, [id], (erro, resultado) => {

    if (erro) {
      return callback(erro, null)
    }

    if (resultado.length === 0) {
      return callback(new Error("Resenha não encontrada"), null)
    }

    callback(null, resultado[0])
  })
},
buscarResenhaPorUsuarioLivro: (usuarioId, livroId, callback) => {

  const sql = `
    SELECT *
    FROM resenha
    WHERE usuario_id = ? AND livro_id = ?
    ORDER BY id DESC
    LIMIT 1
  `

  conn.query(sql, [usuarioId, livroId], (erro, resultado) => {

    if (erro) {
      return callback(erro, null)
    }

    callback(null, resultado[0] || null)
  })
},
atualizarResenha: (id, texto, callback) => {

  const sql = `UPDATE resenha SET texto = ? WHERE id = ?`
  const valores = [texto, id]

  conn.query(sql, valores, (erro, resultado) => {

    if (erro) {
      return callback(erro, null)
    }

    if (resultado.affectedRows === 0) {
      return callback(new Error("Resenha não encontrada"), null)
    }

    const resenhaAtualizada = {
      id,
      texto
    }

    callback(null, resenhaAtualizada)
  })
}, 
      deletarResenha: (id, callback) => {

  const sql = `DELETE FROM resenha WHERE id = ?`

  conn.query(sql, [id], (erro, resultado) => {

    if (erro) {
      return callback(erro, null)
    }

    if (resultado.affectedRows === 0) {
      return callback(new Error("Resenha não encontrada"), null)
    }

    callback(null, { id })
  })
}
}
