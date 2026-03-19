const jwt = require('jsonwebtoken');

const SECRET_KEY = 'sua_chave_secreta_super_segura_123456'; // ⚠️ Mude isso em produção!

module.exports = {
  gerarToken(usuario) {
    return jwt.sign(
      { id: usuario.id, email: usuario.email, tipo: usuario.tipo },
      SECRET_KEY,
      { expiresIn: '24h' }
    );
  },

  verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return res.status(401).json({ erro: 'Token não fornecido' });
    }

    // Remove "Bearer " do header
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      req.usuarioId = decoded.id;
      req.usuarioTipo = decoded.tipo;
      next();
    } catch (erro) {
      if (erro.name === 'TokenExpiredError') {
        return res.status(401).json({ erro: 'Token expirado' });
      }
      return res.status(403).json({ erro: 'Token inválido' });
    }
  }
};
