import React, { useRef } from 'react';
import { downloadBaseSchema } from '../utils/dataHandlers';
import structureBase from '../data/structure.json';

/* --- TÍTULOS BONITOS: CURRICULO GENERATION - DATA ENGINE --- */

const DataPanel = ({ jsonInput, setJsonInput }) => {
  const fileInputRef = useRef(null);

  const handleDownload = () => {
    downloadBaseSchema(structureBase);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonInput(event.target.result);
    };
    reader.readAsText(file);
  };

  return (
    <div className="data-panel-container">
      <div className="glass-card">
        <header className="panel-header">
          <div className="step-indicator">02</div>
          <h3>Gestão de Dados</h3>
        </header>

        <p className="description-text">
          Personalize sua trajetória. Importe seu arquivo <strong>JSON</strong> ou utilize nosso modelo base para começar.
        </p>
        
        <div className="action-button-group">
          <button 
            type="button" 
            className="neo-btn download-variant" 
            onClick={handleDownload}
            title="Baixar Estrutura Base"
          >
            <span className="btn-icon">📦</span>
            <div className="btn-label">
              <span>Baixar</span>
              <small>Modelo JSON</small>
            </div>
          </button>

          <button 
            type="button" 
            className="neo-btn upload-variant" 
            onClick={() => fileInputRef.current.click()}
            title="Carregar Arquivo Local"
          >
            <span className="btn-icon">🚀</span>
            <div className="btn-label">
              <span>Importar</span>
              <small>Subir Arquivo</small>
            </div>
          </button>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".json" 
          onChange={handleFileUpload} 
        />

        <div className="code-editor-container">
          <div className="editor-toolbar">
            <div className="traffic-lights">
              <span></span><span></span><span></span>
            </div>
            <div className="editor-title">engine_config.json</div>
          </div>
          <textarea 
            className="modern-textarea"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{"nome": "Prepare sua revolução profissional...", "experiencias": []}'
          />
        </div>
      </div>
    </div>
  );
};

export default DataPanel;