const express = require('express');
const bodyParser = require('body-parser');
const ExtractHandler = require('./handlers/extract.handler');
require('dotenv').config();

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

app.post('/extract', async (req, res) => {
    try {
        const { pdfBase64, filename } = req.body;

        if (!pdfBase64 || !filename) {
            return res.status(400).json({
                success: false,
                message: 'pdfBase64 e filename são obrigatórios'
            });
        }

        const result = await ExtractHandler.handleExtraction(pdfBase64, filename);
        res.json(result);
    } catch (error) {
        console.error('Erro na API:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erro interno do servidor'
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 