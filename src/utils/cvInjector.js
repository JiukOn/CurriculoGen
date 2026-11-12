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
    // 1. Injeção de Identidade Visual e Estilos
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

    // 2. Injeção do Modo de Densidade de Espaçamento (compact / normal / relaxed)
    const spacingScale = config?.spacing === 'compact' ? '0.85' : (config?.spacing === 'relaxed' ? '1.15' : '1.0');
    doc.documentElement.style.setProperty('--spacing-scale', spacingScale);

    // Ajusta margens e paddings conforme a densidade
    if (doc.body) {
      if (config?.spacing === 'compact') {
        doc.body.style.fontSize = '9pt';
        doc.body.style.lineHeight = '1.3';
      } else if (config?.spacing === 'relaxed') {
        doc.body.style.fontSize = '10.5pt';
        doc.body.style.lineHeight = '1.6';
      } else {
        doc.body.style.fontSize = '';
        doc.body.style.lineHeight = '';
      }
    }

    // 3. Campos de Texto Simples
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
          if (el.parentElement?.tagName === 'LI') {
             el.parentElement.style.display = 'none';
          }
        } else {
          if (id === 'nascimento' && !val.toLowerCase().includes('nasc')) {
               el.innerText = `Nasc.: ${val}`;
          } else {
               el.innerText = val;
          }

          el.style.display = 'inline-block';
          
          if (el.parentElement?.tagName === 'LI') {
             el.parentElement.style.display = 'list-item';
          }
        }
      }
    });

    // 4. Alternância Dinâmica de Seções
    const toggleSection = (id, check) => {
      const sec = doc.getElementById(id);
      if (sec) {
        const hasContent = check && (Array.isArray(check) ? check.length > 0 : String(check).trim() !== "");
        sec.style.display = hasContent ? 'block' : 'none';
      }
    };

    toggleSection('section-resumo', data.resumo);
    toggleSection('section-experiencia', data.experiencias);
    toggleSection('section-formacao', data.formacao);
    toggleSection('section-hard-skills', data.hard_skills);
    toggleSection('section-soft-skills', data.soft_skills);
    toggleSection('section-cursos', data.cursos);
    toggleSection('section-idiomas', data.idiomas);
    toggleSection('section-projetos', data.projetos);

    // 5. Renderização de Coleções
    renderTimeline(doc, 'experiencias', data.experiencias, config?.spacing);
    renderTimeline(doc, 'formacao', data.formacao, config?.spacing);
    renderSkills(doc, data);
    renderCursos(doc, data.cursos);
    renderIdiomas(doc, data.idiomas);
    renderProjetos(doc, data.projetos, config?.spacing);

  } catch (error) {
    console.error("Erro crítico ao injetar dados no currículo:", error);
  }
};

const renderTimeline = (doc, containerId, items, spacing = 'normal') => {
  const container = doc.getElementById(containerId);
  if (!container) return;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    container.innerHTML = '';
    return;
  }

  const marginBottom = spacing === 'compact' ? '8px' : (spacing === 'relaxed' ? '18px' : '12px');

  container.innerHTML = items.map(item => `
    <div class="entry-item" style="margin-bottom: ${marginBottom}; border-left: 2px solid var(--accent-steel, #4a5568); padding-left: 12px; page-break-inside: avoid;">
      <div style="display: flex; justify-content: space-between; font-weight: bold; color: var(--primary-dark, #252523); font-size: 10pt;">
        <span>${escapeHtml(item.titulo || item.curso)}</span>
        <span style="white-space: nowrap; margin-left: 10px; font-weight: normal; font-size: 9pt;">${escapeHtml(item.periodo)}</span>
      </div>
      <div style="font-style: italic; color: var(--accent-steel, #4a5568); font-size: 9pt; margin-top: 2px;">
        ${escapeHtml(item.subtitulo || item.instituicao)}
        ${item.status ? `<span class="tag-status" style="display: inline-block; margin-left: 8px; border: 1px solid var(--accent-steel, #4a5568); padding: 0px 4px; font-size: 7.5pt; border-radius: 3px; font-style: normal; vertical-align: middle;">${escapeHtml(item.status)}</span>` : ''}
      </div>
      ${item.descricao ? `<p style="font-size: 9.5pt; margin-top: 4px; text-align: justify; line-height: 1.35;">${escapeHtml(item.descricao)}</p>` : ''}
    </div>
  `).join('');
};

