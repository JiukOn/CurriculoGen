import React, { useState, useEffect, useRef } from 'react';
import { sendCopilotMessage } from '../utils/copilotService';
import { fetchAvailableModels, selectBestModel } from '../utils/aiService';

/* --- COPILOTO IA: CHAT INTERATIVO, EVIDÊNCIAS & ANTI-ALUCINAÇÃO --- */

const AiCopilotModal = ({ isOpen, onClose, jsonInput, setJsonInput }) => {
  // Estados da API Key e Modelos
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem('gemini_api_key') || ''; } catch { return ''; }
  });
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [showConfig, setShowConfig] = useState(() => !localStorage.getItem('gemini_api_key'));

  // Gestor de Fontes de Evidência (Grounding)
  const [evidenceSources, setEvidenceSources] = useState(() => {
    try {
      const saved = localStorage.getItem('jiu_evidence_sources');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceContent, setNewSourceContent] = useState('');
  const [newSourceType, setNewSourceType] = useState('linkedin'); // 'linkedin' | 'cv_antigo' | 'anotacao'

  // Mensagens do Chat
  const [messages, setMessages] = useState([
    {
      id: 'init_1',
      sender: 'assistant',
      text: 'Olá! Sou o seu Copiloto de Carreira com política de Zero Alucinação. 🛡️\n\nPosso analisar seu perfil do LinkedIn, currículos antigos e anotações para construir ou ajustar seu currículo exatamente aos fatos reais da sua trajetória. O que você gostaria de fazer hoje?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingResume, setPendingResume] = useState(null);

  const messagesEndRef = useRef(null);
  const fileUploadRef = useRef(null);

  // Persistências
  useEffect(() => {
    try { localStorage.setItem('gemini_api_key', apiKey); } catch {}
  }, [apiKey]);

  useEffect(() => {
    try { localStorage.setItem('jiu_evidence_sources', JSON.stringify(evidenceSources)); } catch {}
  }, [evidenceSources]);

  // Consulta modelos disponíveis para a chave
  useEffect(() => {
    if (!apiKey || apiKey.trim().length < 10) {
      setAvailableModels([]);
      setSelectedModel('');
      return;
    }

    let isMounted = true;
    const loadModels = async () => {
      try {
        const models = await fetchAvailableModels(apiKey);
        if (isMounted) {
          setAvailableModels(models);
          const best = selectBestModel(models);
          setSelectedModel(best);
        }
      } catch (e) {
        console.warn("Falha ao consultar modelos:", e);
      }
    };

    const debounce = setTimeout(loadModels, 600);
    return () => {
      isMounted = false;
      clearTimeout(debounce);
    };
  }, [apiKey]);

  // Scroll automático do chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  // --- HANDLERS DO CHAT ---
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || isLoading) return;

    if (!apiKey.trim()) {
      setShowConfig(true);
      alert("Por favor, insira sua API Key do Gemini no topo para conversar com o Copiloto.");
      return;
    }

    const userMsg = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      let currentResume = {};
      try { currentResume = JSON.parse(jsonInput); } catch {}

      const response = await sendCopilotMessage({
        apiKey,
        userMessage: cleanText,
        chatHistory: messages,
        evidenceSources,
        currentResumeData: currentResume,
        selectedModel
      });

      const assistantMsg = {
        id: 'ast_' + Date.now(),
        sender: 'assistant',
        text: response.replyText,
        hasUpdate: !!response.updatedResume,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (response.updatedResume) {
        setPendingResume(response.updatedResume);
      }

    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'assistant',
          isError: true,
          text: `⚠️ ${err.message || 'Erro ao processar sua solicitação.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Aplica o currículo gerado
  const handleApplyResume = () => {
    if (pendingResume) {
      setJsonInput(JSON.stringify(pendingResume, null, 2));
      setPendingResume(null);
      setMessages(prev => [
        ...prev,
        {
          id: 'sys_' + Date.now(),
          sender: 'assistant',
          text: '✨ As alterações foram aplicadas diretamente ao currículo em tela!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  // --- GESTÃO DE FONTES DE EVIDÊNCIA ---
  const handleAddSource = (e) => {
    e.preventDefault();
    if (!newSourceContent.trim()) return;

    const source = {
      id: 'src_' + Date.now(),
      title: newSourceTitle.trim() || (newSourceType === 'linkedin' ? 'Perfil LinkedIn' : 'Currículo / Anotação'),
      type: newSourceType,
      content: newSourceContent.trim(),
      dateAdded: new Date().toLocaleDateString()
    };

    setEvidenceSources(prev => [source, ...prev]);
    setNewSourceTitle('');
    setNewSourceContent('');
    setIsAddingSource(false);
  };

  const handleRemoveSource = (id) => {
    setEvidenceSources(prev => prev.filter(s => s.id !== id));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewSourceTitle(file.name);
      setNewSourceContent(event.target.result);
      setNewSourceType(file.name.endsWith('.json') ? 'cv_antigo' : 'anotacao');
      setIsAddingSource(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="copilot-modal-content glass-card" onClick={e => e.stopPropagation()}>
        
        {/* HEADER DO COPILOTO */}
        <header className="copilot-header">
          <div className="copilot-header-info">
            <span className="copilot-avatar">🤖</span>
            <div>
              <h2 className="copilot-title">Copiloto IA de Carreira</h2>
              <span className="copilot-subtitle">
                Auditoria de Fatos & Zero Alucinação • Modelo: <strong>{selectedModel || 'Gemini'}</strong>
              </span>
            </div>
          </div>

          <div className="copilot-header-actions">
            <button
              type="button"
              className={`copilot-config-toggle ${showConfig ? 'active' : ''}`}
              onClick={() => setShowConfig(!showConfig)}
              title="Configurar Chave da API e Modelo"
            >
              ⚙️ Chave & Config
            </button>
            <button type="button" className="copilot-close-btn" onClick={onClose} title="Fechar">
              ✕
            </button>
          </div>
        </header>

        {/* ÁREA RETRÁTIL DE CONFIGURAÇÃO DA CHAVE */}
        {showConfig && (
          <div className="copilot-config-panel">
            <div className="config-row-top">
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                🔑 Configuração da Gemini API Key
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="get-key-link"
              >
                Obter Chave Grátis no Google AI Studio ↗
              </a>
            </div>

            <div className="config-form-group">
              <input
                type="password"
                className="modern-select"
                style={{ padding: '8px 12px', fontSize: '12px', flex: 2 }}
                placeholder="Cole sua API Key do Google AI Studio aqui..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoComplete="off"
              />

              <select
                className="modern-select no-arrow"
                style={{ padding: '8px 10px', fontSize: '12px', flex: 1 }}
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {availableModels.length > 0 ? (
                  availableModels.map(m => (
                    <option key={m} value={m}>
                      {m} {m.includes('flash') ? '⚡' : ''}
                    </option>
                  ))
                ) : (
                  <option value="gemini-2.0-flash">gemini-2.0-flash ⚡</option>
                )}
              </select>
            </div>

            {/* GUIA RÁPIDO PASSO A PASSO */}
            <div className="config-quick-guide">
              <strong>Como obter em 3 passos:</strong> 
              1. Acesse <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">aistudio.google.com/app/apikey</a>. 
              2. Faça login com sua conta Google e clique em <em>"Create API key"</em>. 
              3. Copie e cole no campo acima (é gratuito e seus dados ficam salvos localmente).
            </div>
          </div>
        )}

        {/* GESTOR DE FONTES DE EVIDÊNCIA (GROUNDING) */}
        <div className="evidence-manager-bar">
          <div className="evidence-bar-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>🛡️</span>
              <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Dossiê de Evidências ({evidenceSources.length} fontes ativas)
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className="evidence-add-btn"
                onClick={() => setIsAddingSource(!isAddingSource)}
              >
                {isAddingSource ? 'Cancelar' : '+ Nova Fonte'}
              </button>
              <button
                type="button"
                className="evidence-add-btn upload-style"
                onClick={() => fileUploadRef.current?.click()}
                title="Carregar arquivo .txt ou .json"
              >
                📁 Importar Arquivo
              </button>
              <input
                type="file"
                ref={fileUploadRef}
                style={{ display: 'none' }}
                accept=".txt,.json,.md"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          {/* FORMULÁRIO DE ADIÇÃO DE FONTE */}
          {isAddingSource && (
            <form onSubmit={handleAddSource} className="evidence-add-form">
              <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                <input
                  className="modern-select"
                  style={{ flex: 2, padding: '6px 10px', fontSize: '12px' }}
                  placeholder="Título (ex: LinkedIn Jiuk / Currículo 2024)"
                  value={newSourceTitle}
                  onChange={(e) => setNewSourceTitle(e.target.value)}
                />
                <select
                  className="modern-select no-arrow"
                  style={{ flex: 1, padding: '6px 10px', fontSize: '12px' }}
                  value={newSourceType}
                  onChange={(e) => setNewSourceType(e.target.value)}
                >
                  <option value="linkedin">🌐 LinkedIn</option>
                  <option value="cv_antigo">📄 Currículo Antigo</option>
                  <option value="anotacao">✍️ Anotação / Projeto</option>
                </select>
              </div>
              <textarea
                className="modern-textarea"
                style={{ minHeight: '80px', fontSize: '12px', marginBottom: '6px' }}
                placeholder="Cole o texto aqui (experiências, sobre, responsabilidades, certificações reais)..."
                value={newSourceContent}
                onChange={(e) => setNewSourceContent(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="submit" className="neo-btn" style={{ padding: '6px 16px', height: 'auto', fontSize: '11px' }}>
                  Salvar Evidência
                </button>
              </div>
            </form>
          )}

          {/* LISTA DE FONTES CARREGADAS */}
          {evidenceSources.length > 0 && (
            <div className="evidence-chips-list">
              {evidenceSources.map(src => (
                <div key={src.id} className="evidence-chip" title={src.content.substring(0, 150) + '...'}>
                  <span className="evidence-chip-icon">
                    {src.type === 'linkedin' ? '🌐' : (src.type === 'cv_antigo' ? '📄' : '✍️')}
                  </span>
                  <span className="evidence-chip-name">{src.title}</span>
                  <button
                    type="button"
                    className="evidence-chip-del"
                    onClick={() => handleRemoveSource(src.id)}
                    title="Remover fonte"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CORPO DO CHAT COM AS MENSAGENS */}
        <div className="copilot-chat-body">
          {messages.map(msg => (
            <div key={msg.id} className={`chat-bubble-row ${msg.sender}`}>
              <div className="bubble-avatar">
                {msg.sender === 'user' ? '👤' : '🤖'}
              </div>
              <div className={`chat-bubble ${msg.isError ? 'error-bubble' : ''}`}>
                <div className="bubble-text">{msg.text}</div>
                <div className="bubble-footer">
                  <span className="bubble-time">{msg.timestamp}</span>
                  {msg.hasUpdate && (
                    <span className="bubble-badge-update">⚡ Atualização Disponível</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="chat-bubble-row assistant">
              <div className="bubble-avatar">🤖</div>
              <div className="chat-bubble loading-bubble">
                <span className="pulse-dot" style={{ animationDuration: '0.8s' }}></span>
                <span>Analisando suas evidências e estruturando resposta...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* NOTIFICAÇÃO / BOTÃO DE APLICAÇÃO DE CURRÍCULO PENDENTE */}
        {pendingResume && (
          <div className="pending-resume-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>✨</span>
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                O Copiloto gerou uma nova versão estruturada baseada nas suas evidências.
              </span>
            </div>
            <button
              type="button"
              className="apply-resume-btn"
              onClick={handleApplyResume}
            >
              Aplicar ao Currículo em Tela ✓
            </button>
          </div>
        )}

        {/* INPUT DE ENVIO DO CHAT */}
        <form onSubmit={handleSendMessage} className="copilot-chat-input-area">
          <input
            className="copilot-input-field"
            placeholder="Peça alterações, adicione contexto da vaga ou pergunte algo sobre seu currículo..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="copilot-send-btn"
            disabled={isLoading || !inputText.trim()}
          >
            {isLoading ? '...' : 'Enviar ➔'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default AiCopilotModal;
