import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createScormPackage } from '../../../utils/scorm';

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

function generateScormFiles(data: any[], settings?: any) {
  // Use the updated SCORM 2004 package generator
  return createScormPackage(data, settings);
}

function isStorylaneUrl(url: string) {
  return url.includes('storylane.io/share/');
}

function isVideoUrl(url: string) {
  return /youtube\.com|youtu\.be|vimeo\.com/.test(url);
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
h1 { color: #005C9E; text-align: center; }
.close-btn { background: #005C9E; color: #fff; border: none; border-radius: 4px; padding: 1rem 2rem; font-size: 1.2rem; cursor: pointer; transition: background 0.2s; }
.close-btn:hover { background: #4A3C8C; }
iframe { margin-top: 1rem; }
`
  };
}

function generateVideoScormFiles({ videoUrl, videoFilename }: { videoUrl?: string; videoFilename?: string }) {
  let videoEmbed = '';
  if (videoUrl) {
    if (/youtube\.com|youtu\.be/.test(videoUrl)) {
      // YouTube embed
      const videoId = videoUrl.match(/(?:youtube\.com.*[?&]v=|youtu\.be\/)([\w-]+)/)?.[1];
      if (videoId) {
        videoEmbed = `<iframe width="100%" height="480" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
      }
    } else if (/vimeo\.com/.test(videoUrl)) {
      // Vimeo embed
      const videoId = videoUrl.match(/vimeo\.com\/(\d+)/)?.[1];
      if (videoId) {
        videoEmbed = `<iframe src="https://player.vimeo.com/video/${videoId}" width="100%" height="480" frameborder="0" allowfullscreen></iframe>`;
      }
    }
  } else if (videoFilename) {
    // Local video file
    videoEmbed = `<video width="100%" height="480" controls><source src="${videoFilename}" type="video/mp4">Your browser does not support the video tag.</video>`;
  }
  return {
    'imsmanifest.xml': `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="com.pearson.video" version="1.0"
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
      <title>Pearson Video Module</title>
      <item identifier="item_1" identifierref="resource_1">
        <title>Pearson Video Module</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="resource_1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <file href="scorm.js"/>
      <file href="styles.css"/>
      ${videoFilename ? `<file href="${videoFilename}"/>` : ''}
    </resource>
  </resources>
</manifest>`,
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pearson Video Module</title>
  <link rel="stylesheet" href="styles.css">
  <script src="scorm.js"></script>
</head>
<body>
  <div class="container">
    <header>
      <h1>Pearson Video Module</h1>
    </header>
    <main>
      ${videoEmbed}
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
h1 { color: #005C9E; text-align: center; }
.close-btn { background: #005C9E; color: #fff; border: none; border-radius: 4px; padding: 1rem 2rem; font-size: 1.2rem; cursor: pointer; transition: background 0.2s; }
.close-btn:hover { background: #4A3C8C; }
iframe, video { margin-top: 1rem; }
`
  };
}

function injectScormIntoHtml(html: string): string {
  // Add a Close button and SCORM completion script if not present
  let injected = html;
  // Add close button before </body>
  if (!/id=["']close-btn["']/.test(html)) {
    injected = injected.replace(
      /<\/body>/i,
      `<div style="text-align:center; margin-top:2rem;"><button id="close-btn" class="close-btn" onclick="completeAndClose()">Close</button></div></body>`
    );
  }
  // Add SCORM script before </body>
  if (!/function completeAndClose\(\)/.test(html)) {
    injected = injected.replace(
      /<\/body>/i,
      `<script>
function completeAndClose() {
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
  if (window.parent && window.parent.API && window.parent.API.LMSSetValue) {
    window.parent.API.LMSSetValue('cmi.core.lesson_status', 'incomplete');
  }
};
</script></body>`
    );
  }
  // Add minimal CSS for the button if not present
  if (!/\.close-btn/.test(html)) {
    injected = injected.replace(
      /<\/head>/i,
      `<style>.close-btn { background: #005C9E; color: #fff; border: none; border-radius: 4px; padding: 1rem 2rem; font-size: 1.2rem; cursor: pointer; transition: background 0.2s; } .close-btn:hover { background: #4A3C8C; }</style></head>`
    );
  }
  return injected;
}

function generateHtmlScormFiles(htmlContent: string) {
  return {
    'imsmanifest.xml': `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="com.pearson.html" version="1.0"
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
      <title>Pearson HTML Module</title>
      <item identifier="item_1" identifierref="resource_1">
        <title>Pearson HTML Module</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="resource_1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
    </resource>
  </resources>
</manifest>`,
    'index.html': htmlContent
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
    const url = formData.get('url') as string | null;
    const scenariosJson = formData.get('scenarios') as string | null;
    const videoUrl = formData.get('videoUrl') as string | null;
    const videoFile = formData.get('videoFile') as File | null;
    const htmlFile = formData.get('htmlFile') as File | null;
    const scormSettingsRaw = formData.get('scormSettings') as string | null;
    let scormSettings = undefined;
    if (scormSettingsRaw) {
      try {
        scormSettings = JSON.parse(scormSettingsRaw);
      } catch {}
    }

    // HTML file upload
    if (htmlFile && htmlFile.size > 0) {
      const htmlText = await htmlFile.text();
      const injectedHtml = injectScormIntoHtml(htmlText);
      const scormFiles = generateHtmlScormFiles(injectedHtml);
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
    }

    // Storylane
    if (url && isStorylaneUrl(url)) {
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
    }

    // Video URL
    if (videoUrl && isVideoUrl(videoUrl)) {
      const scormFiles = generateVideoScormFiles({ videoUrl });
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
    }

    // Video File
    if (videoFile && videoFile.size > 0) {
      const scormFiles = generateVideoScormFiles({ videoFilename: videoFile.name });
      const zip = new JSZip();
      Object.entries(scormFiles).forEach(([path, content]) => {
        zip.file(path, content);
      });
      // Add the video file itself
      zip.file(videoFile.name, await videoFile.arrayBuffer());
      const zipContent = await zip.generateAsync({ type: 'blob' });
      return new NextResponse(zipContent, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename=scenario.zip'
        }
      });
    }

    // Knowledge base article (fallback)
    let data: any[] = [];
    if (scenariosJson) {
      console.log('Received scenariosJson:', scenariosJson);
      try {
        data = JSON.parse(scenariosJson);
        console.log('Parsed scenarios data:', data);
      } catch (e) {
        return NextResponse.json({ error: 'Invalid scenarios JSON.' }, { status: 400 });
      }
      if (!Array.isArray(data) || data.length === 0) {
        return NextResponse.json({ error: 'No valid scenarios found. Please check your input.' }, { status: 400 });
      }
    } else if (url) {
      data = await extractContentFromUrl(url);
    }
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No valid content found to create scenarios' }, { status: 400 });
    }
    data = normalizeData(data);
    const scormFiles = generateScormFiles(data, scormSettings);
    // Log the generated files and a sample of their contents
    console.log('Generated SCORM files:', Object.keys(scormFiles));
    Object.entries(scormFiles).forEach(([path, content]) => {
      console.log(`File: ${path}, Content sample:`, typeof content === 'string' ? content.slice(0, 200) : '[binary]');
    });
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

export { generateScormFiles, normalizeData }; 