import React, { useState, useEffect } from 'react';
import { PALETTES, FONTS, MODELS } from '../config/constants';

/* --- DESIGN ENGINE: ESTILO & PERSONALIZAÇÃO --- */

const normalizeHex = (hex) => {
  if (typeof hex !== 'string') return '#2563EB';
  const clean = hex.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    return ('#' + clean.split('').map(c => c + c).join('')).toUpperCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return ('#' + clean).toUpperCase();
  }
  return '#2563EB';
};

const hexToRgb = (hex) => {
  const norm = normalizeHex(hex).slice(1);
  return {
    r: parseInt(norm.slice(0, 2), 16),
    g: parseInt(norm.slice(2, 4), 16),
    b: parseInt(norm.slice(4, 6), 16)
  };
};

const rgbToHex = (r, g, b) => {
  const clamp = (v) => Math.max(0, Math.min(255, Number.isFinite(v) ? Math.round(v) : 0));
  return '#' + [clamp(r), clamp(g), clamp(b)].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
};

const VisualEditor = ({ config, setConfig }) => {
  const currentCustomHex = normalizeHex(config.customColor || '#2563EB');
  const [showCustomTab, setShowCustomTab] = useState(config.palette === 'custom');
  const [hexDraft, setHexDraft] = useState(currentCustomHex);

  useEffect(() => {
    setHexDraft(normalizeHex(config.customColor || '#2563EB'));
  }, [config.customColor]);

  const rgb = hexToRgb(currentCustomHex);

  const applyCustomHex = (newHex) => {
    const normalized = normalizeHex(newHex);
    setHexDraft(normalized);
    setConfig({
      ...config,
      palette: 'custom',
      customColor: normalized
    });
  };

  const handleHexInputChange = (val) => {
    setHexDraft(val);
    const cleaned = val.trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{6}$/.test(cleaned) || /^[0-9a-fA-F]{3}$/.test(cleaned)) {
      const normalized = normalizeHex(cleaned);
      setConfig({
        ...config,
        palette: 'custom',
        customColor: normalized
      });
    }
  };

  const handleRgbChange = (channel, value) => {
    const num = value === '' ? 0 : parseInt(value, 10);
    const nextRgb = { ...rgb, [channel]: Number.isNaN(num) ? 0 : Math.max(0, Math.min(255, num)) };
    applyCustomHex(rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b));
  };

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
                  onClick={() => {
                    setShowCustomTab(false);
                    setConfig({ ...config, palette: key });
                  }}
                  title={colorData.name}
                  style={{ 
                    backgroundColor: colorData.primary,
                    boxShadow: isActive ? `0 0 15px ${colorData.primary}` : 'none'
                  }}
                />
              );
            })}

            {/* Última opção: Cor Personalizada */}
            <button
              type="button"
              className={`color-sphere color-sphere-custom ${config.palette === 'custom' ? 'active' : ''}`}
              onClick={() => {
                if (config.palette === 'custom') {
                  setShowCustomTab(prev => !prev);
                } else {
                  setShowCustomTab(true);
                  setConfig({
                    ...config,
                    palette: 'custom',
                    customColor: currentCustomHex
                  });
                }
              }}
              title="Cor Personalizada"
              style={{
                background: config.palette === 'custom'
                  ? currentCustomHex
                  : 'conic-gradient(from 90deg, #ef4444, #f59e0b, #10b981, #3b82f6, #8b5cf6, #ec4899, #ef4444)',
                boxShadow: config.palette === 'custom' ? `0 0 15px ${currentCustomHex}` : 'none'
              }}
            >
              <span className="custom-sphere-plus">+</span>
            </button>
          </div>

          {/* Aba retrátil de Personalização de Cor (Picker + HEX + RGB) */}
          {showCustomTab && config.palette === 'custom' && (
            <div className="custom-color-panel">
              <div className="custom-color-top">
                <label className="custom-color-picker-wrap" title="Selecionar cor">
                  <input
                    type="color"
                    className="custom-color-native-input"
                    value={currentCustomHex}
                    onChange={(e) => applyCustomHex(e.target.value)}
                  />
                  <span
                    className="custom-color-swatch"
                    style={{ backgroundColor: currentCustomHex }}
                  />
                </label>

                <div className="custom-color-hex-group">
                  <span className="custom-color-field-label">HEX</span>
                  <input
                    type="text"
                    className="custom-color-text-input"
                    value={hexDraft}
                    maxLength={7}
                    onChange={(e) => handleHexInputChange(e.target.value)}
                    placeholder="#2563EB"
                  />
                </div>
              </div>

              <div className="custom-color-rgb-row">
                {[
                  { key: 'r', label: 'R', val: rgb.r },
                  { key: 'g', label: 'G', val: rgb.g },
                  { key: 'b', label: 'B', val: rgb.b }
                ].map(ch => (
                  <div key={ch.key} className="custom-color-rgb-item">
                    <span className="custom-color-field-label">{ch.label}</span>
                    <input
                      type="number"
                      min={0}
                      max={255}
                      className="custom-color-num-input"
                      value={ch.val}
                      onChange={(e) => handleRgbChange(ch.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
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
