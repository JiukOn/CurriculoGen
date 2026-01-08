/* --- TÍTULOS BONITOS: GEMINI NEURAL BRIDGE (SMART FALLBACK & ATS V3) --- */

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Lista de modelos para tentativa de conexão (Ordem de preferência: Velocidade -> Estabilidade -> Potência).
 * Isso garante funcionamento gratuito mesmo se um modelo específico estiver fora do ar na região.
 */
const MODELS_TO_TRY = ["gemini-1.5-flash", "gemini-pro", "gemini-1.5-pro"];

/**
 * Conecta ao Google Gemini com sistema de redundância para otimizar o currículo.
 * * @param {string} apiKey - Chave da API (BYOK).
 * @param {object} currentJson - Objeto JSON atual do currículo (A VERDADE).
 * @param {string|object} jobData - Texto ou JSON da descrição da vaga (O ALVO).
 * @returns {Promise<object>} - Novo JSON otimizado.
 */
export const optimizeResumeWithGemini = async (apiKey, currentJson, jobData) => {
  // 1. Validação de Entrada Rigorosa
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API Key inválida ou não fornecida.");
  }
  if (!currentJson || typeof currentJson !== 'object') {
    throw new Error("O currículo atual não é um objeto JSON válido.");
  }

  // Normalização da Vaga
  const jobContext = typeof jobData === 'string' ? jobData : JSON.stringify(jobData, null, 2);
  if (!jobContext || jobContext.length < 10) {
    throw new Error("A descrição da vaga é muito curta para análise ATS.");
  }

  // 2. Inicialização do Cliente
  const genAI = new GoogleGenerativeAI(apiKey);

  // 3. Prompt de Engenharia (ATS & SEO Strict Mode)
  const prompt = `
    ATUE COMO: Auditor Sênior de Carreira e Especialista em Algoritmos ATS (Applicant Tracking Systems).
    OBJETIVO: Realizar uma cirurgia de SEO no currículo para maximizar o 'match rate' com a vaga, respeitando a integridade dos fatos.

    ---
    ALVO (VAGA):
    ${jobContext}

    FONTE (CANDIDATO):
    ${JSON.stringify(currentJson)}
    ---

    REGRAS DE OURO (INTEGRIDADE):
    1. PROIBIDO ALUCINAR: JAMAIS adicione cargos, empresas, datas ou hard-skills que não existam na FONTE. Se o candidato não tem "Java", não invente.
    2. TRADUÇÃO DE SEO: Se a vaga pede "Controle de Versão" e o candidato tem "Git", reescreva como "Controle de Versão com Git". Use a terminologia exata da vaga para descrever o que ele JÁ TEM.

    INSTRUÇÕES DE OTIMIZAÇÃO:
    1. RESUMO: Reescreva como um "Elevator Pitch" agressivo, usando as palavras-chave principais da vaga (ex: tecnologias, metodologias).
    2. EXPERIÊNCIAS:
       - Inicie cada bullet point com VERBOS DE AÇÃO fortes (ex: Arquitetou, Liderou, Otimizou, Implementou).
       - Foque em RESULTADOS. Se houver métricas na fonte, destaque-as.
       - Alinhe a descrição das tarefas com as "Responsabilidades" da vaga.
    3. COMPETÊNCIAS: Reordene as listas de skills para colocar no topo as que dão "Match" com a vaga.
    4. ESTRUTURA: Mantenha ESTRITAMENTE a estrutura JSON original (não remova campos de contato).

    SAÍDA:
    Apenas o JSON válido puro. Sem markdown. Sem explicações.
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

      // Se chegou aqui, sucesso! Vamos processar e retornar.
      return processAndValidateResponse(text, currentJson);

    } catch (error) {
      console.warn(`[Neural Engine] Falha no modelo ${modelName}:`, error.message);
      lastError = error;
      
      // Se o erro for de API Key inválida, não adianta tentar outros modelos
      if (error.message.includes("API key") || error.message.includes("403")) {
        throw new Error("Sua API Key é inválida. Verifique no Google AI Studio.");
      }
      
      // Se for erro de filtro de segurança (Candidate safety), para imediatamente
      if (error.message.includes("candidate") || error.message.includes("safety")) {
        throw new Error("O conteúdo foi bloqueado pelos filtros de segurança da IA.");
      }

      // Para outros erros (404, 503, Overloaded), o loop continua para o próximo modelo...
    }
  }

  // Se saiu do loop, todos os modelos falharam
  handleFinalError(lastError);
};

// --- FUNÇÕES AUXILIARES (HELPER FUNCTIONS) ---

/**
 * Limpa, faz o parse e valida a integridade do JSON retornado pela IA.
 */
function processAndValidateResponse(text, originalJson) {
  // Limpeza Cirúrgica de Markdown
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
    throw new Error("A IA gerou um formato inválido. Tente clicar em Otimizar novamente.");
  }

  // Validação de Integridade (Anti-Corrupção)
  const newKeys = Object.keys(optimizedJson);
  const criticalKeys = ['nome', 'experiencias', 'contato', 'formacao'];
  
  // Verifica se as chaves críticas ainda existem
  const hasCriticalKeys = criticalKeys.every(k => newKeys.includes(k));

  if (!hasCriticalKeys) {
    throw new Error("A IA corrompeu a estrutura do currículo. Tente novamente.");
  }

  return optimizedJson;
}

/**
 * Gera mensagens de erro amigáveis para o usuário final.
 */
function handleFinalError(error) {
  const msg = error.toString().toLowerCase();

  if (msg.includes("quota") || msg.includes("429")) {
    throw new Error("Cota de uso da API excedida temporariamente. Aguarde 1 minuto.");
  } else if (msg.includes("fetch") || msg.includes("network")) {
    throw new Error("Erro de conexão. Verifique sua internet.");
  } else if (msg.includes("not found") || msg.includes("404")) {
    throw new Error("Nenhum modelo de IA disponível na sua região ou chave.");
  } else {
    // Erro genérico com detalhe técnico
    throw new Error(`Falha na IA: ${error.message || "Erro desconhecido"}`);
  }
}