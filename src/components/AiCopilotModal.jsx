import React, { useState, useEffect, useRef } from 'react';
import { sendCopilotMessage } from '../utils/copilotService';
import { fetchAvailableModels, selectBestModel } from '../utils/aiService';
import { readFileContent } from '../utils/fileExtractor';

/* --- COPILOTO IA AVANÇADO: CHAT, UPLOAD DIRETO DE PDF/TXT/MD E CONSCIÊNCIA DO APP --- */

const AiCopilotModal = ({ isOpen, onClose, jsonInput, setJsonInput, config, setConfig }) => {
  // Estados de API Key e Modelos
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem('gemini_api_key') || ''; } catch { return ''; }
  });
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [showConfig, setShowConfig] = useState(() => !localStorage.getItem('gemini_api_key'));

  // Dossiê de Evidências Multi-Fonte
  const [evidenceSources, setEvidenceSources] = useState(() => {
    try {
      const saved = localStorage.getItem('jiu_evidence_sources');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Mensagens do Chat
  const [messages, setMessages] = useState([
    {
      id: 'init_1',
      sender: 'assistant',
      text: 'Olá! Sou o seu Copiloto de Carreira com política de Zero Alucinação. 🛡️\n\nVocê pode me enviar seus currículos em PDF, perfis do LinkedIn ou anotações. Tenho controle do aplicativo para ajustar layout, modelo, cores e conteúdo com base em fatos reais. O que deseja fazer?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Persistência
  useEffect(() => {
    try { localStorage.setItem('gemini_api_key', apiKey); } catch {}
  }, [apiKey]);

  useEffect(() => {
    try { localStorage.setItem('jiu_evidence_sources', JSON.stringify(evidenceSources)); } catch {}
  }, [evidenceSources]);

  // Consulta modelos dinâmicos
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

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  // --- ENVIO DE MENSAGENS COM CONTEXTO COMPLETO ---
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || isLoading) return;

    if (!apiKey.trim()) {
      setShowConfig(true);
      alert("Por favor, informe sua API Key do Google AI Studio no topo para prosseguir.");
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
        currentAppConfig: config,
        selectedModel
      });

      const assistantMsg = {
        id: 'ast_' + Date.now(),
        sender: 'assistant',
        text: response.replyText,
        hasAction: !!response.proposedAction,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);

      if (response.proposedAction) {
        setPendingAction(response.proposedAction);
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

  // --- APLICAÇÃO DE AÇÃO PROPOSTA PELA IA ---
  const handleApplyAction = () => {
    if (!pendingAction) return;

    if (pendingAction.resume) {
      setJsonInput(JSON.stringify(pendingAction.resume, null, 2));
    }

    if (pendingAction.config && setConfig) {
      setConfig(prev => ({
        ...prev,
        ...pendingAction.config
      }));
    }

    const summaryText = pendingAction.summary || "Alterações de conteúdo e layout aplicadas com sucesso!";
    setPendingAction(null);

    setMessages(prev => [
      ...prev,
      {
        id: 'sys_' + Date.now(),
        sender: 'assistant',
        text: `✨ ${summaryText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // --- INGESTÃO DIRETA DE ARQUIVOS (PDF, TXT, MD, JSON) ---
  const handleProcessFiles = async (files) => {
    if (!files || files.length === 0) return;

    setIsProcessingFile(true);
    const newSources = [];

    for (const file of Array.from(files)) {
      try {
        const text = await readFileContent(file);
        if (text && text.trim().length > 10) {
          const isPdf = file.name.toLowerCase().endsWith('.pdf');
          newSources.push({
            id: 'src_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            title: file.name,
            type: isPdf ? 'pdf' : (file.name.endsWith('.json') ? 'json' : 'texto'),
            content: text,
            dateAdded: new Date().toLocaleDateString()
          });
        }
      } catch (err) {
        console.error(`Erro ao ler arquivo ${file.name}:`, err);
        alert(`Não foi possível extrair o texto de ${file.name}.`);
      }
    }

    if (newSources.length > 0) {
      setEvidenceSources(prev => [...newSources, ...prev]);
      setMessages(prev => [
        ...prev,
        {
          id: 'sys_' + Date.now(),
          sender: 'assistant',
          text: `📁 Anexei ${newSources.length} novo(s) arquivo(s) como evidência comprovada: ${newSources.map(s => s.title).join(', ')}. Posso usá-los agora para reescrever ou atualizar seu currículo!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }

    setIsProcessingFile(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveSource = (id) => {
    setEvidenceSources(prev => prev.filter(s => s.id !== id));
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
                Zero Alucinação • Controle de Layout & Conteúdo • <strong>{selectedModel || 'Gemini'}</strong>
              </span>
            </div>
          </div>

          <div className="copilot-header-actions">
            <button
              type="button"
              className={`copilot-config-toggle ${showConfig ? 'active' : ''}`}
              onClick={() => setShowConfig(!showConfig)}
              title="Configurar Chave da API"
            >
              ⚙️ Chave & Modelo
            </button>
            <button type="button" className="copilot-close-btn" onClick={onClose} title="Fechar">
              ✕
            </button>
          </div>
        </header>

        {/* ÁREA RETRÁTIL DE CONFIGURAÇÃO */}
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

            <div className="config-quick-guide">
              <strong>Como obter em 3 passos:</strong> 
              1. Acesse <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">aistudio.google.com/app/apikey</a>. 
              2. Faça login com sua conta Google e clique em <em>"Create API key"</em>. 
              3. Cole aqui (é 100% gratuito e seus dados ficam salvos apenas no seu navegador).
            </div>
          </div>
        )}

        {/* ZONA DE ARRASTO & EVIDÊNCIAS SEM BUROCRACIA */}
        <div 
          className={`evidence-dropzone-bar ${dragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="evidence-bar-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>🛡️</span>
              <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Dossiê de Evidências ({evidenceSources.length} anexados)
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className="evidence-add-btn upload-style"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFile}
              >
                {isProcessingFile ? 'Lendo PDF...' : '+ Anexar Arquivos (PDF / TXT / MD)'}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf,.txt,.md,.json"
                multiple
                onChange={(e) => handleProcessFiles(e.target.files)}
              />
            </div>
          </div>

          {/* LISTA DE FONTES CARREGADAS */}
          {evidenceSources.length > 0 ? (
            <div className="evidence-chips-list">
              {evidenceSources.map(src => (
                <div key={src.id} className="evidence-chip" title={src.content.substring(0, 150) + '...'}>
                  <span className="evidence-chip-icon">
                    {src.type === 'pdf' ? '📄' : (src.type === 'json' ? '💾' : '✍️')}
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
          ) : (
            <div className="evidence-empty-hint">
              Solte seus currículos antigos em <strong>PDF</strong>, anotações ou textos aqui para dar embasamento real à IA.
            </div>
          )}
        </div>

        {/* CHAT COM O COPILOTO */}
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
                  {msg.hasAction && (
                    <span className="bubble-badge-update">⚡ Ação Disponível</span>
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
                <span>Analisando suas evidências e elaborando resposta...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* CARD DE AÇÃO PROPOSTA COM PREVIEW DE DIFF */}
        {pendingAction && (
          <div className="pending-resume-bar">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>✨</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                  {pendingAction.summary || 'Proposta de atualização pronta!'}
                </span>
              </div>
              {pendingAction.config && (
                <small style={{ fontSize: '11px', opacity: 0.85 }}>
                  Ajustes de layout: {pendingAction.config.model ? `Modelo: ${pendingAction.config.model} | ` : ''}
                  {pendingAction.config.palette ? `Cor: ${pendingAction.config.palette} | ` : ''}
                  {pendingAction.config.spacing ? `Densidade: ${pendingAction.config.spacing}` : ''}
                </small>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="discard-action-btn"
                onClick={() => setPendingAction(null)}
              >
                Descartar
              </button>
              <button
                type="button"
                className="apply-resume-btn"
                onClick={handleApplyAction}
              >
                Aplicar Alterações ✓
              </button>
            </div>
          </div>
        )}

        {/* INPUT DE ENVIO DO CHAT */}
        <form onSubmit={handleSendMessage} className="copilot-chat-input-area">
          <input
            className="copilot-input-field"
            placeholder="Ex: 'Estruture meu currículo a partir do PDF anexado' ou 'Mude para o Modelo Executive com cor Azul'..."
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
