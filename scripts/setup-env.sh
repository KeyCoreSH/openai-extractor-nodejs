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

# Solicitar valores para as variáveis de ambiente
read -p "Digite a OPENAI_API_KEY: " openai_key
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