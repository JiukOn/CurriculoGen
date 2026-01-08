/* --- TÍTULOS BONITOS: MOTOR DE EXPORTAÇÃO PDF OTIMIZADO --- */

/**
 * Aciona o driver de impressão do sistema focado no conteúdo do Iframe.
 * Otimizado para leitura por motores ATS e IAs de recrutamento.
 * @param {React.RefObject} iframeRef - Referência para o Iframe do currículo.
 */
export const exportToPDF = (iframeRef) => {
  if (!iframeRef || !iframeRef.current) {
    console.error("Erro: Iframe não encontrado para exportação.");
    return;
  }

  const iframeWindow = iframeRef.current.contentWindow;
  const iframeDoc = iframeRef.current.contentDocument || iframeWindow.document;

  if (iframeWindow && iframeDoc) {
    // 1. Define o nome do arquivo dinamicamente para o sistema de arquivos
    const nameElement = iframeDoc.getElementById('nome');
    const fileName = nameElement?.innerText || "Curriculo_Profissional";
    
    // Altera o título do documento temporariamente para nomear o PDF
    const originalTitle = iframeDoc.title;
    iframeDoc.title = `CV_${fileName.trim().replace(/\s+/g, '_')}`;

    // 2. Garante o foco para evitar que o navegador imprima a página de controles
    iframeWindow.focus();

    // 3. Executa a impressão
    // DICA: Para resultados profissionais, selecione 'Salvar como PDF' 
    // e 'Margens: Nenhuma' nas configurações da janela que abrirá.
    try {
      const isPrinted = iframeWindow.print();
      
      // Alguns navegadores retornam null ou undefined, mas se houver erro cai no catch
      if (isPrinted === false) {
        alert("A impressão foi cancelada ou bloqueada pelo navegador.");
      }
    } catch (err) {
      console.error("Erro ao disparar driver de impressão:", err);
      alert("Erro ao abrir janela de exportação. Verifique se pop-ups estão permitidos.");
    } finally {
      // Restaura o título original após a chamada
      iframeDoc.title = originalTitle;
    }
  } else {
    console.error("Janela do Iframe inacessível.");
  }
};