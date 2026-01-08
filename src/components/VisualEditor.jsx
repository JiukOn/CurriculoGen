import React from 'react';
import { PALETTES, FONTS, MODELS } from '../config/constants';

/* --- TÍTULOS BONITOS: DESIGN ENGINE - IDENTIDADE VISUAL --- */

const VisualEditor = ({ config, setConfig }) => {
  return (
    <div className="visual-editor-container">
      <div className="glass-card mb-20">
        <header className="panel-header">
          <div className="step-indicator">01</div>
          <h3>Estilização Visual</h3>
        </header>

        {/* Escolha do Template com Preview Textual */}
        <div className="control-group">
          <label className="modern-label">Arquitetura de Layout</label>
          <div className="custom-select-wrapper">
            <select 
              className="modern-select"
              value={config.model} 
              onChange={(e) => setConfig({...config, model: e.target.value})}
            >
              {MODELS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name.toUpperCase()}
                </option>
              ))}
            </select>
            <span className="select-arrow">▼</span>
          </div>
        </div>

        {/* Definição de Cores - Botões Circulares Estilizados */}
        <div className="control-group">
          <label className="modern-label">Paleta de Identidade</label>
          <div className="palette-flex">
            {Object.entries(PALETTES).map(([key, value]) => (
              <div key={key} className="color-wrapper">
                <button
                  className={`modern-color-btn ${config.palette === key ? 'active' : ''}`}
                  style={{ 
                    backgroundColor: value.primary,
                    boxShadow: config.palette === key ? `0 0 15px ${value.primary}66` : 'none'
                  }}
                  onClick={() => setConfig({...config, palette: key})}
                  title={value.name}
                />
                <span className="color-dot-label">{value.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Escolha da Tipografia - Preview em tempo real no label */}
        <div className="control-group no-margin">
          <label className="modern-label">Tipografia Profissional</label>
          <div className="custom-select-wrapper">
            <select 
              className="modern-select"
              style={{ fontFamily: config.font }}
              value={config.font} 
              onChange={(e) => setConfig({...config, font: e.target.value})}
            >
              {FONTS.map(f => (
                <option key={f.id} value={f.family} style={{ fontFamily: f.family }}>
                  {f.name}
                </option>
              ))}
            </select>
            <span className="select-arrow">▼</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualEditor;