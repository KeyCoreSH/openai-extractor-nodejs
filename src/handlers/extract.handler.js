const aiClient = require('../config/openai.config');
const FileUtils = require('../utils/file.utils');
const PdfUtils = require('../utils/pdf.utils');

class ExtractHandler {
    static async extractTextFromImage(imageBase64, prompt) {
        try {
            console.log('Iniciando extração de texto da imagem...');
            console.log('Prompt:', prompt);
            console.log('Tamanho do base64:', imageBase64.length);
            
            const provider = process.env.AI_PROVIDER || 'openai';
            const model = provider === 'openai' ? 'gpt-4o' : 'deepseek-chat';
            
            // Usar prompt recebido
            const textExtract = prompt || 'Extraia o texto desta imagem. Retorne os dados estruturados como JSON.';
            
            let requestConfig;
            
            // Usar o mesmo formato para ambos os provedores
            requestConfig = {
                model: model,
                messages: [
                    {
                        role: "user",
                        content: [
                            { 
                                type: "text", 
                                text: textExtract
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/png;base64,${imageBase64}`,
                                    detail: "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 10000,
                temperature: 0.2,
                response_format: { type: "text" }
            };

            console.log('Enviando requisição para:', provider);
            
            const response = await aiClient.chat.completions.create(requestConfig);
            
            if (!response.choices || !response.choices[0] || !response.choices[0].message) {
                throw new Error('Resposta inválida do provedor de IA');
            }

            const extractedText = response.choices[0].message.content;
            
            if (!extractedText || extractedText.trim() === '') {
                throw new Error('Nenhum texto extraído da imagem');
            }

            // Converter a string JSON escapada em um objeto JSON válido
            let jsonData;
            try {
                // Primeiro, remover as barras invertidas de escape
                const cleanJsonString = extractedText.replace(/\\/g, '');
                // Converter para objeto JSON
                jsonData = JSON.parse(cleanJsonString);
            } catch (parseError) {
                console.error('Erro ao converter JSON:', parseError);
                throw new Error('Falha ao converter dados extraídos para JSON');
            }

            return jsonData;
        } catch (error) {
            console.error('Erro detalhado ao extrair texto:', error);
            if (error.response) {
                console.error('Resposta de erro:', error.response.data);
            }
            throw new Error(`Falha ao extrair texto da imagem: ${error.message}`);
        }
    }

    static async handleExtraction(pdfBase64, filename, prompt) {
        try {
            console.log('Iniciando processamento do arquivo:', filename);
            console.log('Prompt:', prompt);
            
            // Validar entrada
            if (!FileUtils.isBase64(pdfBase64)) {
                throw new Error('Arquivo inválido: não é um base64 válido');
            }

            const fileType = FileUtils.getFileType(pdfBase64);
            console.log('Tipo de arquivo detectado:', fileType);
            
            // Converter PDF para imagem se necessário
            let imageBase64 = pdfBase64;
            if (fileType === 'pdf') {
                console.log('Convertendo PDF para imagem...');
                imageBase64 = await PdfUtils.convertPdfToImage(pdfBase64);
                console.log('PDF convertido para imagem com sucesso');
            }

            // Extrair texto
            console.log('Extraindo texto...');
            const extractedText = await this.extractTextFromImage(imageBase64, prompt);
            console.log('Texto extraído com sucesso');

            // Salvar imagem no S3
            console.log('Salvando imagem no S3...');
            const imageBuffer = Buffer.from(imageBase64, 'base64');
            const s3Result = await FileUtils.uploadToS3(imageBuffer, filename, 'images');
            console.log('Imagem salva no S3:', s3Result.key);

            // Construir URL do S3
            const s3Url = `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${s3Result.key}`;

            return {
                success: true,
                message: 'Processamento concluído com sucesso',
                data: {
                    extractedText,
                    imageUrl: s3Url
                }
            };
        } catch (error) {
            console.error('Erro detalhado no processamento:', error);
            throw error;
        }
    }
}

module.exports = ExtractHandler; 