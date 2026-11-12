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

/* --- GESTÃO DE PERFIL E DADOS --- */

const DataPanel = ({ jsonInput, setJsonInput }) => {
  const [viewMode, setViewMode] = useState('form'); 
  const [parsedData, setParsedData] = useState({});
  const [parseError, setParseError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
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
    } catch {
      setParseError("JSON inválido detectado. Corrija na aba JSON.");
    }
  }, [jsonInput]);

  useEffect(() => {
    if (profiles.length === 0 && parsedData && parsedData.nome) {
      const initial = createProfile(parsedData.cargo || "Meu Primeiro Currículo", parsedData);
      setProfiles([initial]);
      setActiveIdState(initial.id);
    }
  }, [profiles.length, parsedData]);

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
      } catch {
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
            <h2 style={{margin: 0, color: 'var(--text-main)', fontSize: '1.35rem', fontWeight: 700}}>
              Editor de Perfil
            </h2>
            <button 
              className="neo-btn" 
              onClick={() => setIsFormOpen(false)}
              style={{
                padding: '8px 18px', 
                height: 'auto', 
                background: 'rgba(231, 76, 60, 0.1)', 
                borderColor: 'var(--error-red)', 
                color: 'var(--error-red)',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
            >
              Concluído ✕
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
          <div className="section-title-wrapper">
            <h3 className="section-heading">Perfil</h3>
          </div>
        </header>

        {/* GERENCIADOR DE VERSÕES SALVAS */}
        <div className="control-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label className="modern-label" style={{ margin: 0 }}>
              Versões salvas ({profiles.length})
            </label>
            <button
              type="button"
              className="add-profile-btn"
              onClick={() => setIsCreatingProfile(!isCreatingProfile)}
              title="Criar nova versão"
            >
              {isCreatingProfile ? 'Cancelar' : '+ Nova Versão'}
            </button>
          </div>

          {isCreatingProfile && (
            <form onSubmit={handleCreateNewProfile} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                className="modern-select"
                style={{ padding: '8px 12px', fontSize: '12px', flex: 1 }}
                placeholder="Nome da versão (ex: Backend Senior)"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                autoFocus
              />
              <button type="submit" className="neo-btn" style={{ padding: '8px 14px', height: 'auto', fontSize: '11px' }}>
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
                    title="Excluir versão"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* MODO DE EDIÇÃO */}
        <div className="mode-toggle-container">
          <button 
            type="button"
            className={`mode-btn ${viewMode === 'form' ? 'active' : ''}`}
            onClick={() => !parseError && setViewMode('form')}
          >
            <span>Formulário</span>
          </button>
          <button 
            type="button"
            className={`mode-btn ${viewMode === 'code' ? 'active' : ''}`}
            onClick={() => setViewMode('code')}
          >
            <span>JSON</span>
          </button>
        </div>

        {/* BACKUP & IMPORTAR (Mantendo 💾 e 📂 conforme solicitado) */}
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

        <div style={{ height: '16px' }}></div>

        {viewMode === 'form' ? (
          parseError ? (
            <div className="error-toast-neon">{parseError}</div>
          ) : (
            <>
              <p className="description-text" style={{ textAlign: 'center', marginBottom: '14px' }}>
                Abra o editor completo para preencher experiências, formação, habilidades e projetos.
              </p>
              
              <button 
                type="button"
                className="btn-launch-modal" 
                onClick={() => setIsFormOpen(true)}
              >
                <span>Editar Dados do Perfil</span>
                <small style={{ fontWeight: '400', opacity: 0.7, fontSize: '0.8rem' }}>
                  Abrir em Tela Cheia
                </small>
              </button>
            </>
          )
        ) : (
          <div className="code-editor-container">
            <div className="editor-toolbar">
              <div className="traffic-lights"><span className="red"></span><span className="yellow"></span><span className="green"></span></div>
              <div className="editor-title" style={{ color: '#666', fontSize: '10px' }}>dados_curriculo.json</div>
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
