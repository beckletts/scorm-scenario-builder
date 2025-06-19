import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

// Reuse your scenario-to-SCORM logic
import { generateScormFiles } from '../generate/route';

const API_KEY = process.env.AUTOMATION_API_KEY;

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || apiKey !== API_KEY) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const json = await request.json();
    let data: any[] = [];
    if (json && Array.isArray(json.scenarios)) {
      data = json.scenarios;
    } else {
      return NextResponse.json({ error: 'Invalid payload: scenarios array required' }, { status: 400 });
    }
    // Normalize and generate SCORM
    // (reuse normalizeData and generateScormFiles from your main route)
    const { normalizeData } = await import('../generate/route');
    data = normalizeData(data);
    const scormFiles = generateScormFiles(data);
    const zip = new JSZip();
    Object.entries(scormFiles).forEach(([path, content]) => {
      zip.file(path, content);
    });
    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
    return new NextResponse(zipContent, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=scenario.zip'
      }
    });
  } catch (error) {
    console.error('Error processing automation request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 