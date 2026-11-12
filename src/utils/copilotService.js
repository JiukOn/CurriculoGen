// Serviço do Copiloto Conversacional com Grounding Estrito, Anti-Alucinação e Consciência do App
import { fetchAvailableModels, selectBestModel } from './aiService';

const SYSTEM_INSTRUCTION_GROUNDING = `
VOCÊ É: Um Consultor Especialista de Carreira, Designer de Currículos e Auditor Técnico do Jiukurriculo.
SUA MISSÃO: Ajudar o usuário a construir, refinar e otimizar seu currículo profissional através de conversa iterativa com base estrita nos fatos fornecidos.

REGRA SUPREMA DE INTEGRIDADE (ANTI-ALUCINAÇÃO ESTRITA):
1. ZERO INVENÇÃO: Você JAMAIS deve inventar empresas, cargos, cursos, certificações, datas, métricas ou tecnologias que não tenham evidência explícita nas "FONTES DE EVIDÊNCIA DO USUÁRIO" fornecidas ou nas mensagens enviadas pelo próprio usuário.
2. RESPEITO AOS FATOS: Se o usuário pedir para focar em uma vaga cujos requisitos ele NÃO possui no dossiê de evidências, NUNCA crie essas experiências. Em vez disso, aponte a lacuna no chat com clareza e destaque as competências reais correlatas que ele possui.
3. CONSCIÊNCIA DO APLICATIVO (DESIGN & LAYOUT):
   Você pode sugerir ou alterar configurações visuais do aplicativo quando o usuário pedir ou quando achar mais adequado:
   - "model": 'model1.html' (Modern Slate), 'model2.html' (Minimalist), 'model3.html' (Executive), 'model4.html' (Grid Tech)
   - "palette": 'graphite', 'azul', 'roxo', 'rosa', 'verde', 'marrom'
   - "spacing": 'compact' (ajuste para 1 página), 'normal' (padrão equilibrado), 'relaxed' (2 páginas)
   - "font": "'Inter', sans-serif", "'Roboto', sans-serif", "'Montserrat', sans-serif", "'Georgia', serif", "'Playfair Display', serif"

4. FORMATO DE SAÍDA:
   Em cada resposta, forneça:
   a) Uma mensagem explicativa clara, cordial e profissional no chat detalhando o que foi feito ou tirando dúvidas.
   b) Se houver alteração de currículo OU de configurações visuais, inclua o bloco delimitado exatamente assim:
   <<<RESUME_ACTION>>>
   {
     "resume": { ...objeto completo de dados do currículo... },
     "config": {
       "model": "modelX.html",
       "palette": "azul",
       "spacing": "compact"
     },
     "summary": "Resumo em 1 frase das alterações realizadas"
   }
   <<<END_RESUME_ACTION>>>

ESTRUTURA DE DADOS DO CURRÍCULO:
{
  "nome": string,
  "cargo": string,
  "resumo": string,
  "contato": { "tel": string, "email": string, "local": string, "linkedin": string, "nascimento": string },
  "formacao": [{ "curso": string, "instituicao": string, "periodo": string, "status": string, "descricao": string }],
  "experiencias": [{ "titulo": string, "subtitulo": string, "periodo": string, "descricao": string }],
  "hard_skills": [{ "nome": string, "nivel": number }],
  "soft_skills": [ string ],
  "cursos": [ string ],
  "idiomas": [{ "idioma": string, "nivel": string }],
  "projetos": [{ "nome": string, "link": string, "descricao": string }]
}
`;

