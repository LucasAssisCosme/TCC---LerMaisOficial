const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const env = require("./env");

const uploadDir = env.profileUploadDir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("[MULTER] Pasta criada:", uploadDir);
}

const uploadDirLivrosCapa = env.bookCoverUploadDir;
if (!fs.existsSync(uploadDirLivrosCapa)) {
  fs.mkdirSync(uploadDirLivrosCapa, { recursive: true });
  console.log("[MULTER] Pasta criada:", uploadDirLivrosCapa);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const tempName = `temp_${Date.now()}${ext}`;
    cb(null, tempName);
  },
});

function obterExtensaoLimpa(nomeArquivo) {
  if (!nomeArquivo) return ".jpg";

  const ext = path.extname(nomeArquivo).toLowerCase();
  const extensoesValidas = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

  if (extensoesValidas.includes(ext)) {
    console.log(`[obterExtensaoLimpa] Extensão válida encontrada: ${ext}`);
    return ext;
  }

  console.log(
    `[obterExtensaoLimpa] Extensão inválida/desconhecida: ${ext}, usando .jpg como padrão`,
  );
  return ".jpg";
}

const fileFilter = (req, file, cb) => {
  const tipos = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (tipos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Apenas imagens são permitidas"), false);
  }
};

function calcularHashArquivo(caminhoArquivo) {
  try {
    const conteudo = fs.readFileSync(caminhoArquivo);
    return crypto.createHash("sha256").update(conteudo).digest("hex");
  } catch (erro) {
    console.error("[HASH] Erro ao calcular hash:", erro);
    return null;
  }
}

function verificarImagemDuplicada(caminhoTemporario) {
  try {
    const hashNova = calcularHashArquivo(caminhoTemporario);
    if (!hashNova) return null;

    console.log(`[UPLOAD] Hash da nova imagem: ${hashNova}`);

    const arquivos = fs.readdirSync(uploadDir);

    for (const arquivo of arquivos) {
      if (arquivo.startsWith("temp_")) continue;

      const caminhoExistente = path.join(uploadDir, arquivo);
      const hashExistente = calcularHashArquivo(caminhoExistente);

      if (hashExistente === hashNova) {
        console.log(`[UPLOAD] Imagem duplicada encontrada: ${arquivo}`);
        return arquivo;
      }
    }

    const ext = path.extname(caminhoTemporario);
    const nomeComHash = `img_${hashNova.substring(0, 16)}${ext}`;
    const novoDestino = path.join(uploadDir, nomeComHash);

    if (!fs.existsSync(novoDestino)) {
      fs.renameSync(caminhoTemporario, novoDestino);
      console.log(`[UPLOAD] Arquivo salvo com hash: ${nomeComHash}`);
      return nomeComHash;
    }

    console.log("[UPLOAD] Arquivo com esse hash já existe, deletando temporário");
    fs.unlinkSync(caminhoTemporario);
    return nomeComHash;
  } catch (erro) {
    console.error("[UPLOAD] Erro ao verificar duplicata:", erro);
    return null;
  }
}

function verificarImagemDuplicadaLivro(caminhoTemporario) {
  try {
    console.log("[UPLOAD LIVRO] Iniciando processamento:", caminhoTemporario);

    if (!fs.existsSync(caminhoTemporario)) {
      console.error(
        "[UPLOAD LIVRO] Arquivo temporário não encontrado:",
        caminhoTemporario,
      );
      return null;
    }

    const hashNova = calcularHashArquivo(caminhoTemporario);
    if (!hashNova) {
      console.error("[UPLOAD LIVRO] Erro ao calcular hash do arquivo");
      return null;
    }

    console.log(`[UPLOAD LIVRO] Hash calculado: ${hashNova}`);

    const nomeTemporario = path.basename(caminhoTemporario);
    const ext = path.extname(nomeTemporario);

    console.log(
      `[UPLOAD LIVRO] Nome temporário: ${nomeTemporario}, Extensão: ${ext}`,
    );

    let arquivos = [];
    try {
      arquivos = fs.readdirSync(uploadDirLivrosCapa);
      console.log(
        "[UPLOAD LIVRO] Arquivos na pasta:",
        arquivos.slice(0, 5),
        `... (${arquivos.length} total)`,
      );
    } catch (err) {
      console.error("[UPLOAD LIVRO] Erro ao ler pasta:", err);
      return null;
    }

    for (const arquivo of arquivos) {
      if (arquivo.startsWith("temp_")) continue;

      const caminhoExistente = path.join(uploadDirLivrosCapa, arquivo);
      const hashExistente = calcularHashArquivo(caminhoExistente);

      if (hashExistente === hashNova) {
        console.log(`[UPLOAD LIVRO] Imagem duplicada encontrada: ${arquivo}`);
        try {
          fs.unlinkSync(caminhoTemporario);
          console.log("[UPLOAD LIVRO] Arquivo temporário deletado");
        } catch (err) {
          console.error("[UPLOAD LIVRO] Erro ao deletar temporário:", err);
        }
        return arquivo;
      }
    }

    const nomeComHash = `livro_${hashNova.substring(0, 16)}${ext}`;
    const novoDestino = path.join(uploadDirLivrosCapa, nomeComHash);

    console.log("[UPLOAD LIVRO] Renomeando arquivo:", {
      de: caminhoTemporario,
      para: novoDestino,
      ext,
      nomeComHash,
    });

    if (!fs.existsSync(novoDestino)) {
      try {
        fs.renameSync(caminhoTemporario, novoDestino);
        console.log(`[UPLOAD LIVRO] Arquivo salvo com sucesso: ${nomeComHash}`);

        if (fs.existsSync(novoDestino)) {
          console.log("[UPLOAD LIVRO] Arquivo salvo confirmado");
          console.log("[UPLOAD LIVRO] Verificando arquivo:", {
            caminho: novoDestino,
            existe: true,
            tamanho: fs.statSync(novoDestino).size,
          });
          return nomeComHash;
        }

        console.error(
          "[UPLOAD LIVRO] Arquivo não foi criado após renameSync",
        );
        return null;
      } catch (err) {
        console.error("[UPLOAD LIVRO] Erro ao renomear arquivo:", err);
        return null;
      }
    }

    console.log("[UPLOAD LIVRO] Arquivo com esse hash já existe");
    try {
      fs.unlinkSync(caminhoTemporario);
      console.log("[UPLOAD LIVRO] Arquivo temporário deletado");
    } catch (err) {
      console.error("[UPLOAD LIVRO] Erro ao deletar temporário:", err);
    }
    return nomeComHash;
  } catch (erro) {
    console.error("[UPLOAD LIVRO] Erro geral ao verificar duplicata:", erro);
    return null;
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const storageLivroCapa = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("[storageLivroCapa - destination]", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      destino: uploadDirLivrosCapa,
    });
    cb(null, uploadDirLivrosCapa);
  },
  filename: (req, file, cb) => {
    const ext = obterExtensaoLimpa(file.originalname);
    const tempName = `temp_${Date.now()}${ext}`;
    console.log("[storageLivroCapa - filename]", {
      originalname: file.originalname,
      extensaoExtraida: ext,
      nomeTemporario: tempName,
    });
    cb(null, tempName);
  },
});

const uploadLivroCapa = multer({
  storage: storageLivroCapa,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
module.exports.uploadLivroCapa = uploadLivroCapa;
module.exports.verificarImagemDuplicada = verificarImagemDuplicada;
module.exports.verificarImagemDuplicadaLivro = verificarImagemDuplicadaLivro;
module.exports.uploadDir = uploadDir;
module.exports.uploadDirLivrosCapa = uploadDirLivrosCapa;
