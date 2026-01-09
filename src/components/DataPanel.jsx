import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import EasyForm from './EasyForm';
import structureBase from '../data/structure.json';
import { downloadBaseSchema } from '../utils/dataHandlers';


const DataPanel = ({ jsonInput, setJsonInput }) => {
  const [viewMode, setViewMode] = useState('form'); 
  const [parsedData, setParsedData] = useState({});
  const [parseError, setParseError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      if (!jsonInput || jsonInput.trim() === "") {
        setParsedData({});
        return;
      }
      const parsed = JSON.parse(jsonInput) || {};
      setParsedData(parsed);
      setParseError(null);
    } catch (e) {
      setParseError("JSON inválido detectado. Corrija no Modo Código.");
    }
  }, [jsonInput]);

  // --- HANDLERS ---

  const handleFormUpdate = (newData) => {
    setParsedData(newData);
    setJsonInput(JSON.stringify(newData, null, 2));
  };

  const handleDownload = () => {
    downloadBaseSchema(parsedData || structureBase, "meu_curriculo_backup");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonInput(event.target.result);
      try {
        JSON.parse(event.target.result);
        setViewMode('form');
      } catch (err) {
        setViewMode('code');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const renderModal = () => {
    if (!isFormOpen) return null;

    return createPortal(
      <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
        <div className="modal-content giant-modal glass-card" onClick={e => e.stopPropagation()}>
          
          {/* Header do Modal */}
          <div className="giant-modal-header">
            <h2 style={{margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '1.5rem'}}>
              <span style={{color: 'var(--primary)'}}>📝</span> Editor Visual de Currículo
            </h2>
            <button 
              className="neo-btn" 
              onClick={() => setIsFormOpen(false)}
              style={{
                padding: '10px 20px', 
                height: 'auto', 
                background: 'rgba(231, 76, 60, 0.1)', 
                borderColor: 'var(--error-red)', 
                color: 'var(--error-red)',
                fontWeight: 'bold'
              }}
            >
              FECHAR E SALVAR ✕
            </button>
          </div>

          <div className="giant-modal-body">
            <EasyForm jsonData={parsedData} onUpdate={handleFormUpdate} />
          </div>

        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <div className="glass-card">
        <header className="panel-header">
          <div className="step-indicator">02</div>
          <h3>Gestão de Dados</h3>
        </header>

        <div className="mode-toggle-container">
          <button 
            className={`mode-btn ${viewMode === 'form' ? 'active' : ''}`}
            onClick={() => !parseError && setViewMode('form')}
            title="Preencher campos visualmente"
          >
            <span style={{fontSize: '1.2em'}}>📝</span> 
            <span>MODO FÁCIL</span>
          </button>
          <button 
            className={`mode-btn ${viewMode === 'code' ? 'active' : ''}`}
            onClick={() => setViewMode('code')}
            title="Editar código JSON puro"
          >
            <span style={{fontSize: '1.2em'}}>💻</span> 
            <span>MODO CÓDIGO</span>
          </button>
        </div>

        <div className="action-button-group">
          <button type="button" className="neo-btn download-variant" onClick={handleDownload} title="Baixar Backup">
            <span className="btn-icon">💾</span>
            <div className="btn-label"><span>BACKUP</span><small>.json</small></div>
          </button>
          <button type="button" className="neo-btn upload-variant" onClick={() => fileInputRef.current.click()} title="Importar">
            <span className="btn-icon">📂</span>
            <div className="btn-label"><span>IMPORTAR</span><small>.json</small></div>
          </button>
        </div>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleFileUpload} />

        <div className="section-spacer" style={{height: '15px'}}></div>

        {viewMode === 'form' ? (
          parseError ? (
            <div className="error-toast-neon">⚠️ {parseError}<br/><small>Corrija no Modo Código.</small></div>
          ) : (
            <>
              <p className="description-text" style={{textAlign: 'center', marginBottom: '15px'}}>
                Abra o editor visual em tela cheia para preencher seus dados com conforto e visualização clara.
              </p>
              
              <button 
                className="btn-launch-modal" 
                onClick={() => setIsFormOpen(true)}
              >
                <span className="launch-icon">✨</span>
                <span>ABRIR FORMULÁRIO DE DADOS</span>
                <small style={{fontWeight: '400', opacity: 0.7, fontSize: '0.8rem'}}>
                  Editar em Tela Cheia
                </small>
              </button>
            </>
          )
        ) : (
          <div className="code-editor-container">
            <div className="editor-toolbar">
              <div className="traffic-lights"><span className="red"></span><span className="yellow"></span><span className="green"></span></div>
              <div className="editor-title" style={{color: '#666', fontSize: '10px'}}>raw_data.json</div>
            </div>
            <textarea 
              className="modern-textarea"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              spellCheck="false"
            />
          </div>
        )}
      </div>

      {renderModal()}
    </>
  );
};

export default DataPanel;