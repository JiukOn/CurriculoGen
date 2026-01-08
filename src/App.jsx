import React, { useState, useEffect, useRef, useCallback } from 'react';
import VisualEditor from './components/VisualEditor';
import DataPanel from './components/DataPanel';
import { injectDataToIframe } from './utils/cvInjector';
import { exportToPDF } from './utils/exportHandler';
import { validateAndFormat } from './utils/dataHandlers';
import { PALETTES } from './config/constants';
import structureBase from './data/structure.json'; // Ajustado para o caminho padrão de assets
import './App.css';

/* --- TÍTULOS BONITOS: CORE ENGINE 2026 - ESTÁVEL E SEGURO --- */

function App() {
  // Estado de Estilização: Reativo para o Passo 1
  const [config, setConfig] = useState({ 
    model: 'model1.html', 
    palette: 'graphite', 
    font: "'Inter', sans-serif" 
  });
  
  // Estado de Dados: Persistência local robusta para o Passo 2
  const [jsonInput, setJsonInput] = useState(() => {
    try {
      const saved = localStorage.getItem('cv_data_cache');
      return saved || JSON.stringify(structureBase, null, 2);
    } catch (e) {
      return JSON.stringify(structureBase, null, 2);
    }
  });

  const [error, setError] = useState(null);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const iframeRef = useRef(null);

  /* --- TÍTULOS BONITOS: MOTOR DE SINCRONIZAÇÃO EM TEMPO REAL --- */
  
  const syncPreview = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow || !isIframeReady) return;

    const doc = iframe.contentWindow.document;

    // Validação, Formatação e Tratamento de Transições
    const validatedData = validateAndFormat(jsonInput);
    
    if (!validatedData && jsonInput.trim() !== "") {
      setError("Erro de sintaxe no JSON. Verifique vírgulas, aspas e chaves.");
    } else {
      setError(null);
      // Salva progresso automaticamente para evitar perdas
      localStorage.setItem('cv_data_cache', jsonInput);
    }

    // Injeção de Dados, Cores e Fontes no Iframe
    injectDataToIframe(doc, validatedData, config, PALETTES);
    
  }, [jsonInput, config, isIframeReady]);

  // Debounce de 200ms para evitar gargalos na digitação
  useEffect(() => {
    const timeout = setTimeout(syncPreview, 200);
    return () => clearTimeout(timeout);
  }, [syncPreview]);

  // Garante re-sincronização imediata ao trocar de modelo HTML
  useEffect(() => {
    if (isIframeReady) syncPreview();
  }, [config.model, isIframeReady, syncPreview]);

  return (
    <div className="app-container">
      <aside className="sidebar-controls">
        <h1 className="brand-title">CV ENGINE</h1>
        
        {/* Passo 1: Edição Visual de Cores e Fontes */}
        <VisualEditor config={config} setConfig={setConfig} />
        
        {/* Painel de Erros de Sintaxe */}
        {error && <div className="error-badge">{error}</div>}

        {/* Passo 2: Gestão de Dados e Upload de JSON */}
        <DataPanel 
          jsonInput={jsonInput} 
          setJsonInput={setJsonInput} 
        />

        {/* Passo 3: Exportação Profissional ATS-Friendly */}
        <div className="action-area" style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <button 
            className="btn-print" 
            disabled={!!error || !jsonInput}
            onClick={() => exportToPDF(iframeRef)}
          >
            💾 EXPORTAR PDF PROFISSIONAL
          </button>
        </div>
      </aside>

      <main className="preview-area">
        <div className="iframe-wrapper">
          <iframe 
            ref={iframeRef} 
            onLoad={() => setIsIframeReady(true)}
            src={`./models/${config.model}`} 
            className="cv-iframe"
            title="Preview Real-Time A4"
            // allow-modals é vital para o funcionamento do exportToPDF
            sandbox="allow-same-origin allow-scripts allow-modals"
          />
        </div>
      </main>
    </div>
  );
}

export default App;