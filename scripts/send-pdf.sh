#!/bin/bash

# Verificar se o arquivo existe
if [ ! -f "example/CNH-e.pdf" ]; then
    echo "Erro: Arquivo example/CNH-e.pdf não encontrado"
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
    "filename": "CNH-e.pdf"
}' >> "$TEMP_FILE"

# Enviar para o endpoint usando o arquivo temporário
curl -X POST \
     -H "Content-Type: application/json" \
     -d "@$TEMP_FILE" \
     https://extract.logt.com.br/extract

# Limpar arquivos temporários
rm "$TEMP_FILE" "$TEMP_PDF" 