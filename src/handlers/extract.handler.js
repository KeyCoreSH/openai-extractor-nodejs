const openai = require('../config/openai.config');
const FileUtils = require('../utils/file.utils');

class ExtractHandler {
    static async extractTextFromImage(imageBase64) {
        try {
            console.log('Iniciando extração de texto da imagem...');
            
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: [
                            { 
                                type: "text", 
                                text: "Extraia o texto desta imagem. Retorne apenas o texto extraído, sem formatação adicional. Se não conseguir extrair texto, retorne 'Nenhum texto encontrado'." 
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
                max_tokens: 1000,
                temperature: 0.1
            });

            console.log('Resposta da OpenAI recebida');
            
            if (!response.choices || !response.choices[0] || !response.choices[0].message) {
                throw new Error('Resposta inválida da OpenAI');
            }

            const extractedText = response.choices[0].message.content;
            
            if (!extractedText || extractedText.trim() === '') {
                throw new Error('Nenhum texto extraído da imagem');
            }

            return extractedText;
        } catch (error) {
            console.error('Erro detalhado ao extrair texto:', error);
            if (error.response) {
                console.error('Resposta de erro da OpenAI:', error.response.data);
            }
            throw new Error(`Falha ao extrair texto da imagem: ${error.message}`);
        }
    }

    static async handleExtraction(pdfBase64, filename) {
        try {
            console.log('Iniciando processamento do arquivo:', filename);
            
            // Validar entrada
            if (!FileUtils.isBase64(pdfBase64)) {
                throw new Error('Arquivo inválido: não é um base64 válido');
            }

            const fileType = FileUtils.getFileType(pdfBase64);
            console.log('Tipo de arquivo detectado:', fileType);
            
            // Converter PDF para imagem se necessário
            let imageBase64 = pdfBase64;
            if (fileType === 'pdf') {
                // TODO: Implementar conversão de PDF para imagem
                throw new Error('Conversão de PDF para imagem ainda não implementada');
            }

            // Extrair texto
            console.log('Extraindo texto...');
            const extractedText = await this.extractTextFromImage(imageBase64);
            console.log('Texto extraído com sucesso');

            // Salvar texto extraído no S3
            console.log('Salvando texto no S3...');
            const buffer = Buffer.from(extractedText, 'utf-8');
            const result = await FileUtils.uploadToS3(buffer, `${filename}.txt`, 'extracted');
            console.log('Texto salvo no S3:', result.key);

            return {
                success: true,
                message: 'Texto extraído com sucesso',
                data: {
                    extractedText,
                    s3Location: result.key
                }
            };
        } catch (error) {
            console.error('Erro detalhado no processamento:', error);
            throw error;
        }
    }
}

module.exports = ExtractHandler; 