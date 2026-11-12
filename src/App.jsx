import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import VisualEditor from './components/VisualEditor';
import DataPanel from './components/DataPanel';
import AiPanel from './components/AiPanel';
import AiCopilotModal from './components/AiCopilotModal';
import HelpPanel from './components/HelpPanel';
import { injectDataToIframe } from './utils/cvInjector';
import { exportToPDF, downloadDirectPDF } from './utils/exportHandler';
import { validateAndFormat } from './utils/dataHandlers';
import { useHistory } from './hooks/useHistory';
import { PALETTES } from './config/constants';
import structureBase from './data/structure.json';
import './App.css';

/* --- JIUKURRICULO ENGINE: ENHANCED RESIZABLE & UNDO/REDO EDITION --- */

const safeStorage = {
  get: (key, fallback) => {
    try {
      const item = localStorage.getItem(key);
      if (item !== null && item !== undefined && item !== 'null' && item !== 'undefined') {
        return item;
      }
      if (fallback === null || fallback === undefined) return null;
      return typeof fallback === 'object' ? JSON.stringify(fallback) : String(fallback);
    } catch {
      if (fallback === null || fallback === undefined) return null;
      return typeof fallback === 'object' ? JSON.stringify(fallback) : String(fallback);
    }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, value); } catch {}
  }
};

