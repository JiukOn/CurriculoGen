/* --- TÍTULOS BONITOS: GEMINI NEURAL BRIDGE (ATS & SEO FOCUSED) --- */

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Conecta ao Google Gemini (Modelo Stable) para otimizar o currículo.
 * Prioriza a verdade dos dados do usuário enquanto ajusta a terminologia para ATS.
 * * @param {string} apiKey - Chave da API (BYOK).
 * @param {object} currentJson - Objeto JSON atual do currículo (A VERDADE).
 * @param {string|object} jobData - Texto ou JSON da descrição da vaga (O ALVO).
 * @returns {Promise<object>} - Novo JSON otimizado.
 */
export const optimizeResumeWithGemini = async (apiKey, currentJson, jobData) => {
  // 1. Validação de Entrada
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API Key inválida ou não fornecida.");
  }
  if (!currentJson || typeof currentJson !== 'object') {
    throw new Error("O currículo atual não é um objeto JSON válido.");
  }

  // Normaliza os dados da vaga (pode vir como string ou objeto JSON)
  const jobContext = typeof jobData === 'string' ? jobData : JSON.stringify(jobData, null, 2);

  if (!jobContext || jobContext.length < 10) {
    throw new Error("A descrição da vaga é muito curta para ser analisada.");
  }

  // 2. Configuração do Modelo
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Usando 'gemini-pro' para estabilidade e evitar erros 404
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  // 3. Engenharia de Prompt (SEO & ATS Strict Mode)
  const prompt = `
    ATUE COMO: Auditor Sênior de Carreira e Especialista em Algoritmos ATS (Applicant Tracking Systems).
    
    OBJETIVO: Realizar uma cirurgia de SEO no currículo do candidato para maximizar o 'match rate' com a vaga, SEMPRE respeitando a veracidade dos dados originais.

    ---
    ENTRADA 1: O ALVO (DADOS DA VAGA)
    ${jobContext}

    ENTRADA 2: A FONTE DA VERDADE (DADOS DO CANDIDATO)
    ${JSON.stringify(currentJson)}
    ---

    DIRETRIZES DE INTEGRIDADE (CRÍTICO):
    1. PROIBIDO ALUCINAR: Você NÃO pode adicionar empresas, cargos, faculdades ou hard-skills que não existam na ENTRADA 2. Se o candidato não sabe "Java", não adicione "Java".
    2. ADAPTAÇÃO DE VOCABULÁRIO (SEO): Se a vaga usa o termo "Versionamento" e o candidato tem "Git", reescreva como "Versionamento de código com Git". Use a terminologia da vaga para descrever as competências que o candidato JÁ TEM.

    INSTRUÇÕES DE OTIMIZAÇÃO:
    1. RESUMO: Reescreva completamente para ser um "Elevator Pitch" focado nos requisitos da vaga. Inclua o nome do cargo da vaga se o candidato tiver experiência compatível.
    2. EXPERIÊNCIAS: Reescreva as descrições ("descricao") focando em RESULTADOS e RESPONSABILIDADES. Substitua termos genéricos por palavras-chave da vaga. Comece frases com verbos de ação fortes (ex: Liderou, Otimizou, Desenvolveu).
    3. COMPETÊNCIAS: Reordene as 'hard_skills' e 'soft_skills' para colocar no topo as que aparecem na vaga.
    4. ESTRUTURA: Mantenha ESTRITAMENTE a estrutura JSON original.

    SAÍDA ESPERADA:
    Retorne APENAS o JSON válido. Sem markdown (\`\`\`), sem comentários.
  `;

  try {
    // 4. Execução da IA
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error("A IA não retornou conteúdo. Tente novamente.");

    // 5. Limpeza e Extração Cirúrgica do JSON
    let cleanedText = text
      .replace(/```json/g, '') // Remove inicio de bloco json
      .replace(/```/g, '')     // Remove fechamento de bloco
      .trim();
    
    // Garante que pegamos apenas o que está entre a primeira { e a última }
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
    }

    // 6. Parsing Seguro
    let optimizedJson;
    try {
      optimizedJson = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Conteúdo recebido da IA (Falha de Parse):", cleanedText);
      throw new Error("A IA gerou uma resposta mal formatada. Tente clicar em 'Otimizar' novamente.");
    }

    // 7. Validação de Integridade (Anti-Corrupção de Dados)
    const originalKeys = Object.keys(currentJson);
    const newKeys = Object.keys(optimizedJson);
    
    // As chaves principais não podem sumir
    const criticalKeys = ['nome', 'experiencias', 'contato', 'formacao'];
    const hasCriticalKeys = criticalKeys.every(k => newKeys.includes(k));

    if (!hasCriticalKeys) {
      throw new Error("A IA corrompeu a estrutura do currículo. Tente novamente.");
    }

    return optimizedJson;

  } catch (error) {
    // 8. Tratamento de Erros Avançado
    console.error("Jiukurriculo Neural Error:", error);

    const errorMsg = error.toString().toLowerCase();

    if (errorMsg.includes("api key") || errorMsg.includes("403")) {
      throw new Error("Chave de API inválida. Verifique sua Key.");
    } else if (errorMsg.includes("not found") || errorMsg.includes("404")) {
      throw new Error("Modelo de IA indisponível. Verifique se sua Key tem acesso ao 'gemini-pro'.");
    } else if (errorMsg.includes("candidate") || errorMsg.includes("safety")) {
      throw new Error("O conteúdo foi bloqueado pelos filtros de segurança da IA.");
    } else if (errorMsg.includes("fetch")) {
      throw new Error("Erro de conexão. Verifique sua internet.");
    } else {
      throw error; // Repassa erro tratado genericamente
    }
  }
};