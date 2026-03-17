const conn = require("../config/banco");
const bcrypt = require('bcrypt');

module.exports = {
  login: (email, senha, callback) => {
    //Criar variavel sql que guarda a consulta
    const sql = `SELECT * FROM usuarios WHERE email = ?`;

    // Valores que serão utilizados na consulta
    const valores = [email];

    //Executar o comando no banco
    conn.query(sql, valores, (erro, resultados) => {
      //Lidar com erro
      if (erro) {
        return callback(erro, null);
      }

      if (resultados.length === 0) {
        return callback(null, null);
      }

      const usuario = resultados[0];

      // Comparar a senha fornecida com o hash armazenado
      bcrypt.compare(senha, usuario.senha, (erroCompare, resultadoCompare) => {
        if (erroCompare) {
          return callback(erroCompare, null);
        }

        if (resultadoCompare) {
          callback(null, usuario);
        } else {
          callback(null, null);
        }
      });
    });
  },

  //Criar = CREATE
  salvar: (
    { nome, email, senha, foto_perfil, bio, genero_favorito, tipo, apelido },
    callback,
  ) => {
    // Hash da senha antes de salvar
    bcrypt.hash(senha, 10, (erroHash, hash) => {
      if (erroHash) {
        return callback(erroHash, null);
      }

      //Variavel sql que guarda a consulta desejada
      const sql = `INSERT INTO usuarios (nome,email,senha,foto_perfil, bio, genero_favorito, tipo, apelido) VALUES(?,?,?,?,?,?,?,?) `;

      // Valores que serão utilizados na consulta
      const valores = [
        nome,
        email,
        hash,
        foto_perfil,
        bio,
        genero_favorito,
        tipo,
        apelido,
      ];

      conn.query(sql, valores, (erro, resultado) => {
        console.log("Valores enviados:", valores);  // Para ver os dados
        if(erro){
            console.log("Erro no insert:", erro);
            return callback(erro, null);
        }
        console.log("Resultado do insert:", resultado);  // Deve mostrar insertId
        const novoUsuario = {id: resultado.insertId, nome,email,senha: hash,foto_perfil, bio, genero_favorito, tipo, apelido};
        callback(null, novoUsuario);
      });
    });
  },
  listarTodos: (callback) => {
    //Variavel sql que guarda a consulta desejada
    const sql = `SELECT * FROM usuarios`;

    //Executar o comando no banco
    conn.query(sql, (erro, resultados) => {
      if (erro) {
        return callback(erro, null);
      }
      callback(null, resultados);
    });
  },

  //Atualizar = UPDATE
  //Buscar usuario
  buscarPorid: (id, callback) => {
    const sql = `SELECT * FROM  usuarios WHERE id = ?`;
    const valor = [id];
    conn.query(sql, valor, (erro, resultado) => {
      if (erro) {
        return callback(erro, null);
      }
      callback(null, resultado[0] || null);
    });
  },

esqueceuSenha: (email, senha, id, callback) => {
  // Hash da nova senha
  bcrypt.hash(senha, 10, (erroHash, hash) => {
    if (erroHash) {
      return callback(erroHash, null);
    }

    const sql = `UPDATE usuarios SET senha = ? WHERE id = ? AND email = ?`
    const valores = [hash, id, email]

    conn.query(sql, valores, (erro, resultado) => {

      if (erro) {
        return callback(erro, null)
      }

      if (resultado.affectedRows === 0) {
        return callback(new Error("Email ou usuário não encontrado"), null)
      }

      const usuarioAtualizado = {
        id,
        email,
        senha: hash
      }

      callback(null, usuarioAtualizado)
    })
  })
},

esqueceuSenhaPorEmail: (email, senha, callback) => {
  bcrypt.hash(senha, 10, (erroHash, hash) => {
    if (erroHash) {
      return callback(erroHash, null);
    }

    const sql = `UPDATE usuarios SET senha = ? WHERE email = ?`
    const valores = [hash, email]

    conn.query(sql, valores, (erro, resultado) => {
      if (erro) {
        return callback(erro, null)
      }

      if (resultado.affectedRows === 0) {
        return callback(null, null)
      }

      callback(null, { email, senha: hash })
    })
  })
}, 
 atualizar: (id, dados, callback) => {
  // Filtrar apenas campos com valores válidos (não undefined e não vazios)
  const camposValidos = {};
  Object.keys(dados).forEach(key => {
    if (dados[key] !== undefined && dados[key] !== '') {
      camposValidos[key] = dados[key];
    }
  });

  // Se nenhum campo for válido, retorne erro
  if (Object.keys(camposValidos).length === 0) {
    return callback(new Error('Nenhum campo válido para atualizar'), null);
  }

  // Se senha estiver sendo atualizada, hash ela
  if (camposValidos.senha) {
    bcrypt.hash(camposValidos.senha, 10, (erroHash, hash) => {
      if (erroHash) {
        return callback(erroHash, null);
      }
      camposValidos.senha = hash;
      // Continuar com a atualização
      continuarAtualizacao(id, camposValidos, callback);
    });
  } else {
    continuarAtualizacao(id, camposValidos, callback);
  }

  function continuarAtualizacao(id, camposValidos, callback) {
    // Construir a parte SET da query dinamicamente
    const setClause = Object.keys(camposValidos).map(key => `${key} = ?`).join(', ');
    const valores = Object.values(camposValidos);
    valores.push(id);  // Adicionar id no final para WHERE

    const sql = `UPDATE usuarios SET ${setClause} WHERE id = ?`;

    conn.query(sql, valores, (erro, resultado) => {
      if (erro) {
        return callback(erro, null);
      }
      // Retornar o objeto atualizado (opcional: busque do banco ou retorne os campos atualizados)
      callback(null, { id, ...camposValidos });
    });
  }
},
  deletar: (id, callback) => {
    //Variavel sql que guarda a consulta desejada
    const sql = `DELETE FROM usuarios WHERE id = ?`;
    //Variavel com informação oculta/misteriosa
    const valor = [id];

    //Executar o comando no banco
    conn.query(sql, valor, (erro, resultado) => {
      if (erro) {
        return callback(erro, null);
      }
      callback(null, resultado.affectedRows > 0);
    });
  },
};
