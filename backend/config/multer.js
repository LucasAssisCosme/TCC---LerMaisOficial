const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Criar pasta de uploads se não existir
const uploadDir = path.join(__dirname, '..', 'uploads', 'perfis');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('[MULTER] Pasta criada:', uploadDir);
}

// Criar pasta de uploads de capas de livros se não existir
const uploadDirLivrosCapa = path.join(__dirname, '..', 'uploads', 'livro_capa');
if (!fs.existsSync(uploadDirLivrosCapa)) {
  fs.mkdirSync(uploadDirLivrosCapa, { recursive: true });
  console.log('[MULTER] Pasta criada:', uploadDirLivrosCapa);
}

// Configurar armazenamento de arquivo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    // Usar timestamp para arquivo temporário (será verificado/renomeado depois)
    const tempName = `temp_${Date.now()}${ext}`;
    cb(null, tempName);
  }
});

// Função para obter extensão correta do arquivo
function obterExtensaoLimpa(nomeArquivo) {
  if (!nomeArquivo) return '.jpg';
  
  const ext = path.extname(nomeArquivo).toLowerCase();
  
  // Extensões válidas de imagem
  const extensoesValidas = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  // Se extensão é válida, retornar; senão usar jpg como padrão
  if (extensoesValidas.includes(ext)) {
    console.log(`[obterExtensaoLimpa] Extensão válida encontrada: ${ext}`);
    return ext;
  }
  
  // Tentar mapear MIME type se disponível
  console.log(`[obterExtensaoLimpa] Extensão inválida/desconhecida: ${ext}, usando .jpg como padrão`);
  return '.jpg';
}

// Validar tipo de arquivo
const fileFilter = (req, file, cb) => {
  const tipos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (tipos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas'), false);
  }
};

// Função auxiliar para calcular hash de um arquivo
function calcularHashArquivo(caminhoArquivo) {
  try {
    const conteudo = fs.readFileSync(caminhoArquivo);
    return crypto.createHash('sha256').update(conteudo).digest('hex');
  } catch (erro) {
    console.error('[HASH] Erro ao calcular hash:', erro);
    return null;
  }
}

// Função para verificar se imagem duplicada já existe
function verificarImagemDuplicada(caminhoTemporario) {
  try {
    const hashNova = calcularHashArquivo(caminhoTemporario);
    if (!hashNova) return null;

    console.log(`[UPLOAD] Hash da nova imagem: ${hashNova}`);

    // Procurar por arquivos com mesmo hash no naming
    const arquivos = fs.readdirSync(uploadDir);
    
    // Verificar cada arquivo existente
    for (const arquivo of arquivos) {
      if (arquivo.startsWith('temp_')) continue; // Ignorar temporários
      
      const caminhoExistente = path.join(uploadDir, arquivo);
      const hashExistente = calcularHashArquivo(caminhoExistente);
      
      if (hashExistente === hashNova) {
        console.log(`[UPLOAD] Imagem duplicada encontrada: ${arquivo}`);
        return arquivo; // Retorna o nome do arquivo que já existe
      }
    }

    // Se não encontrou duplicata, renomear arquivo com hash
    const ext = path.extname(caminhoTemporario);
    const nomeComHash = `img_${hashNova.substring(0, 16)}${ext}`;
    const novoDestino = path.join(uploadDir, nomeComHash);

    // Verificar novamente se já existe (race condition)
    if (!fs.existsSync(novoDestino)) {
      fs.renameSync(caminhoTemporario, novoDestino);
      console.log(`[UPLOAD] Arquivo salvo com hash: ${nomeComHash}`);
      return nomeComHash;
    } else {
      console.log(`[UPLOAD] Arquivo com esse hash já existe, deletando temporário`);
      fs.unlinkSync(caminhoTemporario);
      return nomeComHash;
    }

  } catch (erro) {
    console.error('[UPLOAD] Erro ao verificar duplicata:', erro);
    return null;
  }
}

