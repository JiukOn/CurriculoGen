import React, { useState, useEffect, useRef } from 'react';
import { optimizeResumeWithGemini, fetchAvailableModels, selectBestModel, importResumeFromRawText } from '../utils/aiService';

/* --- JIUKURRICULO: NEURAL ENGINE (COM DETECÇÃO DINÂMICA DE MODELOS E IMPORTADOR) --- */

const AiPanel = ({ jsonInput, setJsonInput }) => {
  // Estados
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem('gemini_api_key') || ''; } catch (e) { return ''; }
  });
  const [jobDesc, setJobDesc] = useState('');
  const [rawResumeText, setRawResumeText] = useState('');
  const [activeTab, setActiveTab] = useState('optimize'); // 'optimize' | 'import'
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, msg: '' });

  // Detecção dinâmica de modelos
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isCheckingModels, setIsCheckingModels] = useState(false);

  const fileInputRef = useRef(null);

  // Persistência da Key
  useEffect(() => {
    try { localStorage.setItem('gemini_api_key', apiKey); } catch (e) {}
  }, [apiKey]);

  // Consulta dinâmica de modelos ao inserir/alterar a API Key
  useEffect(() => {
    if (!apiKey || apiKey.trim().length < 10) {
      setAvailableModels([]);
      setSelectedModel('');
      return;
    }

    let isMounted = true;
    const checkModels = async () => {
      setIsCheckingModels(true);
      try {
        const models = await fetchAvailableModels(apiKey);
        if (isMounted) {
          setAvailableModels(models);
          const best = selectBestModel(models);
          setSelectedModel(best);
        }
      } catch (err) {
        console.warn("Erro ao detectar modelos:", err);
      } finally {
        if (isMounted) setIsCheckingModels(false);
      }
    };

    const debounce = setTimeout(checkModels, 800);
    return () => {
      isMounted = false;
      clearTimeout(debounce);
    };
  }, [apiKey]);

  // --- FUNÇÕES DE ARQUIVO ---
  const handleDownloadTemplate = () => {
    const template = {
      nome: "Título da Vaga (ex: Desenvolvedor Full Stack)",
      requisitos: ["Requisito técnico 1", "Requisito técnico 2"],
      responsabilidades: ["Responsabilidade do dia a dia 1", "Responsabilidade 2"],
      diferenciais: ["Diferencial ou Nice-to-have 1"]
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "vagaDesc.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonContent = JSON.parse(e.target.result);
        setJobDesc(JSON.stringify(jsonContent, null, 2));
        setFeedback({ type: 'success', msg: 'Vaga importada! Clique em Otimizar.' });
      } catch (err) {
        setFeedback({ type: 'error', msg: 'Arquivo inválido. Use um JSON.' });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };

  // --- OTIMIZAÇÃO NEURAL ---
  const handleOptimization = async () => {
    setFeedback({ type: null, msg: '' });
    
    if (!apiKey.trim()) {
      setFeedback({ type: 'error', msg: 'A API Key do Gemini é obrigatória.' });
      return;
    }
    if (!jobDesc.trim() || jobDesc.length < 10) {
      setFeedback({ type: 'error', msg: 'Descrição da vaga insuficiente.' });
      return;
    }

    setLoading(true);

    try {
      let currentData;
      try {
        currentData = JSON.parse(jsonInput);
      } catch (e) {
        throw new Error("JSON do currículo inválido.");
      }

      const optimizedData = await optimizeResumeWithGemini(apiKey, currentData, jobDesc, selectedModel);
      setJsonInput(JSON.stringify(optimizedData, null, 2));
      setFeedback({ type: 'success', msg: `Otimizado com sucesso usando ${selectedModel || 'Gemini'}!` });
      
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', msg: error.message || 'Erro na otimização.' });
    } finally {
      setLoading(false);
    }
  };

  // --- IMPORTAÇÃO INTELIGENTE DE TEXTO BRUTO (ITEM 6) ---
  const handleImportRawText = async () => {
    setFeedback({ type: null, msg: '' });

    if (!apiKey.trim()) {
      setFeedback({ type: 'error', msg: 'A API Key do Gemini é necessária para analisar o texto.' });
      return;
    }
    if (!rawResumeText.trim() || rawResumeText.length < 20) {
      setFeedback({ type: 'error', msg: 'Cole um texto com mais detalhes do seu perfil ou histórico profissional.' });
      return;
    }

    setLoading(true);

    try {
      const extracted = await importResumeFromRawText(apiKey, rawResumeText, selectedModel);
      setJsonInput(JSON.stringify(extracted, null, 2));
      setFeedback({ type: 'success', msg: 'Dados extraídos e estruturados com sucesso no currículo!' });
      setActiveTab('optimize');
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', msg: err.message || 'Falha ao estruturar o texto fornecido.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-panel-container">
      <div className="glass-card ai-panel-border">
        
        <header className="panel-header">
          <div className="step-indicator ai-indicator" style={{ background: '#9b59b6', color: 'white' }}>03</div>
          <h3>Neural Engine & IA</h3>
        </header>

        {/* SUB-TABS: OTIMIZAÇÃO ATS OU IMPORTADOR DE TEXTO */}
        <div className="ai-tabs-container">
          <button
            type="button"
            className={`ai-tab-btn ${activeTab === 'optimize' ? 'active' : ''}`}
            onClick={() => setActiveTab('optimize')}
          >
            🎯 Otimizar p/ Vaga
          </button>
          <button
            type="button"
            className={`ai-tab-btn ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            📋 Importar Texto/LinkedIn
          </button>
        </div>

        {/* --- API KEY SECTION --- */}
        <div className="control-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="modern-label ai-label" style={{ color: '#9b59b6' }}>Gemini API Key</label>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ fontSize: '10px', color: '#9b59b6', textDecoration: 'none', fontWeight: 'bold' }}
            >
              Obter Chave Grátis ↗
            </a>
          </div>
          <div className="custom-select-wrapper">
            <input 
              type="password" 
              className="modern-select ai-input"
              style={{ borderColor: apiKey ? '#9b59b6' : '' }}
              placeholder="Cole sua chave do Google AI Studio..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        {/* SELEÇÃO DINÂMICA DE MODELO (ITEM 1) */}
        {apiKey && (
          <div className="control-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="modern-label" style={{ fontSize: '11px', color: '#bdc3c7' }}>
                Modelo Selecionado
              </label>
              {isCheckingModels ? (
                <span style={{ fontSize: '10px', color: '#9b59b6' }}>Consultando API...</span>
              ) : (
                availableModels.length > 0 && (
                  <span style={{ fontSize: '10px', color: '#2ecc71' }}>● {availableModels.length} detectados</span>
                )
              )}
            </div>
            <select
              className="modern-select no-arrow"
              style={{ fontSize: '12px', borderColor: 'rgba(155, 89, 182, 0.4)' }}
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {availableModels.length > 0 ? (
                availableModels.map(m => (
                  <option key={m} value={m}>
                    {m} {m.includes('flash') ? '⚡ (Rápido e Estável)' : ''}
                  </option>
                ))
              ) : (
                <option value="gemini-2.0-flash">gemini-2.0-flash (Recomendado)</option>
              )}
            </select>
            <small style={{ fontSize: '10px', opacity: 0.7, marginTop: '3px', display: 'block' }}>
              Modelos com sufixo <em>flash</em> oferecem o menor custo, maior velocidade e saída JSON estruturada.
            </small>
          </div>
        )}

        {/* CONTEÚDO DA ABA 1: OTIMIZAR VAGA */}
        {activeTab === 'optimize' && (
          <div className="control-group">
            <label className="modern-label ai-label" style={{ color: '#9b59b6' }}>Dados da Vaga</label>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <button 
                type="button"
                onClick={handleDownloadTemplate}
                className="neo-btn"
                style={{
                  borderColor: 'rgba(155, 89, 182, 0.3)',
                  background: 'rgba(155, 89, 182, 0.05)',
                  color: '#e0e0e0',
                  justifyContent: 'center',
                  padding: '8px',
                  height: 'auto'
                }}
                title="Baixar Modelo JSON"
              >
                <span style={{ fontSize: '14px', marginRight: '5px' }}>📥</span>
                <span style={{ fontSize: '10px', fontWeight: '700' }}>BAIXAR VAGA</span>
              </button>

              <button 
                type="button"
                onClick={handleImportClick}
                className="neo-btn"
                style={{
                  borderColor: '#9b59b6',
                  background: 'rgba(155, 89, 182, 0.15)',
                  color: '#d4acfc',
                  justifyContent: 'center',
                  padding: '8px',
                  height: 'auto'
                }}
                title="Importar vagaDesc.json"
              >
                <span style={{ fontSize: '14px', marginRight: '5px' }}>📂</span>
                <span style={{ fontSize: '10px', fontWeight: '700' }}>IMPORTAR</span>
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload} 
                accept=".json" 
                style={{display: 'none'}} 
              />
            </div>

            <textarea 
              className="modern-textarea ai-textarea"
              style={{ minHeight: '100px', borderColor: jobDesc ? '#9b59b6' : '' }}
              placeholder="Cole aqui a descrição ou requisitos da vaga..."
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
            />
          </div>
        )}

        {/* CONTEÚDO DA ABA 2: IMPORTADOR INTELIGENTE (ITEM 6) */}
        {activeTab === 'import' && (
          <div className="control-group">
            <label className="modern-label ai-label" style={{ color: '#9b59b6' }}>
              Texto do Perfil / LinkedIn / Currículo Antigo
            </label>
            <textarea 
              className="modern-textarea ai-textarea"
              style={{ minHeight: '130px', borderColor: rawResumeText ? '#9b59b6' : '' }}
              placeholder="Cole aqui o texto do seu perfil do LinkedIn ou currículo antigo (experiências, educação, skills, etc.)..."
              value={rawResumeText}
              onChange={(e) => setRawResumeText(e.target.value)}
            />
            <small style={{ fontSize: '10.5px', opacity: 0.75, display: 'block', marginTop: '4px' }}>
              A IA analisará o texto livre e preencherá automaticamente todos os campos do seu formulário.
            </small>
          </div>
        )}

        {/* FEEDBACK STATUS */}
        {feedback.msg && (
          <div 
            className={`feedback-box ${feedback.type}`}
            style={{ 
              padding: '10px 12px', 
              borderRadius: '8px', 
              marginBottom: '12px',
              fontSize: '11px',
              fontWeight: 'bold',
              background: feedback.type === 'error' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)',
              color: feedback.type === 'error' ? '#e74c3c' : '#2ecc71',
              border: `1px solid ${feedback.type === 'error' ? '#e74c3c' : '#2ecc71'}`,
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <span>{feedback.type === 'error' ? '⚠️' : '✨'}</span>
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* BOTÃO PRINCIPAL */}
        <div className="action-button-group" style={{ display: 'flex', marginTop: '6px' }}>
          {activeTab === 'optimize' ? (
            <button 
              type="button"
              className="btn-neon-export ai-btn"
              onClick={handleOptimization}
              disabled={loading || !apiKey || !jobDesc}
              style={{ 
                borderColor: '#9b59b6', 
                color: loading ? '#666' : '#9b59b6',
                position: 'relative',
                width: '100%',
                background: loading ? 'transparent' : 'rgba(155, 89, 182, 0.05)'
              }}
            >
              <div className="btn-glow" style={{ background: 'rgba(155, 89, 182, 0.4)' }}></div>
              <span className="btn-content" style={{ fontSize: '12px' }}>
                {loading ? (
                  <span className="pulsing-text">OTIMIZANDO COM IA...</span>
                ) : (
                  <>
                    <i style={{ marginRight: '8px', fontSize: '14px' }}>⚡</i> OTIMIZAR CURRÍCULO
                  </>
                )}
              </span>
            </button>
          ) : (
            <button 
              type="button"
              className="btn-neon-export ai-btn"
              onClick={handleImportRawText}
              disabled={loading || !apiKey || !rawResumeText}
              style={{ 
                borderColor: '#9b59b6', 
                color: loading ? '#666' : '#9b59b6',
                position: 'relative',
                width: '100%',
                background: loading ? 'transparent' : 'rgba(155, 89, 182, 0.05)'
              }}
            >
              <div className="btn-glow" style={{ background: 'rgba(155, 89, 182, 0.4)' }}></div>
              <span className="btn-content" style={{ fontSize: '12px' }}>
                {loading ? (
                  <span className="pulsing-text">EXTRAINDO DADOS...</span>
                ) : (
                  <>
                    <i style={{ marginRight: '8px', fontSize: '14px' }}>✨</i> ESTRUTURAR CURRÍCULO
                  </>
                )}
              </span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default AiPanel;
