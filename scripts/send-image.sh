#!/bin/bash

# Verificar se o arquivo existe
if [ ! -f "example/cnh-image.png" ]; then
    echo "Erro: Arquivo example/cnh-image.png não encontrado"
    exit 1
fi

# Criar arquivo temporário para a imagem comprimida
TEMP_IMAGE=$(mktemp).png

# Comprimir a imagem
convert "example/cnh-image.png" -resize 50% -quality 80 "$TEMP_IMAGE"

# Verificar o tamanho do arquivo
FILE_SIZE=$(stat -f%z "$TEMP_IMAGE")
echo "Tamanho do arquivo comprimido: $FILE_SIZE bytes"

# Criar arquivo temporário para o payload
TEMP_FILE=$(mktemp)

# Converter imagem para base64 e criar o payload JSON
echo '{
    "pdfBase64": "' > "$TEMP_FILE"
base64 -i "$TEMP_IMAGE" | tr -d '\n' >> "$TEMP_FILE"
echo '",
    "filename": "cnh-image.png"
}' >> "$TEMP_FILE"

# Enviar para o endpoint usando o arquivo temporário
curl -X POST \
     -H "Content-Type: application/json" \
     -d "@$TEMP_FILE" \
     https://extract.logt.com.br/extract

# Limpar arquivos temporários
rm "$TEMP_FILE" "$TEMP_IMAGE" 