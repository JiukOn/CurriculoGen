import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import VisualEditor from './components/VisualEditor';
import DataPanel from './components/DataPanel';
import { injectDataToIframe } from './utils/cvInjector';
import { exportToPDF } from './utils/exportHandler';
import { validateAndFormat } from './utils/dataHandlers';
import { PALETTES } from './config/constants';
import structureBase from './data/structure.json';
import './App.css';

/* --- TÍTULOS BONITOS: JIUKURRILO CORE ENGINE - FINAL STABLE --- */

function App() {
  const [config, setConfig] = useState({ 
    model: 'model1.html', 
    palette: 'graphite', 
    font: "'Inter', sans-serif" 
  });
  
  const [jsonInput, setJsonInput] = useState(() => {
    try {
      const saved = localStorage.getItem('cv_generation_cache');
      // Tenta carregar do cache ou usa o arquivo de assets padrão
      return saved || JSON.stringify(structureBase, null, 2);
    } catch (e) {
      return JSON.stringify(structureBase, null, 2);
    }
  });

  const [error, setError] = useState(null);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const iframeRef = useRef(null);

  /* --- TÍTULOS BONITOS: LÓGICA DE SINCRONIZAÇÃO MEMORIZADA --- */
  
  const validatedData = useMemo(() => {
    const result = validateAndFormat(jsonInput);
    if (!result && jsonInput.trim() !== "") {
      setError("Sintaxe JSON corrompida.");
      return null;
    }
    setError(null);
    localStorage.setItem('cv_generation_cache', jsonInput);
    return result;
  }, [jsonInput]);

  const syncPreview = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !isIframeReady) return;

    try {
      const doc = iframe.contentWindow.document;
      // Injeta os dados, cores e fontes no preview
      injectDataToIframe(doc, validatedData, config, PALETTES);
    } catch (err) {
      console.warn("Aguardando permissões do Iframe...");
    }
  }, [validatedData, config, isIframeReady]);

  useEffect(() => {
    const timeout = setTimeout(syncPreview, 150);
    return () => clearTimeout(timeout);
  }, [syncPreview]);

  const handleIframeLoad = () => {
    setIsIframeReady(true);
    syncPreview();
  };

  return (
    <div className="app-container glass-bg">
      {/* Sidebar: Painel de Controle Glassmorphism */}
      <aside className="sidebar-controls glass-sidebar">
        <header className="brand-header-neon">
          <h1 className="brand-title-jiu">JIU<span>KURRILO</span></h1>
          <div className="status-line">
            <span className="pulse-dot"></span> SYSTEM ACTIVE
          </div>
        </header>
        
        <div className="control-sections-scroll">
          {/* Passo 1: Edição Visual */}
          <VisualEditor config={config} setConfig={setConfig} />
          
          <div className="section-spacer"></div>
          
          {error && <div className="error-toast-neon">{error}</div>}

          {/* Passo 2: Gestão de Dados */}
          <DataPanel 
            jsonInput={jsonInput} 
            setJsonInput={setJsonInput} 
          />
        </div>

        <div className="section-spacer-large"></div>

        {/* Passo 3: Exportação Profissional */}
        <div className="export-section-glass">
          <button 
            className="btn-neon-export" 
            disabled={!!error || !jsonInput}
            onClick={() => exportToPDF(iframeRef)}
          >
            <div className="btn-glow"></div>
            <span className="btn-content">
              <i>💾</i> EXPORTAR CURRÍCULO
            </span>
          </button>
        </div>
      </aside>

      {/* Main: Área de Preview Expandida (Canvas A4) */}
      <main className="preview-area-expanded">
        <div className="viewport-container-full">
          <div className="canvas-header">
            <span className="badge-live">LIVE PREVIEW</span>
            <div className="canvas-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
          <div className="iframe-shadow-box">
            <iframe 
              ref={iframeRef} 
              onLoad={handleIframeLoad}
              src={`./models/${config.model}`} 
              className="cv-iframe-full"
              title="Jiukurrilo Canvas"
              /* allow-same-origin é obrigatório para o JS injetar dados no HTML local */
              sandbox="allow-scripts allow-modals allow-same-origin"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;