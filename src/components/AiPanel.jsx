import React, { useState, useEffect, useRef } from 'react';
import { optimizeResumeWithGemini } from '../utils/aiService';

/* --- JIUKURRICULO: NEURAL ENGINE (VAGA JSON SUPPORT) --- */

const AiPanel = ({ jsonInput, setJsonInput }) => {
  // Estados
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem('gemini_api_key') || ''; } catch (e) { return ''; }
  });
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, msg: '' });
  
  // Referência para o input de arquivo oculto
  const fileInputRef = useRef(null);

  // Persistência da Key
  useEffect(() => {
    try { localStorage.setItem('gemini_api_key', apiKey); } catch (e) {}
  }, [apiKey]);

  // --- FUNÇÕES DE ARQUIVO (NOVO) ---

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
        
        // Formata o JSON para string e joga no textarea
        // Isso permite que a IA leia tanto texto puro quanto JSON
        setJobDesc(JSON.stringify(jsonContent, null, 2));
        setFeedback({ type: 'success', msg: 'Vaga importada com sucesso! Clique em Otimizar.' });
      } catch (err) {
        setFeedback({ type: 'error', msg: 'Arquivo inválido. Certifique-se que é um JSON.' });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset para permitir re-upload
  };

  // --- OTIMIZAÇÃO NEURAL ---

  const handleOptimization = async () => {
    setFeedback({ type: null, msg: '' });
    
    if (!apiKey.trim()) {
      setFeedback({ type: 'error', msg: 'A API Key do Gemini é obrigatória.' });
      return;
    }
    if (!jobDesc.trim() || jobDesc.length < 10) {
      setFeedback({ type: 'error', msg: 'Cole ou importe uma descrição de vaga válida.' });
      return;
    }

    setLoading(true);

    try {
      let currentData;
      try {
        currentData = JSON.parse(jsonInput);
      } catch (e) {
        throw new Error("O JSON atual do currículo é inválido.");
      }

      // Chama o serviço atualizado que aceita tanto texto quanto JSON na vaga
      const optimizedData = await optimizeResumeWithGemini(apiKey, currentData, jobDesc);
      
      setJsonInput(JSON.stringify(optimizedData, null, 2));
      setFeedback({ type: 'success', msg: 'Currículo reescrito para a vaga! Verifique as alterações.' });
      
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', msg: error.message || 'Erro desconhecido na otimização.' });
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
          <br/><small style={{opacity: 0.7}}>(BYOK: Seus dados não são armazenados por nós).</small>
        </p>

        {/* Input API Key */}
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
        </div>

        {/* Área da Vaga com Botões de Arquivo */}
        <div className="control-group">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
            <label className="modern-label ai-label" style={{ color: '#9b59b6', margin: 0 }}>Dados da Vaga (JD)</label>
            
            {/* Botões de Ação de Arquivo */}
            <div style={{display: 'flex', gap: '8px'}}>
              <button 
                onClick={handleDownloadTemplate}
                className="neo-btn"
                style={{padding: '4px 8px', fontSize: '10px', height: 'auto', background: 'transparent'}}
                title="Baixar Modelo JSON"
              >
                📥 Modelo
              </button>
              <button 
                onClick={handleImportClick}
                className="neo-btn"
                style={{padding: '4px 8px', fontSize: '10px', height: 'auto', borderColor: '#9b59b6', color: '#9b59b6', background: 'transparent'}}
                title="Importar vagaDesc.json"
              >
                📂 Importar
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload} 
                accept=".json" 
                style={{display: 'none'}} 
              />
            </div>
          </div>

          <textarea 
            className="modern-textarea ai-textarea"
            style={{ minHeight: '120px', borderColor: jobDesc ? '#9b59b6' : '' }}
            placeholder="Cole a descrição ou use o botão Importar..."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
          />
        </div>

        {/* Feedback Area */}
        {feedback.msg && (
          <div 
            className={`feedback-box ${feedback.type}`}
            style={{ 
              padding: '10px', 
              borderRadius: '8px', 
              marginBottom: '15px',
              fontSize: '11px',
              fontWeight: 'bold',
              background: feedback.type === 'error' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)',
              color: feedback.type === 'error' ? '#e74c3c' : '#2ecc71',
              border: `1px solid ${feedback.type === 'error' ? '#e74c3c' : '#2ecc71'}`
            }}
          >
            {feedback.type === 'error' ? '⚠️ ' : '✨ '}
            {feedback.msg}
          </div>
        )}

        {/* Botão de Ação */}
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
              width: '100%'
            }}
          >
            <div className="btn-glow" style={{ background: 'rgba(155, 89, 182, 0.4)' }}></div>
            <span className="btn-content">
              {loading ? (
                <span className="pulsing-text">PROCESSANDO...</span>
              ) : (
                <>
                  <i style={{ marginRight: '8px' }}>⚡</i> OTIMIZAR CURRÍCULO
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