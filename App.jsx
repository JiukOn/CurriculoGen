import React, { useState, useEffect, useRef } from 'react';
import './App.css';

/* TÍTULOS BONITOS: CONFIGURAÇÕES DE PALETAS 2026 */
const PALETTES = {
  graphite: { primary: '#252523', accent: '#4a5568' },
  azul: { primary: '#1a365d', accent: '#2b6cb0' },
  roxo: { primary: '#44337a', accent: '#6b46c1' },
  rosa: { primary: '#702459', accent: '#b83280' },
  verde: { primary: '#22543d', accent: '#38a169' },
  marrom: { primary: '#5e3a1e', accent: '#8b4513' }
};

const FONTS = [
  { name: 'Inter (Tech)', family: "'Inter', sans-serif" },
  { name: 'Roboto (Modern)', family: "'Roboto', sans-serif" },
  { name: 'Montserrat (Bold)', family: "'Montserrat', sans-serif" },
  { name: 'Georgia (Classica)', family: "'Georgia', serif" }
];

function App() {
  const [model, setModel] = useState('model1.html');
  const [palette, setPalette] = useState('graphite');
  const [font, setFont] = useState(FONTS[0].family);
  const [jsonInput, setJsonInput] = useState('');
  const iframeRef = useRef(null);

  // Carregar o structure.json inicial da pasta assets
  useEffect(() => {
    fetch('./src/assets/structure.json')
      .then(response => response.json())
      .then(data => setJsonInput(JSON.stringify(data, null, 2)))
      .catch(err => console.error("Erro ao carregar JSON inicial:", err));
  }, []);

  /* TÍTULOS BONITOS: SINCRONIZAÇÃO COM O IFRAME */
  useEffect(() => {
    const updateIframe = () => {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow) {
        const doc = iframe.contentWindow.document;

        // 1. Aplica Identidade Visual (CSS Variables)
        doc.documentElement.style.setProperty('--primary-dark', PALETTES[palette].primary);
        doc.documentElement.style.setProperty('--accent-steel', PALETTES[palette].accent);
        doc.body.style.fontFamily = font;

        // 2. Injeta Dados do JSON
        try {
          const data = JSON.parse(jsonInput);
          injectData(doc, data);
        } catch (e) {
          // JSON malformado enquanto o usuário digita
        }
      }
    };

    // Pequeno delay para garantir que o Iframe carregou o novo modelo
    const timer = setTimeout(updateIframe, 300);
    return () => clearTimeout(timer);
  }, [model, palette, font, jsonInput]);

  /* TÍTULOS BONITOS: MOTOR DE INJEÇÃO DE DADOS */
  const injectData = (doc, data) => {
    // Mapeia campos simples (ID deve ser igual à chave do JSON)
    const simpleFields = ['nome', 'resumo', 'cargo', 'email', 'tel', 'local'];
    simpleFields.forEach(field => {
      const el = doc.getElementById(field);
      if (el) {
        if (data[field]) {
          el.innerText = data[field];
          el.style.display = 'block';
        } else {
          el.style.display = 'none'; // Requisito: apagar se não existir
        }
      }
    });

    // Renderização de Listas (Experiências e Formação)
    renderList(doc, 'experiencias', data.experiencias);
    renderList(doc, 'formacao', data.formacao);
  };

  const renderList = (doc, containerId, items) => {
    const container = doc.getElementById(containerId);
    if (!container) return;

    if (!items || items.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    container.innerHTML = items.map(item => `
      <div class="entry-item" style="margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>${item.titulo || item.curso}</span>
          <span>${item.periodo}</span>
        </div>
        <div style="font-style: italic; color: var(--accent-steel);">${item.subtitulo || item.instituicao}</div>
        ${item.status ? `<span class="badge">${item.status}</span>` : ''}
        <p style="font-size: 10pt;">${item.descricao || ''}</p>
      </div>
    `).join('');
  };

  const downloadPDF = () => {
    iframeRef.current.contentWindow.print();
  };

  return (
    <div className="app-container">
      {/* PAINEL DE CONTROLE ESQUERDO */}
      <aside className="sidebar-controls">
        <h2 className="brand-title">CV ENGINE 2026</h2>
        
        <div className="control-group">
          <label>1. Selecione o Modelo</label>
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            <option value="model1.html">Modelo 1: Modern Slate</option>
            <option value="model2.html">Modelo 2: Minimalist</option>
            <option value="model3.html">Modelo 3: Executive</option>
            <option value="model4.html">Modelo 4: Grid Tech</option>
          </select>
        </div>

        <div className="control-group">
          <label>2. Paleta de Cores</label>
          <div className="palette-grid">
            {Object.keys(PALETTES).map(p => (
              <button 
                key={p} 
                className={`color-btn ${palette === p ? 'active' : ''}`}
                style={{ background: PALETTES[p].primary }}
                onClick={() => setPalette(p)}
                title={p}
              />
            ))}
          </div>
        </div>

        <div className="control-group">
          <label>3. Tipografia</label>
          <select value={font} onChange={(e) => setFont(e.target.value)}>
            {FONTS.map(f => <option key={f.name} value={f.family}>{f.name}</option>)}
          </select>
        </div>

        <div className="control-group">
          <label>4. Dados do Currículo (JSON)</label>
          <textarea 
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Cole seu JSON aqui..."
          />
        </div>

        <button className="btn-print" onClick={downloadPDF}>
          GERAR PDF FINAL
        </button>
      </aside>

      {/* ÁREA DE VISUALIZAÇÃO DIREITA */}
      <main className="preview-area">
        <div className="iframe-wrapper">
          <iframe 
            ref={iframeRef}
            src={`./models/${model}`} 
            title="Currículo Preview"
            className="cv-iframe"
          />
        </div>
      </main>
    </div>
  );
}

export default App;
