import React, { useState, useEffect, useRef } from 'react';
import { optimizeResumeWithGemini } from '../utils/aiService';

/* --- JIUKURRICULO: NEURAL ENGINE (UI ENHANCED) --- */

const AiPanel = ({ jsonInput, setJsonInput }) => {
  // Estados
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem('gemini_api_key') || ''; } catch (e) { return ''; }
  });
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, msg: '' });
  
  const fileInputRef = useRef(null);

  // Persistência da Key
  useEffect(() => {
    try { localStorage.setItem('gemini_api_key', apiKey); } catch (e) {}
  }, [apiKey]);

  // --- FUNÇÕES DE ARQUIVO ---

  const handleDownloadTemplate = () => {
    const template = {
      nome: "Título da Vaga (ex: Desenvolvedor C# Jr)",
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

      const optimizedData = await optimizeResumeWithGemini(apiKey, currentData, jobDesc);
      
      setJsonInput(JSON.stringify(optimizedData, null, 2));
      setFeedback({ type: 'success', msg: 'Currículo otimizado com sucesso!' });
      
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', msg: error.message || 'Erro na otimização.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-panel-container">
      <div className="glass-card ai-panel-border">
        
        <header className="panel-header">
          <div className="step-indicator ai-indicator" style={{ background: '#9b59b6', color: 'white' }}>03</div>
          <h3>Neural Optimizer</h3>
        </header>

        <p className="description-text">
          Utilize o <strong>Gemini Pro</strong> para alinhar seu currículo à vaga.
          <br/><small style={{opacity: 0.7}}>(Seus dados não são armazenados).</small>
        </p>

        {/* --- API KEY SECTION --- */}
        <div className="control-group">
          <label className="modern-label ai-label" style={{ color: '#9b59b6' }}>Gemini API Key</label>
          <div className="custom-select-wrapper">
            <input 
              type="password" 
              className="modern-select ai-input"
              style={{ borderColor: apiKey ? '#9b59b6' : '' }}
              placeholder="Cole sua chave do AI Studio aqui..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
            />
          </div>
          {/* Link de Ajuda */}
          <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '5px'}}>
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ fontSize: '10px', color: '#9b59b6', textDecoration: 'none', fontWeight: 'bold' }}
            >
              Obter Chave Grátis ↗
            </a>
          </div>
        </div>

        {/* --- JOB DESCRIPTION SECTION --- */}
        <div className="control-group">
          <label className="modern-label ai-label" style={{ color: '#9b59b6' }}>Dados da Vaga (JD)</label>
          
          {/* GRID DE BOTÕES GRANDES GLASSMORPHISM */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            
            {/* Botão Baixar Modelo */}
            <button 
              onClick={handleDownloadTemplate}
              className="neo-btn"
              style={{
                borderColor: 'rgba(155, 89, 182, 0.3)',
                background: 'rgba(155, 89, 182, 0.05)',
                color: '#e0e0e0',
                justifyContent: 'center',
                padding: '12px',
                height: 'auto'
              }}
              title="Baixar Modelo JSON"
            >
              <span style={{ fontSize: '16px', marginRight: '5px' }}>📥</span>
              <span style={{ fontSize: '11px', fontWeight: '700' }}>BAIXAR MODELO</span>
            </button>

            {/* Botão Importar */}
            <button 
              onClick={handleImportClick}
              className="neo-btn"
              style={{
                borderColor: '#9b59b6',
                background: 'rgba(155, 89, 182, 0.15)',
                color: '#d4acfc', // Tom lilás claro
                justifyContent: 'center',
                padding: '12px',
                height: 'auto'
              }}
              title="Importar vagaDesc.json"
            >
              <span style={{ fontSize: '16px', marginRight: '5px' }}>📂</span>
              <span style={{ fontSize: '11px', fontWeight: '700' }}>IMPORTAR JSON</span>
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
            style={{ minHeight: '120px', borderColor: jobDesc ? '#9b59b6' : '' }}
            placeholder="Cole a descrição ou use o botão Importar..."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
          />
        </div>

        {/* --- FEEDBACK AREA --- */}
        {feedback.msg && (
          <div 
            className={`feedback-box ${feedback.type}`}
            style={{ 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '15px',
              fontSize: '11px',
              fontWeight: 'bold',
              background: feedback.type === 'error' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)',
              color: feedback.type === 'error' ? '#e74c3c' : '#2ecc71',
              border: `1px solid ${feedback.type === 'error' ? '#e74c3c' : '#2ecc71'}`,
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <span style={{ fontSize: '14px' }}>{feedback.type === 'error' ? '⚠️' : '✨'}</span>
            {feedback.msg}
          </div>
        )}

        {/* --- MAIN ACTION BUTTON --- */}
        <div className="action-button-group" style={{ display: 'flex', marginTop: '10px' }}>
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
                <span className="pulsing-text">PROCESSANDO...</span>
              ) : (
                <>
                  <i style={{ marginRight: '8px', fontSize: '14px' }}>⚡</i> OTIMIZAR CURRÍCULO
                </>
              )}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default AiPanel;