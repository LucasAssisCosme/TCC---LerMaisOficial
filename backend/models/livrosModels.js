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
  // Lista de colunas permitidas para atualização
  const colunasPermitidas = ['titulo', 'autor', 'genero', 'ano', 'numero_paginas', 'descricao', 'editora'];
  
  // Filtrar apenas campos com valores válidos e permitidos
  const camposValidos = {};
  Object.keys(dados).forEach(key => {
    // ✅ Validar se coluna está na whitelist
    if (colunasPermitidas.includes(key) && dados[key] !== undefined && dados[key] !== '') {
      camposValidos[key] = dados[key];
    }
  });

  if (Object.keys(camposValidos).length === 0) {
    return callback(new Error('Nenhum campo válido para atualizar'), null);
  }

  // Construir dinamicamente apenas com colunas validadas
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
            // Deletar em cascata respeitando as foreign keys
            const sqlDeleteFavoritas = `DELETE FROM partes_favoritas WHERE livro_id = ?`;
            const sqlDeleteResenha = `DELETE FROM resenha WHERE livro_id = ?`;
            const sqlDeleteAvaliacoes = `DELETE FROM avaliacoes WHERE livro_id = ?`;
            const sqlDeleteBiblioteca = `DELETE FROM biblioteca WHERE livro_id = ?`;
            const sqlDeleteLivro = `DELETE FROM livros WHERE id = ?`;

            // Executar deletações em cascata
            conn.query(sqlDeleteFavoritas, [id], (erro1) => {
                  if(erro1){
                        return callback(erro1, null);
                  }

                  conn.query(sqlDeleteResenha, [id], (erro2) => {
                        if(erro2){
                              return callback(erro2, null);
                        }

                        conn.query(sqlDeleteAvaliacoes, [id], (erro3) => {
                              if(erro3){
                                    return callback(erro3, null);
                              }

                              conn.query(sqlDeleteBiblioteca, [id], (erro4) => {
                                    if(erro4){
                                          return callback(erro4, null);
                                    }

                                    // Por último, deletar o livro
                                    conn.query(sqlDeleteLivro, [id], (erro5, resultado) => {
                                          if(erro5){
                                                return callback(erro5, null);
                                          }
                                          callback(null, resultado.affectedRows > 0);
                                    });
                              });
                        });
                  });
            });
      },
      salvarFavorita: ({usuario_id, livro_id, parte_favorita}, callback) => {
            // Primeiro deleta qualquer favorita anterior
            const sqlDelete = `DELETE FROM partes_favoritas WHERE usuario_id = ? AND livro_id = ?`
            
            conn.query(sqlDelete, [usuario_id, livro_id], (erroDelete) => {

                  // Depois insere a nova
                  const sqlInsert = `INSERT INTO partes_favoritas (usuario_id, livro_id, trecho) VALUES (?, ?, ?)`
                  const valores = [usuario_id, livro_id, parte_favorita]

                  conn.query(sqlInsert, valores, (erro, resultado) => {
                        if(erro){
                              return callback(erro, null)
                        }

                        const favorita = {
                              usuario_id,
                              livro_id,
                              parte_favorita
                        }

                        callback(null, favorita)
                  })
            })
      },
      buscarFavorita: (usuarioId, livroId, callback) => {
            const sql = `SELECT id, usuario_id, livro_id, trecho as parte_favorita FROM partes_favoritas WHERE usuario_id = ? AND livro_id = ?`

            conn.query(sql, [usuarioId, livroId], (erro, resultado) => {
                  if(erro){
                        return callback(erro, null)
                  }

                  callback(null, resultado[0] || null)
            })
      }
}

