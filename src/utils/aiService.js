const MODELS_TO_TRY = [
  // --- TIER 1: GEMINI 3.0 (Bleeding Edge) ---
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

/**
 * Conecta ao Google Gemini via HTTP Fetch (Sem SDK).
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

  // 3. Loop de Tentativa (Native Fetch)
  let lastError = null;

  for (const modelName of MODELS_TO_TRY) {
    try {
      // console.log(`[Neural Engine] Conectando via REST ao modelo: ${modelName}...`);
      
      const response = await callGeminiAPI(modelName, apiKey, prompt);
      
      // Se chegou aqui, funcionou.
      console.log(`[Neural Engine] Conexão bem-sucedida: ${modelName}`);
      return processAndValidateResponse(response, currentJson);

    } catch (error) {
      const msg = error.message.toLowerCase();
      console.warn(`[Neural Engine] Falha REST ${modelName}:`, msg);
      lastError = error;

      // Se for erro de Chave (400 ou 403), para tudo.
      if (msg.includes("400") || msg.includes("403") || msg.includes("invalid arg")) {
        throw new Error("API Key inválida ou rejeitada pelo Google (Erro 400/403).");
      }
      
      // 404 (Not Found) ou 500 (Server Error) -> Tenta o próximo modelo
    }
  }

  handleFinalError(lastError);
};

// --- FUNÇÕES AUXILIARES DE CONEXÃO E PARSE ---

async function callGeminiAPI(model, key, promptText) {
  // ATENÇÃO: Usando endpoint v1beta que geralmente suporta modelos preview/novos
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  
  const payload = {
    contents: [{
      parts: [{ text: promptText }]
    }]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
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
    throw new Error("Formato inválido recebido da IA.");
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
  
  if (msg.includes("404")) {
    throw new Error("Nenhum modelo disponível (Erro 404). Verifique se a API está ativada no seu projeto Google Cloud.");
  } else if (msg.includes("429")) {
    throw new Error("Muitas requisições. Aguarde um momento.");
  } else if (msg.includes("Failed to fetch")) {
    throw new Error("Erro de conexão com a internet.");
  } else {
    throw new Error(`Falha na IA: ${msg}`);
  }
}