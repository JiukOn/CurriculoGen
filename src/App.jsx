import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import VisualEditor from './components/VisualEditor';
import DataPanel from './components/DataPanel';
import AiPanel from './components/AiPanel';
import AiCopilotModal from './components/AiCopilotModal';
import HelpPanel from './components/HelpPanel';
import { injectDataToIframe } from './utils/cvInjector';
import { exportToPDF, downloadDirectPDF } from './utils/exportHandler';
import { validateAndFormat } from './utils/dataHandlers';
import { PALETTES } from './config/constants';
import structureBase from './data/structure.json';
import './App.css';

/* --- JIUKURRICULO ENGINE: ENHANCED MULTI-FEATURE EDITION --- */

const safeStorage = {
  get: (key, fallback) => {
    try {
      const item = localStorage.getItem(key);
      return item ? item : (typeof fallback === 'object' ? JSON.stringify(fallback) : fallback);
    } catch {
      return (typeof fallback === 'object' ? JSON.stringify(fallback) : fallback);
    }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, value); } catch {}
  }
};

function App() {
  // --- ESTADOS GLOBAIS ---
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('jiu_editor_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { 
      model: 'model1.html', 
      palette: 'graphite', 
      font: "'Inter', sans-serif",
      spacing: 'normal' // 'compact' | 'normal' | 'relaxed'
    };
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
  const [isDirectDownloading, setIsDirectDownloading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);

  // Zoom e Visualização Mobile (Item 4)
  const [zoomLevel, setZoomLevel] = useState(100);
  const [mobileTab, setMobileTab] = useState('editor'); // 'editor' | 'preview'

  const iframeRef = useRef(null);

  // 1. Aplicação de Tema e Configurações Persistentes
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
    
    setTimeout(() => setIsSyncing(false), 300);
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
    const timeout = setTimeout(syncPreview, 120);
    return () => clearTimeout(timeout);
  }, [syncPreview]);

  const handleIframeLoad = () => {
    setIsIframeReady(true);
    syncPreview();
  };

  // 4. Exportação via Impressora do Sistema / PDF
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

  // 5. Download Direto de PDF sem diálogo do navegador (Item 2)
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
      
      {/* MODAL DE AJUDA */}
      {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}

      {/* MODAL DO COPILOTO IA INTERATIVO */}
      <AiCopilotModal 
        isOpen={showCopilot}
        onClose={() => setShowCopilot(false)}
        jsonInput={jsonInput}
        setJsonInput={setJsonInput}
      />

      {/* BARRA DE ALTERNÂNCIA MOBILE (ITEM 4) */}
      <div className="mobile-nav-toggle">
        <button
          type="button"
          className={`mobile-tab-btn ${mobileTab === 'editor' ? 'active' : ''}`}
          onClick={() => setMobileTab('editor')}
        >
          ⚙️ Editor & Dados
        </button>
        <button
          type="button"
          className={`mobile-tab-btn ${mobileTab === 'preview' ? 'active' : ''}`}
          onClick={() => setMobileTab('preview')}
        >
          👁️ Ver Currículo
        </button>
      </div>

      {/* SIDEBAR COM CONTROLES */}
      <aside className={`sidebar-controls glass-sidebar ${mobileTab === 'preview' ? 'hide-on-mobile' : ''}`}>
        
        {/* HEADER */}
        <header className="brand-header-neon">
          <div className="header-top-row">
            <h1 className="brand-title-jiu">JIU<span>KURRICULO</span></h1>
            
            <div className="header-controls">
              <button 
                type="button"
                onClick={() => setShowHelp(true)} 
                className="help-toggle-btn"
                title="Guia de Uso e Tutoriais"
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
        
        {/* ÁREA DE ROLAGEM COM OS PAINEIS */}
        <div className="control-sections-scroll">
          
          {/* PASSO 01: Visual & Densidade */}
          <VisualEditor config={config} setConfig={setConfig} />
          
          <div className="section-spacer"></div>

          {/* PASSO 02: Gestão de Dados & Múltiplos Perfis */}
          <DataPanel 
            jsonInput={jsonInput} 
            setJsonInput={setJsonInput} 
          />

          <div className="section-spacer"></div>

          {/* PASSO 03: Copiloto IA de Carreira */}
          <AiPanel onOpenCopilot={() => setShowCopilot(true)} />
          
          <div className="section-spacer"></div>
          
          {error && <div className="error-toast-neon">⚠️ {error}</div>}

        </div>

        <div className="section-spacer-large"></div>

        {/* FOOTER ACTIONS COM OPÇÃO DUPLA DE PDF (ITEM 2) */}
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
              title="Abrir driver de impressão / Salvar PDF do navegador"
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

      {/* ÁREA DE PREVIEW COM CONTROLES DE ZOOM (ITEM 4) */}
      <main className={`preview-area-expanded ${mobileTab === 'editor' ? 'hide-on-mobile' : ''}`}>
        <div className="viewport-container-full">
          
          <div className="canvas-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge-live">LIVE PREVIEW</span>
              {config.spacing && (
                <span className="badge-density">
                  {config.spacing === 'compact' ? '📐 COMPACTO' : (config.spacing === 'relaxed' ? '📑 ESPAÇOSO' : '📄 PADRÃO')}
                </span>
              )}
            </div>

            {/* CONTROLES DE ZOOM (ITEM 4) */}
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

          <div className="iframe-shadow-box" style={{ overflow: 'auto' }}>
            <div 
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
                minHeight: '100%'
              }}
            >
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
        </div>
      </main>
    </div>
  );
}

export default App;
