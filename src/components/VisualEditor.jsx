import React from 'react';
import { PALETTES, FONTS, MODELS } from '../config/constants';

/* --- TÍTULOS BONITOS: DESIGN ENGINE - CLEAN INTERFACE --- */

const VisualEditor = ({ config, setConfig }) => {
  return (
    <div className="visual-editor-container">
      <div className="glass-card">
        <header className="panel-header">
          <div className="step-indicator">01</div>
          <h3>Estilização Visual</h3>
        </header>

        {/* Escolha do Template - Sem setas, visual limpo */}
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

        {/* Seleção de Cores - Grid Jiukurrcuilo (Esferas Grandes) */}
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
                  /* Usa a classe 'color-sphere' definida no novo CSS para ser grande e redonda */
                  className={`color-sphere ${isActive ? 'active' : ''}`}
                  onClick={() => setConfig({ ...config, palette: key })}
                  title={colorData.name}
                  style={{ 
                    backgroundColor: colorData.primary,
                    /* O box-shadow cria o efeito neon na cor ativa */
                    boxShadow: isActive ? `0 0 15px ${colorData.primary}` : 'none'
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Escolha da Tipografia - Sem setas */}
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