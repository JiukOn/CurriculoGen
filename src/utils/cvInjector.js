/* --- TÍTULOS BONITOS: MOTOR DE INJEÇÃO E ESTILIZAÇÃO DINÂMICA --- */

export const injectDataToIframe = (doc, data, config, palettes) => {
  if (!doc) return;

  // 1. Sincronização de Identidade Visual (Cores e Fontes)
  // Requisito: O modelo HTML deve usar var(--primary-dark) e var(--accent-steel)
  if (config && palettes) {
    const colors = palettes[config.palette];
    if (colors) {
      doc.documentElement.style.setProperty('--primary-dark', colors.primary);
      doc.documentElement.style.setProperty('--accent-steel', colors.accent);
    }
    // Aplica a fonte selecionada ao corpo do documento
    doc.body.style.fontFamily = config.font;
  }

  // Se não houver dados (JSON vazio ou erro), paramos aqui para manter o estilo
  if (!data) return;

  // 2. Campos de Texto Simples
  const textMappings = {
    'nome': data.nome,
    'cargo': data.cargo,
    'resumo': data.resumo,
    'email': data.contato?.email,
    'tel': data.contato?.tel,
    'local': data.contato?.local,
    'linkedin': data.contato?.linkedin
  };

  Object.keys(textMappings).forEach(id => {
    const el = doc.getElementById(id);
    if (el) {
      const val = textMappings[id];
      if (!val || val === "") {
        el.style.display = 'none';
      } else {
        el.innerText = val;
        el.style.display = 'inline-block';
      }
    }
  });

  // 3. Controle de Visibilidade de Seções Inteiras
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

  // 4. Chamada dos Renderizadores de Lista
  renderTimeline(doc, 'experiencias', data.experiencias);
  renderTimeline(doc, 'formacao', data.formacao);
  renderSkills(doc, data);
  renderCursos(doc, data.cursos);
};

/* --- TÍTULOS BONITOS: RENDERIZADOR DE LINHA DO TEMPO (EDUCAÇÃO/ESTÁGIO) --- */

const renderTimeline = (doc, containerId, items) => {
  const container = doc.getElementById(containerId);
  if (!container || !items) return;

  container.innerHTML = items.map(item => `
    <div class="entry-item" style="margin-bottom: 15px; border-left: 2px solid var(--accent-steel); padding-left: 15px;">
      <div style="display: flex; justify-content: space-between; font-weight: bold; color: var(--primary-dark);">
        <span>${item.titulo || item.curso}</span>
        <span>${item.periodo}</span>
      </div>
      <div style="font-style: italic; color: var(--accent-steel); font-size: 10pt;">
        ${item.subtitulo || item.instituicao}
        ${item.status ? `<span class="tag-status" style="margin-left: 8px; border: 1px solid var(--accent-steel); padding: 1px 5px; font-size: 8pt; border-radius: 3px; font-style: normal;">${item.status}</span>` : ''}
      </div>
      ${item.descricao ? `<p style="font-size: 10pt; margin-top:5px; text-align: justify;">${item.descricao}</p>` : ''}
    </div>
  `).join('');
};

/* --- TÍTULOS BONITOS: RENDERIZADOR DE COMPETÊNCIAS --- */

const renderSkills = (doc, data) => {
  const hardCont = doc.getElementById('hard-skills-lista');
  const softCont = doc.getElementById('soft-skills-lista');

  if (hardCont && data.hard_skills) {
    hardCont.innerHTML = data.hard_skills.map(s => `
      <div class="skill-bar-container" style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; font-size: 9pt; font-weight: 600; margin-bottom: 3px;">
          <span>${s.nome}</span><span>${s.nivel}%</span>
        </div>
        <div style="height: 6px; background: #edf2f7; width: 100%; border-radius: 3px;">
          <div style="height: 100%; background: var(--primary-dark); width: ${s.nivel}%; border-radius: 3px; transition: width 0.5s ease;"></div>
        </div>
      </div>
    `).join('');
  }

  if (softCont && data.soft_skills) {
    softCont.innerHTML = data.soft_skills.map(s => `
      <span style="display: inline-block; background: var(--primary-dark); color: white; padding: 3px 10px; border-radius: 4px; font-size: 9pt; margin-right: 5px; margin-bottom: 5px;">
        ${s}
      </span>
    `).join('');
  }
};

/* --- TÍTULOS BONITOS: RENDERIZADOR DE CURSOS ADICIONAIS --- */

const renderCursos = (doc, items) => {
  const container = doc.getElementById('cursos-lista');
  if (!container || !items) return;
  container.innerHTML = items.map(c => `<li style="font-size: 10pt; margin-bottom: 5px; list-style-type: square; color: var(--accent-steel);"><span style="color: #333;">${c}</span></li>`).join('');
};