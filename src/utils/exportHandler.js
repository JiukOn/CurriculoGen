/**
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
    // 1. INJEÇÃO DE CSS DE IMPRESSÃO
    const oldStyle = iframeDoc.getElementById('print-fix-style');
    if (oldStyle) oldStyle.remove();

    const style = iframeDoc.createElement('style');
    style.id = 'print-fix-style';
    style.innerHTML = `
      @page {
        size: A4;
        margin: 0mm !important; /* Remove URL, Data, Título e Números de página */
      }
      @media print {
        html, body {
          width: 210mm;
          height: 297mm;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important; /* Corta pixels extras que geram folha em branco */
          background-color: white !important;
          -webkit-print-color-adjust: exact !important; /* Garante cores e backgrounds */
          print-color-adjust: exact !important;
        }
        /* Garante que o container ocupe a página toda */
        .cv-container, #main, body > div {
          height: 100% !important;
          margin: 0 !important;
        }
      }
    `;
    iframeDoc.head.appendChild(style);

    // 2. Define o nome do arquivo (Nome do Candidato)
    const nameElement = iframeDoc.getElementById('nome');
    const fileName = nameElement?.innerText || "Curriculo_Profissional";
    
    const originalTitle = iframeDoc.title;
    iframeDoc.title = `CV_${fileName.trim().replace(/\s+/g, '_')}`;

    // 3. Foco e Impressão
    iframeWindow.focus();

    try {
      setTimeout(() => {
        iframeWindow.print();
        iframeDoc.title = originalTitle;
      }, 100);
      
    } catch (err) {
      console.error("Erro ao disparar driver de impressão:", err);
      alert("Erro ao exportar. Verifique se pop-ups estão permitidos.");
    }
  } else {
    console.error("Janela do Iframe inacessível.");
  }
};