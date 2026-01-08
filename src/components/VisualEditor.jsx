import React from 'react';
import { PALETTES, FONTS, MODELS } from '../config/constants';

/* --- TÍTULOS BONITOS: PAINEL DE ESTILIZAÇÃO --- */

const VisualEditor = ({ config, setConfig }) => {
  return (
    <div className="visual-editor">
      {/* Escolha do Template */}
      <div className="control-group">
        <label>1. Escolha do Template</label>
        <select 
          value={config.model} 
          onChange={(e) => setConfig({...config, model: e.target.value})}
        >
          {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {/* Definição de Cores */}
      <div className="control-group">
        <label>2. Definição de Cores</label>
        <div className="palette-grid">
          {Object.entries(PALETTES).map(([key, value]) => (
            <button
              key={key}
              className={`color-btn ${config.palette === key ? 'active' : ''}`}
              style={{ background: value.primary }}
              onClick={() => setConfig({...config, palette: key})}
              title={value.name}
            />
          ))}
        </div>
      </div>

      {/* Escolha da Tipografia */}
      <div className="control-group">
        <label>3. Tipografia (Perfil)</label>
        <select 
          value={config.font} 
          onChange={(e) => setConfig({...config, font: e.target.value})}
        >
          {FONTS.map(f => <option key={f.id} value={f.family}>{f.name}</option>)}
        </select>
      </div>
    </div>
  );
};

export default VisualEditor;