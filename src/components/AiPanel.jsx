import React, { useState, useEffect } from 'react';

/* --- CARD RESUMIDO DO COPILOTO IA NA SIDEBAR COM ACESSO DIRETO AO CHAT --- */

const AiPanel = ({ onOpenCopilot }) => {
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem('gemini_api_key') || ''; } catch { return ''; }
  });

  const [evidenceCount, setEvidenceCount] = useState(0);

  useEffect(() => {
    const checkState = () => {
      try {
        const key = localStorage.getItem('gemini_api_key') || '';
        setApiKey(key);
        const sources = localStorage.getItem('jiu_evidence_sources');
        setEvidenceCount(sources ? JSON.parse(sources).length : 0);
      } catch {}
    };

    checkState();
    window.addEventListener('storage', checkState);
    return () => window.removeEventListener('storage', checkState);
  }, []);

  return (
    <div className="ai-panel-container">
      <div className="glass-card ai-panel-border">
        
        <header className="panel-header">
          <div className="step-indicator ai-indicator" style={{ background: '#9b59b6', color: 'white' }}>03</div>
          <h3>Copiloto IA & Conversa</h3>
        </header>

        <p className="description-text">
          Converse interativamente com a IA para estruturar, enriquecer e auditar seu currículo com base no seu <strong>LinkedIn</strong> e histórico real (<strong>Zero Alucinação</strong>).
        </p>

        {/* STATUS DA CHAVE E EVIDÊNCIAS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Status da Chave:</span>
            {apiKey ? (
              <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>● Configurada</span>
            ) : (
              <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>○ Não informada</span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Dossiê de Fontes:</span>
            <span style={{ color: '#9b59b6', fontWeight: 'bold' }}>
              {evidenceCount > 0 ? `${evidenceCount} fonte(s) ativa(s)` : 'Nenhuma fonte (adicione)'}
            </span>
          </div>
        </div>

        {/* BOTÃO PRINCIPAL DE LANÇAMENTO DO CHAT */}
        <button 
          type="button"
          className="btn-neon-export ai-btn"
          onClick={onOpenCopilot}
          style={{ 
            borderColor: '#9b59b6', 
            color: '#fff',
            position: 'relative',
            width: '100%',
            background: 'rgba(155, 89, 182, 0.2)',
            boxShadow: '0 0 15px rgba(155, 89, 182, 0.3)'
          }}
        >
          <div className="btn-glow" style={{ background: 'rgba(155, 89, 182, 0.4)' }}></div>
          <span className="btn-content" style={{ fontSize: '12px' }}>
            <i style={{ marginRight: '8px', fontSize: '14px' }}>💬</i> CONVERSAR COM O COPILOTO
          </span>
        </button>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '10px', color: '#9b59b6', textDecoration: 'none', fontWeight: 'bold' }}
          >
            Obter Chave Grátis no Google AI Studio ↗
          </a>
        </div>

      </div>
    </div>
  );
};

export default AiPanel;
