import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import VisualEditor from './components/VisualEditor';
import DataPanel from './components/DataPanel';
import { injectDataToIframe } from './utils/cvInjector';
import { exportToPDF } from './utils/exportHandler';
import { validateAndFormat } from './utils/dataHandlers';
import { PALETTES } from './config/constants';
import structureBase from './data/structure.json';
import './App.css';

/* --- TÍTULOS BONITOS: JIUKURRILO - CORE ENGINE GLASS --- */

function App() {
  const [config, setConfig] = useState({ 
    model: 'model1.html', 
    palette: 'graphite', 
    font: "'Inter', sans-serif" 
  });
  
  const [jsonInput, setJsonInput] = useState(() => {
    try {
      const saved = localStorage.getItem('cv_generation_cache');
      return saved || JSON.stringify(structureBase, null, 2);
    } catch (e) {
      return JSON.stringify(structureBase, null, 2);
    }
  });

  const [error, setError] = useState(null);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const iframeRef = useRef(null);

  /* --- TÍTULOS BONITOS: LÓGICA DE PROCESSAMENTO --- */
  
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
    const doc = iframe.contentWindow.document;
    injectDataToIframe(doc, validatedData, config, PALETTES);
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
      <aside className="sidebar-controls glass-sidebar">
        <header className="brand-header-neon">
          <h1 className="brand-title-jiu">JIU<span>KURRILO</span></h1>
          <div className="status-line">
            <span className="pulse-dot"></span> SYSTEM ACTIVE
          </div>
        </header>
        
        <div className="control-sections-scroll">
          {/* Passo 1: Design Engine */}
          <VisualEditor config={config} setConfig={setConfig} />
          
          {error && <div className="error-toast-neon">{error}</div>}

          {/* Passo 2: Data Engine */}
          <DataPanel 
            jsonInput={jsonInput} 
            setJsonInput={setJsonInput} 
          />
        </div>

        {/* Passo 3: Finalização */}
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

      <main className="preview-area-jiu">
        <div className="viewport-container-glass">
          <div className="canvas-header">
            <span className="badge-live">LIVE PREVIEW</span>
            <div className="canvas-dots"><span></span><span></span><span></span></div>
          </div>
          <div className="iframe-shadow-box">
            <iframe 
              ref={iframeRef} 
              onLoad={handleIframeLoad}
              src={`./models/${config.model}`} 
              className="cv-iframe-clean"
              title="Jiukurrilo Canvas"
              sandbox="allow-same-origin allow-scripts allow-modals"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;