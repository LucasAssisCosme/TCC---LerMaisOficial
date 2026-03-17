const conn = require("../config/banco");

module.exports = {
  // Paginômetro - total de páginas lidas por um usuário
  getTotalPaginasLidas: (usuario_id, callback) => {
    const sql = `
      SELECT SUM(livros.numero_paginas) as total_paginas
      FROM biblioteca
      JOIN livros ON biblioteca.livro_id = livros.id
      WHERE biblioteca.usuario_id = ? AND biblioteca.progresso = 'lido'
    `;
    conn.query(sql, [usuario_id], (erro, resultado) => {
      if (erro) {
        return callback(erro, null);
      }
      callback(null, resultado[0]?.total_paginas || 0);
    });
  },

  // Posição do usuário no ranking
  getPosicaoRanking: (usuario_id, callback) => {
    const sql = `
      SELECT COUNT(*) + 1 as posicao
      FROM (
        SELECT usuario_id, SUM(livros.numero_paginas) as total_paginas
        FROM biblioteca
        JOIN livros ON biblioteca.livro_id = livros.id
        WHERE biblioteca.progresso = 'lido'
        GROUP BY usuario_id
      ) ranking
      WHERE total_paginas > (
        SELECT COALESCE(SUM(livros.numero_paginas), 0)
        FROM biblioteca
        JOIN livros ON biblioteca.livro_id = livros.id
        WHERE biblioteca.usuario_id = ? AND biblioteca.progresso = 'lido'
      )
    `;
    conn.query(sql, [usuario_id], (erro, resultado) => {
      if (erro) {
        return callback(erro, null);
      }
      callback(null, resultado[0]?.posicao || 1);
    });
  },

  // Top ranking
  getTopRanking: (limite = 10, callback) => {
    const sql = `
      SELECT 
        usuarios.id,
        usuarios.nome,
        usuarios.foto_perfil,
        SUM(livros.numero_paginas) as total_paginas
      FROM biblioteca
      JOIN livros ON biblioteca.livro_id = livros.id
      JOIN usuarios ON biblioteca.usuario_id = usuarios.id
      WHERE biblioteca.progresso = 'lido'
      GROUP BY usuarios.id
      ORDER BY total_paginas DESC
      LIMIT ?
    `;
    conn.query(sql, [limite], (erro, resultados) => {
      if (erro) {
        return callback(erro, null);
      }
      callback(null, resultados);
    });
  }
};
