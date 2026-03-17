const conn = require("../config/banco")

module.exports = {
     criarResenha: ({usuario_id, livro_id, texto}, callback) => {

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
