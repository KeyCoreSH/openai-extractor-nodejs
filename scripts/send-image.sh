#!/bin/bash

# Verificar se o arquivo existe
if [ ! -f "example/cnh-image.png" ]; then
    echo "Erro: Arquivo example/cnh-image.png não encontrado"
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

# Criar arquivo temporário para a imagem na pasta /tmp
TEMP_IMAGE="/tmp/image_$(date +%s).png"

# Copiar a imagem original para o arquivo temporário
cp "example/cnh-image.png" "$TEMP_IMAGE"

# Verificar o tamanho do arquivo
FILE_SIZE=$(stat -f%z "$TEMP_IMAGE")
echo "Tamanho do arquivo: $FILE_SIZE bytes"
echo "Arquivo temporário salvo em: $TEMP_IMAGE"

# Criar arquivo temporário para o payload na pasta /tmp
TEMP_FILE="/tmp/payload_$(date +%s).json"

# Converter imagem para base64 e criar o payload JSON
echo '{
    "pdfBase64": "' > "$TEMP_FILE"
base64 -i "$TEMP_IMAGE" | tr -d '\n' >> "$TEMP_FILE"
echo '",
    "filename": "cnh-image.png",
    "typeDoc": "'"$TYPE_DOC"'"
}' >> "$TEMP_FILE"

# Enviar para o endpoint usando o arquivo temporário
echo "Enviando para $ENDPOINT/extract..."
curl -X POST \
     -H "Content-Type: application/json" \
     -d "@$TEMP_FILE" \
     "$ENDPOINT/extract"

echo "Arquivos temporários mantidos em:"
echo "- Imagem: $TEMP_IMAGE"
echo "- Payload: $TEMP_FILE" 