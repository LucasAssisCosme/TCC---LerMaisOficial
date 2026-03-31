const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Criar pasta de uploads se não existir
const uploadDir = path.join(__dirname, '..', 'uploads', 'perfis');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
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

// Exportar instância do multer
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Exportar também a função de verificação
module.exports = upload;
module.exports.verificarImagemDuplicada = verificarImagemDuplicada;
module.exports.uploadDir = uploadDir;
