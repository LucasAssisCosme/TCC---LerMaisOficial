const conn = require("../config/banco");
const bcrypt = require("bcrypt");

function executarQuery(sql, valores = []) {
  return new Promise((resolve, reject) => {
    conn.query(sql, valores, (erro, resultado) => {
      if (erro) {
        reject(erro);
        return;
      }

      resolve(resultado);
    });
  });
}

function normalizarBaseApelido(apelido) {
  const base = String(apelido || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

  return base || "leitor";
}

async function gerarSugestoesDisponiveis(apelidoBase, usuarioIgnoradoId = null) {
  const base = normalizarBaseApelido(apelidoBase);
  const valores = [];
  let sql = `SELECT apelido FROM usuarios WHERE apelido IS NOT NULL AND apelido <> ''`;

  if (usuarioIgnoradoId !== null && usuarioIgnoradoId !== undefined) {
    sql += ` AND id <> ?`;
    valores.push(usuarioIgnoradoId);
  }

  const usuarios = await executarQuery(sql, valores);
  const apelidosExistentes = new Set(
    usuarios.map((usuario) => String(usuario.apelido || "").trim().toLowerCase()),
  );

  const sugestoes = [];
  const candidatos = [
    `${base}_1`,
    `${base}_2`,
    `${base}_3`,
    `${base}_4`,
    `${base}_5`,
    `${base}123`,
    `${base}2026`,
    `${base}_oficial`,
    `${base}_books`,
    `${base}_leitor`,
  ];

  for (const candidato of candidatos) {
    const sugestao = candidato.slice(0, 50);
    const chave = sugestao.toLowerCase();

    if (!apelidosExistentes.has(chave) && !sugestoes.includes(sugestao)) {
      sugestoes.push(sugestao);
    }

    if (sugestoes.length >= 5) {
      break;
    }
  }

  let contador = 6;
  while (sugestoes.length < 5) {
    const sugestao = `${base}_${contador}`.slice(0, 50);
    const chave = sugestao.toLowerCase();
    if (!apelidosExistentes.has(chave) && !sugestoes.includes(sugestao)) {
      sugestoes.push(sugestao);
    }
    contador += 1;
  }

  return sugestoes;
}

module.exports = {
  buscarPorApelido: (apelido, callback, usuarioIgnoradoId = null) => {
    const apelidoLimpo = String(apelido || "").trim();

    if (!apelidoLimpo) {
      callback(null, null);
      return;
    }

    let sql = `SELECT id, apelido FROM usuarios WHERE LOWER(apelido) = LOWER(?)`;
    const valores = [apelidoLimpo];

    if (usuarioIgnoradoId !== null && usuarioIgnoradoId !== undefined) {
      sql += ` AND id <> ?`;
      valores.push(usuarioIgnoradoId);
    }

    sql += ` LIMIT 1`;

    conn.query(sql, valores, (erro, resultados) => {
      if (erro) {
        return callback(erro, null);
      }

      callback(null, resultados[0] || null);
    });
  },

  gerarSugestoesApelido: (apelido, callback, usuarioIgnoradoId = null) => {
    gerarSugestoesDisponiveis(apelido, usuarioIgnoradoId)
      .then((sugestoes) => callback(null, sugestoes))
      .catch((erro) => callback(erro, null));
  },

  login: (email, senha, callback) => {
    const sql = `SELECT * FROM usuarios WHERE email = ?`;
    const valores = [email];

    conn.query(sql, valores, (erro, resultados) => {
      if (erro) {
        return callback(erro, null);
      }

      if (resultados.length === 0) {
        return callback(null, null);
      }

      const usuario = resultados[0];

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

  salvar: (
    { nome, email, senha, foto_perfil, bio, genero_favorito, tipo, apelido },
    callback,
  ) => {
    bcrypt.hash(senha, 10, (erroHash, hash) => {
      if (erroHash) {
        return callback(erroHash, null);
      }

      const sql = `INSERT INTO usuarios (nome,email,senha,foto_perfil, bio, genero_favorito, tipo, apelido) VALUES(?,?,?,?,?,?,?,?) `;
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
        console.log("Valores enviados:", valores);
        if (erro) {
          console.log("Erro no insert:", erro);
          return callback(erro, null);
        }

        console.log("Resultado do insert:", resultado);
        const novoUsuario = {
          id: resultado.insertId,
          nome,
          email,
          senha: hash,
          foto_perfil,
          bio,
          genero_favorito,
          tipo,
          apelido,
        };

        callback(null, novoUsuario);
      });
    });
  },

  listarTodos: (callback) => {
    const sql = `SELECT * FROM usuarios`;

    conn.query(sql, (erro, resultados) => {
      if (erro) {
        return callback(erro, null);
      }

      callback(null, resultados);
    });
  },

  buscarPorid: (id, callback) => {
    const sql = `SELECT * FROM usuarios WHERE id = ?`;
    const valor = [id];

    conn.query(sql, valor, (erro, resultado) => {
      if (erro) {
        return callback(erro, null);
      }

      callback(null, resultado[0] || null);
    });
  },

  esqueceuSenha: (email, senha, id, callback) => {
    bcrypt.hash(senha, 10, (erroHash, hash) => {
      if (erroHash) {
        return callback(erroHash, null);
      }

      const sql = `UPDATE usuarios SET senha = ? WHERE id = ? AND email = ?`;
      const valores = [hash, id, email];

      conn.query(sql, valores, (erro, resultado) => {
        if (erro) {
          return callback(erro, null);
        }

        if (resultado.affectedRows === 0) {
          return callback(new Error("Email ou usuario nao encontrado"), null);
        }

        callback(null, {
          id,
          email,
          senha: hash,
        });
      });
    });
  },

  esqueceuSenhaPorEmail: (email, senha, callback) => {
    bcrypt.hash(senha, 10, (erroHash, hash) => {
      if (erroHash) {
        return callback(erroHash, null);
      }

      const sql = `UPDATE usuarios SET senha = ? WHERE email = ?`;
      const valores = [hash, email];

      conn.query(sql, valores, (erro, resultado) => {
        if (erro) {
          return callback(erro, null);
        }

        if (resultado.affectedRows === 0) {
          return callback(null, null);
        }

        callback(null, { email, senha: hash });
      });
    });
  },

  atualizar: (id, dados, callback) => {
    const colunasPermitidas = [
      "nome",
      "email",
      "bio",
      "genero_favorito",
      "apelido",
      "foto_perfil",
      "senha",
    ];

    const camposValidos = {};
    Object.keys(dados).forEach((key) => {
      if (
        colunasPermitidas.includes(key) &&
        dados[key] !== undefined &&
        dados[key] !== ""
      ) {
        camposValidos[key] = dados[key];
      }
    });

    if (Object.keys(camposValidos).length === 0) {
      return callback(new Error("Nenhum campo valido para atualizar"), null);
    }

    if (camposValidos.senha) {
      bcrypt.hash(camposValidos.senha, 10, (erroHash, hash) => {
        if (erroHash) {
          return callback(erroHash, null);
        }

        camposValidos.senha = hash;
        continuarAtualizacao(id, camposValidos, callback);
      });
    } else {
      continuarAtualizacao(id, camposValidos, callback);
    }

    function continuarAtualizacao(usuarioId, campos, done) {
      const setClause = Object.keys(campos)
        .map((key) => `${key} = ?`)
        .join(", ");
      const valores = Object.values(campos);
      valores.push(usuarioId);

      const sql = `UPDATE usuarios SET ${setClause} WHERE id = ?`;

      conn.query(sql, valores, (erro) => {
        if (erro) {
          return done(erro, null);
        }

        done(null, { id: usuarioId, ...campos });
      });
    }
  },

  deletar: (id, callback) => {
    const usuarioId = [id];

    conn.beginTransaction(async (erroTransacao) => {
      if (erroTransacao) {
        return callback(erroTransacao, null);
      }

      try {
        await executarQuery(`DELETE FROM biblioteca WHERE usuario_id = ?`, usuarioId);
        await executarQuery(`DELETE FROM avaliacoes WHERE usuario_id = ?`, usuarioId);
        await executarQuery(`DELETE FROM resenha WHERE usuario_id = ?`, usuarioId);
        await executarQuery(
          `DELETE FROM partes_favoritas WHERE usuario_id = ?`,
          usuarioId,
        );

        const resultado = await executarQuery(
          `DELETE FROM usuarios WHERE id = ?`,
          usuarioId,
        );

        conn.commit((erroCommit) => {
          if (erroCommit) {
            return conn.rollback(() => callback(erroCommit, null));
          }

          callback(null, resultado.affectedRows > 0);
        });
      } catch (erro) {
        conn.rollback(() => callback(erro, null));
      }
    });
  },
};
