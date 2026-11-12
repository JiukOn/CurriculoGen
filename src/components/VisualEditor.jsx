import React from 'react';
import { PALETTES, FONTS, MODELS } from '../config/constants';

/* --- DESIGN ENGINE: CONTROLES VISUAIS & DENSIDADE --- */

const VisualEditor = ({ config, setConfig }) => {
  return (
    <div className="visual-editor-container">
      <div className="glass-card">
        <header className="panel-header">
          <div className="step-indicator">01</div>
          <h3>Estilização Visual</h3>
        </header>

        {/* Escolha do Template */}
        <div className="control-group">
          <label className="modern-label">Arquitetura de Layout</label>
          <select 
            className="modern-select no-arrow"
            value={config.model} 
            onChange={(e) => setConfig({ ...config, model: e.target.value })}
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id}>
                {m.name.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Seleção de Cores - Grid Jiukurriculo */}
        <div className="control-group">
          <label className="modern-label">Paleta de Identidade</label>
          <div className="palette-grid-jiu">
            {Object.keys(PALETTES).map((key) => {
              const colorData = PALETTES[key];
              const isActive = config.palette === key;
              
              return (
                <button
                  key={key}
                  type="button"
                  className={`color-sphere ${isActive ? 'active' : ''}`}
                  onClick={() => setConfig({ ...config, palette: key })}
                  title={colorData.name}
                  style={{ 
                    backgroundColor: colorData.primary,
                    boxShadow: isActive ? `0 0 15px ${colorData.primary}` : 'none'
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Densidade e Espaçamento de Página (Item 5) */}
        <div className="control-group">
          <label className="modern-label">Densidade da Página (Ajuste A4)</label>
          <div className="spacing-density-selector">
            {[
              { id: 'compact', label: 'Compacto (1 Pág)', icon: '📐' },
              { id: 'normal', label: 'Padrão', icon: '📄' },
              { id: 'relaxed', label: 'Espaçoso (2 Págs)', icon: '📑' }
            ].map(d => (
              <button
                key={d.id}
                type="button"
                className={`density-pill-btn ${config.spacing === d.id ? 'active' : ''}`}
                onClick={() => setConfig({ ...config, spacing: d.id })}
                title={d.label}
              >
                <span>{d.icon}</span> {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Escolha da Tipografia */}
        <div className="control-group no-margin">
          <label className="modern-label">Tipografia</label>
          <select 
            className="modern-select no-arrow"
            style={{ fontFamily: config.font }}
            value={config.font} 
            onChange={(e) => setConfig({ ...config, font: e.target.value })}
          >
            {FONTS.map(f => (
              <option key={f.id} value={f.family} style={{ fontFamily: f.family }}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default VisualEditor;
