const path = require('path')

const express = require('express')
const cors = require('cors')

const fs = require('fs')
const multerConfig = require('./config/multer')

const app = express()

app.use(cors())
let frase = "Dudu maravilhoso"

const port = 3000


// const caminho = path.join(__dirname, "views")

const usuarioRoutes = require("./routes/usuarioRoutes")
const livrosRoutes = require("./routes/livrosRoutes")
const resenhaRoutes = require("./routes/resenhaRoutes")
const bibliotecaRoutes = require("./routes/bibliotecaRoutes")
const avaliacoesRoutes = require("./routes/avaliacoesRoutes")
const PFRoutes = require("./routes/PFRoutes")
const rankingRoutes = require("./routes/rankingRoutes")

app.use(express.urlencoded({extended:true}))
app.use(express.json())

app.use(express.static(path.join(__dirname, '..', 'frontend')))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Rota de teste para debug
app.get('/test-uploads', (req, res) => {
  const uploadPath = path.join(__dirname, 'uploads', 'perfis');
  const uploadPathLivros = path.join(__dirname, 'uploads', 'livro_capa');
  
  try {
    const filesProfile = fs.readdirSync(uploadPath);
    const filesLivro = fs.readdirSync(uploadPathLivros);
    
    res.json({ 
      mensagem: 'Upload path funcionando',
      perfis: {
        path: uploadPath,
        arquivos: filesProfile
      },
      livros: {
        path: uploadPathLivros,
        arquivos: filesLivro
      }
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Rota para verificar se arquivo de imagem existe
app.get('/verificar-arquivo/:tipo/:nome', (req, res) => {
  const { tipo, nome } = req.params;
  const uploadDir = tipo === 'livro' ? 
    path.join(__dirname, 'uploads', 'livro_capa') :
    path.join(__dirname, 'uploads', 'perfis');
  
  const caminhoCompleto = path.join(uploadDir, nome);
  const existe = fs.existsSync(caminhoCompleto);
  
  console.log(`[verificar-arquivo] Verificando: ${caminhoCompleto} - Existe: ${existe}`);
  
  if (existe) {
    const stats = fs.statSync(caminhoCompleto);
    res.json({ 
      existe: true, 
      tamanho: stats.size, 
      caminho: caminhoCompleto,
      mensagem: 'Arquivo encontrado'
    });
  } else {
    // Listar arquivos da pasta
    const arquivos = fs.readdirSync(uploadDir);
    console.log('[verificar-arquivo] Arquivos na pasta:', arquivos);
    res.status(404).json({ 
      existe: false, 
      caminho: caminhoCompleto,
      arquivosNaPasta: arquivos,
      mensagem: 'Arquivo não encontrado'
    });
  }
});

// Rota para debug - mostrar último livro adicionado
app.get('/debug/ultimo-livro', (req, res) => {
  const conn = require('./config/banco');
  const sql = 'SELECT id, titulo, imagem_capa FROM livros ORDER BY id DESC LIMIT 5';
  
  conn.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ erro: err.message });
    }
    
    res.json({
      mensagem: 'Últimos 5 livros',
      livros: results.map(l => ({
        id: l.id,
        titulo: l.titulo,
        imagem_capa: l.imagem_capa,
        arquivo: path.basename(l.imagem_capa || '')
      }))
    });
  });
});

// Endpoint para upload de imagem de livro
app.post('/upload-livro-capa', multerConfig.uploadLivroCapa.single('imagemFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        sucesso: false,
        mensagem: 'Nenhum arquivo foi enviado' 
      });
    }

    const caminhoTemporario = path.join(
      multerConfig.uploadDirLivrosCapa,
      req.file.filename,
    );
    const nomeArquivoFinal =
      multerConfig.verificarImagemDuplicadaLivro(caminhoTemporario);

    if (!nomeArquivoFinal) {
      return res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao processar imagem do livro',
      });
    }

    const urlImagem = `/uploads/livro_capa/${nomeArquivoFinal}`;
    
    res.json({
      sucesso: true,
      url: urlImagem,
      arquivo: nomeArquivoFinal,
      mensagem: 'Upload realizado com sucesso'
    });
  } catch (erro) {
    console.error('[UPLOAD] Erro:', erro);
    res.status(500).json({ 
      sucesso: false,
      mensagem: 'Erro ao fazer upload: ' + erro.message 
    });
  }
});

app.use("/livros", livrosRoutes)
app.use("/usuario", usuarioRoutes)
app.use("/resenha", resenhaRoutes)
app.use("/biblioteca", bibliotecaRoutes)
app.use("/avaliacoes", avaliacoesRoutes)
app.use("/PF", PFRoutes)
app.use("/ranking", rankingRoutes)

// app.set('view engine', 'ejs')

// Definindo 'Atalho' onde buscar as views
// app.set("views", path.join(__dirname, "views"))

// app.use(express.static('public'))

//Rota de pagina inicial
// app.get("/home", (req,res) => {
//    res.render("login", {titulo: "Logado"})
// })
// //Rota inicial do projeto
// app.get("/", (req,res) => {
//     res.render("login", { titulo: "Login"})
// })

// // caso digite uma rota que não existe, leva para 404.ejs
// app.use((req, res) => {
//     res.status(404)
//     res.render("404", { titulo: "Pagina de erro"})
// })

//Coloca o servidor para funcionar
app.listen(port, () => {
    console.log(`Servidor funcionando em http://localhost:${port}`);
})





