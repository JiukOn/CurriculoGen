// Serviço do Copiloto Conversacional com Grounding Estrito e Anti-Alucinação
import { fetchAvailableModels, selectBestModel } from './aiService';

const SYSTEM_INSTRUCTION_GROUNDING = `
VOCÊ É: Um Consultor Especialista de Carreira e Auditor Técnico de Currículos do Jiukurriculo.
SUA MISSÃO: Ajudar o usuário a construir, refinar e otimizar seu currículo profissional através de conversa iterativa.

REGRA SUPREMA DE INTEGRIDADE (ANTI-ALUCINAÇÃO ESTRITA):
1. ZERO INVENÇÃO: Você JAMAIS deve inventar cargos, empresas, cursos, datas, métricas ou tecnologias que não tenham evidência explícita nas "FONTES DE EVIDÊNCIA DO USUÁRIO" fornecidas ou nas mensagens enviadas pelo próprio usuário.
2. RESPEITO AOS FATOS: Se o usuário pedir para focar em uma vaga que exige tecnologias ou experiências que ele NÃO possui no dossiê de evidências, NUNCA crie essas experiências. Em vez disso, explique no chat a lacuna e valorize as competências reais correlatas que ele de fato possui.
3. ESCLARECIMENTO DE DÚVIDAS: Se uma informação estiver vaga ou incompleta no dossiê (ex: período de atuação, nível de inglês, papel em um projeto), pergunte ao usuário no chat em vez de supor.
4. SAÍDA DUPLA INTELIGENTE: Em cada resposta, você deve fornecer:
   a) Uma mensagem explicativa clara, amigável e profissional ao usuário explicando o que foi feito ou tirando dúvidas.
   b) Se houve alteração ou geração de currículo, forneça o objeto completo e válido no formato JSON dentro de um bloco delimitado:
   <<<RESUME_JSON>>>
   { ...objeto de currículo... }
   <<<END_RESUME_JSON>>>

ESTRUTURA COMPLETA ESPERADA NO JSON DO CURRÍCULO:
{
  "nome": string,
  "cargo": string,
  "resumo": string,
  "contato": {
    "tel": string,
    "email": string,
    "local": string,
    "linkedin": string,
    "nascimento": string
  },
  "formacao": [
    { "curso": string, "instituicao": string, "periodo": string, "status": string, "descricao": string }
  ],
  "experiencias": [
    { "titulo": string, "subtitulo": string, "periodo": string, "descricao": string }
  ],
  "hard_skills": [
    { "nome": string, "nivel": number }
  ],
  "soft_skills": [ string ],
  "cursos": [ string ],
  "idiomas": [
    { "idioma": string, "nivel": string }
  ],
  "projetos": [
    { "nome": string, "link": string, "descricao": string }
  ]
}
`;

export const sendCopilotMessage = async ({
  apiKey,
  userMessage,
  chatHistory = [],
  evidenceSources = [],
  currentResumeData,
  selectedModel = null,
  timeoutMs = 30000
}) => {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("API Key do Gemini é obrigatória.");
  }

  // 1. Monta o contexto de evidências compiladas
  let evidenceContext = "=== FONTES DE EVIDÊNCIA FORNECIDAS PELO USUÁRIO (GROUNDING REAL) ===\n";
  if (!evidenceSources || evidenceSources.length === 0) {
    evidenceContext += "(Nenhuma fonte externa cadastrada ainda. Use as mensagens da conversa e o currículo atual como fontes de fato).\n";
  } else {
    evidenceSources.forEach((src, idx) => {
      evidenceContext += `\n[FONTE ${idx + 1}: ${src.title || 'Sem título'} (${src.type || 'Texto'})]\n${src.content}\n`;
    });
  }

  evidenceContext += `\n=== CURRÍCULO ATUAL EM TELA ===\n${JSON.stringify(currentResumeData, null, 2)}\n`;

  // 2. Determina o modelo dinâmico
  let modelToUse = selectedModel;
  if (!modelToUse) {
    const available = await fetchAvailableModels(apiKey);
    modelToUse = selectBestModel(available);
  }

  // 3. Formata histórico para o formato da API Gemini
  const contents = [];

  // Primeira mensagem do sistema / contexto injetada
  contents.push({
    role: "user",
    parts: [{ text: `${SYSTEM_INSTRUCTION_GROUNDING}\n\n${evidenceContext}` }]
  });
  contents.push({
    role: "model",
    parts: [{ text: "Compreendido perfeitamente. Sou seu Consultor de Carreira e Auditor de Currículos do Jiukurriculo. Seguirei estritamente a política de Zero Alucinação, baseando-me exclusivamente nas suas fontes de evidência comprováveis. Como posso te ajudar a estruturar ou refinar seu currículo agora?" }]
  });

  // Histórico anterior da conversa
  chatHistory.forEach(msg => {
    contents.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    });
  });

  // Mensagem atual do usuário
  contents.push({
    role: "user",
    parts: [{ text: userMessage }]
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey.trim()}`;

  const payload = {
    contents,
    generationConfig: {
      temperature: 0.2
    }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errorMsg = errData.error?.message || res.statusText;
      throw new Error(`Erro Gemini (${res.status}): ${errorMsg}`);
    }

    const data = await res.json();
    const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawResponse) {
      throw new Error("A IA retornou uma resposta em branco.");
    }

    return parseCopilotResponse(rawResponse);

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Tempo limite excedido (${timeoutMs / 1000}s) no modelo ${modelToUse}. Tente novamente.`);
    }
    throw err;
  }
};

function parseCopilotResponse(text) {
  let messageText = text;
  let parsedResumeJson = null;

  // Procura pelo delimitador de JSON
  const markerStart = '<<<RESUME_JSON>>>';
  const markerEnd = '<<<END_RESUME_JSON>>>';

  const startIdx = text.indexOf(markerStart);
  const endIdx = text.indexOf(markerEnd);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const jsonBlock = text.substring(startIdx + markerStart.length, endIdx).trim();
    messageText = (text.substring(0, startIdx) + text.substring(endIdx + markerEnd.length)).trim();

    try {
      parsedResumeJson = JSON.parse(jsonBlock);
    } catch (e) {
      console.warn("Falha ao fazer parse do bloco de JSON do Copiloto:", e);
    }
  } else {
    // Tenta encontrar bloco json padrão se o modelo usar ```json
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      try {
        parsedResumeJson = JSON.parse(codeBlockMatch[1]);
        messageText = text.replace(codeBlockMatch[0], '').trim();
      } catch {}
    }
  }

  return {
    replyText: messageText || "Currículo atualizado com sucesso com base nas suas evidências!",
    updatedResume: parsedResumeJson
  };
}
