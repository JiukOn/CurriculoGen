import React, { useState } from 'react';

const Accordion = ({ title, icon, children, isOpenDefault = false }) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  return (
    <div className={`accordion-item ${isOpen ? 'open' : ''}`}>
      <div 
        className="accordion-header" 
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <span style={{fontSize: '1.2em', opacity: 0.8}}>{icon}</span>
          <span>{title}</span>
        </div>
        <span style={{ 
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' 
        }}>
          ▼
        </span>
      </div>
      {isOpen && <div className="accordion-content">{children}</div>}
    </div>
  );
};

const TagInput = ({ tags = [], onUpdate, placeholder }) => {
  const [inputVal, setInputVal] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      const trimmed = inputVal.trim();
      if (trimmed && !tags.includes(trimmed)) {
        onUpdate([...tags, trimmed]);
        setInputVal('');
      }
    } else if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
      onUpdate(tags.slice(0, -1));
    }
  };

  const removeTag = (indexToRemove) => {
    onUpdate(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div>
      <div className="tag-input-container">
        {tags.map((tag, index) => (
          <div key={index} className="tag-chip">
            {tag}
            <span className="tag-remove" onClick={() => removeTag(index)}>×</span>
          </div>
        ))}
        <input 
          className="tag-input-field" 
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : "Adicionar..."}
        />
      </div>
      <small className="helper-text">Pressione <strong>Enter</strong> ou <strong>Vírgula</strong> para adicionar.</small>
    </div>
  );
};

