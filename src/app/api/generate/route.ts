import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import axios from 'axios';
import * as cheerio from 'cheerio';

async function parseExcel(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(worksheet);
}

async function parseCSV(text: string) {
  const workbook = XLSX.read(text, { type: 'string' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(worksheet);
}

async function parsePDF(buffer: ArrayBuffer) {
  // For now, return a simple object since we need to handle PDF parsing differently
  return [{
    question: "PDF parsing will be implemented soon",
    answer: "This is a placeholder for PDF content"
  }];
}

function normalizeData(data: any[]) {
  return data.map(row => {
    const normalized: any = {};
    Object.keys(row).forEach(key => {
      const lowerKey = key.toLowerCase().trim();
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

function generateScormFiles(data: any[]) {
  const scenarios = data.map((item, index) => {
    if (item.question && item.answer) {
      return `
        <div class="scenario" data-index="${index}" style="display: none;">
          <div class="scenario-content">
            <h2>Scenario ${index + 1}</h2>
            <div class="question-section">
              <h3>Customer Query:</h3>
              <p>${item.question}</p>
            </div>
            <div class="response-section">
              <textarea class="response-input" placeholder="Enter your response..."></textarea>
              <button class="submit-btn" onclick="submitResponse(${index})">Submit Response</button>
            </div>
            <div class="feedback-section" style="display: none;">
              <h3>Model Response:</h3>
              <p>${item.answer}</p>
              <div class="self-assessment">
                <h4>Self-Assessment:</h4>
                <div class="rating-buttons">
                  <button onclick="rateResponse(${index}, 1)">Needs Improvement</button>
                  <button onclick="rateResponse(${index}, 2)">Good</button>
                  <button onclick="rateResponse(${index}, 3)">Excellent</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    return '';
  }).join('');

  const files: Record<string, string> = {
    'imsmanifest.xml': `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="com.pearson.scenario" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="default_org">
    <organization identifier="default_org">
      <title>Customer Service Training Scenario</title>
      <item identifier="item_1" identifierref="resource_1">
        <title>Customer Service Training Scenario</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="resource_1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <file href="scorm.js"/>
      <file href="styles.css"/>
    </resource>
  </resources>
</manifest>`,
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Customer Service Training Scenario</title>
  <link rel="stylesheet" href="styles.css">
  <script src="scorm.js"></script>
</head>
<body>
  <div class="container">
    <header>
      <img src="https://www.pearson.com/content/dam/one-dot-com/one-dot-com/global/Images/logos/Pearson_Logo_Primary_Blk_RGB.svg" alt="Pearson Logo" class="logo">
      <h1>Customer Service Training</h1>
    </header>
    
    <main>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
      
      ${scenarios}
      
      <div class="navigation-buttons">
        <button id="prev-btn" onclick="previousScenario()" disabled>Previous</button>
        <button id="next-btn" onclick="nextScenario()">Next</button>
      </div>
    </main>
  </div>
</body>
</html>`,
    'scorm.js': `let currentScenario = 0;
let totalScenarios = 0;
let responses = [];

window.onload = function() {
  totalScenarios = document.querySelectorAll('.scenario').length;
  showScenario(0);
  updateProgress();
};

function showScenario(index) {
  document.querySelectorAll('.scenario').forEach(scenario => {
    scenario.style.display = 'none';
  });
  
  const scenario = document.querySelector(\`.scenario[data-index="\${index}"]\`);
  if (scenario) {
    scenario.style.display = 'block';
  }
  
  document.getElementById('prev-btn').disabled = index === 0;
  document.getElementById('next-btn').disabled = index === totalScenarios - 1;
  
  updateProgress();
}

function previousScenario() {
  if (currentScenario > 0) {
    currentScenario--;
    showScenario(currentScenario);
  }
}

function nextScenario() {
  if (currentScenario < totalScenarios - 1) {
    currentScenario++;
    showScenario(currentScenario);
  }
}

function submitResponse(index) {
  const scenario = document.querySelector(\`.scenario[data-index="\${index}"]\`);
  const response = scenario.querySelector('.response-input').value;
  responses[index] = response;
  scenario.querySelector('.feedback-section').style.display = 'block';
}

function rateResponse(index, rating) {
  responses[index] = { ...responses[index], rating };
  document.getElementById('next-btn').disabled = false;
}

function updateProgress() {
  const progress = ((currentScenario + 1) / totalScenarios) * 100;
  document.querySelector('.progress-fill').style.width = \`\${progress}%\`;
}`,
    'styles.css': `
:root {
  --pearson-purple: #005C9E;
  --pearson-light-purple: #8A7AB5;
  --pearson-amethyst: #4A3C8C;
  --pearson-white: #FFFFFF;
  --pearson-gray: #666666;
  --pearson-light-gray: #F8F9FA;
}

body {
  font-family: "Plus Jakarta Sans", Arial, sans-serif;
  line-height: 1.5;
  margin: 0;
  padding: 0;
  background-color: var(--pearson-light-gray);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  max-width: 200px;
  margin-bottom: 1rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--pearson-light-gray);
  border-radius: 4px;
  margin-bottom: 2rem;
}

.progress-fill {
  height: 100%;
  background-color: var(--pearson-purple);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.scenario {
  background-color: var(--pearson-white);
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.response-input {
  width: 100%;
  min-height: 150px;
  padding: 1rem;
  border: 2px solid var(--pearson-light-purple);
  border-radius: 4px;
  margin-bottom: 1rem;
  font-family: inherit;
}

button {
  background-color: var(--pearson-purple);
  color: var(--pearson-white);
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: var(--pearson-amethyst);
}

button:disabled {
  background-color: var(--pearson-gray);
  cursor: not-allowed;
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
}

.rating-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  .rating-buttons {
    flex-direction: column;
  }
  
  .rating-buttons button {
    width: 100%;
    margin-bottom: 0.5rem;
  }
}`
  };

  return files;
}

function isStorylaneUrl(url: string) {
  return url.includes('storylane.io/share/');
}

function generateStorylaneScormFiles(storylaneUrl: string) {
  return {
    'imsmanifest.xml': `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="com.pearson.storylane" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="default_org">
    <organization identifier="default_org">
      <title>Pearson Storylane Experience</title>
      <item identifier="item_1" identifierref="resource_1">
        <title>Pearson Storylane Experience</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="resource_1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <file href="scorm.js"/>
      <file href="styles.css"/>
    </resource>
  </resources>
</manifest>`,
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pearson Storylane Experience</title>
  <link rel="stylesheet" href="styles.css">
  <script src="scorm.js"></script>
</head>
<body>
  <div class="container">
    <header>
      <img src="https://www.pearson.com/content/dam/one-dot-com/one-dot-com/global/Images/logos/Pearson_Logo_Primary_Blk_RGB.svg" alt="Pearson Logo" class="logo">
      <h1>Pearson Storylane Experience</h1>
    </header>
    <main>
      <iframe src="${storylaneUrl}" width="100%" height="600" style="border:1px solid #ccc; border-radius:8px;" allowfullscreen></iframe>
      <div style="text-align:center; margin-top:2rem;">
        <button id="close-btn" class="close-btn" onclick="completeAndClose()">Close</button>
      </div>
    </main>
  </div>
</body>
</html>`,
    'scorm.js': `function completeAndClose() {
  if (window.parent && window.parent.API) {
    var scorm = window.parent.API;
    if (scorm.LMSSetValue) {
      scorm.LMSSetValue('cmi.core.lesson_status', 'completed');
      scorm.LMSCommit('');
      scorm.LMSFinish('');
    }
  }
  window.close();
}
window.onload = function() {
  // Optionally, mark as started
  if (window.parent && window.parent.API && window.parent.API.LMSSetValue) {
    window.parent.API.LMSSetValue('cmi.core.lesson_status', 'incomplete');
  }
};`,
    'styles.css': `
body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; background: #f8f9fa; margin: 0; }
.container { max-width: 900px; margin: 2rem auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 2rem; }
.logo { max-width: 200px; display: block; margin: 0 auto 1rem auto; }
h1 { color: #005C9E; text-align: center; }
.close-btn { background: #005C9E; color: #fff; border: none; border-radius: 4px; padding: 1rem 2rem; font-size: 1.2rem; cursor: pointer; transition: background 0.2s; }
.close-btn:hover { background: #4A3C8C; }
iframe { margin-top: 1rem; }
`
  };
}

async function extractContentFromUrl(url: string) {
  try {
    console.log('Fetching content from URL:', url);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Try different common article selectors
    const selectors = [
      'article',
      '.article',
      '.content',
      '.main-content',
      'main',
      '#content',
      '.post-content'
    ];

    let content = '';
    let title = '';

    // Try to find the title
    const possibleTitles = [
      $('h1').first().text(),
      $('title').text(),
      $('.article-title').text(),
      $('.title').text()
    ].filter(t => t.trim().length > 0);

    title = possibleTitles[0] || 'Knowledge Base Article';

    // Try each selector until we find content
    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        if (content.length > 0) break;
      }
    }

    // If no content found through selectors, try getting main text content
    if (!content) {
      content = $('body')
        .clone()
        .children('header, nav, footer, script, style')
        .remove()
        .end()
        .text()
        .trim();
    }

    // Clean up the content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();

    console.log('Extracted title:', title);
    console.log('Content length:', content.length);

    if (!content) {
      throw new Error('No content could be extracted from the URL');
    }

    // Split content into multiple scenarios if it's too long
    const scenarios = [];
    const maxLength = 1000; // Maximum length for each scenario
    
    if (content.length > maxLength) {
      // Split by paragraphs or sentences
      const paragraphs = content.split(/\n\n|\.\s+/);
      let currentScenario = '';
      
      for (const paragraph of paragraphs) {
        if ((currentScenario + paragraph).length > maxLength) {
          if (currentScenario) {
            scenarios.push({
              question: title,
              answer: currentScenario.trim(),
              type: 'knowledge_base'
            });
          }
          currentScenario = paragraph;
        } else {
          currentScenario += ' ' + paragraph;
        }
      }
      
      if (currentScenario) {
        scenarios.push({
          question: title,
          answer: currentScenario.trim(),
          type: 'knowledge_base'
        });
      }
    } else {
      scenarios.push({
        question: title,
        answer: content,
        type: 'knowledge_base'
      });
    }

    console.log('Generated scenarios:', scenarios.length);
    return scenarios;
  } catch (error) {
    console.error('Error extracting content from URL:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to extract content from URL: ${errorMessage}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const url = formData.get('url') as string | null;
    const scenariosJson = formData.get('scenarios') as string | null;

    let data: any[] = [];

    if (scenariosJson) {
      data = JSON.parse(scenariosJson);
    } else if (file) {
      const buffer = await file.arrayBuffer();
      const extension = file.name.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'xlsx':
        case 'xls':
          data = await parseExcel(buffer);
          break;
        case 'csv':
          const text = await file.text();
          data = await parseCSV(text);
          break;
        case 'pdf':
          data = await parsePDF(buffer);
          break;
        default:
          throw new Error('Unsupported file type');
      }
    } else if (url) {
      if (isStorylaneUrl(url)) {
        // Generate special SCORM package for Storylane
        const scormFiles = generateStorylaneScormFiles(url);
        const zip = new JSZip();
        Object.entries(scormFiles).forEach(([path, content]) => {
          zip.file(path, content);
        });
        const zipContent = await zip.generateAsync({ type: 'blob' });
        return new NextResponse(zipContent, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename=scenario.zip'
          }
        });
      } else {
        data = await extractContentFromUrl(url);
      }
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No valid content found to create scenarios' }, { status: 400 });
    }

    console.log('Processing scenarios:', data.length);
    data = normalizeData(data);
    const scormFiles = generateScormFiles(data);
    
    const zip = new JSZip();
    
    Object.entries(scormFiles).forEach(([path, content]) => {
      zip.file(path, content);
    });

    const zipContent = await zip.generateAsync({ type: 'blob' });

    return new NextResponse(zipContent, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=scenario.zip'
      }
    });

  } catch (error) {
    console.error('Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 