function App() {
  // --- CONFIGURAÇÃO DO MODELO VISUAL ---
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('jiu_editor_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { 
      model: 'model1.html', 
      palette: 'graphite', 
      font: "'Inter', sans-serif",
      spacing: 'normal'
    };
  });
  
  const [theme, setTheme] = useState(() => safeStorage.get('jiu_theme', 'dark'));

  // --- HISTÓRICO DE ESTADOS (UNDO / REDO COM CTRL+Z / CTRL+Y) ---
  const initialJson = useMemo(() => {
    const saved = safeStorage.get('cv_generation_cache', null);
    return saved || JSON.stringify(structureBase, null, 2);
  }, []);

  const {
    state: jsonInput,
    set: setJsonInput,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistory(initialJson, 30);

  // --- ESTADOS DE CONTROLE E UI ---
  const [error, setError] = useState(null);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDirectDownloading, setIsDirectDownloading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);

  // Zoom e Visualização Mobile
  const [zoomLevel, setZoomLevel] = useState(100);
  const [mobileTab, setMobileTab] = useState('editor');

  // --- PAINEL LATERAL REDIMENSIONÁVEL (SPLITTER DRAG & DROP) ---
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('jiu_sidebar_width');
      return saved ? parseInt(saved, 10) : 430;
    } catch { return 430; }
  });
  const [isDragging, setIsDragging] = useState(false);

  const iframeRef = useRef(null);

  // Efeito de redimensionamento do Splitter
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const minW = 330;
      const maxW = Math.min(window.innerWidth * 0.55, 680);
      const newWidth = Math.max(minW, Math.min(maxW, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        try { localStorage.setItem('jiu_sidebar_width', sidebarWidth.toString()); } catch {}
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, sidebarWidth]);

  // Persistências
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    safeStorage.set('jiu_theme', theme);
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('jiu_editor_config', JSON.stringify(config));
    } catch {}
  }, [config]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Validação dos Dados
  const validatedData = useMemo(() => {
    setIsSyncing(true);
    const result = validateAndFormat(jsonInput);
    
    if (!result && jsonInput && jsonInput.trim() !== "") {
      setError("Estrutura JSON inválida. Verifique a sintaxe no Painel de Dados.");
      setIsSyncing(false);
      return null;
    }

    setError(null);
    safeStorage.set('cv_generation_cache', jsonInput);
    
    setTimeout(() => setIsSyncing(false), 200);
    return result;
  }, [jsonInput]);

  // Sincronização com Iframe
  const syncPreview = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !isIframeReady) return;

    try {
      const doc = iframe.contentWindow.document;
      if (validatedData) {
        injectDataToIframe(doc, validatedData, { ...config, zoom: zoomLevel }, PALETTES);
      }
    } catch (err) {
      if (err.name !== 'SecurityError') {
        console.warn("Sync pendente:", err);
      }
    }
  }, [validatedData, config, zoomLevel, isIframeReady]);

  useEffect(() => {
    const timeout = setTimeout(syncPreview, 100);
    return () => clearTimeout(timeout);
  }, [syncPreview]);

  const handleIframeLoad = () => {
    setIsIframeReady(true);
    syncPreview();
  };

  // Exportação via Impressora
  const handleExport = async () => {
    if (isExporting || error) return;
    
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      exportToPDF(iframeRef);
    } catch (e) {
      setError("Falha ao iniciar driver de impressão.");
      console.error(e);
    } finally {
      setTimeout(() => setIsExporting(false), 1200);
    }
  };

  // Download Direto de PDF
  const handleDirectPdfDownload = async () => {
    if (isDirectDownloading || error) return;

    setIsDirectDownloading(true);
    try {
      const parsed = validatedData?.nome || 'Curriculo';
      await downloadDirectPDF(iframeRef, parsed);
    } catch (e) {
      console.error("Falha no download direto:", e);
      setError("Falha ao gerar PDF direto. Tente o botão de impressão.");
    } finally {
      setIsDirectDownloading(false);
    }
  };

  return (
    <div className="app-container glass-bg">
      
      {/* MODAL DE AJUDA REFORMULADO */}
      {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}

      {/* MODAL DO COPILOTO IA INTERATIVO COM CONSCIÊNCIA DO APP */}
      <AiCopilotModal 
        isOpen={showCopilot}
        onClose={() => setShowCopilot(false)}
        jsonInput={jsonInput}
        setJsonInput={setJsonInput}
        config={config}
        setConfig={setConfig}
      />

      {/* NAVEGAÇÃO MOBILE */}
      <div className="mobile-nav-toggle">
        <button
          type="button"
          className={`mobile-tab-btn ${mobileTab === 'editor' ? 'active' : ''}`}
          onClick={() => setMobileTab('editor')}
        >
          Editor & Dados
        </button>
        <button
          type="button"
          className={`mobile-tab-btn ${mobileTab === 'preview' ? 'active' : ''}`}
          onClick={() => setMobileTab('preview')}
        >
          Ver Currículo
        </button>
      </div>

      {/* SIDEBAR COM LARGURA DINÂMICA (RESIZABLE) */}
      <aside 
        className={`sidebar-controls glass-sidebar ${mobileTab === 'preview' ? 'hide-on-mobile' : ''}`}
        style={{ width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` }}
      >
        
        {/* HEADER COM AÇÕES RÁPIDAS (TEMA, AJUDA, UNDO / REDO) */}
        <header className="brand-header-neon">
          <div className="header-top-row">
            <h1 className="brand-title-jiu">JIU<span>KURRICULO</span></h1>
            
            <div className="header-controls">
              {/* BOTÕES DE HISTÓRICO UNDO / REDO */}
              <div className="history-controls-group">
                <button
                  type="button"
                  className="history-btn"
                  onClick={undo}
                  disabled={!canUndo}
                  title="Desfazer (Ctrl + Z)"
                >
                  ↺
                </button>
                <button
                  type="button"
                  className="history-btn"
                  onClick={redo}
                  disabled={!canRedo}
                  title="Refazer (Ctrl + Y)"
                >
                  ↻
                </button>
              </div>

              <button 
                type="button"
                onClick={() => setShowHelp(true)} 
                className="help-toggle-btn"
                title="Guia de Uso & Tutoriais"
              >
                ?
              </button>
              
              <button 
                type="button"
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
                animationDuration: (isSyncing || isExporting || isDirectDownloading) ? '0.5s' : '2s',
                backgroundColor: (isExporting || isDirectDownloading) ? '#3498db' : '#2ecc71',
                boxShadow: (isExporting || isDirectDownloading) ? '0 0 10px #3498db' : '0 0 10px #2ecc71'
              }}
            ></span> 
            {isDirectDownloading ? 'BAIXANDO PDF...' : (isExporting ? 'PREPARANDO PDF...' : (isSyncing ? 'PROCESSANDO...' : 'SISTEMA ATIVO'))}
          </div>
        </header>

        {/* COPILOTO IA NO TOPO (DESTAQUE MÁXIMO) */}
        <div style={{ padding: '0 0 14px 0' }}>
          <AiPanel onOpenCopilot={() => setShowCopilot(true)} />
        </div>
        
        {/* ÁREA DE ROLAGEM COM DESIGN & DADOS */}
        <div className="control-sections-scroll">
          
          {/* Estilo & Layout */}
          <VisualEditor config={config} setConfig={setConfig} />
          
          <div className="section-spacer" style={{ height: '14px' }}></div>

          {/* Dados & Perfis */}
          <DataPanel 
            jsonInput={jsonInput} 
            setJsonInput={setJsonInput} 
          />
          
          {error && <div className="error-toast-neon">{error}</div>}

        </div>

        <div className="section-spacer-large" style={{ height: '20px' }}></div>

        {/* FOOTER ACTIONS COM OPÇÃO DUPLA DE PDF */}
        <div className="export-section-glass">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button 
              type="button"
              className="btn-neon-export" 
              disabled={!!error || !jsonInput || isSyncing || isExporting || isDirectDownloading}
              onClick={handleDirectPdfDownload}
              title="Download direto do arquivo .PDF"
              style={{ padding: '12px 6px' }}
            >
              <div className="btn-glow"></div>
              <span className="btn-content" style={{ fontSize: '11px' }}>
                <i>📥</i> {isDirectDownloading ? 'BAIXANDO...' : 'DOWNLOAD PDF'}
              </span>
            </button>

            <button 
              type="button"
              className="btn-neon-export" 
              disabled={!!error || !jsonInput || isSyncing || isExporting || isDirectDownloading}
              onClick={handleExport}
              title="Abrir driver de impressão nativo"
              style={{ padding: '12px 6px', borderColor: '#3498db', color: '#3498db' }}
            >
              <div className="btn-glow" style={{ background: 'rgba(52, 152, 219, 0.3)' }}></div>
              <span className="btn-content" style={{ fontSize: '11px' }}>
                <i>🖨️</i> {isExporting ? 'GERANDO...' : 'IMPRIMIR (A4)'}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* DIVISÓRIA ARRASTÁVEL (RESIZER / SPLITTER) */}
      <div 
        className={`sidebar-resizer ${isDragging ? 'dragging' : ''}`}
        onMouseDown={() => setIsDragging(true)}
        title="Arraste para redimensionar a barra lateral"
      >
        <div className="resizer-handle"></div>
      </div>

      {/* ÁREA DE PREVIEW COM CONTROLES DE ZOOM */}
      <main className={`preview-area-expanded ${mobileTab === 'editor' ? 'hide-on-mobile' : ''}`}>
        <div className="viewport-container-full">
          
          <div className="canvas-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge-live">LIVE PREVIEW</span>
              {config.spacing && (
                <span className="badge-density">
                  {config.spacing === 'compact' ? 'COMPACTO' : (config.spacing === 'relaxed' ? 'ESPAÇOSO' : 'PADRÃO')}
                </span>
              )}
            </div>

            {/* CONTROLES DE ZOOM */}
            <div className="zoom-controls-wrapper">
              <button 
                type="button"
                className="zoom-btn"
                onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))}
                title="Diminuir Zoom"
              >
                －
              </button>
              <span className="zoom-indicator">{zoomLevel}%</span>
              <button 
                type="button"
                className="zoom-btn"
                onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
                title="Aumentar Zoom"
              >
                ＋
              </button>
              <button 
                type="button"
                className="zoom-btn reset-zoom"
                onClick={() => setZoomLevel(100)}
                title="Redefinir Zoom para 100%"
              >
                ↺
              </button>
            </div>

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
