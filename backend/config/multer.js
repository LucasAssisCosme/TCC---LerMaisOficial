const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
    const name = `usuario_${req.params.id}_${Date.now()}${ext}`;
    cb(null, name);
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

// Exportar instância do multer
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;
