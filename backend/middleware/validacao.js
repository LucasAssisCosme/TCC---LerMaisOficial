const { body, param, validationResult } = require('express-validator');

// Middleware para tratar erros de validação
const tratarErrosValidacao = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      erro: 'Erro de validação', 
      detalhes: errors.array() 
    });
  }
  next();
};

// Validações para Usuário
const validarCadastroUsuario = [
  body('nome')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/).withMessage('Nome pode conter apenas letras e espaços'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  
  body('senha')
    .notEmpty().withMessage('Senha é obrigatória')
    .isLength({ min: 8, max: 32 }).withMessage('Senha deve ter entre 8 e 32 caracteres'),
  
  body('tipo')
    .optional()
    .trim()
    .isIn(['aluno', 'bibliotecaria'])
    .withMessage('Tipo de usuário inválido. Use: aluno ou bibliotecaria'),
  
  body('genero_favorito')
    .notEmpty().withMessage('Gênero favorito é obrigatório')
    .isIn(['Romance', 'Fantasia', 'Terror', 'Aventura', 'Ficcao_Cientifica', 'Drama', 'Autoajuda', 'Outro'])
    .withMessage('Gênero favorito inválido'),
  
  body('apelido')
    .notEmpty().withMessage('Apelido é obrigatório')
    .isLength({ min: 2, max: 50 }).withMessage('Apelido deve ter entre 2 e 50 caracteres'),
  
  tratarErrosValidacao
];

const validarLoginUsuario = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  
  body('senha')
    .notEmpty().withMessage('Senha é obrigatória'),
  
  tratarErrosValidacao
];

const validarRedefinirSenha = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  
  body('novaSenha')
    .notEmpty().withMessage('Nova senha é obrigatória')
    .isLength({ min: 8, max: 32 }).withMessage('Senha deve ter entre 8 e 32 caracteres'),
  
  body('confirmarSenha')
    .notEmpty().withMessage('Confirmar senha é obrigatório')
    .custom((value, { req }) => value === req.body.novaSenha)
    .withMessage('As senhas não coincidem'),
  
  tratarErrosValidacao
];

const validarIdUsuario = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de usuário inválido'),
  
  tratarErrosValidacao
];

// Validações para Livros
const validarCadastroLivro = [
  body('titulo')
    .trim()
    .notEmpty().withMessage('Título é obrigatório')
    .isLength({ min: 2, max: 200 }).withMessage('Título deve ter entre 2 e 200 caracteres'),
  
  body('autor')
    .trim()
    .notEmpty().withMessage('Autor é obrigatório')
    .isLength({ min: 2, max: 100 }).withMessage('Autor deve ter entre 2 e 100 caracteres'),
  
  body('genero')
    .trim()
    .notEmpty().withMessage('Gênero é obrigatório')
    .isLength({ min: 2, max: 50 }).withMessage('Gênero deve ter entre 2 e 50 caracteres'),
  
  body('ano')
    .isInt({ min: 1000, max: new Date().getFullYear() })
    .withMessage('Ano inválido'),
  
  body('numero_paginas')
    .isInt({ min: 1, max: 10000 })
    .withMessage('Número de páginas inválido'),
  
  body('descricao')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Descrição não pode exceder 1000 caracteres'),
  
  body('imagem_capa')
    .optional()
    .trim()
    .isURL().withMessage('URL da imagem inválida'),
  
  body('editora')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Editora não pode exceder 100 caracteres'),
  
  tratarErrosValidacao
];

const validarAtualizacaoLivro = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de livro inválido'),
  
  body('titulo')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('Título deve ter entre 2 e 200 caracteres'),
  
  body('autor')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Autor deve ter entre 2 e 100 caracteres'),
  
  body('genero')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Gênero deve ter entre 2 e 50 caracteres'),
  
  body('ano')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() })
    .withMessage('Ano inválido'),
  
  body('numero_paginas')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Número de páginas inválido'),
  
  body('descricao')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Descrição não pode exceder 1000 caracteres'),
  
  tratarErrosValidacao
];

const validarIdLivro = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de livro inválido'),
  
  tratarErrosValidacao
];

// ✅ Validações para Atualização de Usuário
const validarAtualizacaoUsuario = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de usuário inválido'),
  
  body('nome')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/).withMessage('Nome pode conter apenas letras e espaços'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  
  body('senha')
    .optional()
    .isLength({ min: 8, max: 32 }).withMessage('Senha deve ter entre 8 e 32 caracteres'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Bio não pode exceder 500 caracteres'),
  
  body('apelido')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Apelido deve ter entre 2 e 50 caracteres'),
  
  body('genero_favorito')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Gênero favorito não pode exceder 50 caracteres'),
  
  body('foto_perfil')
    .optional()
    .trim(),
  
  tratarErrosValidacao
];

// ✅ Validações para Cadastro de Partes Favoritas
const validarCadastroPF = [
  body('usuario_id')
    .isInt({ min: 1 }).withMessage('ID do usuário inválido'),
  
  body('livro_id')
    .isInt({ min: 1 }).withMessage('ID do livro inválido'),
  
  body('trecho')
    .trim()
    .notEmpty().withMessage('Trecho é obrigatório')
    .isLength({ min: 5, max: 1000 }).withMessage('Trecho deve ter entre 5 e 1000 caracteres'),
  
  tratarErrosValidacao
];

// ✅ Validações para Atualização de Partes Favoritas
const validarAtualizacaoPF = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID de parte favorita inválido'),
  
  body('trecho')
    .optional()
    .trim()
    .isLength({ min: 5, max: 1000 }).withMessage('Trecho deve ter entre 5 e 1000 caracteres'),
  
  tratarErrosValidacao
];

// Validações para Biblioteca
const validarStatusBiblioteca = [
  body('usuario_id')
    .isInt({ min: 1 }).withMessage('ID do usuário inválido'),
  
  body('livro_id')
    .isInt({ min: 1 }).withMessage('ID do livro inválido'),
  
  body('progresso')
    .trim()
    .isIn(['lido', 'lendo', 'quero_ler'])
    .withMessage('Progresso inválido. Use: lido, lendo ou quero_ler'),
  
  tratarErrosValidacao
];

// Validações para Avaliações
const validarAvaliacao = [
  body('usuario_id')
    .isInt({ min: 1 }).withMessage('ID do usuário inválido'),
  
  body('livro_id')
    .isInt({ min: 1 }).withMessage('ID do livro inválido'),
  
  body('estrelas')
    .isInt({ min: 1, max: 5 })
    .withMessage('Avaliação deve ser entre 1 e 5 estrelas'),
  
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
