import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import VisualEditor from './components/VisualEditor';
import DataPanel from './components/DataPanel';
import AiPanel from './components/AiPanel';
import HelpPanel from './components/HelpPanel'; // <--- IMPORT NOVO
import { injectDataToIframe } from './utils/cvInjector';
import { exportToPDF } from './utils/exportHandler';
import { validateAndFormat } from './utils/dataHandlers';
import { PALETTES } from './config/constants';
import structureBase from './data/structure.json'; // Certifique-se que o caminho está certo
import './App.css';

/* --- JIUKURRICULO ENGINE: STABLE & DYNAMIC EDITION --- */

// Helper seguro para localStorage
const safeStorage = {
  get: (key, fallback) => {
    try {
      const item = localStorage.getItem(key);
      return item ? item : (typeof fallback === 'object' ? JSON.stringify(fallback) : fallback);
    } catch (e) {
      return (typeof fallback === 'object' ? JSON.stringify(fallback) : fallback);
    }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, value); } catch (e) {}
  }
};

function App() {
  // --- ESTADOS GLOBAIS ---
  
  const [config, setConfig] = useState({ 
    model: 'model1.html', 
    palette: 'graphite', 
    font: "'Inter', sans-serif" 
  });
  
  const [theme, setTheme] = useState(() => safeStorage.get('jiu_theme', 'dark'));

  const [jsonInput, setJsonInput] = useState(() => {
    const saved = safeStorage.get('cv_generation_cache', null);
    return saved || JSON.stringify(structureBase, null, 2);
  });

  // --- ESTADOS DE CONTROLE E UI ---
  const [error, setError] = useState(null);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // NOVO: Estado para o Modal de Ajuda
  const [showHelp, setShowHelp] = useState(false);

  const iframeRef = useRef(null);

  // --- EFEITOS E LÓGICA DE NEGÓCIO ---

  // 1. Aplicação de Tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    safeStorage.set('jiu_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // 2. Validação de Dados (Core)
  const validatedData = useMemo(() => {
    setIsSyncing(true);
    const result = validateAndFormat(jsonInput);
    
    if (!result && jsonInput.trim() !== "") {
      setError("Estrutura JSON inválida. Verifique a sintaxe no Painel de Dados.");
      setIsSyncing(false);
      return null;
    }

    setError(null);
    safeStorage.set('cv_generation_cache', jsonInput);
    
    setTimeout(() => setIsSyncing(false), 400);
    return result;
  }, [jsonInput]);

  // 3. Sincronização com Iframe
  const syncPreview = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !isIframeReady) return;

    try {
      const doc = iframe.contentWindow.document;
      if (validatedData) {
        injectDataToIframe(doc, validatedData, config, PALETTES);
      }
    } catch (err) {
      if (err.name !== 'SecurityError') {
        console.warn("Sync pendente:", err);
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

  // 4. Wrapper de Exportação
  const handleExport = async () => {
    if (isExporting || error) return;
    
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      exportToPDF(iframeRef);
    } catch (e) {
      setError("Falha ao iniciar driver de impressão.");
      console.error(e);
    } finally {
      setTimeout(() => setIsExporting(false), 1500);
    }
  };

  // --- RENDERIZAÇÃO ---

  return (
    <div className="app-container glass-bg">
      
      {/* RENDERIZAÇÃO DO MODAL DE AJUDA */}
      {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}

      <aside className="sidebar-controls glass-sidebar">
        
        {/* HEADER */}
        <header className="brand-header-neon">
          <div className="header-top-row">
            <h1 className="brand-title-jiu">JIU<span>KURRICULO</span></h1>
            
            {/* CONTROLES DE CABEÇALHO (TEMA + AJUDA) */}
            <div className="header-controls">
              <button 
                onClick={() => setShowHelp(true)} 
                className="help-toggle-btn"
                title="Guia de Uso e Tutoriais"
              >
                ?
              </button>
              
              <button 
                onClick={toggleTheme} 
                className="theme-toggle-btn" 
                title={theme === 'dark' ? "Modo Claro" : "Modo Escuro"}
              >
                {theme === 'dark' ? '🌙' : '☀️'}
              </button>
            </div>
          </div>

          <div className="status-line">
            <span 
              className="pulse-dot" 
              style={{ 
                animationDuration: (isSyncing || isExporting) ? '0.5s' : '2s',
                backgroundColor: isExporting ? '#3498db' : '#2ecc71',
                boxShadow: isExporting ? '0 0 10px #3498db' : '0 0 10px #2ecc71'
              }}
            ></span> 
            {isExporting ? 'GERANDO PDF...' : (isSyncing ? 'PROCESSANDO...' : 'SYSTEM ACTIVE')}
          </div>
        </header>
        
        {/* SCROLLABLE AREA */}
        <div className="control-sections-scroll">
          
          {/* PASSO 01: Visual */}
          <VisualEditor config={config} setConfig={setConfig} />
          
          <div className="section-spacer"></div>

          {/* PASSO 02: Dados Manuais */}
          <DataPanel 
            jsonInput={jsonInput} 
            setJsonInput={setJsonInput} 
          />

          <div className="section-spacer"></div>

          {/* PASSO 03: Neural Engine */}
          <AiPanel jsonInput={jsonInput} setJsonInput={setJsonInput} />
          
          <div className="section-spacer"></div>
          
          {/* Toast de Erro Global */}
          {error && <div className="error-toast-neon">⚠️ {error}</div>}

        </div>

        <div className="section-spacer-large"></div>

        {/* FOOTER ACTIONS */}
        <div className="export-section-glass">
          <button 
            className="btn-neon-export" 
            disabled={!!error || !jsonInput || isSyncing || isExporting}
            onClick={handleExport}
          >
            <div className="btn-glow"></div>
            <span className="btn-content">
              <i>💾</i> {isExporting ? 'PREPARANDO ARQUIVO...' : 'EXPORTAR PDF'}
            </span>
          </button>
        </div>
      </aside>

      {/* PREVIEW AREA */}
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