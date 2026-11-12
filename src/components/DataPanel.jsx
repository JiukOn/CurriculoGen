import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import EasyForm from './EasyForm';
import structureBase from '../data/structure.json';
import { downloadBaseSchema } from '../utils/dataHandlers';
import {
  getSavedProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
  getActiveProfileId,
  setActiveProfileId
} from '../utils/profileManager';

const DataPanel = ({ jsonInput, setJsonInput }) => {
  const [viewMode, setViewMode] = useState('form'); 
  const [parsedData, setParsedData] = useState({});
  const [parseError, setParseError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Múltiplos Perfis (Item 3)
  const [profiles, setProfiles] = useState(() => getSavedProfiles(structureBase));
  const [activeProfileId, setActiveIdState] = useState(() => getActiveProfileId() || 'prof_default');
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      if (!jsonInput || jsonInput.trim() === "") {
        setParsedData({});
        return;
      }
      const parsed = JSON.parse(jsonInput) || {};
      setParsedData(parsed);
      setParseError(null);
    } catch (e) {
      setParseError("JSON inválido detectado. Corrija no Modo Código.");
    }
  }, [jsonInput]);

  // Se não houver perfis salvos, inicializa o primeiro com o estado atual
  useEffect(() => {
    if (profiles.length === 0 && parsedData && parsedData.nome) {
      const initial = createProfile(parsedData.cargo || "Meu Primeiro Currículo", parsedData);
      setProfiles([initial]);
      setActiveIdState(initial.id);
    }
  }, [profiles.length, parsedData]);

  // --- HANDLERS DE FORMULÁRIO E PERFIS ---
  const handleFormUpdate = (newData) => {
    setParsedData(newData);
    const jsonStr = JSON.stringify(newData, null, 2);
    setJsonInput(jsonStr);

    if (activeProfileId) {
      updateProfile(activeProfileId, newData);
      setProfiles(getSavedProfiles());
    }
  };

  const handleSelectProfile = (id) => {
    const found = profiles.find(p => p.id === id);
    if (found) {
      setActiveIdState(id);
      setActiveProfileId(id);
      setParsedData(found.data);
      setJsonInput(JSON.stringify(found.data, null, 2));
    }
  };

  const handleCreateNewProfile = (e) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    const newP = createProfile(newProfileName, parsedData || structureBase);
    const updated = getSavedProfiles();
    setProfiles(updated);
    setActiveIdState(newP.id);
    setNewProfileName('');
    setIsCreatingProfile(false);
  };

  const handleDeleteProfile = (id, e) => {
    e.stopPropagation();
    if (profiles.length <= 1) {
      alert("Você deve manter pelo menos um perfil de currículo.");
      return;
    }
    if (window.confirm("Deseja realmente excluir este perfil?")) {
      const remaining = deleteProfile(id);
      setProfiles(remaining);
      const nextId = remaining[0]?.id || null;
      setActiveIdState(nextId);
      if (nextId) {
        const nextProfile = remaining[0];
        setParsedData(nextProfile.data);
        setJsonInput(JSON.stringify(nextProfile.data, null, 2));
      }
    }
  };

  const handleDownload = () => {
    const currentName = profiles.find(p => p.id === activeProfileId)?.name || "curriculo";
    downloadBaseSchema(parsedData || structureBase, `backup_${currentName.replace(/\s+/g, '_')}`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        setJsonInput(event.target.result);
        setParsedData(data);
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        const newP = createProfile(fileName, data);
        setProfiles(getSavedProfiles());
        setActiveIdState(newP.id);
        setViewMode('form');
      } catch (err) {
        setViewMode('code');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const renderModal = () => {
    if (!isFormOpen) return null;

    return createPortal(
      <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
        <div className="modal-content giant-modal glass-card" onClick={e => e.stopPropagation()}>
          <div className="giant-modal-header">
            <h2 style={{margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '15px', fontSize: '1.5rem'}}>
              <span style={{color: 'var(--primary)'}}>📝</span> Editor Visual de Currículo
            </h2>
            <button 
              className="neo-btn" 
              onClick={() => setIsFormOpen(false)}
              style={{
                padding: '10px 20px', 
                height: 'auto', 
                background: 'rgba(231, 76, 60, 0.1)', 
                borderColor: 'var(--error-red)', 
                color: 'var(--error-red)',
                fontWeight: 'bold'
              }}
            >
              CONCLUÍDO ✕
            </button>
          </div>

          <div className="giant-modal-body">
            <EasyForm jsonData={parsedData} onUpdate={handleFormUpdate} />
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <div className="glass-card">
        <header className="panel-header">
          <div className="step-indicator">02</div>
          <h3>Gestão de Dados & Perfis</h3>
        </header>

        {/* GERENCIADOR DE MÚLTIPLOS PERFIS (ITEM 3) */}
        <div className="profiles-manager-container" style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label className="modern-label" style={{ fontSize: '11px', margin: 0 }}>
              Perfis de Currículo ({profiles.length})
            </label>
            <button
              type="button"
              className="add-profile-btn"
              onClick={() => setIsCreatingProfile(!isCreatingProfile)}
              title="Criar nova versão ou perfil"
            >
              {isCreatingProfile ? 'Cancelar' : '+ Novo Perfil'}
            </button>
          </div>

          {isCreatingProfile && (
            <form onSubmit={handleCreateNewProfile} style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <input
                className="modern-select"
                style={{ padding: '6px 10px', fontSize: '12px', flex: 1 }}
                placeholder="Ex: Desenvolvedor Senior / Versão EN"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                autoFocus
              />
              <button type="submit" className="neo-btn" style={{ padding: '6px 12px', height: 'auto', fontSize: '11px' }}>
                Salvar
              </button>
            </form>
          )}

          <div className="profiles-pill-list">
            {profiles.map(p => (
              <div
                key={p.id}
                className={`profile-pill ${activeProfileId === p.id ? 'active' : ''}`}
                onClick={() => handleSelectProfile(p.id)}
                title={`Última alteração: ${new Date(p.updatedAt).toLocaleDateString()}`}
              >
                <span className="profile-pill-name">{p.name}</span>
                {profiles.length > 1 && (
                  <button
                    type="button"
                    className="profile-pill-del"
                    onClick={(e) => handleDeleteProfile(p.id, e)}
                    title="Excluir perfil"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mode-toggle-container">
          <button 
            type="button"
            className={`mode-btn ${viewMode === 'form' ? 'active' : ''}`}
            onClick={() => !parseError && setViewMode('form')}
            title="Preencher campos visualmente"
          >
            <span style={{fontSize: '1.2em'}}>📝</span> 
            <span>MODO FÁCIL</span>
          </button>
          <button 
            type="button"
            className={`mode-btn ${viewMode === 'code' ? 'active' : ''}`}
            onClick={() => setViewMode('code')}
            title="Editar código JSON puro"
          >
            <span style={{fontSize: '1.2em'}}>💻</span> 
            <span>MODO CÓDIGO</span>
          </button>
        </div>

        <div className="action-button-group">
          <button type="button" className="neo-btn download-variant" onClick={handleDownload} title="Baixar Backup">
            <span className="btn-icon">💾</span>
            <div className="btn-label"><span>BACKUP</span><small>.json</small></div>
          </button>
          <button type="button" className="neo-btn upload-variant" onClick={() => fileInputRef.current.click()} title="Importar">
            <span className="btn-icon">📂</span>
            <div className="btn-label"><span>IMPORTAR</span><small>.json</small></div>
          </button>
        </div>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleFileUpload} />

        <div className="section-spacer" style={{height: '12px'}}></div>

        {viewMode === 'form' ? (
          parseError ? (
            <div className="error-toast-neon">⚠️ {parseError}<br/><small>Corrija no Modo Código.</small></div>
          ) : (
            <>
              <p className="description-text" style={{textAlign: 'center', marginBottom: '12px'}}>
                Abra o editor visual para preencher dados, cursos, idiomas e projetos.
              </p>
              
              <button 
                type="button"
                className="btn-launch-modal" 
                onClick={() => setIsFormOpen(true)}
              >
                <span className="launch-icon">✨</span>
                <span>ABRIR FORMULÁRIO DE DADOS</span>
                <small style={{fontWeight: '400', opacity: 0.7, fontSize: '0.8rem'}}>
                  Editar em Tela Cheia
                </small>
              </button>
            </>
          )
        ) : (
          <div className="code-editor-container">
            <div className="editor-toolbar">
              <div className="traffic-lights"><span className="red"></span><span className="yellow"></span><span className="green"></span></div>
              <div className="editor-title" style={{color: '#666', fontSize: '10px'}}>raw_data.json</div>
            </div>
            <textarea 
              className="modern-textarea"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              spellCheck="false"
            />
          </div>
        )}
      </div>

      {renderModal()}
    </>
  );
};

export default DataPanel;
