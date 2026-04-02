const { body, param, validationResult } = require('express-validator');

// Middleware para tratar erros de validaÃ§Ã£o
const tratarErrosValidacao = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      erro: 'Erro de validaÃ§Ã£o', 
      detalhes: errors.array() 
    });
  }
  next();
};

// ValidaÃ§Ãµes para UsuÃ¡rio
const validarCadastroUsuario = [
  body('nome')
    .trim()
    .notEmpty().withMessage('Nome Ã© obrigatÃ³rio')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[\\p{L}\\s]+$/u).withMessage('Nome pode conter apenas letras e espaÃ§os'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email Ã© obrigatÃ³rio')
    .isEmail().withMessage('Email invÃ¡lido')
    .normalizeEmail(),
  
  body('senha')
    .notEmpty().withMessage('Senha Ã© obrigatÃ³ria')
    .isLength({ min: 8, max: 32 }).withMessage('Senha deve ter entre 8 e 32 caracteres'),
  
  body('tipo')
    .optional()
    .trim()
    .isIn(['aluno', 'bibliotecaria'])
    .withMessage('Tipo de usuÃ¡rio invÃ¡lido. Use: aluno ou bibliotecaria'),
  
  body('genero_favorito')
    .notEmpty().withMessage('GÃªnero favorito Ã© obrigatÃ³rio')
    .isIn(['Romance', 'Fantasia', 'Terror', 'Aventura', 'Ficcao_Cientifica', 'Drama', 'Autoajuda', 'Outro'])
    .withMessage('GÃªnero favorito invÃ¡lido'),
  
  body('apelido')
    .notEmpty().withMessage('Apelido Ã© obrigatÃ³rio')
    .isLength({ min: 2, max: 50 }).withMessage('Apelido deve ter entre 2 e 50 caracteres'),

  tratarErrosValidacao
];

const validarLoginUsuario = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email Ã© obrigatÃ³rio')
    .isEmail().withMessage('Email invÃ¡lido')
    .normalizeEmail(),
  
  body('senha')
    .notEmpty().withMessage('Senha Ã© obrigatÃ³ria'),
  
  tratarErrosValidacao
];

const validarRedefinirSenha = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email Ã© obrigatÃ³rio')
    .isEmail().withMessage('Email invÃ¡lido')
    .normalizeEmail(),
  
  body('novaSenha')
    .notEmpty().withMessage('Nova senha Ã© obrigatÃ³ria')
    .isLength({ min: 8, max: 32 }).withMessage('Senha deve ter entre 8 e 32 caracteres'),
  
  body('confirmarSenha')
    .notEmpty().withMessage('Confirmar senha Ã© obrigatÃ³rio')
    .custom((value, { req }) => value === req.body.novaSenha)
    .withMessage('As senhas nÃ£o coincidem'),
  
  tratarErrosValidacao
];

const validarIdUsuario = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de usuÃ¡rio invÃ¡lido'),
  
  tratarErrosValidacao
];

// ValidaÃ§Ãµes para Livros
const validarCadastroLivro = [
  body('titulo')
    .trim()
    .notEmpty().withMessage('TÃ­tulo Ã© obrigatÃ³rio')
    .isLength({ min: 2, max: 200 }).withMessage('TÃ­tulo deve ter entre 2 e 200 caracteres'),
  
  body('autor')
    .trim()
    .notEmpty().withMessage('Autor Ã© obrigatÃ³rio')
    .isLength({ min: 2, max: 100 }).withMessage('Autor deve ter entre 2 e 100 caracteres'),
  
  body('genero')
    .trim()
    .notEmpty().withMessage('GÃªnero Ã© obrigatÃ³rio')
    .isLength({ min: 2, max: 50 }).withMessage('GÃªnero deve ter entre 2 e 50 caracteres'),
  
  body('ano')
    .isInt({ min: 1000, max: new Date().getFullYear() })
    .withMessage('Ano invÃ¡lido'),
  
  body('numero_paginas')
    .isInt({ min: 1, max: 10000 })
    .withMessage('NÃºmero de pÃ¡ginas invÃ¡lido'),
  
  body('descricao')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('DescriÃ§Ã£o nÃ£o pode exceder 1000 caracteres'),

  body('imagem_capa')
    .optional()
    .trim()
    .isURL({ require_tld: false }).withMessage('URL da imagem invÃ¡lida'),

  body('editora')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Editora nÃ£o pode exceder 100 caracteres'),
  
  tratarErrosValidacao
];

