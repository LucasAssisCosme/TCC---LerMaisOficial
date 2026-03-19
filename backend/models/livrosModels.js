const conn = require("../config/banco")

module.exports = {
     guardar: ({titulo, autor, genero, ano, numero_paginas, descricao, imagem_capa, editora}, callback) => {
           //Tem fallback de capa também no backend
         const capaPadrao = 'https://gabrielchalita.com.br/wp-content/uploads/2019/12/semcapa.png';
         const capaFinal = imagem_capa && imagem_capa.toString().trim() ? imagem_capa : capaPadrao;

         //Variavel que guarda consulta sql
         const sql = `INSERT INTO livros(titulo, autor, genero, ano, numero_paginas, descricao, imagem_capa, editora)
         VALUES(?, ?, ?, ?, ?,?, ?, ?)`

         const valores = [titulo, autor, genero, ano, numero_paginas, descricao, capaFinal, editora]

          conn.query( sql, valores, (erro, resultados) => {
          if(erro){
          return callback(erro, null)
        }

        const novoProduto = { id:resultados.insertId, titulo, autor, genero, ano, numero_paginas, descricao, imagem_capa, editora }

        callback(null, novoProduto)
     } )
     },
     //Busca todos os produtos pelo banco
     listarGeral: (callback) => {
       //Variavel sql que guarda a consulta desejada
          const sql = `SELECT * FROM livros`

           //Executar o comando no banco
        conn.query(sql, (erro, resultados) => {
          if(erro){
            return callback(erro, null)
          }
          callback(null, resultados)
        })

     },
     //Buscar usuario especifico pelo banco
    irPorid: (id, callback) => {
  const sql = `SELECT * FROM livros WHERE id = ?`
  const valores = [ id ]
  
  conn.query(sql, valores, (erro, resultado) => {
    
    if(erro){
      return callback(erro, null)
    }
    callback(null, resultado[0] || null)
  })
},

Renovar: (id, dados, callback) => {  // Ou renomeie para atualizar
  // Filtrar apenas campos com valores válidos
  const camposValidos = {};
  Object.keys(dados).forEach(key => {
    if (dados[key] !== undefined && dados[key] !== '') {
      camposValidos[key] = dados[key];
    }
  });

  if (Object.keys(camposValidos).length === 0) {
    return callback(new Error('Nenhum campo válido para atualizar'), null);
  }

  const setClause = Object.keys(camposValidos).map(key => `${key} = ?`).join(', ');
  const valores = Object.values(camposValidos);
  valores.push(id);

  const sql = `UPDATE livros SET ${setClause} WHERE id = ?`;

  conn.query(sql, valores, (erro, resultado) => {
    if (erro) {
      return callback(erro, null);
    }
    callback(null, { id, ...camposValidos });
  });
},      atualizarImagemCapaPadrao: (ids, capaPadrao, callback) => {
          if (!Array.isArray(ids) || ids.length === 0) {
              return callback(null, null);
          }

          const sql = `UPDATE livros SET imagem_capa = ? WHERE id IN (?)`;
          conn.query(sql, [capaPadrao, ids], (erro, resultado) => {
              if (erro) {
                  return callback(erro, null);
              }
              callback(null, resultado);
          });
      },
      deletar: (id, callback) => {
            //Variavel sql que guarda a consulta desejada
                 const sql = `DELETE FROM livros WHERE id = ?`
                 const valor = [id]
             //Executar o comando no banco
             conn.query(sql, valor, (erro, resultado) => {
                          if(erro){
                            return callback(erro, null)
                          }
                          callback(null, resultado.affectedRows > 0)
             })
      }
}

