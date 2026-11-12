// Utilitário para extração de texto de arquivos PDF no navegador usando pdfjs-dist
import * as pdfjsLib from 'pdfjs-dist';

// Configura o worker do PDF.js usando CDN correspondente ou worker inline
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export const extractTextFromPdf = async (file) => {
  if (!file) throw new Error("Nenhum arquivo fornecido.");

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;

  let fullText = '';

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += `--- Página ${pageNum} ---\n${pageText}\n\n`;
  }

  return fullText.trim();
};

export const readFileContent = async (file) => {
  if (!file) throw new Error("Arquivo não fornecido.");

  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.pdf')) {
    return await extractTextFromPdf(file);
  }

  // Arquivos .txt, .md, .json
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
};