const validarAtualizacaoLivro = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de livro invÃ¡lido'),
  
  body('titulo')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('TÃ­tulo deve ter entre 2 e 200 caracteres'),
  
  body('autor')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Autor deve ter entre 2 e 100 caracteres'),
  
  body('genero')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('GÃªnero deve ter entre 2 e 50 caracteres'),
  
  body('ano')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() })
    .withMessage('Ano invÃ¡lido'),
  
  body('numero_paginas')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('NÃºmero de pÃ¡ginas invÃ¡lido'),
  
  body('descricao')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('DescriÃ§Ã£o nÃ£o pode exceder 1000 caracteres'),

  body('imagem_capa')
    .optional()
    .trim()
    .isURL({ require_tld: false }).withMessage('URL da imagem invÃ¡lida'),

  body('editora')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Editora nÃ£o pode exceder 100 caracteres'),
  
  tratarErrosValidacao
];

const validarIdLivro = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de livro invÃ¡lido'),
  
  tratarErrosValidacao
];

// âœ… ValidaÃ§Ãµes para AtualizaÃ§Ã£o de UsuÃ¡rio
const validarAtualizacaoUsuario = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de usuÃ¡rio invÃ¡lido'),
  
  body('nome')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[\\p{L}\\s]+$/u).withMessage('Nome pode conter apenas letras e espaÃ§os'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Email invÃ¡lido')
    .normalizeEmail(),
  
  body('senha')
    .optional()
    .isLength({ min: 8, max: 32 }).withMessage('Senha deve ter entre 8 e 32 caracteres'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Bio nÃ£o pode exceder 500 caracteres'),
  
  body('apelido')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Apelido deve ter entre 2 e 50 caracteres'),
  
  body('genero_favorito')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('GÃªnero favorito nÃ£o pode exceder 50 caracteres'),
  
  body('foto_perfil')
    .optional()
    .trim(),
  
  tratarErrosValidacao
];

// âœ… ValidaÃ§Ãµes para Cadastro de Partes Favoritas
const validarCadastroPF = [
  body('usuario_id')
    .isInt({ min: 1 }).withMessage('ID do usuÃ¡rio invÃ¡lido'),
  
  body('livro_id')
    .isInt({ min: 1 }).withMessage('ID do livro invÃ¡lido'),
  
  body('trecho')
    .trim()
    .notEmpty().withMessage('Trecho Ã© obrigatÃ³rio')
    .isLength({ min: 5, max: 1000 }).withMessage('Trecho deve ter entre 5 e 1000 caracteres'),
  
  tratarErrosValidacao
];

// âœ… ValidaÃ§Ãµes para AtualizaÃ§Ã£o de Partes Favoritas
const validarAtualizacaoPF = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de parte favorita invÃ¡lido'),
  
  body('trecho')
    .optional()
    .trim()
    .isLength({ min: 5, max: 1000 }).withMessage('Trecho deve ter entre 5 e 1000 caracteres'),
  
  tratarErrosValidacao
];

// ValidaÃ§Ãµes para Biblioteca
const validarStatusBiblioteca = [
  body('usuario_id')
    .isInt({ min: 1 }).withMessage('ID do usuÃ¡rio invÃ¡lido'),
  
  body('livro_id')
    .isInt({ min: 1 }).withMessage('ID do livro invÃ¡lido'),
  
  body('progresso')
    .trim()
    .isIn(['lido', 'lendo', 'quero_ler'])
    .withMessage('Progresso invÃ¡lido. Use: lido, lendo ou quero_ler'),
  
  tratarErrosValidacao
];

// ValidaÃ§Ãµes para AvaliaÃ§Ãµes
const validarAvaliacao = [
  body('usuario_id')
    .isInt({ min: 1 }).withMessage('ID do usuÃ¡rio invÃ¡lido'),
  
  body('livro_id')
    .isInt({ min: 1 }).withMessage('ID do livro invÃ¡lido'),
  
  body('estrelas')
    .isInt({ min: 1, max: 5 })
    .withMessage('AvaliaÃ§Ã£o deve ser entre 1 e 5 estrelas'),
  
  tratarErrosValidacao
];

module.exports = {
  validarCadastroUsuario,
  validarLoginUsuario,
  validarRedefinirSenha,
  validarIdUsuario,
  validarAtualizacaoUsuario,
  validarCadastroLivro,
  validarAtualizacaoLivro,
  validarIdLivro,
  validarCadastroPF,
  validarAtualizacaoPF,
  validarStatusBiblioteca,
  validarAvaliacao,
  tratarErrosValidacao
};


