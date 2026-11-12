// Utilitário universal para leitura e extração de texto de arquivos (PDF, TXT, MD, JSON) no navegador
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configura o worker local empacotado pelo Vite (sem depender de CDN externa)
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

export const extractTextFromPdf = async (file) => {
  if (!file) throw new Error('Nenhum arquivo fornecido.');

  const arrayBuffer = await file.arrayBuffer();

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer.slice(0)),
      useWorkerFetch: false,
      isEvalSupported: false
    });
    const pdfDoc = await loadingTask.promise;

    let fullText = '';

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      let lastY = null;
      const lines = [];
      let currentLine = '';

      for (const item of textContent.items) {
        if (!('str' in item)) continue;
        const y = item.transform?.[5];
        if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 4) {
          if (currentLine.trim()) lines.push(currentLine.trim());
          currentLine = item.str;
        } else {
          currentLine += (currentLine && !currentLine.endsWith(' ') && !item.str.startsWith(' ') ? ' ' : '') + item.str;
        }
        if (item.hasEOL) {
          if (currentLine.trim()) lines.push(currentLine.trim());
          currentLine = '';
        }
        if (y !== undefined) lastY = y;
      }
      if (currentLine.trim()) lines.push(currentLine.trim());

      const pageText = lines.join('\n').trim();
      fullText += `--- Página ${pageNum} ---\n${pageText}\n\n`;
    }

    const cleanedText = fullText.trim();
    const isScannedOrEmpty = cleanedText.replace(/---\s*Página\s*\d+\s*---/g, '').trim().length < 20;

    return {
      text: cleanedText,
      pageCount: pdfDoc.numPages,
      isScannedOrEmpty,
      base64Pdf: isScannedOrEmpty ? arrayBufferToBase64(arrayBuffer) : null
    };
  } catch (err) {
    // Fallback multimodal: caso o PDF tenha proteção/estrutura incomum, envia o PDF bruto ao Gemini
    console.warn('Fallback para PDF multimodal após falha na extração local:', err);
    return {
      text: `[PDF anexado: ${file.name} — enviado para leitura direta pelo modelo]`,
      pageCount: null,
      isScannedOrEmpty: true,
      base64Pdf: arrayBufferToBase64(arrayBuffer)
    };
  }
};

export const parseUploadedFile = async (file) => {
  if (!file) throw new Error('Arquivo não fornecido.');

  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
    const pdfResult = await extractTextFromPdf(file);
    return {
      title: file.name,
      type: 'pdf',
      text: pdfResult.text,
      pageCount: pdfResult.pageCount,
      isScannedOrEmpty: pdfResult.isScannedOrEmpty,
      base64Data: pdfResult.base64Pdf,
      mimeType: pdfResult.base64Pdf ? 'application/pdf' : null
    };
  }

  // Arquivos de texto: .txt, .md, .json (e outros formatos textuais)
  const rawText = await file.text();
  let type = 'texto';
  let normalizedText = rawText;

  if (fileName.endsWith('.json') || file.type === 'application/json') {
    type = 'json';
    try {
      const parsed = JSON.parse(rawText);
      normalizedText = JSON.stringify(parsed, null, 2);
    } catch {
      normalizedText = rawText;
    }
  } else if (fileName.endsWith('.md')) {
    type = 'markdown';
  }

  return {
    title: file.name,
    type,
    text: normalizedText.trim(),
    pageCount: null,
    isScannedOrEmpty: false,
    base64Data: null,
    mimeType: null
  };
};

export const readFileContent = async (file) => {
  const parsed = await parseUploadedFile(file);
  return parsed.text;
};
