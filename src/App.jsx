import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import VisualEditor from './components/VisualEditor';
import DataPanel from './components/DataPanel';
import { injectDataToIframe } from './utils/cvInjector';
import { exportToPDF } from './utils/exportHandler';
import { validateAndFormat } from './utils/dataHandlers';
import { PALETTES } from './config/constants';
import structureBase from './data/structure.json';
import './App.css';

/* --- TÍTULOS BONITOS: JIUKURRILO CORE ENGINE - SECURE EDITION --- */

// Helper seguro para localStorage (evita crash em modo anônimo)
const safeStorage = {
  get: (key, fallback) => {
    try {
      const item = localStorage.getItem(key);
      return item ? item : JSON.stringify(fallback, null, 2);
    } catch (e) {
      console.warn('Storage inacessível, usando fallback.');
      return JSON.stringify(fallback, null, 2);
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Falha silenciosa se quota excedida ou bloqueado
    }
  }
};

function App() {
  // Estado de Visual
  const [config, setConfig] = useState({ 
    model: 'model1.html', 
    palette: 'graphite', 
    font: "'Inter', sans-serif" 
  });
  
  // Estado de Dados (Inicialização Segura)
  const [jsonInput, setJsonInput] = useState(() => 
    safeStorage.get('cv_generation_cache', structureBase)
  );

  // Estados de Controle e UI
  const [error, setError] = useState(null);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); // Feedback visual de processamento
  const iframeRef = useRef(null);

  /* --- TÍTULOS BONITOS: VALIDAÇÃO E MEMORIZAÇÃO --- */
  
  const validatedData = useMemo(() => {
    // Inicia feedback de processamento
    setIsSyncing(true);

    const result = validateAndFormat(jsonInput);
    
    // Tratamento de Erro de Sintaxe
    if (!result && jsonInput.trim() !== "") {
      setError("Sintaxe JSON inválida. Verifique vírgulas e chaves.");
      setIsSyncing(false);
      return null;
    }

    setError(null);
    safeStorage.set('cv_generation_cache', jsonInput);
    
    // Finaliza processamento brevemente após validação
    setTimeout(() => setIsSyncing(false), 300);
    return result;
  }, [jsonInput]);

  /* --- TÍTULOS BONITOS: MOTOR DE INJEÇÃO SEGURO --- */

  const syncPreview = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !isIframeReady) return;

    try {
      const doc = iframe.contentWindow.document;
      
      // Injeção de dados
      injectDataToIframe(doc, validatedData, config, PALETTES);
      
    } catch (err) {
      // Captura erros críticos de segurança ou acesso DOM
      if (err.name === 'SecurityError') {
        console.error("Bloqueio de segurança do navegador detectado.");
      } else {
        console.warn("Sincronização pendente...", err);
      }
    }
  }, [validatedData, config, isIframeReady]);

  // Debounce para otimização de performance
  useEffect(() => {
    const timeout = setTimeout(syncPreview, 150);
    return () => clearTimeout(timeout);
  }, [syncPreview]);

  // Handler de carregamento do Iframe
  const handleIframeLoad = () => {
    setIsIframeReady(true);
    // Força uma sincronização imediata assim que carrega
    syncPreview();
  };

  return (
    <div className="app-container glass-bg">
      {/* Sidebar de Controles */}
      <aside className="sidebar-controls glass-sidebar">
        <header className="brand-header-neon">
          <h1 className="brand-title-jiu">JIU<span>KURRILO</span></h1>
          <div className="status-line">
            {/* O ponto pulsa mais rápido se estiver sincronizando */}
            <span className="pulse-dot" style={{ animationDuration: isSyncing ? '0.5s' : '2s' }}></span> 
            {isSyncing ? 'PROCESSING...' : 'SYSTEM ACTIVE'}
          </div>
        </header>
        
        <div className="control-sections-scroll">
          <VisualEditor config={config} setConfig={setConfig} />
          
          <div className="section-spacer"></div>
          
          {error && <div className="error-toast-neon">⚠️ {error}</div>}

          <DataPanel 
            jsonInput={jsonInput} 
            setJsonInput={setJsonInput} 
          />
        </div>

        <div className="section-spacer-large"></div>

        <div className="export-section-glass">
          <button 
            className="btn-neon-export" 
            disabled={!!error || !jsonInput || isSyncing}
            onClick={() => exportToPDF(iframeRef)}
          >
            <div className="btn-glow"></div>
            <span className="btn-content">
              <i>💾</i> {isSyncing ? 'PROCESSANDO...' : 'EXPORTAR CURRÍCULO'}
            </span>
          </button>
        </div>
      </aside>

      {/* Área de Preview Full-Screen */}
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
              /**
               * NOTA DE SEGURANÇA:
               * 'allow-same-origin': Necessário para injetar dados via DOM.
               * 'allow-scripts': Necessário para renderizar fontes e estilos dinâmicos.
               * 'allow-modals': Necessário para window.print().
               * 'allow-popups' e outros foram removidos para máxima segurança.
               */
              sandbox="allow-scripts allow-modals allow-same-origin"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;