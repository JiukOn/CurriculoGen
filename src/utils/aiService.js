/* --- TÍTULOS BONITOS: GEMINI NEURAL BRIDGE (ULTIMATE FALLBACK) --- */

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * LISTA DE MODELOS (FALLBACK STRATEGY):
 * O sistema tentará conectar nesta ordem exata.
 * Incluímos o 'gemini-1.0-pro' pois ele é o mais estável para chaves gratuitas antigas.
 */
const MODELS_TO_TRY = [
  "gemini-1.5-flash", // Mais rápido
  "gemini-1.5-pro",   // Mais inteligente
  "gemini-pro",       // Alias padrão
  "gemini-1.0-pro"    // Legado estável (Resolve o erro 404 na maioria dos casos)
];

/**
 * Conecta ao Google Gemini com sistema de redundância para otimizar o currículo.
 */
export const optimizeResumeWithGemini = async (apiKey, currentJson, jobData) => {
  // 1. Validação de Entrada
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API Key inválida. Por favor, insira sua chave.");
  }
  if (!currentJson || typeof currentJson !== 'object') {
    throw new Error("Dados do currículo inválidos.");
  }

  // Normalização da Vaga
  const jobContext = typeof jobData === 'string' ? jobData : JSON.stringify(jobData, null, 2);
  if (!jobContext || jobContext.length < 5) {
    throw new Error("Descrição da vaga muito curta.");
  }

  // 2. Inicialização do Cliente
  const genAI = new GoogleGenerativeAI(apiKey);

  // 3. Prompt de Engenharia (ATS & SEO Strict Mode)
  const prompt = `
    ATUE COMO: Auditor Sênior de Carreira e Especialista em Algoritmos ATS.
    OBJETIVO: Reescrever o currículo para maximizar o 'match rate' com a vaga, mantendo a verdade.

    ---
    VAGA ALVO:
    ${jobContext}

    CURRÍCULO ORIGINAL:
    ${JSON.stringify(currentJson)}
    ---

    REGRAS DE INTEGRIDADE:
    1. NÃO ALUCINAR: Não invente cargos, empresas ou skills que não existem no original.
    2. VOCABULÁRIO ATS: Use a terminologia da vaga. Ex: Se vaga pede "VCS" e usuário tem "Git", escreva "Controle de versão (Git)".

    INSTRUÇÕES:
    1. RESUMO: Reescreva focado nos requisitos da vaga.
    2. EXPERIÊNCIAS: Use verbos de ação e destaque resultados.
    3. ESTRUTURA: Mantenha a estrutura JSON exata.
    4. SAÍDA: Apenas JSON válido.
  `;

  // 4. Loop de Tentativa Inteligente (Smart Retry)
  let lastError = null;

  for (const modelName of MODELS_TO_TRY) {
    try {
      // console.log(`[Neural Engine] Tentando modelo: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) throw new Error("Resposta vazia da IA.");

      // Se chegou aqui, funcionou!
      console.log(`[Neural Engine] Sucesso com modelo: ${modelName}`);
      return processAndValidateResponse(text, currentJson);

    } catch (error) {
      console.warn(`[Neural Engine] Falha no modelo ${modelName}:`, error.message);
      lastError = error;
      
      const msg = error.message.toLowerCase();

      // Se a chave for inválida, não adianta tentar outros modelos
      if (msg.includes("api key") || msg.includes("403") || msg.includes("permission")) {
        throw new Error("Sua API Key é inválida ou não tem permissão. Crie uma nova no Google AI Studio.");
      }
      
      // Se for bloqueio de segurança, para também
      if (msg.includes("candidate") || msg.includes("safety")) {
        throw new Error("O conteúdo foi bloqueado pelos filtros de segurança da IA.");
      }

      // Se for 404 ou 503, o loop continua para o próximo modelo da lista...
    }
  }

  // Se saiu do loop, todos falharam
  handleFinalError(lastError);
};

// --- FUNÇÕES AUXILIARES ---

function processAndValidateResponse(text, originalJson) {
  // Limpeza de Markdown
  let cleanedText = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  const firstBrace = cleanedText.indexOf('{');
  const lastBrace = cleanedText.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1) {
    cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
  }

  let optimizedJson;
  try {
    optimizedJson = JSON.parse(cleanedText);
  } catch (parseError) {
    console.error("Erro de Parse JSON IA:", cleanedText);
    throw new Error("A IA gerou um formato inválido. Tente novamente.");
  }

  // Validação de Integridade
  const newKeys = Object.keys(optimizedJson);
  const criticalKeys = ['nome', 'experiencias', 'contato'];
  const hasCriticalKeys = criticalKeys.every(k => newKeys.includes(k));

  if (!hasCriticalKeys) {
    throw new Error("A IA corrompeu a estrutura do currículo (removeu campos essenciais).");
  }

  return optimizedJson;
}

function handleFinalError(error) {
  const msg = error ? error.toString().toLowerCase() : "erro desconhecido";

  if (msg.includes("quota") || msg.includes("429")) {
    throw new Error("Cota da API excedida. Aguarde alguns instantes.");
  } else if (msg.includes("not found") || msg.includes("404")) {
    throw new Error("Nenhum modelo compatível encontrado. Tente criar uma NOVA API Key no Google AI Studio.");
  } else if (msg.includes("fetch") || msg.includes("network")) {
    throw new Error("Erro de conexão. Verifique sua internet.");
  } else {
    throw new Error(`Falha na IA: ${error.message}`);
  }
}