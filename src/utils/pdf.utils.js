const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const FileUtils = require('./file.utils');

class PdfUtils {
    static async checkDependencies() {
        return new Promise((resolve) => {
            // Verificar se é Ubuntu
            exec('lsb_release -i', async (lsbError) => {
                if (lsbError) {
                    console.error('Este sistema não é Ubuntu. Por favor, use Ubuntu para executar esta aplicação.');
                    resolve(false);
                    return;
                }

                // Verificar se é apt-get
                exec('which apt-get', async (aptError) => {
                    if (aptError) {
                        console.error('apt-get não encontrado. Este sistema não é compatível.');
                        resolve(false);
                        return;
                    }

                    // Verificar e instalar poppler-utils
                    exec('dpkg -l | grep poppler-utils', async (popplerError) => {
                        if (popplerError) {
                            console.log('Instalando poppler-utils...');
                            exec('sudo apt-get update && sudo apt-get install -y poppler-utils', (installError) => {
                                if (installError) {
                                    console.error('Erro ao instalar poppler-utils:', installError);
                                    resolve(false);
                                    return;
                                }
                                console.log('Poppler-utils instalado com sucesso');
                                resolve(true);
                            });
                        } else {
                            resolve(true);
                        }
                    });
                });
            });
        });
    }

    static async convertPdfToImage(pdfBase64, outputDir = '/tmp') {
        try {
            // Verificar e instalar dependências
            const dependenciesInstalled = await this.checkDependencies();
            if (!dependenciesInstalled) {
                throw new Error('Falha ao instalar dependências necessárias. Por favor, instale manualmente: sudo apt-get install poppler-utils');
            }

            // Criar diretório temporário se não existir
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Gerar nome único para o arquivo
            const timestamp = Date.now();
            const pdfPath = path.join(outputDir, `temp_${timestamp}.pdf`);
            const outputPath = path.join(outputDir, `temp_${timestamp}.png`);

            // Converter base64 para arquivo PDF
            const pdfBuffer = Buffer.from(pdfBase64, 'base64');
            await promisify(fs.writeFile)(pdfPath, pdfBuffer);

            // Converter PDF para PNG usando pdftoppm
            const command = `pdftoppm -png -singlefile -r 300 -scale-to 2000 "${pdfPath}" "${outputPath.replace('.png', '')}"`;
            
            await new Promise((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error('Erro ao executar pdftoppm:', error);
                        reject(error);
                        return;
                    }
                    resolve();
                });
            });

            // Verificar se a imagem foi gerada
            if (!fs.existsSync(outputPath)) {
                throw new Error('Falha ao gerar imagem do PDF');
            }

            // Ler a imagem gerada
            const imageBuffer = await promisify(fs.readFile)(outputPath);

            // Converter para base64
            const imageBase64 = imageBuffer.toString('base64');

            // Limpar arquivos temporários
            try {
                await promisify(fs.unlink)(pdfPath);
                await promisify(fs.unlink)(outputPath);
            } catch (cleanupError) {
                console.warn('Erro ao limpar arquivos temporários:', cleanupError);
            }

            return imageBase64;
        } catch (error) {
            console.error('Erro ao converter PDF para imagem:', error);
            throw new Error(`Falha ao converter PDF para imagem: ${error.message}`);
        }
    }
}

module.exports = PdfUtils; 