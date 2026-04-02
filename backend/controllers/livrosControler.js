const livrosModels = require("../models/livrosModels")
const multerConfig = require("../config/multer")

module.exports = {
    livroCadastro(req, res) {
        res.json({ titulo: "Cadastro" })
    },

    salvarLivro(req, res) {
        const { titulo, autor, genero, ano, numero_paginas, descricao, imagem_capa, editora, tipo_usuario } = req.body;

        const tipoUsuario = (tipo_usuario || '').toLowerCase().trim();
        if (!['bibliotecaria', 'bibliotecario', 'professor'].includes(tipoUsuario)) {
            return res.status(403).json({ mensagem: 'Apenas bibliotecárias/bibliotecários podem cadastrar livros.' });
        }

        livrosModels.guardar({ titulo, autor, genero, ano, numero_paginas, descricao, imagem_capa, editora }, (erro, novoLivro) => {
            if (erro) {
                console.error('falha ao inserir livro:', erro.sqlMessage);
                return res.status(500).json({ mensagem: "Erro ao salvar livro" });
            }

            res.json({
                titulo: "Cadastro confirmado",
                tipo: "cadastro",
                novoLivro
            });
        });
    },
    listarLivros(req, res) {
        const capaPadrao = 'https://gabrielchalita.com.br/wp-content/uploads/2019/12/semcapa.png';

        livrosModels.listarGeral((erro, livros) => {
            if (erro) {
                return res.status(500).json({ mensagem: "Erro ao ver lista livros" })
            }

            const livrosAtualizados = livros.map((livro) => {
                const capa = livro.imagem_capa && livro.imagem_capa.toString().trim()
                    ? livro.imagem_capa
                    : capaPadrao;

                return { ...livro, imagem_capa: capa };
            });

            // Atualiza permanentemente os livros sem capa no banco para evitar repetição futura.
            const livrosParaAtualizar = livrosAtualizados.filter((livro) => livro.imagem_capa === capaPadrao);
            if (livrosParaAtualizar.length > 0) {
                const ids = livrosParaAtualizar.map((livro) => livro.id);
                livrosModels.atualizarImagemCapaPadrao(ids, capaPadrao, (err) => {
                    if (err) {
                        console.error('Erro ao definir imagem de capa padrão nos livros:', err);
                    }
                });
            }

            res.json({
                titulo: "lista produtos",
                livros: livrosAtualizados
            })
        })
    },
    buscarLivro(req, res) {
        //Buscar id como parametro url
        const id = req.params.id

        //Acessar model para realizar busca
        livrosModels.irPorid(id, (erro, livro) => {
            //Se deu erro na busca, informar
            //ou se não achou usuario
            if (erro || !livro) {
                return res.status(500).json({ mensagem: "Erro ao buscar livro" })
            }

            
            

            // Se achou usuario, renderiza pagina de ediçõa
            res.json({
                titulo: "Edição",
                livro
            })
        })
    },
    atualizarLivro(req, res) {
        const id = req.params.id;
        const { titulo, autor, genero, ano, numero_paginas, descricao, imagem_capa, editora } = req.body;

        console.log("[atualizarLivro] ID:", id);
        console.log("[atualizarLivro] Dados recebidos:", { titulo, autor, genero, ano, numero_paginas, descricao, imagem_capa, editora });

        livrosModels.Renovar(id, { titulo, autor, genero, ano, numero_paginas, descricao, imagem_capa, editora }, (erro, resultado) => {

            if (erro) {
                console.error("[atualizarLivro] Erro ao atualizar:", erro);
                return res.status(500).json({ mensagem: "Erro ao atualizar livro", erro: erro.message });
            }

            console.log("[atualizarLivro] Livro atualizado com sucesso:", resultado);
             
            res.json({
                tipo: "edicao",
                titulo: "Edição confirmada",
                livroAtualizado: resultado
            });

        });

    },
    salvarFavorita(req, res) {
        const { usuario_id, livro_id, parte_favorita } = req.body;

        livrosModels.salvarFavorita({ usuario_id, livro_id, parte_favorita }, (erro, resultado) => {
            if (erro) {
                return res.status(500).json({ mensagem: "Erro ao salvar favorita" });
            }

            res.json({
                titulo: "Favorita salva",
                favorita: resultado
            });
        });
    },
    buscarFavorita(req, res) {
        const { livroId, usuarioId } = req.params;

        livrosModels.buscarFavorita(usuarioId, livroId, (erro, resultado) => {
            if (erro) {
                return res.status(500).json({ mensagem: "Erro ao buscar favorita" });
            }

            res.json({
                favorita: resultado || null
            });
        });
    },
    deletarLivro(req, res) {
        const id = req.params.id

        //Acessar model e solicitar a exclusão do usuario
        livrosModels.deletar(id, (erro, sucesso) => {

            if (erro || !sucesso) {
                return res.status(500).json({ mensagem: "Erro ao deletar livro" })
            }

      

            const deletado = { livro: "Selecionado" }
            // Renderiza a tela de sucesso
            res.json({
                tipo: "excluir",
                titulo: "livro deletado",
                deletado
            })
        })
    }
}