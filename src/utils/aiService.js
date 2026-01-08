/* --- TÍTULOS BONITOS: GEMINI NEURAL BRIDGE (FINAL MATRIX v5) --- */

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * MATRIZ DE COMPATIBILIDADE:
 * Lista de modelos oficiais. O sistema percorrerá esta lista até achar um ativo.
 * Ordem: 1.5 Pro (Qualidade) -> 1.5 Flash (Velocidade) -> 1.0 Pro (Compatibilidade Legada).
 */
const MODELS_TO_TRY = [
  "gemini-1.5-pro",
  "gemini-1.5-pro-latest",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.0-pro",
  "gemini-pro"
];

/**
 * Otimiza o currículo usando a IA do Google com sistema de redundância total.
 */
export const optimizeResumeWithGemini = async (apiKey, currentJson, jobData) => {
  // --- 1. VALIDAÇÃO DEFENSIVA ---
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    throw new Error("API Key inválida. Verifique sua chave do Google AI Studio.");
  }
  
  if (!currentJson || typeof currentJson !== 'object') {
    throw new Error("Dados do currículo corrompidos ou inválidos.");
  }

  // Normalização do Contexto da Vaga
  let jobContext = "";
  try {
    jobContext = typeof jobData === 'string' ? jobData : JSON.stringify(jobData, null, 2);
  } catch (e) {
    throw new Error("Erro ao processar dados da vaga.");
  }

  if (jobContext.length < 5) {
    throw new Error("Descrição da vaga insuficiente para análise.");
  }

  // --- 2. CONFIGURAÇÃO DO CLIENTE ---
  const genAI = new GoogleGenerativeAI(apiKey);

  // --- 3. ENGENHARIA DE PROMPT (STRICT JSON) ---
  const prompt = `
    ATUE COMO: Especialista em ATS (Applicant Tracking Systems) e Recrutador Sênior.
    OBJETIVO: Reescrever o conteúdo do currículo para alinhar com a vaga, MANTENDO A VERDADE.

    --- DADOS DA VAGA ---
    ${jobContext}
    ---------------------

    --- DADOS DO CANDIDATO ---
    ${JSON.stringify(currentJson)}
    --------------------------

    REGRAS DE OURO (INTEGRIDADE):
    1. PROIBIDO INVENTAR: Não adicione cargos, empresas ou hard-skills que não existam nos dados do candidato.
    2. ADAPTAÇÃO: Se a vaga pede "VCS" e o candidato tem "Git", reescreva como "Controle de versão (Git)". Use a linguagem da vaga.
    3. FOCO: Reescreva o 'resumo' e as descrições de 'experiencias' para focar no que a vaga pede.

    SAÍDA OBRIGATÓRIA:
    Retorne APENAS o JSON válido atualizado. Sem markdown (Ex: não use \`\`\`json). Sem texto extra.
  `;

  // --- 4. LOOP DE TENTATIVA (FALLBACK ENGINE) ---
  let lastError = null;

  for (const modelName of MODELS_TO_TRY) {
    try {
      // console.log(`[Neural Engine] Testando conexão com: ${modelName}...`);
      
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // Tenta gerar o conteúdo
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) throw new Error("IA retornou resposta vazia.");

      // Se chegou aqui, SUCESSO!
      console.log(`[Neural Engine] Conectado com sucesso via: ${modelName}`);
      return processAndValidateResponse(text, currentJson);

    } catch (error) {
      // Análise do Erro
      const msg = error.message ? error.message.toLowerCase() : "";
      const status = error.status || 0;

      console.warn(`[Neural Engine] Falha no modelo ${modelName} (${status}): ${msg}`);
      lastError = error;

      // ERROS FATAIS (Interrompem o loop imediatamente)
      // 403: Permissão Negada / Chave Inválida
      // 400: Bad Request (Chave mal formatada)
      if (msg.includes("api key") || msg.includes("permission") || status === 403 || status === 400) {
        throw new Error("Sua API Key é inválida ou não tem permissão. Crie uma nova chave.");
      }

      // ERROS DE CONTEÚDO (Safety Filters)
      if (msg.includes("candidate") || msg.includes("safety") || msg.includes("blocked")) {
        throw new Error("O conteúdo foi bloqueado pelos filtros de segurança da IA.");
      }

      // Se for 404 (Not Found) ou 503 (Unavailable), continuamos para o próximo modelo da lista.
      continue;
    }
  }

  // Se saiu do loop, nenhum modelo funcionou.
  handleFinalError(lastError);
};

// --- FUNÇÕES AUXILIARES ---

function processAndValidateResponse(text, originalJson) {
  // Limpeza Cirúrgica de Markdown
  let cleanedText = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  // Extração do JSON (caso a IA fale algo antes ou depois)
  const firstBrace = cleanedText.indexOf('{');
  const lastBrace = cleanedText.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1) {
    cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
  }

  let optimizedJson;
  try {
    optimizedJson = JSON.parse(cleanedText);
  } catch (e) {
    console.error("Falha no Parse JSON:", cleanedText);
    throw new Error("A IA gerou um formato inválido. Tente novamente.");
  }

  // Validação de Estrutura (Não pode perder campos vitais)
  const criticalKeys = ['nome', 'experiencias', 'contato'];
  const newKeys = Object.keys(optimizedJson);
  
  const hasKeys = criticalKeys.every(key => newKeys.includes(key));
  
  if (!hasKeys) {
    throw new Error("A IA corrompeu a estrutura do currículo. Tente novamente.");
  }

  return optimizedJson;
}

function handleFinalError(error) {
  const msg = error ? error.toString().toLowerCase() : "erro desconhecido";
  
  console.error("Erro Fatal IA:", error);

  if (msg.includes("404") || msg.includes("not found")) {
    throw new Error("Nenhum modelo compatível encontrado. Sua chave pode ser de um projeto antigo sem Gemini ativado.");
  } else if (msg.includes("fetch") || msg.includes("network")) {
    throw new Error("Erro de conexão. Verifique sua internet.");
  } else {
    throw new Error(`Falha crítica na IA: ${error.message || msg}`);
  }
}