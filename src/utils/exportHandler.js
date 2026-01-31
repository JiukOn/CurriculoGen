export const exportToPDF = (iframeRef) => {
  if (!iframeRef || !iframeRef.current) {
    return;
  }

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
          max-height: 594mm !important;
          margin: 0 auto !important;
          padding: 0 !important;
          overflow: hidden !important;
          background-color: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          display: block !important;
          zoom: 0.96;
        }
        .cv-page, .main-container, #main, body > div {
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
        h1, h2, h3, h4, h5, .section-title {
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
      }, 500);
    } catch (err) {
      console.error(err);
    }
  }
};