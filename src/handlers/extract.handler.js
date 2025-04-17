const openai = require('../config/openai.config');
const FileUtils = require('../utils/file.utils');

class ExtractHandler {
    static async extractTextFromImage(imageBase64) {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4-vision-preview",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Extraia o texto desta imagem. Retorne apenas o texto extraído, sem formatação adicional." },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/jpeg;base64,${imageBase64}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('Erro ao extrair texto:', error);
            throw new Error('Falha ao extrair texto da imagem');
        }
    }

    static async handleExtraction(pdfBase64, filename) {
        try {
            // Validar entrada
            if (!FileUtils.isBase64(pdfBase64)) {
                throw new Error('Arquivo inválido: não é um base64 válido');
            }

            const fileType = FileUtils.getFileType(pdfBase64);
            
            // Converter PDF para imagem se necessário
            let imageBase64 = pdfBase64;
            if (fileType === 'pdf') {
                // TODO: Implementar conversão de PDF para imagem
                throw new Error('Conversão de PDF para imagem ainda não implementada');
            }

            // Extrair texto
            const extractedText = await this.extractTextFromImage(imageBase64);

            // Salvar texto extraído no S3
            const buffer = Buffer.from(extractedText, 'utf-8');
            const result = await FileUtils.uploadToS3(buffer, `${filename}.txt`, 'extracted');

            return {
                success: true,
                message: 'Texto extraído com sucesso',
                data: {
                    extractedText,
                    s3Location: result.key
                }
            };
        } catch (error) {
            console.error('Erro no processamento:', error);
            throw error;
        }
    }
}

module.exports = ExtractHandler; 