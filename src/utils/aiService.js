const MODELS_TO_TRY = [
  "gemini-3.0-flash-preview",
  "gemini-3.0-pro-preview",

  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-pro",

  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",

  "gemini-1.5-flash",
  "gemini-1.5-pro"
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const optimizeResumeWithGemini = async (apiKey, currentJson, jobData) => {
  if (!apiKey || apiKey.trim() === "") throw new Error("API Key inválida.");
  if (!currentJson) throw new Error("JSON do currículo inválido.");

  const jobContext = typeof jobData === 'string' ? jobData : JSON.stringify(jobData, null, 2);
  if (!jobContext || jobContext.length < 5) throw new Error("Descrição da vaga muito curta.");

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

  for (let attempt = 1; attempt <= 2; attempt++) {
    
    if (attempt === 2) {
      console.log("⚠️ 1ª Rodada falhou (Todos ocupados). Aguardando 2s para tentativa final...");
      await delay(2000); 
    }

    for (const modelName of MODELS_TO_TRY) {
      try {
        const response = await callGeminiAPI(modelName, apiKey, prompt, 10000);
        
        console.log(`[Neural Engine] ✅ SUCESSO na Rodada ${attempt} com: ${modelName}`);
        return processAndValidateResponse(response, currentJson);

      } catch (error) {
        const msg = error.message.toLowerCase();
        lastError = error;

        const isRateLimit = msg.includes("429") || msg.includes("too many requests");
        const isNotFound = msg.includes("404") || msg.includes("not found");
        
        if (isRateLimit) {
            console.warn(`[Neural Engine] ⏳ ${modelName} lotado (429). Pulando...`);
        } else if (isNotFound) {
            console.warn(`[Neural Engine] ❌ ${modelName} off (404). Pulando...`);
        } else {
            console.warn(`[Neural Engine] ⚠️ Falha em ${modelName}: ${msg}`);
        }

        if (msg.includes("400") || msg.includes("403") || msg.includes("invalid arg") || msg.includes("api key")) {
          throw new Error("Sua API Key é inválida ou foi rejeitada pelo Google (Erro 400/403).");
        }

      }
    }
  }

  handleFinalError(lastError);
};


async function callGeminiAPI(model, key, promptText, timeoutMs = 15000) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  
  const payload = {
    contents: [{ parts: [{ text: promptText }] }]
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

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