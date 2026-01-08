/* --- TÍTULOS BONITOS: GEMINI NEURAL BRIDGE (LITE-FIRST STRATEGY) --- */

/**
 * LISTA DE MODELOS (ORDEM DE DISPONIBILIDADE):
 * Estratégia "Lite-First": Tenta os modelos mais leves e com maior cota gratuita primeiro.
 * Ordem: Lite -> Flash -> Pro (para cada versão).
 */
const MODELS_TO_TRY = [
  // --- TIER 1: GEMINI 3.0 (Novidade) ---
  "gemini-3.0-flash-preview", // Mais chance de estar livre que o Pro
  "gemini-3.0-pro-preview",

  // --- TIER 2: GEMINI 2.5 (Performance) ---
  "gemini-2.5-flash-lite",    // O mais leve de todos (Prioridade Máxima)
  "gemini-2.5-flash",
  "gemini-2.5-pro",           // Deixa o Pro pro final (Cota baixa)

  // --- TIER 3: GEMINI 2.0 (Estável) ---
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",

  // --- TIER 4: FALLBACK SEGURO (Legado) ---
  "gemini-1.5-flash",         // O "Tanque de Guerra" da Google (Quase nunca falha)
  "gemini-1.5-pro"
];

// Utilitário de Delay (Pausa não-bloqueante)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Conecta ao Google Gemini via HTTP Fetch (Sem SDK).
 * Sistema anti-travamento com timeout e redundância dupla.
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
  for (let attempt = 1; attempt <= 2; attempt++) {
    
    // Pausa estratégica APENAS se estiver indo para a segunda rodada
    if (attempt === 2) {
      console.log("⚠️ 1ª Rodada falhou (Todos ocupados). Aguardando 2s para tentativa final...");
      await delay(2000); 
    }

    // Loop interno pelos modelos
    for (const modelName of MODELS_TO_TRY) {
      try {
        // Timeout curto (10s) para garantir fluidez na UI
        const response = await callGeminiAPI(modelName, apiKey, prompt, 10000);
        
        console.log(`[Neural Engine] ✅ SUCESSO na Rodada ${attempt} com: ${modelName}`);
        return processAndValidateResponse(response, currentJson);

      } catch (error) {
        const msg = error.message.toLowerCase();
        lastError = error;

        // Identificação de Erro para Log
        const isRateLimit = msg.includes("429") || msg.includes("too many requests");
        const isNotFound = msg.includes("404") || msg.includes("not found");
        
        if (isRateLimit) {
            console.warn(`[Neural Engine] ⏳ ${modelName} lotado (429). Pulando...`);
        } else if (isNotFound) {
            console.warn(`[Neural Engine] ❌ ${modelName} off (404). Pulando...`);
        } else {
            console.warn(`[Neural Engine] ⚠️ Falha em ${modelName}: ${msg}`);
        }

        // ERRO FATAL (Chave Inválida) - Para tudo imediatamente
        if (msg.includes("400") || msg.includes("403") || msg.includes("invalid arg") || msg.includes("api key")) {
          throw new Error("Sua API Key é inválida ou foi rejeitada pelo Google (Erro 400/403).");
        }

        // Se for 429, 404, 500 ou Timeout -> O código continua para o próximo modelo instantaneamente
      }
    }
  }

  // Se chegou aqui, falhou nas 2 rodadas completas (todos os modelos falharam)
  handleFinalError(lastError);
};

// --- FUNÇÕES AUXILIARES ---

async function callGeminiAPI(model, key, promptText, timeoutMs = 15000) {
  // Usando endpoint v1beta para máxima compatibilidade com modelos novos
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  
  const payload = {
    contents: [{ parts: [{ text: promptText }] }]
  };

  // Controller para cancelar a requisição se demorar muito (Anti-travamento)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal // Liga o timeout ao fetch
    });

    clearTimeout(timeoutId); // Limpa o timer se respondeu a tempo

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        throw new Error(`${response.status} ${errorMessage}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) throw new Error("Resposta vazia da IA.");
    
    return text;

  } catch (error) {
    clearTimeout(timeoutId);
    // Transforma erro de Abort em mensagem legível
    if (error.name === 'AbortError') {
        throw new Error(`Timeout: O modelo ${model} demorou mais de ${timeoutMs/1000}s.`);
    }
    throw error;
  }
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
    throw new Error("IA corrompeu a estrutura do currículo.");
  }

  return optimizedJson;
}

function handleFinalError(error) {
  const msg = error ? error.toString() : "Erro desconhecido";
  
  if (msg.includes("429")) {
    throw new Error("Servidores do Google ocupados. Tente novamente em 1 minuto.");
  } else if (msg.includes("404")) {
    throw new Error("Nenhum modelo compatível encontrado na sua chave.");
  } else if (msg.includes("Failed to fetch") || msg.includes("network")) {
    throw new Error("Erro de conexão com a internet.");
  } else {
    throw new Error(`Não foi possível otimizar: ${msg}`);
  }
}