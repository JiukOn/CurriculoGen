/* --- TÍTULOS BONITOS: GEMINI NEURAL BRIDGE (STABLE) --- */

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Conecta ao Google Gemini 1.5 Flash para otimizar o currículo.
 * * @param {string} apiKey - Chave da API (BYOK).
 * @param {object} currentJson - Objeto JSON atual do currículo.
 * @param {string} jobDescription - Texto da descrição da vaga.
 * @returns {Promise<object>} - Novo JSON otimizado.
 */
export const optimizeResumeWithGemini = async (apiKey, currentJson, jobDescription) => {
  // 1. Validação de Entrada
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API Key inválida ou não fornecida.");
  }
  if (!currentJson || typeof currentJson !== 'object') {
    throw new Error("O currículo atual não é um objeto JSON válido.");
  }
  if (!jobDescription || jobDescription.trim().length < 10) {
    throw new Error("A descrição da vaga é muito curta para ser analisada.");
  }

  // 2. Configuração do Modelo
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // 3. Engenharia de Prompt (Strict Mode)
  const prompt = `
    CONTEXTO: Você é um especialista sênior em recrutamento Tech e otimização para ATS (Applicant Tracking Systems).
    OBJETIVO: Reescrever os textos de um currículo para aumentar a relevância (match) com uma vaga específica, mantendo a honestidade dos dados.

    ENTRADA 1 (VAGA):
    "${jobDescription}"

    ENTRADA 2 (CURRÍCULO ORIGINAL):
    ${JSON.stringify(currentJson)}

    REGRAS DE EXECUÇÃO OBRIGATÓRIAS:
    1. ESTRUTURA: Mantenha ESTRITAMENTE a mesma estrutura de chaves do JSON original. Não adicione chaves novas, não remova chaves existentes.
    2. RESUMO: Reescreva o campo de resumo/perfil focando nas palavras-chave da vaga.
    3. EXPERIÊNCIA: Para cada experiência, reescreva a descrição para destacar conquistas e tecnologias que a vaga pede. Use verbos de ação.
    4. IDIOMA: Mantenha o idioma original do currículo (Português).
    5. FORMATO: A saída deve ser APENAS o JSON válido. Sem blocos de código markdown (\`\`\`), sem explicações, sem texto introdutório. Apenas o objeto JSON puro.
  `;

  try {
    // 4. Execução da IA
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error("A IA não retornou conteúdo.");

    // 5. Limpeza e Extração Cirúrgica do JSON
    // Remove blocos de markdown se houver e busca o primeiro '{' e último '}'
    let cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
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
      console.error("Erro de Parsing JSON da IA:", cleanedText);
      throw new Error("A IA gerou uma resposta inválida. Tente novamente.");
    }

    // 7. Validação de Integridade (Sanity Check)
    // Verifica se pelo menos uma chave principal original ainda existe
    const originalKeys = Object.keys(currentJson);
    const newKeys = Object.keys(optimizedJson);
    const hasIntegrity = originalKeys.some(key => newKeys.includes(key));

    if (!hasIntegrity) {
      throw new Error("A estrutura do currículo foi corrompida pela IA.");
    }

    return optimizedJson;

  } catch (error) {
    // 8. Tratamento de Erros da API
    console.error("Jiukurriculo Neural Error:", error);

    if (error.message.includes("API key")) {
      throw new Error("Chave de API inválida ou expirada.");
    } else if (error.message.includes("candidate")) {
      throw new Error("O conteúdo foi bloqueado pelos filtros de segurança da IA.");
    } else {
      throw error; // Repassa erro genérico tratado
    }
  }
};