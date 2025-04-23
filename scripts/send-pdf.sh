#!/bin/bash

# Verificar se o arquivo existe
if [ ! -f "example/CNH-e.pdf" ]; then
    echo "Erro: Arquivo example/CNH-e.pdf não encontrado"
    exit 1
fi

# Definir o endpoint baseado no ambiente
ENDPOINT=""
if [ "$1" == "local" ]; then
    ENDPOINT="http://localhost:3008"
elif [ "$1" == "prod" ]; then
    ENDPOINT="https://extract.logt.com.br"
else
    echo "Uso: $0 [local|prod] [tipo_documento]"
    echo "  local - Usa o servidor local (http://localhost:3008)"
    echo "  prod  - Usa o servidor de produção (https://extract.logt.com.br)"
    echo "  tipo_documento - Tipo do documento (CNH, RG, CPF, comprovante_de_residencia, ANTT, CNPJ, CRLV)"
    exit 1
fi

# Verificar se o tipo de documento foi fornecido
if [ -z "$2" ]; then
    echo "Erro: Tipo de documento não fornecido"
    echo "Tipos suportados: CNH, RG, CPF, comprovante_de_residencia, ANTT, CNPJ, CRLV"
    exit 1
fi

TYPE_DOC="$2"

# Validar o tipo de documento
VALID_TYPES=("CNH" "RG" "CPF" "comprovante_de_residencia" "ANTT" "CNPJ" "CRLV")
if [[ ! " ${VALID_TYPES[@]} " =~ " ${TYPE_DOC} " ]]; then
    echo "Erro: Tipo de documento inválido"
    echo "Tipos suportados: ${VALID_TYPES[*]}"
    exit 1
fi

# Criar arquivo temporário para o PDF otimizado
TEMP_PDF=$(mktemp).pdf

# Otimizar o PDF (se o ghostscript estiver instalado)
if command -v gs &> /dev/null; then
    gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile="$TEMP_PDF" "example/CNH-e.pdf"
else
    # Se não tiver ghostscript, usar o arquivo original
    cp "example/CNH-e.pdf" "$TEMP_PDF"
fi

# Verificar o tamanho do arquivo
FILE_SIZE=$(stat -f%z "$TEMP_PDF")
echo "Tamanho do arquivo PDF: $FILE_SIZE bytes"

# Criar arquivo temporário para o payload
TEMP_FILE=$(mktemp)

# Converter PDF para base64 e criar o payload JSON
echo '{
    "pdfBase64": "' > "$TEMP_FILE"
base64 -i "$TEMP_PDF" | tr -d '\n' >> "$TEMP_FILE"
echo '",
    "filename": "CNH-e.pdf",
    "typeDoc": "'"$TYPE_DOC"'"
}' >> "$TEMP_FILE"

# Enviar para o endpoint usando o arquivo temporário
echo "Enviando para $ENDPOINT/extract..."
curl -X POST \
     -H "Content-Type: application/json" \
     -d "@$TEMP_FILE" \
     "$ENDPOINT/extract"

# Limpar arquivos temporários
rm "$TEMP_FILE" "$TEMP_PDF" 