/* --- TÍTULOS BONITOS: EXPORTAÇÃO DE SCHEMA E GERENCIAMENTO DE ARQUIVOS --- */

/**
 * Faz o download do schema base em formato JSON.
 * @param {Object} baseData - Os dados importados do structure.json
 */
export const downloadBaseSchema = (baseData) => {
  if (!baseData) {
    console.error("Erro: Dados base para o schema não encontrados.");
    return;
  }

  try {
    // Transforma o objeto em string formatada
    const dataStr = JSON.stringify(baseData, null, 2);
    
    // Cria um Blob (Binary Large Object) para garantir compatibilidade com navegadores modernos
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // Cria um elemento de link temporário para disparar o download
    const link = document.createElement('a');
    link.href = url;
    link.download = "meu_curriculo_base.json";
    
    document.body.appendChild(link);
    link.click();
    
    // Limpeza de memória e remoção do elemento
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Falha ao gerar o arquivo de download:", err);
  }
};

/* --- TÍTULOS BONITOS: VALIDAÇÃO TÉCNICA E FORMATAÇÃO DE DADOS --- */

/**
 * Valida o JSON inserido e formata campos críticos como as badges de transição.
 * @param {string} rawData - String bruta vinda do textarea
 * @returns {Object|null} Dados formatados ou null se houver erro
 */
export const validateAndFormat = (rawData) => {
  if (!rawData || rawData.trim() === "") return null;

  try {
    const data = JSON.parse(rawData);
    
    // Tratamento de Formação: Garante destaque para transições (Ex: Engenharia para ADS)
    if (data.formacao && Array.isArray(data.formacao)) {
      data.formacao = data.formacao.map(item => ({
        ...item,
        // Converte o status para caixa alta para padronização visual nas badges
        status: item.status ? item.status.toString().toUpperCase() : null
      }));
    }

    // Tratamento de Experiências: Garante que existam arrays para o motor de injeção
    data.experiencias = Array.isArray(data.experiencias) ? data.experiencias : [];
    data.hard_skills = Array.isArray(data.hard_skills) ? data.hard_skills : [];
    data.soft_skills = Array.isArray(data.soft_skills) ? data.soft_skills : [];

    return data;
  } catch (e) {
    console.warn("Aviso: Entrada de dados JSON inválida.");
    return null;
  }
};