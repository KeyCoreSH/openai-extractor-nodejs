# Documentação - OpenAI Extractor

## Visão Geral
O OpenAI Extractor é uma ferramenta que utiliza inteligência artificial para extrair texto de imagens e PDFs. A ferramenta suporta tanto o OpenAI quanto o Deepseek como provedores de IA.

## Requisitos do Sistema
- Node.js 14 ou superior
- Ubuntu (sistema operacional)
- Poppler-utils instalado (para processamento de PDFs)

## Instalação

### 1. Instalar Dependências do Sistema
```bash
sudo apt-get update
sudo apt-get install -y poppler-utils
```

### 2. Instalar Dependências do Projeto
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
OPENAI_API_KEY=sua_chave_api_openai
# ou
DEEPSEEK_API_KEY=sua_chave_api_deepseek

PROVIDER=openai # ou deepseek
PORT=3000
```

## Uso

### 1. Iniciar o Servidor
```bash
node src/index.js
```

### 2. Enviar Imagem para Extração
```bash
./scripts/send-image.sh <caminho_para_imagem> <tipo_documento>
```

Exemplo:
```bash
./scripts/send-image.sh /caminho/para/imagem.jpg nota_fiscal
```

Tipos de documento suportados:
- nota_fiscal
- boleto
- recibo
- contrato
- outros

### 3. Enviar PDF para Extração
```bash
./scripts/send-pdf.sh <caminho_para_pdf> <tipo_documento>
```

Exemplo:
```bash
./scripts/send-pdf.sh /caminho/para/documento.pdf contrato
```

## Endpoints da API

### Extrair Texto de Imagem
```
POST /api/extract/image
```

Corpo da requisição:
```json
{
    "image": "base64_da_imagem",
    "typeDoc": "tipo_do_documento"
}
```

### Extrair Texto de PDF
```
POST /api/extract/pdf
```

Corpo da requisição:
```json
{
    "pdf": "base64_do_pdf",
    "typeDoc": "tipo_do_documento"
}
```

## Respostas da API

### Sucesso
```json
{
    "success": true,
    "data": {
        "text": "texto_extraido",
        "typeDoc": "tipo_do_documento"
    }
}
```

### Erro
```json
{
    "success": false,
    "error": "mensagem_de_erro"
}
```

## Códigos de Erro Comuns

- `400`: Requisição inválida
- `401`: Chave de API incorreta
- `413`: Arquivo muito grande
- `500`: Erro interno do servidor

## Limitações

- Tamanho máximo do arquivo: 50MB
- Formatos suportados:
  - Imagens: JPG, PNG
  - PDFs: Qualquer PDF válido

## Solução de Problemas

### 1. Erro "401 Incorrect API key provided"
- Verifique se a chave de API está correta no arquivo `.env`
- Confirme se a chave está ativa no provedor escolhido

### 2. Erro "413 Request Entity Too Large"
- Reduza o tamanho do arquivo
- Comprima a imagem antes de enviar

### 3. Erro "Falha ao converter PDF para imagem"
- Verifique se o poppler-utils está instalado
- Confirme se o PDF não está corrompido

## Suporte

Para suporte adicional, entre em contato com a equipe de desenvolvimento. 