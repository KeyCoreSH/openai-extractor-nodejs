#!/bin/bash

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo "Criando arquivo .env..."
    touch .env
fi

# Função para adicionar ou atualizar variável no .env
set_env_var() {
    local var_name=$1
    local var_value=$2
    
    # Remove a variável se já existir
    sed -i "/^$var_name=/d" .env
    
    # Adiciona a nova variável
    echo "$var_name=$var_value" >> .env
}

# Função para validar API key
validate_api_key() {
    local api_key=$1
    if [[ ! "$api_key" =~ ^sk-[a-zA-Z0-9]{32,}$ ]]; then
        echo "Erro: API key inválida. Deve começar com 'sk-' e ter pelo menos 32 caracteres."
        return 1
    fi
    return 0
}

# Solicitar e validar OPENAI_API_KEY
while true; do
    read -p "Digite a OPENAI_API_KEY (começa com sk-): " openai_key
    if validate_api_key "$openai_key"; then
        break
    fi
done

# Solicitar outros valores
read -p "Digite a AWS_ACCESS_KEY_ID: " aws_access_key
read -p "Digite a AWS_SECRET_ACCESS_KEY: " aws_secret_key
read -p "Digite o S3_BUCKET: " s3_bucket
read -p "Digite a S3_REGION: " s3_region

# Configurar as variáveis
set_env_var "OPENAI_API_KEY" "$openai_key"
set_env_var "AWS_ACCESS_KEY_ID" "$aws_access_key"
set_env_var "AWS_SECRET_ACCESS_KEY" "$aws_secret_key"
set_env_var "S3_BUCKET" "$s3_bucket"
set_env_var "S3_REGION" "$s3_region"

echo "Variáveis de ambiente configuradas com sucesso!"

# Testar a API key
echo -e "\nTestando a API key..."
curl -s -H "Authorization: Bearer $openai_key" \
     https://api.openai.com/v1/models \
     | jq -r '.data[0].id'

if [ $? -eq 0 ]; then
    echo "API key válida e funcionando!"
else
    echo "Erro: API key inválida ou sem permissões. Verifique se:"
    echo "1. A API key está correta"
    echo "2. A API key tem permissões para acessar os modelos"
    echo "3. A conta está ativa e com créditos suficientes"
fi 