const EasyForm = ({ jsonData, onUpdate }) => {
  
  const data = jsonData || {};

  
  const handleChange = (field, value) => {
    onUpdate({ ...data, [field]: value });
  };

  const handleContactChange = (field, value) => {
    onUpdate({
      ...data,
      contato: { ...(data.contato || {}), [field]: value }
    });
  };

  const addItem = (arrayName, template) => {
    const newArray = [...(data[arrayName] || []), template];
    onUpdate({ ...data, [arrayName]: newArray });
  };

  const removeItem = (arrayName, index) => {
    const newArray = [...(data[arrayName] || [])];
    newArray.splice(index, 1);
    onUpdate({ ...data, [arrayName]: newArray });
  };

  const updateItem = (arrayName, index, field, value) => {
    const newArray = [...(data[arrayName] || [])];
    newArray[index] = { ...newArray[index], [field]: value };
    onUpdate({ ...data, [arrayName]: newArray });
  };

  const updateSkill = (index, field, value) => {
    const newSkills = [...(data.hard_skills || [])];
    if (field === 'nivel') {
      let num = parseInt(value);
      if (isNaN(num)) num = 0;
      value = Math.min(100, Math.max(0, num));
    }
    newSkills[index] = { ...newSkills[index], [field]: value };
    onUpdate({ ...data, hard_skills: newSkills });
  };

  return (
    <div className="easy-form-container">
      
      <Accordion title="Dados Pessoais" icon="👤" isOpenDefault={true}>
        <div className="responsive-grid">
          <div className="form-group">
            <label className="form-label">Nome Completo</label>
            <input 
              className="form-input" 
              value={data.nome || ''} 
              onChange={(e) => handleChange('nome', e.target.value)}
              placeholder="Ex: Ana Souza"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Cargo / Objetivo</label>
            <input 
              className="form-input" 
              value={data.cargo || ''} 
              onChange={(e) => handleChange('cargo', e.target.value)}
              placeholder="Ex: Desenvolvedora Fullstack"
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Resumo Profissional</label>
          <textarea 
            className="form-input" 
            value={data.resumo || ''} 
            onChange={(e) => handleChange('resumo', e.target.value)}
            placeholder="Breve resumo das suas qualificações..."
            style={{ minHeight: '100px' }}
          />
        </div>
      </Accordion>

      <Accordion title="Contato" icon="📞">
        <div className="responsive-grid">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              type="email"
              className="form-input" 
              value={data.contato?.email || ''} 
              onChange={(e) => handleContactChange('email', e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Telefone</label>
            <input 
              type="tel"
              className="form-input" 
              value={data.contato?.tel || ''} 
              onChange={(e) => handleContactChange('tel', e.target.value)} 
            />
          </div>
        </div>
        
        <div className="responsive-grid">
          <div className="form-group">
            <label className="form-label">LinkedIn / Site</label>
            <input className="form-input" value={data.contato?.linkedin || ''} onChange={(e) => handleContactChange('linkedin', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Localização</label>
            <input className="form-input" value={data.contato?.local || ''} onChange={(e) => handleContactChange('local', e.target.value)} placeholder="Cidade - UF" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Data de Nascimento (Opcional)</label>
          <input 
            className="form-input" 
            value={data.contato?.nascimento || ''} 
            onChange={(e) => handleContactChange('nascimento', e.target.value)} 
            placeholder="DD/MM/AAAA" 
          />
        </div>
      </Accordion>

      <Accordion title="Experiência Profissional" icon="💼">
        {(data.experiencias || []).map((exp, idx) => (
          <div key={idx} className="array-item-wrapper">
            <div className="responsive-grid">
              <div className="form-group">
                <label className="form-label">Cargo</label>
                <input 
                  className="form-input" 
                  value={exp.titulo || ''} 
                  onChange={(e) => updateItem('experiencias', idx, 'titulo', e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Empresa</label>
                <input className="form-input" value={exp.subtitulo || ''} onChange={(e) => updateItem('experiencias', idx, 'subtitulo', e.target.value)} />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Período</label>
              <input 
                className="form-input" 
                value={exp.periodo || ''} 
                onChange={(e) => updateItem('experiencias', idx, 'periodo', e.target.value)} 
                placeholder="Ex: Jan 2022 - Atual" 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descrição das Atividades</label>
              <textarea 
                className="form-input" 
                value={exp.descricao || ''} 
                onChange={(e) => updateItem('experiencias', idx, 'descricao', e.target.value)} 
              />
            </div>
            
            <button className="btn-remove" onClick={() => removeItem('experiencias', idx)}>
              ✕ Remover Item
            </button>
          </div>
        ))}
        <button className="btn-add" onClick={() => addItem('experiencias', { titulo: '', subtitulo: '', periodo: '', descricao: '' })}>
          + Adicionar Nova Experiência
        </button>
      </Accordion>

      <Accordion title="Formação Acadêmica" icon="🎓">
        {(data.formacao || []).map((form, idx) => (
          <div key={idx} className="array-item-wrapper">
            <div className="responsive-grid">
              <div className="form-group">
                <label className="form-label">Curso</label>
                <input className="form-input" value={form.curso || ''} onChange={(e) => updateItem('formacao', idx, 'curso', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Instituição</label>
                <input className="form-input" value={form.instituicao || ''} onChange={(e) => updateItem('formacao', idx, 'instituicao', e.target.value)} />
              </div>
            </div>

            <div className="responsive-grid">
              <div className="form-group">
                <label className="form-label">Período</label>
                <input className="form-input" value={form.periodo || ''} onChange={(e) => updateItem('formacao', idx, 'periodo', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <input className="form-input" value={form.status || ''} onChange={(e) => updateItem('formacao', idx, 'status', e.target.value)} placeholder="Ex: Concluído" />
              </div>
            </div>
            
            <button className="btn-remove" onClick={() => removeItem('formacao', idx)}>
              ✕ Remover Item
            </button>
          </div>
        ))}
        <button className="btn-add" onClick={() => addItem('formacao', { curso: '', instituicao: '', periodo: '', status: '' })}>
          + Adicionar Nova Formação
        </button>
      </Accordion>

      <Accordion title="Hard Skills (Técnicas)" icon="⚡">
        <p className="description-text" style={{marginBottom: '10px'}}>
          Defina o nível técnico para gerar barras de progresso.
        </p>
        {(data.hard_skills || []).map((skill, idx) => (
          <div key={idx} className="array-item-wrapper" style={{display: 'flex', gap: '10px', alignItems: 'center', paddingBottom: '10px'}}>
            <div style={{flex: 3}}>
               <input 
                 className="form-input" 
                 placeholder="Habilidade (Ex: React)" 
                 value={skill.nome || ''} 
                 onChange={(e) => updateSkill(idx, 'nome', e.target.value)} 
               />
            </div>
            <div style={{flex: 1}}>
               <input 
                 type="number" 
                 min="0" max="100"
                 className="form-input" 
                 placeholder="%" 
                 value={skill.nivel || ''} 
                 onChange={(e) => updateSkill(idx, 'nivel', e.target.value)} 
                 style={{textAlign: 'center'}}
               />
            </div>
            <button 
              className="btn-remove" 
              style={{marginTop: 0, padding: '10px', height: '100%'}} 
              onClick={() => removeItem('hard_skills', idx)}
              title="Remover"
            >
              ✕
            </button>
          </div>
        ))}
        <button className="btn-add" onClick={() => addItem('hard_skills', { nome: '', nivel: 50 })}>
          + Adicionar Skill
        </button>
      </Accordion>

       <Accordion title="Soft Skills (Comportamental)" icon="🤝">
        <p className="description-text">Habilidades interpessoais (Tags).</p>
        <TagInput 
          tags={data.soft_skills || []} 
          onUpdate={(newTags) => onUpdate({ ...data, soft_skills: newTags })}
          placeholder="Ex: Liderança, Comunicação..."
        />
      </Accordion>

      <Accordion title="Cursos Complementares" icon="📚">
        <p className="description-text">Certificações e workshops extras.</p>
        <TagInput 
          tags={data.cursos || []} 
          onUpdate={(newTags) => onUpdate({ ...data, cursos: newTags })}
          placeholder="Ex: AWS Cloud Practitioner (2024)..."
        />
      </Accordion>

    </div>
  );
};

export default EasyForm;