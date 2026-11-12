import React from 'react';
import { PALETTES, FONTS, MODELS } from '../config/constants';

/* --- DESIGN ENGINE: ESTILO & PERSONALIZAÇÃO --- */

const VisualEditor = ({ config, setConfig }) => {
  return (
    <div className="visual-editor-container">
      <div className="glass-card">
        <header className="panel-header">
          <div className="section-title-wrapper">
            <h3 className="section-heading">Estilo</h3>
          </div>
        </header>

        {/* Escolha do Template */}
        <div className="control-group">
          <label className="modern-label">Modelo de Currículo</label>
          <select 
            className="modern-select no-arrow"
            value={config.model} 
            onChange={(e) => setConfig({ ...config, model: e.target.value })}
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Seleção de Cores */}
        <div className="control-group">
          <label className="modern-label">Paleta de Cores</label>
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

        {/* Densidade da Página */}
        <div className="control-group">
          <label className="modern-label">Densidade da Página</label>
          <div className="spacing-density-selector">
            {[
              { id: 'compact', label: 'Compacto' },
              { id: 'normal', label: 'Padrão' },
              { id: 'relaxed', label: 'Espaçoso' }
            ].map(d => (
              <button
                key={d.id}
                type="button"
                className={`density-pill-btn ${config.spacing === d.id ? 'active' : ''}`}
                onClick={() => setConfig({ ...config, spacing: d.id })}
                title={d.label}
              >
                {d.label}
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
