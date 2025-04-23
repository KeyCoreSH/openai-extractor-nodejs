#!/bin/bash

# Carregar variáveis de ambiente
if [ -f .env ]; then
    echo "Carregando variáveis de ambiente do arquivo .env"
    source .env
else
    echo "Arquivo .env não encontrado"
    exit 1
fi

# Verificar OPENAI_API_KEY
if [ -z "$OPENAI_API_KEY" ]; then
    echo "Erro: OPENAI_API_KEY não está definida"
    exit 1
fi

# Verificar formato da API key
if [[ ! "$OPENAI_API_KEY" =~ ^sk- ]]; then
    echo "Erro: OPENAI_API_KEY não começa com 'sk-'"
    exit 1
fi

# Mostrar informações (ocultando parte da API key)
echo "Variáveis de ambiente carregadas:"
echo "OPENAI_API_KEY: ${OPENAI_API_KEY:0:7}..."
echo "AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID:0:4}..."
echo "S3_BUCKET: $S3_BUCKET"
echo "S3_REGION: $S3_REGION"

# Testar conexão com OpenAI
echo -e "\nTestando conexão com OpenAI..."
curl -s -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models \
     | jq -r '.data[0].id'

if [ $? -eq 0 ]; then
    echo "Conexão com OpenAI bem-sucedida!"
else
    echo "Erro ao conectar com OpenAI. Verifique sua API key."
    exit 1
fi 