import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';

const { jsPDF } = window.jspdf;
const { Document, Packer, Paragraph, HeadingLevel } = window.docx;
const { PDFDocument, rgb } = window.PDFLib;

const fileInput = document.getElementById('fileInput');
const folderInput = document.getElementById('folderInput');
const dropZone = document.getElementById('dropZone');
const levelSelect = document.getElementById('levelSelect');
const pdfModeSelect = document.getElementById('pdfModeSelect');
const personPrefixInput = document.getElementById('personPrefix');
const processBtn = document.getElementById('processBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const presetDirectBtn = document.getElementById('presetDirectBtn');
const presetRecommendedBtn = document.getElementById('presetRecommendedBtn');
const presetAllBtn = document.getElementById('presetAllBtn');
const fileList = document.getElementById('fileList');
const fileCount = document.getElementById('fileCount');
const resultsContainer = document.getElementById('resultsContainer');
const mappingTable = document.getElementById('mappingTable');
const summaryStats = document.getElementById('summaryStats');
const statusBanner = document.getElementById('statusBanner');
const entityToggles = [...document.querySelectorAll('.entity-toggle')];

const state = {
  files: [],
  results: [],
  objectUrls: [],
  entityMap: new Map(),
  counters: {
    person: 0,
    official: 0,
    country: 0,
    location: 0,
    route: 0,
    facility: 0,
    caseId: 0,
    address: 0,
    email: 0,
    phone: 0,
    generic: 0,
  },
  categoryCounts: new Map(),
};

const countries = [
  'Afghanistan', 'Albania', 'Algeria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Egypt', 'France', 'Germany',
  'Greece', 'Hungary', 'Iraq', 'Italy', 'Jordan', 'Lebanon', 'Libya', 'Malta', 'Morocco', 'Netherlands',
  'Pakistan', 'Poland', 'Romania', 'Spain', 'Syria', 'Turkey', 'Ukraine'
];

const familyTerms = ['wife', 'husband', 'daughter', 'son', 'children', 'child', 'mother', 'father', 'brother', 'sister'];
const monthPattern = 'January|February|March|April|May|June|July|August|September|October|November|December';
const supportedExtensions = new Set(['docx', 'pdf', 'txt', 'xlsx']);
const directPreset = ['PERSON', 'CASE_ID', 'PASSPORT_OR_ID', 'ADDRESS', 'EMAIL', 'PHONE'];
const recommendedPreset = ['PERSON', 'CASE_ID', 'PASSPORT_OR_ID', 'ADDRESS', 'EMAIL', 'PHONE', 'DATE_EXACT', 'COUNTRY', 'LOCATION', 'FACILITY', 'ROUTE', 'FAMILY_TERM'];

function setStatus(message, type = 'info') {
  statusBanner.textContent = message;
  statusBanner.className = `status ${type}`;
}

function alpha(n) {
  let result = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function clearObjectUrls() {
  for (const url of state.objectUrls) URL.revokeObjectURL(url);
  state.objectUrls = [];
}

function selectedCategories() {
  return new Set(entityToggles.filter(toggle => toggle.checked).map(toggle => toggle.value));
}

function applyPreset(values) {
  const selected = new Set(values);
  entityToggles.forEach(toggle => {
    toggle.checked = selected.has(toggle.value);
  });
}

function resetState() {
  state.files = [];
  state.results = [];
  state.entityMap = new Map();
  state.categoryCounts = new Map();
  state.counters = {
    person: 0, official: 0, country: 0, location: 0, route: 0, facility: 0,
    caseId: 0, address: 0, email: 0, phone: 0, generic: 0,
  };
  clearObjectUrls();
  renderFileList();
  renderResults();
  renderMappingTable();
  renderStats();
  downloadAllBtn.disabled = true;
  setStatus('Session cleared. No files loaded.', 'info');
}

function updateCategoryCount(category) {
  state.categoryCounts.set(category, (state.categoryCounts.get(category) || 0) + 1);
}

function placeholderFor(original, category) {
  const prefix = personPrefixInput.value.trim() || 'Applicant';
  const key = `${category}::${original.trim()}`.toLowerCase();
  if (state.entityMap.has(key)) return state.entityMap.get(key).replacement;

  let replacement;
  switch (category) {
    case 'PERSON':
      state.counters.person += 1;
      replacement = `${prefix} ${alpha(state.counters.person)}`;
      break;
    case 'OFFICIAL_NAME':
    case 'ORGANISATION':
      state.counters.official += 1;
      replacement = `Official ${alpha(state.counters.official)}`;
      break;
    case 'COUNTRY':
      state.counters.country += 1;
      replacement = `Country ${alpha(state.counters.country)}`;
      break;
    case 'LOCATION':
      state.counters.location += 1;
      replacement = `Location ${alpha(state.counters.location)}`;
      break;
    case 'FACILITY':
      state.counters.facility += 1;
      replacement = `Facility ${alpha(state.counters.facility)}`;
      break;
    case 'ROUTE':
      state.counters.route += 1;
      replacement = `Route ${state.counters.route}`;
      break;
    case 'CASE_ID':
    case 'FILE_NUMBER':
    case 'PASSPORT_OR_ID':
      state.counters.caseId += 1;
      replacement = `Case File ${String(state.counters.caseId).padStart(3, '0')}`;
      break;
    case 'ADDRESS':
      state.counters.address += 1;
      replacement = `Address ${alpha(state.counters.address)}`;
      break;
    case 'EMAIL':
      state.counters.email += 1;
      replacement = `email-${String(state.counters.email).padStart(3, '0')}@example.invalid`;
      break;
    case 'PHONE':
      state.counters.phone += 1;
      replacement = `+000-000-${String(state.counters.phone).padStart(4, '0')}`;
      break;
    case 'FAMILY_TERM':
      replacement = 'family member';
      break;
    case 'DATE_EXACT':
      replacement = generaliseDate(original);
      break;
    default:
      state.counters.generic += 1;
      replacement = `Redacted ${String(state.counters.generic).padStart(3, '0')}`;
      break;
  }

  state.entityMap.set(key, { category, original: original.trim(), replacement });
  updateCategoryCount(category);
  return replacement;
}

function generaliseDate(value) {
  const monthMatch = value.match(new RegExp(`(${monthPattern})\\s+(\\d{4})`));
  if (monthMatch) return `${monthMatch[1]} ${monthMatch[2]}`;
  const parts = value.split(/[/-]/);
  if (parts.length === 3) {
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `Year ${year}`;
  }
  return 'Date Redacted';
}

function buildPatterns(active) {
  const patterns = [];
  if (active.has('EMAIL')) patterns.push(['EMAIL', /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}\b/g]);
  if (active.has('PHONE')) patterns.push(['PHONE', /\+?\d[\d\s().-]{7,}\d/g]);
  if (active.has('CASE_ID')) patterns.push(['CASE_ID', /\b(?:Case\s*(?:No\.?|Number)?\s*[:#-]?\s*)?[A-Z]{1,4}-?\d{2,4}-\d{2,6}\b/g]);
  if (active.has('PASSPORT_OR_ID')) patterns.push(['PASSPORT_OR_ID', /\b(?:ID|Passport|Document)\s*(?:No\.?|Number)?\s*[:#-]?\s*[A-Z0-9]{5,20}\b/gi]);
  if (active.has('ADDRESS')) patterns.push(['ADDRESS', /\b\d{1,4}\s+[A-Z][A-Za-z0-9.'-]+(?:\s+[A-Z][A-Za-z0-9.'-]+){0,4}\s+(?:Street|St|Road|Rd|Avenue|Ave|Boulevard|Blvd|Lane|Ln|Way)\b/g]);
  if (active.has('DATE_EXACT')) {
    patterns.push(['DATE_EXACT', new RegExp(`\\b\\d{1,2}\\s+(?:${monthPattern})\\s+\\d{4}\\b`, 'g')]);
    patterns.push(['DATE_EXACT', /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g]);
  }
  if (active.has('FACILITY')) patterns.push(['FACILITY', /\b(?:Reception Centre|Closed Controlled Access Centre|CCAC|Camp|Facility)\s+[A-Z][\w-]+(?:\s+[A-Z][\w-]+)*\b/g]);
  if (active.has('ROUTE')) patterns.push(['ROUTE', /\b(?:route\s+via\s+[A-Z][a-zA-Z-]+(?:\s*[–-]\s*[A-Z][a-zA-Z-]+)*)\b/gi]);
  if (active.has('PERSON')) patterns.push(['PERSON', /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g]);
  return patterns;
}

function detectEntities(text, level, activeCategories = selectedCategories()) {
  const entities = [];
  for (const [category, pattern] of buildPatterns(activeCategories)) {
    for (const match of text.matchAll(pattern)) {
      entities.push({ category, text: match[0], start: match.index, end: match.index + match[0].length });
    }
  }

  if (activeCategories.has('COUNTRY')) {
    for (const country of countries) {
      const re = new RegExp(`\\b${country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      for (const match of text.matchAll(re)) {
        entities.push({ category: 'COUNTRY', text: match[0], start: match.index, end: match.index + match[0].length });
      }
    }
  }

  if (level !== 'light' && activeCategories.has('LOCATION')) {
    const locationRe = /\b(?:in|at|from|to|arrived in)\s+([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){0,2})\b/g;
    for (const match of text.matchAll(locationRe)) {
      if (match[1]) {
        const start = match.index + match[0].lastIndexOf(match[1]);
        entities.push({ category: 'LOCATION', text: match[1], start, end: start + match[1].length });
      }
    }
  }

  if (level !== 'light' && activeCategories.has('FAMILY_TERM')) {
    const familyRe = new RegExp(`\\b(?:${familyTerms.join('|')})\\b`, 'gi');
    for (const match of text.matchAll(familyRe)) {
      entities.push({ category: 'FAMILY_TERM', text: match[0], start: match.index, end: match.index + match[0].length });
    }
  }

  entities.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const deduped = [];
  let lastEnd = -1;
  for (const entity of entities) {
    if (entity.start < lastEnd) continue;
    deduped.push(entity);
    lastEnd = entity.end;
  }
  return deduped;
}

function anonymizeText(text, level, activeCategories = selectedCategories()) {
  const entities = detectEntities(text, level, activeCategories);
  let out = text;
  const replacements = [];

  for (const entity of [...entities].sort((a, b) => b.start - a.start)) {
    let replacement;
    if (entity.category === 'DATE_EXACT') {
      replacement = generaliseDate(entity.text);
      const key = `${entity.category}::${entity.text.trim()}`.toLowerCase();
      if (!state.entityMap.has(key)) {
        state.entityMap.set(key, { category: entity.category, original: entity.text.trim(), replacement });
        updateCategoryCount(entity.category);
      }
    } else if (entity.category === 'FAMILY_TERM') {
      replacement = level === 'demo-safe' ? 'family member' : entity.text;
      const key = `${entity.category}::${entity.text.trim()}`.toLowerCase();
      if (!state.entityMap.has(key)) {
        state.entityMap.set(key, { category: entity.category, original: entity.text.trim(), replacement });
        updateCategoryCount(entity.category);
      }
    } else {
      replacement = placeholderFor(entity.text, entity.category);
    }
    out = `${out.slice(0, entity.start)}${replacement}${out.slice(entity.end)}`;
    replacements.push({ ...entity, replacement });
  }

  if (level === 'demo-safe' && activeCategories.has('FAMILY_TERM')) {
    out = out.replace(/\b\d+\s+children\b/gi, 'family members');
    out = out.replace(/\b\d{1,2}\s+years? old\b/gi, 'young person');
  }

  return { text: out, replacements: replacements.reverse() };
}

function blobUrl(blob) {
  const url = URL.createObjectURL(blob);
  state.objectUrls.push(url);
  return url;
}

function makeDownload(filename, blob) {
  return { filename, blob, url: blobUrl(blob) };
}

async function textToDocxBlob(title, text) {
  const paragraphs = [
    new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
    ...text.split(/\n+/).map(line => new Paragraph({ text: line || ' ' })),
  ];
  const doc = new Document({ sections: [{ children: paragraphs }] });
  return Packer.toBlob(doc);
}

function textToPdfBlob(title, text) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const width = pdf.internal.pageSize.getWidth() - 80;
  let y = 48;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.text(title, 40, y);
  y += 24;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const lines = pdf.splitTextToSize(text || ' ', width);
  for (const line of lines) {
    if (y > 790) {
      pdf.addPage();
      y = 48;
    }
    pdf.text(line, 40, y);
    y += 14;
  }
  return pdf.output('blob');
}

async function extractPdfText(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items.map(item => item.str).join(' ');
    pages.push(items);
  }
  return pages.join('\n\n');
}

async function extractDocxText(file) {
  const buffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value || '';
}

async function buildTextOutputs(relativePath, text, replacements, formats) {
  const baseName = relativePath.replace(/\.[^.]+$/, '');
  const downloads = [];
  if (formats.includes('txt')) downloads.push(makeDownload(`${baseName}_anonymised.txt`, new Blob([text], { type: 'text/plain;charset=utf-8' })));
  if (formats.includes('docx')) downloads.push(makeDownload(`${baseName}_anonymised.docx`, await textToDocxBlob(`${relativePath} (anonymised)`, text)));
  if (formats.includes('pdf')) downloads.push(makeDownload(`${baseName}_anonymised.pdf`, textToPdfBlob(`${relativePath} (anonymised)`, text)));
  return { sourceName: relativePath, previewText: text, replacements, downloads, mode: 'anonymised-text' };
}

async function processTxtFile(file, relativePath, level, activeCategories) {
  const raw = await file.text();
  const anonymized = anonymizeText(raw, level, activeCategories);
  return buildTextOutputs(relativePath, anonymized.text, anonymized.replacements, ['txt', 'docx', 'pdf']);
}

async function processDocxFile(file, relativePath, level, activeCategories) {
  const raw = await extractDocxText(file);
  const anonymized = anonymizeText(raw, level, activeCategories);
  return buildTextOutputs(relativePath, anonymized.text, anonymized.replacements, ['txt', 'docx', 'pdf']);
}

async function processPdfBlackout(file, relativePath, level, activeCategories) {
  const buffer = await file.arrayBuffer();
  const sourceBytes = new Uint8Array(buffer);
  const pdfjsDoc = await pdfjsLib.getDocument({ data: sourceBytes }).promise;
  const pdfLibDoc = await PDFDocument.load(sourceBytes);
  const allReplacements = [];
  const previewPages = [];

  for (let pageIndex = 0; pageIndex < pdfjsDoc.numPages; pageIndex += 1) {
    const page = await pdfjsDoc.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 1.0 });
    const content = await page.getTextContent();
    const pdfLibPage = pdfLibDoc.getPage(pageIndex);

    const pagePreview = [];
    for (const item of content.items) {
      const str = item.str || '';
      if (!str.trim()) continue;
      pagePreview.push(str);
      const entities = detectEntities(str, level, activeCategories);
      if (!entities.length) continue;

      const transform = pdfjsLib.Util.transform(viewport.transform, item.transform);
      const x = transform[4];
      const yTop = transform[5];
      const height = Math.max(item.height || Math.abs(transform[3]) || 8, 8);
      const width = Math.max(item.width || (str.length * 5), 8);
      const y = viewport.height - yTop - height;

      pdfLibPage.drawRectangle({
        x,
        y,
        width,
        height,
        color: rgb(0, 0, 0),
        borderColor: rgb(0, 0, 0),
        borderWidth: 0,
        opacity: 1,
      });

      for (const entity of entities) {
        allReplacements.push({ ...entity, replacement: 'BLACK BAR REDACTION' });
        const key = `${entity.category}::${entity.text.trim()}`.toLowerCase();
        if (!state.entityMap.has(key)) {
          state.entityMap.set(key, { category: entity.category, original: entity.text.trim(), replacement: 'BLACK BAR REDACTION' });
          updateCategoryCount(entity.category);
        }
      }
    }
    previewPages.push(pagePreview.join(' '));
  }

  const outputBytes = await pdfLibDoc.save();
  const baseName = relativePath.replace(/\.[^.]+$/, '');
  return {
    sourceName: relativePath,
    previewText: previewPages.join('\n\n'),
    replacements: allReplacements,
    downloads: [makeDownload(`${baseName}_redacted.pdf`, new Blob([outputBytes], { type: 'application/pdf' }))],
    mode: 'pdf-blackout',
  };
}

async function processPdfFile(file, relativePath, level, activeCategories) {
  if (pdfModeSelect.value === 'blackout') {
    return processPdfBlackout(file, relativePath, level, activeCategories);
  }
  const raw = await extractPdfText(file);
  const anonymized = anonymizeText(raw, level, activeCategories);
  return buildTextOutputs(relativePath, anonymized.text, anonymized.replacements, ['txt', 'docx', 'pdf']);
}

async function processXlsxFile(file, relativePath, level, activeCategories) {
  const buffer = await file.arrayBuffer();
  const workbook = window.XLSX.read(buffer, { type: 'array' });
  const previewLines = [];
  const replacements = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const range = window.XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
    for (let row = range.s.r; row <= range.e.r; row += 1) {
      const rendered = [];
      for (let col = range.s.c; col <= range.e.c; col += 1) {
        const address = window.XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[address];
        if (!cell) continue;
        if (typeof cell.v === 'string' && !cell.v.startsWith('=')) {
          const result = anonymizeText(cell.v, level, activeCategories);
          cell.v = result.text;
          cell.w = result.text;
          rendered.push(result.text);
          replacements.push(...result.replacements);
        } else {
          rendered.push(String(cell.v));
        }
      }
      if (rendered.length) previewLines.push(rendered.join(' | '));
    }
  }

  const xlsxArray = window.XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const xlsxBlob = new Blob([xlsxArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const previewText = previewLines.join('\n');
  const baseName = relativePath.replace(/\.[^.]+$/, '');
  const docxBlob = await textToDocxBlob(`${relativePath} (anonymised)`, previewText);
  const pdfBlob = textToPdfBlob(`${relativePath} (anonymised)`, previewText);
  const txtBlob = new Blob([previewText], { type: 'text/plain;charset=utf-8' });

  return {
    sourceName: relativePath,
    previewText,
    replacements,
    downloads: [
      makeDownload(`${baseName}_anonymised.xlsx`, xlsxBlob),
      makeDownload(`${baseName}_anonymised.docx`, docxBlob),
      makeDownload(`${baseName}_anonymised.pdf`, pdfBlob),
      makeDownload(`${baseName}_anonymised.txt`, txtBlob),
    ],
    mode: 'anonymised-text',
  };
}

function renderFileList() {
  fileCount.textContent = `${state.files.length} file${state.files.length === 1 ? '' : 's'}`;
  fileList.innerHTML = '';
  for (const file of state.files) {
    const li = document.createElement('li');
    const left = document.createElement('div');
    left.innerHTML = `<strong>${escapeHtml(file.relativePath)}</strong><div class="muted">${Math.round(file.size / 1024)} KB</div>`;
    const right = document.createElement('div');
    right.className = 'muted';
    right.textContent = file.type || file.extension.toUpperCase();
    li.append(left, right);
    fileList.appendChild(li);
  }
}

function renderResults() {
  resultsContainer.innerHTML = '';
  for (const result of state.results) {
    const card = document.createElement('article');
    card.className = 'result-card';
    const links = result.downloads.map(item => `<a href="${item.url}" download="${escapeHtml(item.filename)}">${escapeHtml(item.filename)}</a>`).join('');
    const modeText = result.mode === 'pdf-blackout' ? 'Original PDF with black-bar redactions' : 'Anonymised content export';
    card.innerHTML = `
      <div class="result-head">
        <div>
          <h3>${escapeHtml(result.sourceName)}</h3>
          <p class="muted">${escapeHtml(modeText)} · ${result.replacements.length} replacement(s)</p>
        </div>
        <div class="result-downloads">${links}</div>
      </div>
      <div class="preview">${escapeHtml(result.previewText.slice(0, 6000) || '(No text extracted)')}</div>
    `;
    resultsContainer.appendChild(card);
  }
}

function renderMappingTable() {
  mappingTable.innerHTML = '';
  const rows = [...state.entityMap.values()].sort((a, b) => a.category.localeCompare(b.category) || a.original.localeCompare(b.original));
  for (const row of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(row.category)}</td><td>${escapeHtml(row.original)}</td><td>${escapeHtml(row.replacement)}</td>`;
    mappingTable.appendChild(tr);
  }
}

function renderStats() {
  summaryStats.innerHTML = '';
  if (!state.categoryCounts.size) return;
  for (const [category, count] of [...state.categoryCounts.entries()].sort()) {
    const span = document.createElement('span');
    span.className = 'stat';
    span.textContent = `${category}: ${count}`;
    summaryStats.appendChild(span);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function addFiles(files) {
  const seen = new Set(state.files.map(file => file.relativePath));
  for (const file of files) {
    const name = file.webkitRelativePath || file.relativePath || file.name;
    const extension = (name.split('.').pop() || '').toLowerCase();
    if (!supportedExtensions.has(extension)) continue;
    if (seen.has(name)) continue;
    state.files.push({
      file,
      size: file.size,
      type: file.type,
      relativePath: name,
      extension,
    });
    seen.add(name);
  }
  renderFileList();
  if (state.files.length) setStatus(`${state.files.length} file(s) ready for processing.`, 'success');
}

async function processOne(entry, level, activeCategories) {
  switch (entry.extension) {
    case 'txt':
      return processTxtFile(entry.file, entry.relativePath, level, activeCategories);
    case 'docx':
      return processDocxFile(entry.file, entry.relativePath, level, activeCategories);
    case 'pdf':
      return processPdfFile(entry.file, entry.relativePath, level, activeCategories);
    case 'xlsx':
      return processXlsxFile(entry.file, entry.relativePath, level, activeCategories);
    default:
      return null;
  }
}

async function processAll() {
  if (!state.files.length) {
    setStatus('Add files or a folder before processing.', 'warn');
    return;
  }
  const activeCategories = selectedCategories();
  if (!activeCategories.size) {
    setStatus('Select at least one anonymisation category.', 'warn');
    return;
  }

  clearObjectUrls();
  state.results = [];
  state.entityMap = new Map();
  state.categoryCounts = new Map();
  Object.keys(state.counters).forEach(key => { state.counters[key] = 0; });
  renderMappingTable();
  renderStats();
  downloadAllBtn.disabled = true;

  const level = levelSelect.value;
  setStatus(`Processing ${state.files.length} file(s) in ${level} mode...`, 'info');

  for (let i = 0; i < state.files.length; i += 1) {
    const entry = state.files[i];
    setStatus(`Processing ${i + 1}/${state.files.length}: ${entry.relativePath}`, 'info');
    try {
      const result = await processOne(entry, level, activeCategories);
      if (result) state.results.push(result);
    } catch (error) {
      console.error(error);
      state.results.push({
        sourceName: entry.relativePath,
        previewText: `Error while processing file: ${error.message}`,
        replacements: [],
        downloads: [],
        mode: 'error',
      });
    }
    renderResults();
    renderMappingTable();
    renderStats();
  }

  downloadAllBtn.disabled = state.results.every(result => result.downloads.length === 0);
  setStatus(`Finished. ${state.results.length} file(s) processed locally in your browser.`, 'success');
}

async function downloadAll() {
  if (!state.results.length) return;
  const zip = new window.JSZip();
  for (const result of state.results) {
    for (const asset of result.downloads) {
      zip.file(asset.filename, asset.blob);
    }
  }
  const summary = [...state.entityMap.values()]
    .map(item => `${item.category}\t${item.original}\t${item.replacement}`)
    .join('\n');
  zip.file('replacement-map.tsv', summary || 'No replacements recorded');
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = blobUrl(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'anonymised-output-bundle.zip';
  a.click();
}

function handleFileInput(event) {
  addFiles([...event.target.files]);
  event.target.value = '';
}

async function readEntriesFromDrop(items) {
  if (!items || !items.length || !items[0].webkitGetAsEntry) return [];
  const files = [];

  async function walk(entry, prefix = '') {
    if (entry.isFile) {
      await new Promise(resolve => entry.file(file => {
        Object.defineProperty(file, 'relativePath', { value: prefix + file.name, configurable: true });
        files.push(file);
        resolve();
      }));
      return;
    }

    if (entry.isDirectory) {
      const reader = entry.createReader();
      const entries = await new Promise(resolve => reader.readEntries(resolve));
      for (const child of entries) await walk(child, `${prefix}${entry.name}/`);
    }
  }

  for (const item of items) {
    const entry = item.webkitGetAsEntry();
    if (entry) await walk(entry);
  }
  return files;
}

fileInput.addEventListener('change', handleFileInput);
folderInput.addEventListener('change', handleFileInput);
processBtn.addEventListener('click', processAll);
clearBtn.addEventListener('click', resetState);
downloadAllBtn.addEventListener('click', downloadAll);
presetDirectBtn.addEventListener('click', () => applyPreset(directPreset));
presetRecommendedBtn.addEventListener('click', () => applyPreset(recommendedPreset));
presetAllBtn.addEventListener('click', () => applyPreset(entityToggles.map(toggle => toggle.value)));

['dragenter', 'dragover'].forEach(evt => dropZone.addEventListener(evt, e => {
  e.preventDefault();
  dropZone.classList.add('dragover');
}));
['dragleave', 'drop'].forEach(evt => dropZone.addEventListener(evt, e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
}));
dropZone.addEventListener('drop', async e => {
  const entryFiles = await readEntriesFromDrop(e.dataTransfer.items);
  const files = entryFiles.length ? entryFiles : [...e.dataTransfer.files];
  addFiles(files);
});

applyPreset(recommendedPreset);
resetState();
