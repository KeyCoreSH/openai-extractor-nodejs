const OpenAI = require('openai');
const dotenv = require('dotenv');

dotenv.config();

const provider = process.env.AI_PROVIDER || 'openai';
const apiKey = process.env.AI_API_KEY;

if (!apiKey) {
    throw new Error('AI_API_KEY não configurada no arquivo .env');
}

let client;

if (provider === 'openai') {
    client = new OpenAI({
        apiKey: apiKey
    });
} else if (provider === 'deepseek') {
    client = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://api.deepseek.com/v1'
    });
} else {
    throw new Error(`Provedor de IA não suportado: ${provider}`);
}

// Testar a conexão
async function testConnection() {
    try {
        const response = await client.models.list();
        console.log('Conexão com OpenAI estabelecida com sucesso');
        console.log('Modelos disponíveis:', response.data.map(m => m.id).join(', '));
        return true;
    } catch (error) {
        console.error('Erro ao testar conexão com OpenAI:', error.message);
        if (error.response) {
            console.error('Detalhes do erro:', error.response.data);
        }
        return false;
    }
}

// Executar o teste de conexão
testConnection().then(success => {
    if (!success) {
        console.error('Falha ao conectar com OpenAI. Verifique sua API key.');
        process.exit(1);
    }
});

module.exports = client; 