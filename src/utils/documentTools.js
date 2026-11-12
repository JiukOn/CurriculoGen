// Utilitários de chunking, indexação e busca em documentos anexados ao Copiloto

export const chunkDocument = (text, chunkSize = 3500, overlap = 300) => {
  if (!text || typeof text !== 'string') return [];
  const clean = text.trim();
  if (!clean) return [];
  if (clean.length <= chunkSize) return [clean];

  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    let end = Math.min(start + chunkSize, clean.length);

    // Tenta quebrar em fim de linha ou espaço para não cortar palavras ao meio
    if (end < clean.length) {
      const lastNewline = clean.lastIndexOf('\n', end);
      const lastSpace = clean.lastIndexOf(' ', end);
      const breakPoint = lastNewline > start + chunkSize * 0.6
        ? lastNewline
        : (lastSpace > start + chunkSize * 0.6 ? lastSpace : end);
      end = breakPoint;
    }

    chunks.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
};

export const buildEvidenceSource = (parsedFile) => {
  const chunks = chunkDocument(parsedFile.text || '');
  return {
    id: 'src_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    title: parsedFile.title,
    type: parsedFile.type || 'texto',
    content: parsedFile.text || '',
    chunks,
    totalChunks: chunks.length,
    totalChars: (parsedFile.text || '').length,
    pageCount: parsedFile.pageCount || null,
    isScannedOrEmpty: !!parsedFile.isScannedOrEmpty,
    base64Data: parsedFile.base64Data || null,
    mimeType: parsedFile.mimeType || null,
    dateAdded: new Date().toLocaleDateString()
  };
};

export const ensureSourceChunks = (src) => {
  if (Array.isArray(src.chunks) && src.chunks.length > 0) return src.chunks;
  return chunkDocument(src.content || '');
};

export const searchEvidenceChunks = (evidenceSources = [], query = '', maxResults = 5) => {
  const terms = String(query)
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length >= 2);

  if (terms.length === 0) return [];

  const matches = [];

  for (const src of evidenceSources) {
    const chunks = ensureSourceChunks(src);
    chunks.forEach((chunkText, chunkIndex) => {
      const lower = chunkText.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (lower.includes(term)) score += 1;
      }
      if (score > 0) {
        matches.push({
          documentId: src.id,
          title: src.title,
          chunkIndex,
          totalChunks: chunks.length,
          score,
          content: chunkText
        });
      }
    });
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, maxResults);
};