const renderSkills = (doc, data) => {
  const hardCont = doc.getElementById('hard-skills-lista');
  const softCont = doc.getElementById('soft-skills-lista');

  if (hardCont && Array.isArray(data.hard_skills)) {
    hardCont.innerHTML = data.hard_skills.map(s => `
      <div class="skill-bar-container" style="margin-bottom: 6px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; font-size: 8.5pt; font-weight: 600; margin-bottom: 2px;">
          <span>${escapeHtml(s.nome)}</span><span>${escapeHtml(String(s.nivel))}%</span>
        </div>
        <div style="height: 5px; background: #edf2f7; width: 100%; border-radius: 3px; overflow: hidden;">
          <div style="height: 100%; background: var(--primary-dark, #252523); width: ${Number(s.nivel) || 0}%; border-radius: 3px; print-color-adjust: exact; -webkit-print-color-adjust: exact;"></div>
        </div>
      </div>
    `).join('');
  }

  if (softCont && Array.isArray(data.soft_skills)) {
    softCont.innerHTML = data.soft_skills.map(s => `
      <span style="display: inline-block; background: var(--primary-dark, #252523); color: white; padding: 3px 7px; border-radius: 3px; font-size: 8.5pt; margin-right: 4px; margin-bottom: 4px; print-color-adjust: exact; -webkit-print-color-adjust: exact;">
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
    <li style="font-size: 9.5pt; margin-bottom: 3px; color: var(--accent-steel, #4a5568); list-style: none;">
      <span style="color: #333; font-weight: 500;">• ${escapeHtml(c)}</span>
    </li>
  `).join('');
};

// Renderização dinâmica de Idiomas
const renderIdiomas = (doc, idiomas) => {
  let container = doc.getElementById('idiomas-lista');
  
  // Se o container de idiomas não existir no template, tenta injetar na seção de idiomas
  if (!container) {
    const sec = doc.getElementById('section-idiomas');
    if (sec) {
      container = doc.createElement('div');
      container.id = 'idiomas-lista';
      container.style.display = 'flex';
      container.style.flexWrap = 'wrap';
      container.style.gap = '8px';
      container.style.marginTop = '8px';
      sec.appendChild(container);
    }
  }

  if (!container) return;

  if (!idiomas || !Array.isArray(idiomas) || idiomas.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = idiomas.map(i => `
    <span style="display: inline-flex; align-items: center; gap: 4px; background: #f0f4f8; border: 1px solid #cbd5e0; padding: 2px 8px; border-radius: 4px; font-size: 8.5pt; font-weight: 500; color: #2d3748;">
      <strong>${escapeHtml(i.idioma)}:</strong> ${escapeHtml(i.nivel)}
    </span>
  `).join('');
};

// Renderização dinâmica de Projetos
const renderProjetos = (doc, projetos, spacing = 'normal') => {
  let container = doc.getElementById('projetos-lista');

  if (!container) {
    const sec = doc.getElementById('section-projetos');
    if (sec) {
      container = doc.createElement('div');
      container.id = 'projetos-lista';
      sec.appendChild(container);
    }
  }

  if (!container) return;

  if (!projetos || !Array.isArray(projetos) || projetos.length === 0) {
    container.innerHTML = '';
    return;
  }

  const marginBottom = spacing === 'compact' ? '6px' : '10px';

  container.innerHTML = projetos.map(p => `
    <div style="margin-bottom: ${marginBottom}; border-left: 2px solid var(--accent-steel, #4a5568); padding-left: 10px; page-break-inside: avoid;">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <span style="font-weight: 600; font-size: 9.5pt; color: var(--primary-dark, #252523);">${escapeHtml(p.nome)}</span>
        ${p.link ? `<a href="${escapeHtml(p.link)}" target="_blank" style="font-size: 8pt; color: var(--accent-steel, #4a5568); text-decoration: underline;">${escapeHtml(p.link)}</a>` : ''}
      </div>
      ${p.descricao ? `<p style="font-size: 9pt; margin-top: 2px; color: #4a5568; line-height: 1.35;">${escapeHtml(p.descricao)}</p>` : ''}
    </div>
  `).join('');
};