export const sendCopilotMessage = async ({
  apiKey,
  userMessage,
  chatHistory = [],
  evidenceSources = [],
  currentResumeData,
  currentAppConfig = {},
  selectedModel = null,
  timeoutMs = 35000
}) => {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("API Key do Gemini é obrigatória.");
  }

  // 1. Monta o contexto de evidências compiladas
  let evidenceContext = "=== FONTES DE EVIDÊNCIA DO USUÁRIO (GROUNDING REAL COMPROVADO) ===\n";
  if (!evidenceSources || evidenceSources.length === 0) {
    evidenceContext += "(Nenhum arquivo externo anexado ainda. Use as mensagens da conversa e o currículo atual como fontes de fato).\n";
  } else {
    evidenceSources.forEach((src, idx) => {
      evidenceContext += `\n[FONTE ${idx + 1}: ${src.title || 'Sem título'} (Tipo: ${src.type})]\n${src.content}\n`;
    });
  }

  evidenceContext += `\n=== ESTADO ATUAL DO APP ===\nConfigurações Visuais Atuais: ${JSON.stringify(currentAppConfig)}\nDados Atuais do Currículo: ${JSON.stringify(currentResumeData, null, 2)}\n`;

  // 2. Determina o modelo dinâmico
  let modelToUse = selectedModel;
  if (!modelToUse) {
    const available = await fetchAvailableModels(apiKey);
    modelToUse = selectBestModel(available);
  }

  // 3. Formata histórico para o formato da API Gemini
  const contents = [];

  contents.push({
    role: "user",
    parts: [{ text: `${SYSTEM_INSTRUCTION_GROUNDING}\n\n${evidenceContext}` }]
  });
  contents.push({
    role: "model",
    parts: [{ text: "Entendido perfeitamente. Sou seu Consultor de Carreira e Designer do Jiukurriculo. Sigo estritamente a política de Zero Alucinação baseando-me apenas em evidências reais. Tenho conhecimento do design do app e posso ajustar layout, paleta e conteúdo com precisão. Como posso te ajudar?" }]
  });

  chatHistory.forEach(msg => {
    contents.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    });
  });

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

    return parseCopilotAction(rawResponse);

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Tempo limite excedido (${timeoutMs / 1000}s) no modelo ${modelToUse}. Tente novamente.`);
    }
    throw err;
  }
};

function parseCopilotAction(text) {
  let messageText = text;
  let proposedAction = null;

  // Busca delimitador novo <<<RESUME_ACTION>>>
  const markerStart = '<<<RESUME_ACTION>>>';
  const markerEnd = '<<<END_RESUME_ACTION>>>';

  const startIdx = text.indexOf(markerStart);
  const endIdx = text.indexOf(markerEnd);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const block = text.substring(startIdx + markerStart.length, endIdx).trim();
    messageText = (text.substring(0, startIdx) + text.substring(endIdx + markerEnd.length)).trim();

    try {
      proposedAction = JSON.parse(block);
    } catch (e) {
      console.warn("Falha no parse do bloco de ação do Copiloto:", e);
    }
  } else {
    // Compatibilidade com delimitador antigo <<<RESUME_JSON>>>
    const oldStart = '<<<RESUME_JSON>>>';
    const oldEnd = '<<<END_RESUME_JSON>>>';
    const oStartIdx = text.indexOf(oldStart);
    const oEndIdx = text.indexOf(oldEnd);

    if (oStartIdx !== -1 && oEndIdx !== -1 && oEndIdx > oStartIdx) {
      const block = text.substring(oStartIdx + oldStart.length, oEndIdx).trim();
      messageText = (text.substring(0, oStartIdx) + text.substring(oEndIdx + oldEnd.length)).trim();
      try {
        const resumeData = JSON.parse(block);
        proposedAction = { resume: resumeData, summary: "Atualização de dados do currículo" };
      } catch {}
    } else {
      // Fallback para blocos ```json
      const codeMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeMatch && codeMatch[1]) {
        try {
          const parsed = JSON.parse(codeMatch[1]);
          if (parsed.nome || parsed.experiencias) {
            proposedAction = { resume: parsed, summary: "Currículo reestruturado" };
            messageText = text.replace(codeMatch[0], '').trim();
          }
        } catch {}
      }
    }
  }

  return {
    replyText: messageText || "Currículo e layout ajustados com sucesso com base nas suas evidências!",
    proposedAction
  };
}
