import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import VisualEditor from './components/VisualEditor';
import DataPanel from './components/DataPanel';
import { injectDataToIframe } from './utils/cvInjector';
import { exportToPDF } from './utils/exportHandler';
import { validateAndFormat } from './utils/dataHandlers';
import { PALETTES } from './config/constants';
import structureBase from './assets/structure.json';
import './App.css';

/* --- JIUKURRICULO ENGINE: SECURE & THEMED EDITION --- */

// Helper seguro para localStorage (evita crash em modo anônimo)
const safeStorage = {
  get: (key, fallback) => {
    try {
      const item = localStorage.getItem(key);
      return item ? item : (typeof fallback === 'object' ? JSON.stringify(fallback) : fallback);
    } catch (e) {
      console.warn('Storage inacessível, usando fallback.');
      return (typeof fallback === 'object' ? JSON.stringify(fallback) : fallback);
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Falha silenciosa
    }
  }
};

function App() {
  // --- ESTADOS ---
  
  const [config, setConfig] = useState({ 
    model: 'model1.html', 
    palette: 'graphite', 
    font: "'Inter', sans-serif" 
  });
  
  // Estado do Tema (Dark padrão)
  const [theme, setTheme] = useState(() => safeStorage.get('jiu_theme', 'dark'));

  // Estado de Dados
  const [jsonInput, setJsonInput] = useState(() => {
    const saved = safeStorage.get('cv_generation_cache', null);
    return saved || JSON.stringify(structureBase, null, 2);
  });

  // Estados de Controle
  const [error, setError] = useState(null);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const iframeRef = useRef(null);

  // --- EFEITOS E LÓGICA ---

  // 1. Aplica o tema ao CSS Root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    safeStorage.set('jiu_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // 2. Validação e Memorização dos Dados
  const validatedData = useMemo(() => {
    setIsSyncing(true);
    const result = validateAndFormat(jsonInput);
    
    if (!result && jsonInput.trim() !== "") {
      setError("Sintaxe JSON inválida. Verifique vírgulas e chaves.");
      setIsSyncing(false);
      return null;
    }

    setError(null);
    safeStorage.set('cv_generation_cache', jsonInput);
    
    // Pequeno delay para feedback visual
    setTimeout(() => setIsSyncing(false), 300);
    return result;
  }, [jsonInput]);

  // 3. Motor de Injeção no Iframe
  const syncPreview = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !isIframeReady) return;

    try {
      const doc = iframe.contentWindow.document;
      injectDataToIframe(doc, validatedData, config, PALETTES);
    } catch (err) {
      if (err.name === 'SecurityError') {
        console.error("Bloqueio de segurança do navegador detectado.");
      }
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

  // --- RENDERIZAÇÃO ---

  return (
    <div className="app-container glass-bg">
      {/* Sidebar de Controles */}
      <aside className="sidebar-controls glass-sidebar">
        <header className="brand-header-neon">
          {/* Top Row com Título e Botão de Tema */}
          <div className="header-top-row">
            <h1 className="brand-title-jiu">JIU<span>KURRICULO</span></h1>
            
            <button 
              onClick={toggleTheme} 
              className="theme-toggle-btn" 
              title={theme === 'dark' ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
          </div>

          <div className="status-line">
            <span className="pulse-dot" style={{ animationDuration: isSyncing ? '0.5s' : '2s' }}></span> 
            {isSyncing ? 'PROCESSANDO...' : 'SYSTEM ACTIVE'}
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
              <i>💾</i> {isSyncing ? 'AGUARDE...' : 'EXPORTAR PDF'}
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
              title="Jiukurriculo Canvas"
              sandbox="allow-scripts allow-modals allow-same-origin"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;