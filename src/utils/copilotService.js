// Serviço do Copiloto Conversacional com Tools (Function Calling), Chunking e Anti-Alucinação
import { fetchAvailableModels, selectBestModel } from './aiService';
import { ensureSourceChunks, searchEvidenceChunks } from './documentTools';

const SYSTEM_INSTRUCTION_GROUNDING = `
VOCÊ É: Um Consultor Especialista de Carreira, Designer de Currículos e Auditor Técnico do Jiukurriculo.
SUA MISSÃO: Ajudar o usuário a construir, editar e otimizar seu currículo profissional através de conversa iterativa com base estrita nos fatos fornecidos.

REGRA SUPREMA DE INTEGRIDADE (ANTI-ALUCINAÇÃO ESTRITA):
1. ZERO INVENÇÃO: Você JAMAIS deve inventar empresas, cargos, cursos, certificações, datas, métricas ou tecnologias que não tenham evidência explícita nas fontes anexadas, no currículo atual ou nas mensagens do usuário.
2. USO DE FERRAMENTAS (TOOLS):
   - Sempre que o usuário pedir para editar, melhorar, revisar ou adicionar algo ao currículo existente, chame PRIMEIRO a ferramenta \`get_current_resume\` para inspecionar o JSON atual antes de propor alterações, evitando apagar ou sobrescrever dados existentes sem necessidade.
   - Use \`get_app_config\` se precisar verificar o modelo, paleta (incluindo \`customColor\`), fonte ou densidade atuais.
   - Se houver documentos grandes no Dossiê de Evidências, use \`list_evidence_documents\`, \`read_document_chunk\` e \`search_evidence_chunks\` para ler todas as partes relevantes antes de responder.
3. CONSCIÊNCIA DO APLICATIVO (DESIGN & LAYOUT):
   Você pode sugerir ou alterar configurações visuais do aplicativo quando solicitado ou adequado:
   - "model": 'model1.html' (Modern Slate), 'model2.html' (Minimalist), 'model3.html' (Executive), 'model4.html' (Grid Tech)
   - "palette": 'graphite', 'azul', 'roxo', 'rosa', 'verde', 'marrom', ou 'custom' (acompanhado de "customColor": "#RRGGBB")
   - "spacing": 'compact' (1 página), 'normal' (padrão), 'relaxed' (2 páginas)
   - "font": "'Inter', sans-serif", "'Roboto', sans-serif", "'Montserrat', sans-serif", "'Georgia', serif", "'Playfair Display', serif"

4. FORMATO DE SAÍDA:
   Em cada resposta final ao usuário:
   a) Escreva uma mensagem clara, cordial e objetiva explicando o que foi analisado ou alterado.
   b) Se houver alteração de currículo OU de configurações visuais, inclua o bloco delimitado exatamente assim:
   <<<RESUME_ACTION>>>
   {
     "mode": "replace",
     "resume": { ...objeto completo atualizado do currículo... },
     "config": {
       "model": "modelX.html",
       "palette": "azul",
       "spacing": "compact"
     },
     "summary": "Resumo em 1 frase das alterações realizadas"
   }
   <<<END_RESUME_ACTION>>>
   Nota: Se estiver apenas editando parte do currículo, você pode enviar "mode": "patch" apenas com as chaves alteradas dentro de "resume", ou "mode": "replace" com o objeto completo preservando os demais campos obtidos via \`get_current_resume\`.

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

const COPILOT_TOOL_DECLARATIONS = [
  {
    name: 'get_current_resume',
    description: 'Lê o JSON do currículo atual carregado no editor para permitir edições precisas sem perder informações existentes.',
    parameters: {
      type: 'OBJECT',
      properties: {
        section: {
          type: 'STRING',
          description: "Seção desejada ('all', 'nome', 'cargo', 'resumo', 'contato', 'formacao', 'experiencias', 'hard_skills', 'soft_skills', 'cursos', 'idiomas', 'projetos'). Padrão: 'all'."
        }
      }
    }
  },
  {
    name: 'get_app_config',
    description: 'Retorna as configurações visuais atuais do aplicativo (modelo, paleta, cor customizada, densidade e tipografia).',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'list_evidence_documents',
    description: 'Lista todos os arquivos (PDF, TXT, MD, JSON) anexados pelo usuário com quantidade de chunks e tamanho.',
    parameters: {
      type: 'OBJECT',
      properties: {}
    }
  },
  {
    name: 'read_document_chunk',
    description: 'Lê um chunk específico (parte) de um documento anexado pelo usuário.',
    parameters: {
      type: 'OBJECT',
      properties: {
        documentTitle: {
          type: 'STRING',
          description: 'Nome do arquivo anexado (ex: Profile.pdf)'
        },
        chunkIndex: {
          type: 'INTEGER',
          description: 'Índice do chunk começando em 0.'
        }
      },
      required: ['documentTitle', 'chunkIndex']
    }
  },
  {
    name: 'search_evidence_chunks',
    description: 'Busca trechos nos documentos anexados que contenham as palavras-chave especificadas.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'Termos ou palavras-chave para buscar nos documentos.'
        }
      },
      required: ['query']
    }
  }
];

function executeCopilotTool(name, args = {}, context) {
  const { currentResumeData, currentAppConfig, evidenceSources } = context;

  switch (name) {
    case 'get_current_resume': {
      const section = args?.section || 'all';
      if (!currentResumeData || typeof currentResumeData !== 'object') {
        return { error: 'Currículo atual vazio ou inválido.' };
      }
      if (section === 'all') {
        return { resume: currentResumeData };
      }
      if (section in currentResumeData) {
        return { section, data: currentResumeData[section] };
      }
      return { error: `Seção '${section}' não encontrada.`, availableSections: Object.keys(currentResumeData) };
    }

    case 'get_app_config':
      return { config: currentAppConfig || {} };

    case 'list_evidence_documents':
      return {
        documents: (evidenceSources || []).map(src => {
          const chunks = ensureSourceChunks(src);
          return {
            id: src.id,
            title: src.title,
            type: src.type,
            totalChunks: chunks.length,
            totalChars: (src.content || '').length,
            pageCount: src.pageCount || null,
            hasMultimodalPdf: !!src.base64Data
          };
        })
      };

    case 'read_document_chunk': {
      const targetTitle = String(args?.documentTitle || '').toLowerCase();
      const idx = Number(args?.chunkIndex ?? 0);
      const doc = (evidenceSources || []).find(
        s => s.title.toLowerCase() === targetTitle || s.title.toLowerCase().includes(targetTitle)
      );
      if (!doc) {
        return {
          error: `Documento '${args?.documentTitle}' não encontrado.`,
          availableDocuments: (evidenceSources || []).map(s => s.title)
        };
      }
      const chunks = ensureSourceChunks(doc);
      if (idx < 0 || idx >= chunks.length) {
        return { error: `chunkIndex ${idx} fora do intervalo (0 a ${chunks.length - 1}).` };
      }
      return {
        title: doc.title,
        chunkIndex: idx,
        totalChunks: chunks.length,
        content: chunks[idx]
      };
    }

    case 'search_evidence_chunks': {
      const results = searchEvidenceChunks(evidenceSources, args?.query || '', 5);
      return { query: args?.query || '', matches: results };
    }

    default:
      return { error: `Ferramenta desconhecida: ${name}` };
  }
}

export const sendCopilotMessage = async ({
  apiKey,
  userMessage,
  chatHistory = [],
  evidenceSources = [],
  currentResumeData,
  currentAppConfig = {},
  selectedModel = null,
  timeoutMs = 45000
}) => {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("API Key do Gemini é obrigatória.");
  }

  // 1. Prepara resumo inteligente das fontes de evidência (inline para arquivos pequenos, indexado por chunks para grandes)
  let evidenceContext = "=== FONTES DE EVIDÊNCIA DO USUÁRIO (GROUNDING REAL COMPROVADO) ===\n";
  const multimodalParts = [];

  if (!evidenceSources || evidenceSources.length === 0) {
    evidenceContext += "(Nenhum arquivo externo anexado. Use as mensagens da conversa e consulte `get_current_resume` se precisar editar o currículo atual).\n";
  } else {
    let totalDirectChars = 0;
    const MAX_DIRECT_CHARS = 18000;

    evidenceSources.forEach((src, idx) => {
      const chunks = ensureSourceChunks(src);
      const contentLen = (src.content || '').length;

      if (src.base64Data && src.mimeType === 'application/pdf') {
        multimodalParts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: src.base64Data
          }
        });
      }

      if (totalDirectChars + contentLen <= MAX_DIRECT_CHARS) {
        totalDirectChars += contentLen;
        evidenceContext += `\n[FONTE ${idx + 1}: ${src.title || 'Sem título'} | Tipo: ${src.type} | Chunks: ${chunks.length}]\n${src.content}\n`;
      } else {
        evidenceContext += `\n[FONTE ${idx + 1}: ${src.title || 'Sem título'} | Tipo: ${src.type} | ${chunks.length} chunks (${contentLen} chars) — use read_document_chunk ou search_evidence_chunks para ler todas as partes]\nPrévia (Chunk 0):\n${chunks[0] || ''}\n`;
      }
    });
  }

  // 2. Determina o modelo dinâmico
  let modelToUse = selectedModel;
  if (!modelToUse) {
    const available = await fetchAvailableModels(apiKey);
    modelToUse = selectBestModel(available);
  }

  // 3. Monta histórico da conversa
  const contents = [];

  const initialParts = [{ text: `${SYSTEM_INSTRUCTION_GROUNDING}\n\n${evidenceContext}` }, ...multimodalParts];
  contents.push({
    role: "user",
    parts: initialParts
  });
  contents.push({
    role: "model",
    parts: [{ text: "Entendido perfeitamente. Sigo estritamente a política de Zero Alucinação e utilizarei as ferramentas para inspecionar o currículo atual e os chunks de documentos sempre que necessário. Como posso ajudar?" }]
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

  // 4. Loop de Function Calling (até 6 rodadas de ferramentas)
  const MAX_TOOL_ROUNDS = 6;
  const toolContext = { currentResumeData, currentAppConfig, evidenceSources };

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const payload = {
      contents,
      tools: [{ functionDeclarations: COPILOT_TOOL_DECLARATIONS }],
      generationConfig: {
        temperature: 0.2
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let data;
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

      data = await res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Tempo limite excedido (${timeoutMs / 1000}s) no modelo ${modelToUse}. Tente novamente.`);
      }
      throw err;
    }

    const candidateContent = data.candidates?.[0]?.content;
    const parts = candidateContent?.parts || [];
    const functionCalls = parts.filter(p => p.functionCall);

    if (functionCalls.length > 0) {
      // Registra a chamada do modelo no histórico da rodada
      contents.push({
        role: 'model',
        parts
      });

      // Executa todas as tools solicitadas e devolve como functionResponse
      const responseParts = functionCalls.map(fc => {
        const { name, args } = fc.functionCall;
        const result = executeCopilotTool(name, args, toolContext);
        return {
          functionResponse: {
            name,
            response: result
          }
        };
      });

      contents.push({
        role: 'user',
        parts: responseParts
      });
      continue;
    }

    const textParts = parts.filter(p => typeof p.text === 'string').map(p => p.text).join('\n').trim();
    if (!textParts) {
      throw new Error("A IA retornou uma resposta em branco.");
    }

    return parseCopilotAction(textParts);
  }

  throw new Error("O Copiloto excedeu o limite de consultas de ferramentas. Tente reformular seu pedido.");
};

function parseCopilotAction(text) {
  let messageText = text;
  let proposedAction = null;

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
