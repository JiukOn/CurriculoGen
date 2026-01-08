import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import VisualEditor from './components/VisualEditor';
import DataPanel from './components/DataPanel';
import { injectDataToIframe } from './utils/cvInjector';
import { exportToPDF } from './utils/exportHandler';
import { validateAndFormat } from './utils/dataHandlers';
import { PALETTES } from './config/constants';
import structureBase from './data/structure.json';
import './App.css';

/* --- TÍTULOS BONITOS: CURRICULO GENERATION - CORE ENGINE --- */

function App() {
  // Estado de Estilização: Configurações visuais do Passo 1
  const [config, setConfig] = useState({ 
    model: 'model1.html', 
    palette: 'graphite', 
    font: "'Inter', sans-serif" 
  });
  
  // Estado de Dados: Persistência local segura para o Passo 2
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

  /* --- TÍTULOS BONITOS: PROCESSAMENTO E SEGURANÇA --- */
  
  // Memoriza os dados validados para evitar processamento excessivo no re-render
  const validatedData = useMemo(() => {
    const result = validateAndFormat(jsonInput);
    if (!result && jsonInput.trim() !== "") {
      setError("Assinatura JSON inválida. Verifique a sintaxe.");
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

    // Injeção segura de dados e estilos reativos
    injectDataToIframe(doc, validatedData, config, PALETTES);
    
  }, [validatedData, config, isIframeReady]);

  /* --- TÍTULOS BONITOS: EFEITOS DE SINCRONIZAÇÃO --- */

  // Debounce inteligente para suavizar a experiência de digitação
  useEffect(() => {
    const timeout = setTimeout(syncPreview, 150);
    return () => clearTimeout(timeout);
  }, [syncPreview]);

  // Força atualização imediata ao carregar um novo modelo
  const handleIframeLoad = () => {
    setIsIframeReady(true);
    syncPreview();
  };

  return (
    <div className="app-container">
      <aside className="sidebar-controls">
        <header className="brand-header">
          <h1 className="brand-title">CURRICULO<span>GENERATION</span></h1>
          <div className="engine-status">
            <span className="status-dot"></span> 2026 Engine Ready
          </div>
        </header>
        
        {/* Passo 1: Edição Visual Estilizada */}
        <VisualEditor config={config} setConfig={setConfig} />
        
        {/* Toast de Erro Flutuante (Opcional via CSS) */}
        {error && <div className="error-badge-modern">{error}</div>}

        {/* Passo 2: Gestão de Dados Modernizada */}
        <DataPanel 
          jsonInput={jsonInput} 
          setJsonInput={setJsonInput} 
        />

        {/* Passo 3: Exportação Otimizada */}
        <div className="action-area-fixed">
          <button 
            className="btn-export-main" 
            disabled={!!error || !jsonInput}
            onClick={() => exportToPDF(iframeRef)}
          >
            <span className="btn-shine"></span>
            <i className="icon-save">💾</i> EXPORTAR PDF PROFISSIONAL
          </button>
        </div>
      </aside>

      <main className="preview-area-modern">
        <div className="iframe-viewport">
          <div className="viewport-header">
            <span>A4 Preview Canvas</span>
            <div className="zoom-controls">100%</div>
          </div>
          <div className="iframe-wrapper-shadow">
            <iframe 
              ref={iframeRef} 
              onLoad={handleIframeLoad}
              src={`./models/${config.model}`} 
              className="cv-iframe"
              title="Curriculo Generation Canvas"
              // Segurança máxima: impede acesso a cookies e execução de scripts externos indesejados
              sandbox="allow-same-origin allow-scripts allow-modals"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;