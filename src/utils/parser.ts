import * as XLSX from 'xlsx';
import pdfParse from 'pdf-parse';

export async function parseFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'xlsx':
    case 'xls':
      return parseExcel(await file.arrayBuffer());
    case 'csv':
      return parseCSV(await file.text());
    case 'pdf':
      return parsePDF(await file.arrayBuffer());
    default:
      throw new Error('Unsupported file type');
  }
}

export async function parseExcel(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer);
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(firstSheet);
  
  return data.map((row: any) => ({
    question: row.Question || row.question || '',
    answer: row.Answer || row.answer || '',
    type: 'customer_service'
  })).filter(item => item.question && item.answer);
}

export async function parseCSV(text: string) {
  const rows = text.split('\n').map(row => row.split(','));
  const headers = rows[0].map(header => header.trim().toLowerCase());
  const questionIndex = headers.indexOf('question');
  const answerIndex = headers.indexOf('answer');
  
  if (questionIndex === -1 || answerIndex === -1) {
    throw new Error('CSV must have "question" and "answer" columns');
  }
  
  return rows.slice(1)
    .map(row => ({
      question: row[questionIndex]?.trim() || '',
      answer: row[answerIndex]?.trim() || '',
      type: 'customer_service'
    }))
    .filter(item => item.question && item.answer);
}

export async function parsePDF(buffer: ArrayBuffer) {
  try {
    const data = await pdfParse(buffer);
    const paragraphs = data.text.split('\n\n').filter(p => p.trim());
    
    const scenarios = [];
    for (let i = 0; i < paragraphs.length - 1; i += 2) {
      const question = paragraphs[i]?.trim();
      const answer = paragraphs[i + 1]?.trim();
      
      if (question && answer) {
        scenarios.push({
          question,
          answer,
          type: 'customer_service'
        });
      }
    }
    
    return scenarios;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
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