const aiClient = require('../config/openai.config');
const FileUtils = require('../utils/file.utils');

class ExtractHandler {
    static async extractTextFromImage(imageBase64) {
        try {
            console.log('Iniciando extração de texto da imagem...');
            console.log('Tamanho do base64:', imageBase64.length);
            
            const provider = process.env.AI_PROVIDER || 'openai';
            const model = provider === 'openai' ? 'gpt-4o' : 'deepseek-chat';
            
            let textExtract = 'Extraia o texto desta imagem de CNH. Retorne os dados estruturados como JSON no seguinte formato: { "nome_completo": "", "registro_cnh": "", "data_nascimento": "", "validade": "", "categoria": "", "cpf": "", "numero_documento": "", "orgao_emissor": "", "uf": "" }. Ignore selos, assinaturas digitais e textos genéricos. Não use blocos de código. Responda somente com o JSON puro, sem formatação Markdown. sem quebra de linha.';
            
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
            console.log('Configuração da requisição:', JSON.stringify(requestConfig, null, 2));
            
            const response = await aiClient.chat.completions.create(requestConfig);
            console.log('Resposta recebida:', JSON.stringify(response, null, 2));
            
            if (!response.choices || !response.choices[0] || !response.choices[0].message) {
                throw new Error('Resposta inválida do provedor de IA');
            }

            const extractedText = response.choices[0].message.content;
            
            if (!extractedText || extractedText.trim() === '') {
                throw new Error('Nenhum texto extraído da imagem');
            }

            return extractedText;
        } catch (error) {
            console.error('Erro detalhado ao extrair texto:', error);
            if (error.response) {
                console.error('Resposta de erro:', error.response.data);
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