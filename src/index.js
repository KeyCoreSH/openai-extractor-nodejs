// Carregar variáveis de ambiente primeiro
require('dotenv').config();

// Verificar se as variáveis de ambiente necessárias estão definidas
const requiredEnvVars = ['OPENAI_API_KEY', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET', 'S3_REGION'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Variáveis de ambiente ausentes:', missingEnvVars);
    process.exit(1);
}

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const ExtractHandler = require('./handlers/extract.handler');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Rota GET para a raiz
app.get('/', (req, res) => {
    res.json({
        name: "OpenAI Extractor",
        version: "1.0.0",
        description: "Sistema de captura e extração de dados de documentos PDF e imagens",
        endpoints: {
            extract: {
                method: "POST",
                path: "/extract",
                description: "Extrai texto de documentos PDF ou imagens",
                parameters: {
                    pdfBase64: "string (base64 do arquivo)",
                    filename: "string (nome do arquivo)"
                }
            }
        },
        features: [
            "Extração de texto de PDFs",
            "Extração de texto de imagens",
            "Armazenamento em S3",
            "Processamento assíncrono",
            "Suporte a múltiplos formatos"
        ],
        status: "online",
        uptime: process.uptime()
    });
});

app.post('/extract', async (req, res) => {
    try {
        const { pdfBase64, filename, prompt } = req.body;

        if (!pdfBase64 || !filename || !prompt) {
            return res.status(400).json({
                success: false,
                message: 'pdfBase64, filename e prompt são obrigatórios'
            });
        }

        console.log('=> filename:', filename);
        console.log('=> prompt:', prompt);
        
        const result = await ExtractHandler.handleExtraction(pdfBase64, filename, prompt);
        res.json(result);
    } catch (error) {
        console.error('Erro na API:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erro interno do servidor'
        });
    }
});

const PORT = process.env.PORT || 3008;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log('Variáveis de ambiente carregadas:', {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Definida' : 'Não definida',
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'Definida' : 'Não definida',
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'Definida' : 'Não definida',
        S3_BUCKET: process.env.S3_BUCKET ? 'Definida' : 'Não definida',
        S3_REGION: process.env.S3_REGION ? 'Definida' : 'Não definida'
    });
}); 
