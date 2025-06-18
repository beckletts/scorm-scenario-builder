import * as XLSX from 'xlsx';
import * as pdfParse from 'pdf-parse';

export async function parseFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'xlsx':
    case 'xls':
      return parseExcel(file);
    case 'csv':
      return parseCSV(file);
    case 'pdf':
      return parsePDF(file);
    default:
      throw new Error('Unsupported file type');
  }
}

async function parseExcel(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  return normalizeData(data);
}

async function parseCSV(file: File) {
  const text = await file.text();
  const workbook = XLSX.read(text, { type: 'string' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  return normalizeData(data);
}

async function parsePDF(file: File) {
  const buffer = await file.arrayBuffer();
  const data = await pdfParse(buffer);
  
  // Split PDF content into sections based on headers or formatting
  const sections = data.text.split(/\n{2,}/);
  
  return sections.map(section => ({
    content: section.trim(),
    type: 'text'
  })).filter(item => item.content.length > 0);
}

function normalizeData(data: any[]) {
  return data.map(row => {
    const normalized: any = {};
    
    // Convert all keys to lowercase for consistency
    Object.keys(row).forEach(key => {
      const lowerKey = key.toLowerCase().trim();
      
      // Map common column names to standardized keys
      switch (lowerKey) {
        case 'question':
        case 'query':
        case 'inquiry':
          normalized.question = row[key];
          break;
        case 'answer':
        case 'response':
        case 'solution':
          normalized.answer = row[key];
          break;
        case 'category':
        case 'type':
        case 'topic':
          normalized.category = row[key];
          break;
        default:
          normalized[lowerKey] = row[key];
      }
    });
    
    return normalized;
  });
} 