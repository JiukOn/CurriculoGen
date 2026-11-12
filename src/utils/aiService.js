// Serviço de integração com Google Gemini API
// Com detecção dinâmica de modelos disponíveis, structured output nativo e fallback inteligente

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Modelo de preferência ordenado por melhor equilíbrio custo x velocidade x estabilidade
const PREFERRED_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.5-pro"
];

// Lista dinamicamente os modelos disponíveis para a chave do usuário
export const fetchAvailableModels = async (apiKey) => {
  if (!apiKey || apiKey.trim() === '') return [];

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erro ${res.status}`);
    }
    const data = await res.json();
    if (!data.models) return [];

    // Filtra apenas modelos que suportam geração de conteúdo
    const supported = data.models
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name.replace('models/', ''));

    return supported;
  } catch (err) {
    console.warn("Falha ao consultar modelos disponíveis:", err.message);
    return [];
  }
};

// Determina dinamicamente o melhor modelo com bom custo-benefício e velocidade
export const selectBestModel = (availableModels) => {
  if (!availableModels || availableModels.length === 0) {
    return "gemini-2.0-flash"; // Fallback padrão seguro
  }

  // Procura na ordem de prioridade (baixo custo e alta velocidade primeiro)
  for (const preferred of PREFERRED_MODELS) {
    if (availableModels.includes(preferred)) {
      return preferred;
    }
  }

  // Se nenhum dos preferidos estiver exato, procura algum com 'flash'
  const flashModel = availableModels.find(m => m.toLowerCase().includes('flash') && !m.includes('preview'));
  if (flashModel) return flashModel;

  return availableModels[0];
};

export const optimizeResumeWithGemini = async (apiKey, currentJson, jobData, selectedModel = null) => {
  if (!apiKey || apiKey.trim() === "") throw new Error("API Key inválida.");
  if (!currentJson) throw new Error("JSON do currículo inválido.");

  const jobContext = typeof jobData === 'string' ? jobData : JSON.stringify(jobData, null, 2);
  if (!jobContext || jobContext.length < 5) throw new Error("Descrição da vaga muito curta.");

  const prompt = `
    ATUE COMO: Auditor Sênior de Carreira e Especialista em ATS (Applicant Tracking Systems).
    OBJETIVO: Reescrever e otimizar o currículo para maximizar o 'match rate' com a vaga, mantendo total veracidade.

    --- VAGA ALVO ---
    ${jobContext}
    
    --- CURRÍCULO ORIGINAL ---
    ${JSON.stringify(currentJson, null, 2)}

    REGRAS ESSENCIAIS:
    1. NÃO INVENTE DADOS: Mantenha a integridade da história do candidato.
    2. VOCABULÁRIO ATS: Use as palavras-chave e terminologias da vaga para enriquecer as descrições.
    3. FOCO: Enriqueça 'resumo', 'experiencias' (com verbos de ação e conquistas quantificáveis) e certifique-se de que hard_skills reflitam os termos da vaga.
    4. PRESERVAÇÃO: Retorne TODOS os campos (nome, cargo, resumo, contato, experiencias, formacao, hard_skills, soft_skills, cursos, idiomas, projetos).

    SAÍDA: Retorne APENAS um objeto JSON válido correspondente à estrutura do currículo.
  `;

  // Se o usuário passou um modelo específico ou selecionamos dinamicamente
  let candidateModels = [];
  if (selectedModel) {
    candidateModels = [selectedModel, ...PREFERRED_MODELS.filter(m => m !== selectedModel)];
  } else {
    // Busca modelos disponíveis dinamicamente
    const available = await fetchAvailableModels(apiKey);
    const best = selectBestModel(available);
    candidateModels = [best, ...PREFERRED_MODELS.filter(m => m !== best)];
  }

  let lastError = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    if (attempt === 2) {
      await delay(1500);
    }

    for (const modelName of candidateModels) {
      try {
        const jsonText = await callGeminiAPIStructured(modelName, apiKey, prompt, 20000);
        return processAndValidateResponse(jsonText);
      } catch (error) {
        const msg = error.message.toLowerCase();
        lastError = error;

        if (msg.includes("400") || msg.includes("403") || msg.includes("api key") || msg.includes("invalid argument")) {
          throw new Error("Sua API Key é inválida ou não possui permissão (Erro 400/403).");
        }
      }
    }
  }

  handleFinalError(lastError);
};

// Importa dados de currículo a partir de texto bruto ou resumo profissional
export const importResumeFromRawText = async (apiKey, rawText, selectedModel = null) => {
  if (!apiKey || apiKey.trim() === "") throw new Error("API Key inválida.");
  if (!rawText || rawText.trim().length < 15) throw new Error("Texto muito curto para importar.");

  const prompt = `
    ATUE COMO: Especialista em Extração de Dados e Estruturação de Currículos.
    OBJETIVO: Extrair e estruturar todas as informações do texto abaixo no formato JSON exato de um currículo profissional.

    TEXTO BRUTO DO CANDIDATO:
    ${rawText}

    ESTRUTURA DE DESTINO:
    {
      "nome": "Nome Completo",
      "cargo": "Título ou Especialidade",
      "resumo": "Resumo de 3 a 5 linhas",
      "contato": {
        "tel": "",
        "email": "",
        "local": "",
        "linkedin": "",
        "nascimento": ""
      },
      "formacao": [
        {
          "curso": "Nome",
          "instituicao": "Instituição",
          "periodo": "2020 - 2024",
          "status": "Concluído",
          "descricao": ""
        }
      ],
      "experiencias": [
        {
          "titulo": "Cargo",
          "subtitulo": "Empresa",
          "periodo": "2022 - Atual",
          "descricao": "Responsabilidades e impacto"
        }
      ],
      "hard_skills": [
        { "nome": "Habilidade", "nivel": 85 }
      ],
      "soft_skills": ["Liderança", "Comunicação"],
      "cursos": ["Curso ou Certificação"],
      "idiomas": [
        { "idioma": "Inglês", "nivel": "Avançado" }
      ],
      "projetos": [
        { "nome": "Projeto", "link": "https://...", "descricao": "" }
      ]
    }

    SAÍDA: Retorne estritamente o JSON preenchido com as informações encontradas no texto. Onde não houver dado, preencha com valor vazio ou omita o item.
  `;

  const available = await fetchAvailableModels(apiKey);
  const best = selectedModel || selectBestModel(available);
  
  const jsonText = await callGeminiAPIStructured(best, apiKey, prompt, 25000);
  return processAndValidateResponse(jsonText);
};

// Chamada à API com Structured Output nativo (responseMimeType: "application/json")
async function callGeminiAPIStructured(model, key, promptText, timeoutMs = 20000) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const payload = {
    contents: [
      { parts: [{ text: promptText }] }
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2
    }
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
      throw new Error(`Timeout: O modelo ${model} demorou mais de ${timeoutMs / 1000}s.`);
    }
    throw error;
  }
}

function processAndValidateResponse(text) {
  let cleanedText = text.trim();
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```/, '').replace(/```$/, '').trim();
  }

  const firstBrace = cleanedText.indexOf('{');
  const lastBrace = cleanedText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(cleanedText);
  } catch (e) {
    console.error("Erro Parse JSON:", cleanedText);
    throw new Error("A IA gerou um formato inválido. Tente novamente.");
  }

  const criticalKeys = ['nome', 'experiencias', 'contato'];
  const newKeys = Object.keys(parsed);

  if (!criticalKeys.every(k => newKeys.includes(k))) {
    throw new Error("A IA corrompeu a estrutura essencial do currículo.");
  }

  return parsed;
}

function handleFinalError(error) {
  const msg = error ? error.toString() : "Erro desconhecido";

  if (msg.includes("429")) {
    throw new Error("Servidores do Google ocupados (Limite de taxa 429). Tente novamente em alguns segundos.");
  } else if (msg.includes("404")) {
    throw new Error("Nenhum modelo compatível encontrado para sua chave.");
  } else if (msg.includes("Failed to fetch") || msg.includes("network")) {
    throw new Error("Erro de conexão com os servidores do Google.");
  } else {
    throw new Error(`Não foi possível otimizar: ${msg}`);
  }
}
