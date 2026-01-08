const escapeHtml = (unsafe) => {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const injectDataToIframe = (doc, data, config, palettes) => {
  if (!doc || !data) return;

  try {
    if (config && palettes) {
      const colors = palettes[config.palette];
      if (colors) {
        doc.documentElement.style.setProperty('--primary-dark', colors.primary);
        doc.documentElement.style.setProperty('--accent-steel', colors.accent);
      }
      if (config.font) {
        doc.body.style.fontFamily = config.font;
      }
    }

    const textMappings = {
      'nome': data.nome,
      'cargo': data.cargo,
      'resumo': data.resumo,
      'email': data.contato?.email,
      'tel': data.contato?.tel,
      'local': data.contato?.local,
      'linkedin': data.contato?.linkedin,
      'nascimento': data.contato?.nascimento 
    };

    Object.keys(textMappings).forEach(id => {
      const el = doc.getElementById(id);
      if (el) {
        const val = textMappings[id];
        
        if (!val || val.trim() === "") {
          el.style.display = 'none';
          if (el.parentElement.tagName === 'LI') {
             el.parentElement.style.display = 'none';
          }
        } else {
          if (id === 'nascimento' && !val.toLowerCase().includes('nasc')) {
               el.innerText = `Nasc.: ${val}`;
          } else {
               el.innerText = val;
          }

          el.style.display = 'inline-block';
          
          if (el.parentElement.tagName === 'LI') {
             el.parentElement.style.display = 'list-item';
          }
        }
      }
    });

    const toggleSection = (id, check) => {
      const sec = doc.getElementById(id);
      if (sec) {
        const hasContent = check && (Array.isArray(check) ? check.length > 0 : check !== "");
        sec.style.display = hasContent ? 'block' : 'none';
      }
    };

    toggleSection('section-resumo', data.resumo);
    toggleSection('section-experiencia', data.experiencias);
    toggleSection('section-formacao', data.formacao);
    toggleSection('section-hard-skills', data.hard_skills);
    toggleSection('section-soft-skills', data.soft_skills);
    toggleSection('section-cursos', data.cursos);

    renderTimeline(doc, 'experiencias', data.experiencias);
    renderTimeline(doc, 'formacao', data.formacao);
    renderSkills(doc, data);
    renderCursos(doc, data.cursos);

  } catch (error) {
    console.error("Erro crítico ao injetar dados no currículo:", error);
  }
};


const renderTimeline = (doc, containerId, items) => {
  const container = doc.getElementById(containerId);
  if (!container) return;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="entry-item" style="margin-bottom: 15px; border-left: 2px solid var(--accent-steel); padding-left: 15px;">
      <div style="display: flex; justify-content: space-between; font-weight: bold; color: var(--primary-dark);">
        <span>${escapeHtml(item.titulo || item.curso)}</span>
        <span style="white-space: nowrap; margin-left: 10px;">${escapeHtml(item.periodo)}</span>
      </div>
      <div style="font-style: italic; color: var(--accent-steel); font-size: 10pt; margin-top: 2px;">
        ${escapeHtml(item.subtitulo || item.instituicao)}
        ${item.status ? `<span class="tag-status" style="display: inline-block; margin-left: 8px; border: 1px solid var(--accent-steel); padding: 0px 4px; font-size: 8pt; border-radius: 3px; font-style: normal; vertical-align: middle;">${escapeHtml(item.status)}</span>` : ''}
      </div>
      ${item.descricao ? `<p style="font-size: 10pt; margin-top:5px; text-align: justify; line-height: 1.4;">${escapeHtml(item.descricao)}</p>` : ''}
    </div>
  `).join('');
};

const renderSkills = (doc, data) => {
  const hardCont = doc.getElementById('hard-skills-lista');
  const softCont = doc.getElementById('soft-skills-lista');

  if (hardCont && Array.isArray(data.hard_skills)) {
    hardCont.innerHTML = data.hard_skills.map(s => `
      <div class="skill-bar-container" style="margin-bottom: 8px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; font-size: 9pt; font-weight: 600; margin-bottom: 2px;">
          <span>${escapeHtml(s.nome)}</span><span>${escapeHtml(String(s.nivel))}%</span>
        </div>
        <div style="height: 6px; background: #edf2f7; width: 100%; border-radius: 3px; overflow: hidden;">
          <div style="height: 100%; background: var(--primary-dark); width: ${Number(s.nivel) || 0}%; border-radius: 3px; print-color-adjust: exact; -webkit-print-color-adjust: exact;"></div>
        </div>
      </div>
    `).join('');
  }

  if (softCont && Array.isArray(data.soft_skills)) {
    softCont.innerHTML = data.soft_skills.map(s => `
      <span style="display: inline-block; background: var(--primary-dark); color: white; padding: 4px 8px; border-radius: 4px; font-size: 9pt; margin-right: 5px; margin-bottom: 5px; print-color-adjust: exact; -webkit-print-color-adjust: exact;">
        ${escapeHtml(s)}
      </span>
    `).join('');
  }
};

const renderCursos = (doc, items) => {
  const container = doc.getElementById('cursos-lista');
  if (!container) return;
  
  if (!items || !Array.isArray(items)) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = items.map(c => `
    <li style="font-size: 10pt; margin-bottom: 4px; color: var(--accent-steel);">
      <span style="color: #333; font-weight: 500;">${escapeHtml(c)}</span>
    </li>
  `).join('');
};