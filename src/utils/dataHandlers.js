export const downloadBaseSchema = (data, prefix = "backup_curriculo") => {
  if (!data) {
    console.error("Erro: Nenhum dado fornecido para download.");
    return;
  }

  try {
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `${prefix}_${dateStr}.json`;

    const dataStr = JSON.stringify(data, null, 2);
    
    const blob = new Blob([dataStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);

  } catch (err) {
    console.error("Falha crítica ao gerar arquivo de download:", err);
    alert("Erro ao baixar o arquivo. Verifique o console.");
  }
};

const sanitizeRecursive = (item) => {
  if (typeof item === 'string') {
    return item
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "") 
      .replace(/on\w+="[^"]*"/g, "") 
      .replace(/javascript:/gi, ""); 
  }
  
  if (Array.isArray(item)) {
    return item.map(sanitizeRecursive);
  }
  
  if (item !== null && typeof item === 'object') {
    const cleanObj = {};
    Object.keys(item).forEach(key => {
      cleanObj[key] = sanitizeRecursive(item[key]);
    });
    return cleanObj;
  }

  return item;
};

export const validateAndFormat = (rawData) => {
  // 1. Validação Básica de Entrada
  if (!rawData || typeof rawData !== 'string' || rawData.trim() === "") {
    return null;
  }

  try {
    const parsedData = JSON.parse(rawData);

    const safeData = sanitizeRecursive(parsedData);

    const formattedData = {
      ...safeData,
      contato: safeData.contato || {}, 
      experiencias: Array.isArray(safeData.experiencias) ? safeData.experiencias : [],
      formacao: Array.isArray(safeData.formacao) ? safeData.formacao : [],
      hard_skills: Array.isArray(safeData.hard_skills) ? safeData.hard_skills : [],
      soft_skills: Array.isArray(safeData.soft_skills) ? safeData.soft_skills : [],
      cursos: Array.isArray(safeData.cursos) ? safeData.cursos : []
    };

    formattedData.formacao = formattedData.formacao.map(item => ({
      ...item,
      status: item.status ? String(item.status).toUpperCase() : null
    }));

    formattedData.hard_skills = formattedData.hard_skills.map(skill => ({
      ...skill,
      nivel: Math.min(Math.max(Number(skill.nivel) || 0, 0), 100)
    }));

    return formattedData;

  } catch (e) {
    console.warn("Validação falhou: JSON mal formatado.", e.message);
    return null;
  }
};