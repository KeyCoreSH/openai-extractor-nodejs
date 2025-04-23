const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const pdf = require('pdf-poppler');
const FileUtils = require('./file.utils');

class PdfUtils {
    static async checkDependencies() {
        return new Promise((resolve) => {
            // Detectar o sistema operacional
            const isMacOS = process.platform === 'darwin';
            const isLinux = process.platform === 'linux';

            if (isMacOS) {
                // Verificar se o Homebrew está instalado
                exec('which brew', async (brewError) => {
                    if (brewError) {
                        console.error('Homebrew não está instalado. Por favor, instale o Homebrew primeiro:');
                        console.error('/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
                        resolve(false);
                        return;
                    }

                    // Verificar e instalar cairo
                    exec('brew list cairo', async (cairoError) => {
                        if (cairoError) {
                            console.log('Instalando cairo...');
                            exec('brew install cairo', (installError) => {
                                if (installError) {
                                    console.error('Erro ao instalar cairo:', installError);
                                    resolve(false);
                                    return;
                                }
                                console.log('Cairo instalado com sucesso');
                            });
                        }

                        // Verificar e instalar poppler
                        exec('brew list poppler', async (popplerError) => {
                            if (popplerError) {
                                console.log('Instalando poppler...');
                                exec('brew install poppler', (installError) => {
                                    if (installError) {
                                        console.error('Erro ao instalar poppler:', installError);
                                        resolve(false);
                                        return;
                                    }
                                    console.log('Poppler instalado com sucesso');
                                    resolve(true);
                                });
                            } else {
                                resolve(true);
                            }
                        });
                    });
                });
            } else if (isLinux) {
                // Verificar se é Ubuntu/Debian
                exec('which apt-get', async (aptError) => {
                    if (!aptError) {
                        // Verificar e instalar cairo
                        exec('dpkg -l | grep libcairo2', async (cairoError) => {
                            if (cairoError) {
                                console.log('Instalando cairo...');
                                exec('sudo apt-get update && sudo apt-get install -y libcairo2-dev', (installError) => {
                                    if (installError) {
                                        console.error('Erro ao instalar cairo:', installError);
                                        resolve(false);
                                        return;
                                    }
                                    console.log('Cairo instalado com sucesso');
                                });
                            }

                            // Verificar e instalar poppler
                            exec('dpkg -l | grep poppler-utils', async (popplerError) => {
                                if (popplerError) {
                                    console.log('Instalando poppler...');
                                    exec('sudo apt-get update && sudo apt-get install -y poppler-utils', (installError) => {
                                        if (installError) {
                                            console.error('Erro ao instalar poppler:', installError);
                                            resolve(false);
                                            return;
                                        }
                                        console.log('Poppler instalado com sucesso');
                                        resolve(true);
                                    });
                                } else {
                                    resolve(true);
                                }
                            });
                        });
                    } else {
                        // Verificar se é CentOS/RHEL
                        exec('which yum', async (yumError) => {
                            if (!yumError) {
                                // Verificar e instalar cairo
                                exec('rpm -q cairo', async (cairoError) => {
                                    if (cairoError) {
                                        console.log('Instalando cairo...');
                                        exec('sudo yum install -y cairo-devel', (installError) => {
                                            if (installError) {
                                                console.error('Erro ao instalar cairo:', installError);
                                                resolve(false);
                                                return;
                                            }
                                            console.log('Cairo instalado com sucesso');
                                        });
                                    }

                                    // Verificar e instalar poppler
                                    exec('rpm -q poppler-utils', async (popplerError) => {
                                        if (popplerError) {
                                            console.log('Instalando poppler...');
                                            exec('sudo yum install -y poppler-utils', (installError) => {
                                                if (installError) {
                                                    console.error('Erro ao instalar poppler:', installError);
                                                    resolve(false);
                                                    return;
                                                }
                                                console.log('Poppler instalado com sucesso');
                                                resolve(true);
                                            });
                                        } else {
                                            resolve(true);
                                        }
                                    });
                                });
                            } else {
                                console.error('Sistema operacional não suportado ou gerenciador de pacotes não encontrado');
                                console.error('Para Ubuntu/Debian: sudo apt-get install libcairo2-dev poppler-utils');
                                console.error('Para CentOS/RHEL: sudo yum install cairo-devel poppler-utils');
                                resolve(false);
                            }
                        });
                    }
                });
            } else {
                console.error('Sistema operacional não suportado');
                resolve(false);
            }
        });
    }

    static async convertPdfToImage(pdfBase64, outputDir = '/tmp') {
        try {
            // Verificar e instalar dependências
            const dependenciesInstalled = await this.checkDependencies();
            if (!dependenciesInstalled) {
                throw new Error('Falha ao instalar dependências necessárias. Por favor, instale manualmente as dependências.');
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

            // Configurar opções de conversão
            const opts = {
                format: 'png',
                out_dir: outputDir,
                out_prefix: `temp_${timestamp}`,
                page: 1, // Converter apenas a primeira página
                scale: 2.0, // Aumentar a resolução
                dpi: 300 // Alta qualidade
            };

            // Converter PDF para imagem
            await pdf.convert(pdfPath, opts);

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