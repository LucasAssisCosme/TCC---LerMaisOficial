CREATE DATABASE sistema_leitura;
USE sistema_leitura;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    foto_perfil VARCHAR(255),
    bio TEXT,
    genero_favorito ENUM('Romance',
'Fantasia',
'Terror',
'Aventura',
'Ficcao_Cientifica',
'Drama',
'Autoajuda',
'Outro') NOT NULL,
	tipo ENUM('aluno', 'bibliotecaria') DEFAULT 'aluno' NOT NULL,
    apelido VARCHAR(100) NOT NULL
);

CREATE TABLE livros (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    autor VARCHAR(100) NOT NULL,
    genero ENUM('Romance',
'Fantasia',
'Terror',
'Aventura',
'Ficcao_Cientifica',
'Drama',
'Autoajuda',
'Outro') NOT NULL,
    ano INT NOT NULL,
    numero_paginas INT NOT NULL,
    descricao TEXT NOT NULL,
    imagem_capa VARCHAR(255) NOT NULL

);

CREATE TABLE biblioteca (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    usuario_id INT NOT NULL,
    livro_id INT NOT NULL,
    progresso ENUM('lendo', 'quero_ler', 'lido') NOT NULL,

    UNIQUE(usuario_id, livro_id),

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (livro_id) REFERENCES livros(id)
);
CREATE TABLE avaliacoes (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    usuario_id INT NOT NULL,
    livro_id INT NOT NULL,
    estrelas TINYINT,

   UNIQUE(usuario_id, livro_id),
        
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (livro_id) REFERENCES livros(id)
);

CREATE TABLE resenha (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    usuario_id INT NOT NULL,
    livro_id INT NOT NULL,
    texto TEXT NOT NULL,

  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (livro_id) REFERENCES livros(id)
);

CREATE TABLE partes_favoritas (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
	usuario_id INT NOT NULL,
    livro_id INT NOT NULL,
    trecho TEXT NOT NULL,

  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (livro_id) REFERENCES livros(id)
);

ALTER TABLE livros ADD editora VARCHAR(100) NOT NULL;
ALTER TABLE livros ADD COLUMN criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE usuarios MODIFY apelido VARCHAR(100) NULL;
ALTER TABLE usuarios MODIFY genero_favorito ENUM('Romance',
'Fantasia',
'Terror',
'Aventura',
'Ficcao_Cientifica',
'Drama',
'Autoajuda',
'Outro') NULL;
ALTER TABLE usuarios MODIFY bio  TEXT NULL;
ALTER TABLE usuarios MODIFY foto_perfil  VARCHAR(255) NULL;
