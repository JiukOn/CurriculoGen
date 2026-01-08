import React, { useRef } from 'react';
import { downloadBaseSchema } from '../utils/dataHandlers';
import structureBase from '../data/structure.json';

/* --- TÍTULOS BONITOS: DATA ENGINE JIUKURRICULO --- */

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
          Sincronize sua trajetória. Importe um arquivo <strong>JSON</strong> ou utilize nosso template para começar a gerar.
        </p>
        
        <div className="action-button-group">
          {/* Botão Neon para Download */}
          <button 
            type="button" 
            className="neo-btn download-variant" 
            onClick={handleDownload}
          >
            <span className="btn-icon">📦</span>
            <div className="btn-label">
              <span>MODELO</span>
              <small>Exportar Base</small>
            </div>
          </button>

          {/* Botão Neon para Upload */}
          <button 
            type="button" 
            className="neo-btn upload-variant" 
            onClick={() => fileInputRef.current.click()}
          >
            <span className="btn-icon">🚀</span>
            <div className="btn-label">
              <span>IMPORTAR</span>
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
              <span className="red"></span>
              <span className="yellow"></span>
              <span className="green"></span>
            </div>
            <div className="editor-title">engine_config.json</div>
          </div>
          <textarea 
            className="modern-textarea"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            spellCheck="false"
            placeholder='{"nome": "Insira seus dados aqui..."}'
          />
        </div>
      </div>
    </div>
  );
};

export default DataPanel;