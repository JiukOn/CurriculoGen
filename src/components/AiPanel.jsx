import React from 'react';

/* --- BOTÃO DE DESTAQUE SUPERIOR DO COPILOTO IA --- */

const AiPanel = ({ onOpenCopilot }) => {
  return (
    <div className="copilot-top-launcher-card" onClick={onOpenCopilot}>
      <div className="launcher-glow-effect"></div>
      <div className="launcher-content">
        <div className="launcher-left">
          <span className="launcher-avatar">✨</span>
          <div>
            <h4 className="launcher-title">Copiloto IA de Carreira</h4>
            <p className="launcher-desc">Auditoria de fatos, leitor de PDF e zero alucinação</p>
          </div>
        </div>
        <button type="button" className="launcher-action-btn">
          Abrir Chat ➔
        </button>
      </div>
    </div>
  );
};

export default AiPanel;
