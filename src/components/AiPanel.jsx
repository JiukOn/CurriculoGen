import React, { useState, useEffect } from 'react';
import { optimizeResumeWithGemini } from '../utils/aiService';

/* --- TÍTULOS BONITOS: NEURAL ENGINE (PANEL 03) --- */

const AiPanel = ({ jsonInput, setJsonInput }) => {
  // Estado local para a API Key (persistente) e Descrição da Vaga
  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem('gemini_api_key') || '';
    } catch (e) {
      return '';
    }
  });
  
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, msg: '' }); // null | 'success' | 'error'

  // Salva a key no localStorage automaticamente
  useEffect(() => {
    try {
      localStorage.setItem('gemini_api_key', apiKey);
    } catch (e) {
      // Falha silenciosa em modo anônimo estrito
    }
  }, [apiKey]);

  const handleOptimization = async () => {
    // 1. Validações Iniciais
    setFeedback({ type: null, msg: '' });
    
    if (!apiKey.trim()) {
      setFeedback({ type: 'error', msg: 'A API Key do Gemini é obrigatória.' });
      return;
    }
    if (!jobDesc.trim() || jobDesc.length < 10) {
      setFeedback({ type: 'error', msg: 'Cole uma descrição de vaga válida.' });
      return;
    }

    setLoading(true);

    try {
      // 2. Parse do JSON atual
      let currentData;
      try {
        currentData = JSON.parse(jsonInput);
      } catch (e) {
        throw new Error("O JSON atual do currículo é inválido. Corrija na aba de Dados antes de prosseguir.");
      }

      // 3. Chamada ao Serviço Neural
      const optimizedData = await optimizeResumeWithGemini(apiKey, currentData, jobDesc);
      
      // 4. Atualização do Estado Global
      setJsonInput(JSON.stringify(optimizedData, null, 2));
      setFeedback({ type: 'success', msg: 'Currículo otimizado com sucesso! Verifique as alterações.' });
      setJobDesc(''); // Limpa a vaga para evitar confusão

    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', msg: error.message || 'Erro desconhecido na otimização.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-panel-container">
      {/* Adiciona borda roxa sutil para diferenciar dos outros painéis */}
      <div className="glass-card ai-panel-border">
        
        <header className="panel-header">
          {/* Indicador estilizado para AI */}
          <div className="step-indicator ai-indicator" style={{ background: '#9b59b6', color: 'white' }}>03</div>
          <h3>Neural Optimizer</h3>
        </header>

        <p className="description-text">
          Utilize o <strong>Gemini 1.5 Flash</strong> para reescrever seu currículo com foco na vaga desejada. (BYOK: Traga sua própria chave).
        </p>

        {/* Input da API Key */}
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
          <small style={{ fontSize: '9px', color: '#666', marginTop: '5px', display: 'block' }}>
            Sua chave é salva apenas no seu navegador local.
          </small>
        </div>

        {/* Input da Descrição da Vaga */}
        <div className="control-group">
          <label className="modern-label ai-label" style={{ color: '#9b59b6' }}>Descrição da Vaga (JD)</label>
          <textarea 
            className="modern-textarea ai-textarea"
            style={{ minHeight: '120px', borderColor: jobDesc ? '#9b59b6' : '' }}
            placeholder="Cole aqui os requisitos, responsabilidades e diferenciais da vaga..."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
          />
        </div>

        {/* Feedback Visual (Mensagens de Erro/Sucesso) */}
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

        {/* Botão de Ação Neural */}
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
                <span className="pulsing-text">PROCESSANDO DADOS...</span>
              ) : (
                <>
                  <i style={{ marginRight: '8px' }}>⚡</i> OTIMIZAR AGORA
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