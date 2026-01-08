/* --- TÍTULOS BONITOS: GEMINI NEURAL BRIDGE (DOUBLE LOOP & RATE LIMIT HANDLER) --- */

/**
 * LISTA DE MODELOS (FALLBACK STRATEGY):
 * Baseada nas prints fornecidas do AI Studio.
 * Ordem: 3.0 -> 2.5 -> 2.0 -> 1.5.
 */
const MODELS_TO_TRY = [
  // --- TIER 1: GEMINI 3.0 (Bleeding Edge) ---
  "gemini-3.0-pro",
  "gemini-3.0-flash",
  "gemini-3.0-pro-preview",
  "gemini-3.0-flash-preview",

  // --- TIER 2: GEMINI 2.5 (High Performance) ---
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",

  // --- TIER 3: GEMINI 2.0 (Stable Modern) ---
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",

  // --- TIER 4: LEGACY FALLBACK (Safety Net) ---
  "gemini-1.5-pro",
  "gemini-1.5-flash"
];

// Utilitário de Delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Conecta ao Google Gemini via HTTP Fetch (Sem SDK).
 * Implementa estratégia de "Double Loop" para contornar Rate Limits.
 */
export const optimizeResumeWithGemini = async (apiKey, currentJson, jobData) => {
  // 1. Validação de Entrada
  if (!apiKey || apiKey.trim() === "") throw new Error("API Key inválida.");
  if (!currentJson) throw new Error("JSON do currículo inválido.");

  const jobContext = typeof jobData === 'string' ? jobData : JSON.stringify(jobData, null, 2);
  if (!jobContext || jobContext.length < 5) throw new Error("Descrição da vaga muito curta.");

  // 2. Construção do Prompt
  const prompt = `
    ATUE COMO: Auditor Sênior de Carreira e Especialista em ATS.
    OBJETIVO: Reescrever o currículo para maximizar o 'match rate', mantendo a verdade.

    --- VAGA ALVO ---
    ${jobContext}
    
    --- CURRÍCULO ORIGINAL ---
    ${JSON.stringify(currentJson)}

    REGRAS DE INTEGRIDADE:
    1. NÃO ALUCINAR: Não invente dados.
    2. VOCABULÁRIO ATS: Use a terminologia da vaga para descrever o que o candidato JÁ TEM.
    3. FOCO: Melhore 'resumo' e 'experiencias' com verbos de ação.

    SAÍDA: Apenas JSON válido.
  `;

  let lastError = null;

  // --- ESTRATÉGIA DOUBLE LOOP (2 RODADAS) ---
  // Rodada 1: Tenta todos. Se der 429, pula pro próximo.
  // Rodada 2: Se tudo falhou, espera um pouco e tenta tudo de novo.
  
  for (let attempt = 1; attempt <= 2; attempt++) {
    if (attempt === 2) {
      console.log("⚠️ Primeira rodada falhou. Aguardando 2s para rodada final...");
      await delay(2000); // Cool-down antes da segunda tentativa geral
    }

    // Loop interno pelos modelos
    for (const modelName of MODELS_TO_TRY) {
      try {
        // console.log(`[Neural Engine] Rodada ${attempt} - Testando: ${modelName}...`);
        
        const response = await callGeminiAPI(modelName, apiKey, prompt);
        
        console.log(`[Neural Engine] SUCESSO na Rodada ${attempt} com: ${modelName}`);
        return processAndValidateResponse(response, currentJson);

      } catch (error) {
        const msg = error.message.toLowerCase();
        const isRateLimit = msg.includes("429") || msg.includes("too many requests");
        
        console.warn(`[Neural Engine] Falha ${modelName} (R${attempt}):`, msg);
        lastError = error;

        // ERRO FATAL DE AUTENTICAÇÃO (Para tudo imediatamente)
        if (msg.includes("400") || msg.includes("403") || msg.includes("invalid arg") || msg.includes("api key")) {
          throw new Error("Sua API Key é inválida ou foi rejeitada pelo Google.");
        }

        // Se for 404 (Não existe) ou 429 (Limite), apenas continua o loop para o próximo modelo.
        // O código não faz nada aqui, apenas deixa o loop 'for' seguir.
      }
    }
  }

  // Se saiu dos 2 loops principais, falhou em ~20 tentativas.
  handleFinalError(lastError);
};

// --- FUNÇÕES AUXILIARES ---

async function callGeminiAPI(model, key, promptText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  
  const payload = {
    contents: [{ parts: [{ text: promptText }] }]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || response.statusText;
    throw new Error(`${response.status} ${errorMessage}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) throw new Error("A API retornou uma resposta vazia.");
  
  return text;
}

function processAndValidateResponse(text, originalJson) {
  let cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const firstBrace = cleanedText.indexOf('{');
  const lastBrace = cleanedText.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1) {
    cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
  }

  let optimizedJson;
  try {
    optimizedJson = JSON.parse(cleanedText);
  } catch (e) {
    console.error("Erro Parse JSON:", cleanedText);
    throw new Error("A IA gerou um formato inválido. Tente novamente.");
  }

  const criticalKeys = ['nome', 'experiencias', 'contato'];
  const newKeys = Object.keys(optimizedJson);
  
  if (!criticalKeys.every(k => newKeys.includes(k))) {
    throw new Error("IA corrompeu a estrutura do currículo (removeu campos essenciais).");
  }

  return optimizedJson;
}

function handleFinalError(error) {
  const msg = error ? error.toString() : "Erro desconhecido";
  
  if (msg.includes("429")) {
    throw new Error("Gemini API sobrecarregada (Muitos usos). Aguarde 1 minuto e tente novamente.");
  } else if (msg.includes("404")) {
    throw new Error("Nenhum modelo compatível encontrado na sua conta Google Cloud (Erro 404).");
  } else if (msg.includes("Failed to fetch")) {
    throw new Error("Erro de conexão com a internet.");
  } else {
    throw new Error(`Falha crítica na IA: ${msg}`);
  }
}