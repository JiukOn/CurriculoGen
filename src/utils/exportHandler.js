import html2pdf from 'html2pdf.js';

export const exportToPDF = (iframeRef) => {
  if (!iframeRef || !iframeRef.current) return;

  const iframeWindow = iframeRef.current.contentWindow;
  const iframeDoc = iframeRef.current.contentDocument || iframeWindow.document;

  if (iframeWindow && iframeDoc) {
    const oldStyle = iframeDoc.getElementById('print-fix-style');
    if (oldStyle) oldStyle.remove();

    const style = iframeDoc.createElement('style');
    style.id = 'print-fix-style';
    style.innerHTML = `
      @page {
        size: A4;
        margin: 0mm !important;
      }
      @media print {
        * {
          box-sizing: border-box !important;
        }
        html, body {
          width: 210mm;
          min-height: 297mm;
          height: auto !important;
          margin: 0 auto !important;
          padding: 0 !important;
          overflow: hidden !important;
          background-color: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          display: block !important;
          zoom: 0.96;
        }
        .cv-page, .main-container, .cv-container, .page, #main, body > div {
          width: 100% !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          border: none !important;
          display: block !important;
          overflow: visible !important;
        }
        .entry-item, .section-wrapper, li, p {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        h1, h2, h3, h4, h5, .section-title, .section-header {
          page-break-after: avoid;
          break-after: avoid;
        }
        .page-break {
          page-break-before: always;
        }
        ::-webkit-scrollbar {
          display: none;
        }
      }
    `;
    iframeDoc.head.appendChild(style);

    const nameElement = iframeDoc.getElementById('nome');
    let rawName = nameElement?.innerText || "Curriculo";
    const safeName = rawName.replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '_').substring(0, 50);

    const originalTitle = iframeDoc.title;
    iframeDoc.title = `CV_${safeName}`;

    iframeWindow.focus();

    try {
      setTimeout(() => {
        iframeWindow.print();
        iframeDoc.title = originalTitle;
      }, 350);
    } catch (err) {
      console.error(err);
    }
  }
};

export const downloadDirectPDF = async (iframeRef, customFileName) => {
  if (!iframeRef || !iframeRef.current) throw new Error("Iframe não disponível.");

  const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
  if (!iframeDoc || !iframeDoc.body) throw new Error("Conteúdo do documento indisponível.");

  const nameElement = iframeDoc.getElementById('nome');
  const rawName = customFileName || nameElement?.innerText || "Curriculo";
  const safeName = rawName.replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '_').substring(0, 50);

  const elementToExport = iframeDoc.body;

  const opt = {
    margin: [0, 0, 0, 0],
    filename: `CV_${safeName}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: 0,
      scrollX: 0
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    },
    pagebreak: {
      mode: ['css', 'legacy'],
      before: '.page-break'
    }
  };

  return html2pdf().set(opt).from(elementToExport).save();
};
