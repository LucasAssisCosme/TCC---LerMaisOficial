const jwt = require("jsonwebtoken");
const env = require("../config/env");

const SECRET_KEY = env.jwtSecret;
const TOKEN_EXPIRES_IN = env.jwtExpiresIn;

module.exports = {
  gerarToken(usuario) {
    return jwt.sign(
      { id: usuario.id, email: usuario.email, tipo: usuario.tipo },
      SECRET_KEY,
      { expiresIn: TOKEN_EXPIRES_IN },
    );
  },

  verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ erro: "Token não fornecido" });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      req.usuarioId = decoded.id;
      req.usuarioTipo = decoded.tipo;
      // Também salvar em req.usuario para compatibilidade
      req.usuario = { id: decoded.id, tipo: decoded.tipo, email: decoded.email };
      next();
    } catch (erro) {
      if (erro.name === "TokenExpiredError") {
        return res.status(401).json({ erro: "Token expirado" });
      }

      return res.status(403).json({ erro: "Token inválido" });
    }
  },
};