// Função para verificar se imagem duplicada já existe para livro
function verificarImagemDuplicadaLivro(caminhoTemporario) {
  try {
    console.log('[UPLOAD LIVRO] Iniciando processamento:', caminhoTemporario);
    
    // Verificar se arquivo temporário existe
    if (!fs.existsSync(caminhoTemporario)) {
      console.error('[UPLOAD LIVRO] Arquivo temporário não encontrado:', caminhoTemporario);
      return null;
    }

    const hashNova = calcularHashArquivo(caminhoTemporario);
    if (!hashNova) {
      console.error('[UPLOAD LIVRO] Erro ao calcular hash do arquivo');
      return null;
    }

    console.log(`[UPLOAD LIVRO] Hash calculado: ${hashNova}`);

    // Obter extensão do arquivo temporário
    const nomeTemporario = path.basename(caminhoTemporario);
    const ext = path.extname(nomeTemporario);
    
    console.log(`[UPLOAD LIVRO] Nome temporário: ${nomeTemporario}, Extensão: ${ext}`);

    // Procurar por arquivos com mesmo hash no naming
    let arquivos = [];
    try {
      arquivos = fs.readdirSync(uploadDirLivrosCapa);
      console.log('[UPLOAD LIVRO] Arquivos na pasta:', arquivos.slice(0, 5), `... (${arquivos.length} total)`);
    } catch (err) {
      console.error('[UPLOAD LIVRO] Erro ao ler pasta:', err);
      return null;
    }
    
    // Verificar cada arquivo existente
    for (const arquivo of arquivos) {
      if (arquivo.startsWith('temp_')) continue; // Ignorar temporários
      
      const caminhoExistente = path.join(uploadDirLivrosCapa, arquivo);
      const hashExistente = calcularHashArquivo(caminhoExistente);
      
      if (hashExistente === hashNova) {
        console.log(`[UPLOAD LIVRO] Imagem duplicada encontrada: ${arquivo}`);
        // Deletar arquivo temporário
        try {
          fs.unlinkSync(caminhoTemporario);
          console.log('[UPLOAD LIVRO] Arquivo temporário deletado');
        } catch (err) {
          console.error('[UPLOAD LIVRO] Erro ao deletar temporário:', err);
        }
        return arquivo; // Retorna o nome do arquivo que já existe
      }
    }

    // Se não encontrou duplicata, renomear arquivo com hash
    const nomeComHash = `livro_${hashNova.substring(0, 16)}${ext}`;
    const novoDestino = path.join(uploadDirLivrosCapa, nomeComHash);

    console.log('[UPLOAD LIVRO] Renomeando arquivo:', { 
      de: caminhoTemporario, 
      para: novoDestino,
      ext: ext,
      nomeComHash: nomeComHash
    });

    // Verificar novamente se já existe (race condition)
    if (!fs.existsSync(novoDestino)) {
      try {
        fs.renameSync(caminhoTemporario, novoDestino);
        console.log(`[UPLOAD LIVRO] Arquivo salvo com sucesso: ${nomeComHash}`);
        
        // Verificar se arquivo foi realmente criado
        if (fs.existsSync(novoDestino)) {
          console.log('[UPLOAD LIVRO] Arquivo salvo confirmado');
          console.log('[UPLOAD LIVRO] Verificando arquivo:', {
            caminho: novoDestino,
            existe: true,
            tamanho: fs.statSync(novoDestino).size
          });
          return nomeComHash;
        } else {
          console.error('[UPLOAD LIVRO] Arquivo não foi criado após renameSync');
          return null;
        }
      } catch (err) {
        console.error('[UPLOAD LIVRO] Erro ao renomear arquivo:', err);
        return null;
      }
    } else {
      console.log(`[UPLOAD LIVRO] Arquivo com esse hash já existe`);
      try {
        fs.unlinkSync(caminhoTemporario);
        console.log('[UPLOAD LIVRO] Arquivo temporário deletado');
      } catch (err) {
        console.error('[UPLOAD LIVRO] Erro ao deletar temporário:', err);
      }
      return nomeComHash;
    }

  } catch (erro) {
    console.error('[UPLOAD LIVRO] Erro geral ao verificar duplicata:', erro);
    return null;
  }
}

// Exportar instância do multer
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ===== CONFIGURAÇÃO PARA CAPAS DE LIVROS =====
const storageLivroCapa = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('[storageLivroCapa - destination]', { 
      originalname: file.originalname,
      mimetype: file.mimetype,
      destino: uploadDirLivrosCapa 
    });
    cb(null, uploadDirLivrosCapa);
  },
  filename: (req, file, cb) => {
    const ext = obterExtensaoLimpa(file.originalname);
    const tempName = `temp_${Date.now()}${ext}`;
    console.log('[storageLivroCapa - filename]', { 
      originalname: file.originalname,
      extensaoExtraida: ext,
      nomeTemporario: tempName
    });
    cb(null, tempName);
  }
});

const uploadLivroCapa = multer({ 
  storage: storageLivroCapa,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Exportações consolidadas
module.exports = upload;
module.exports.uploadLivroCapa = uploadLivroCapa;
module.exports.verificarImagemDuplicada = verificarImagemDuplicada;
module.exports.verificarImagemDuplicadaLivro = verificarImagemDuplicadaLivro;
module.exports.uploadDir = uploadDir;
module.exports.uploadDirLivrosCapa = uploadDirLivrosCapa;
