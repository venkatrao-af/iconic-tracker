import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = 600; // Cache for 10 minutes

interface BootstrapResponse {
  phases: any[];
  resources: any[];
  heatmap: any[];
  tasks: any[];
  projects: any[];
  critical_path: any[];
  milestones: any[];
  metadata: {
    last_sync: string;
  };
}

export async function GET() {
  try {
    const appsScriptUrl = process.env.ICONIC_APPS_SCRIPT_URL;
    const apiToken = process.env.ICONIC_API_TOKEN;

    if (!appsScriptUrl) {
      return NextResponse.json(
        { error: 'ICONIC_APPS_SCRIPT_URL not configured' },
        { status: 500 }
      );
    }

    // Fetch from Google Apps Script endpoint
    const response = await fetch(`${appsScriptUrl}?token=${apiToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 600 }, // Next.js caching
    });

    if (!response.ok) {
      throw new Error(`Apps Script returned ${response.status}`);
    }

    const data: BootstrapResponse = await response.json();

    // Add server timestamp
    const enrichedData = {
      ...data,
      metadata: {
        ...data.metadata,
        server_fetch_time: new Date().toISOString(),
      },
    };

    return NextResponse.json(enrichedData, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    console.error('Bootstrap API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
