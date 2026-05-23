import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Chairman's Portfolio Analysis (MECE + Pareto):

Data: ${data.tasks.length} tasks, ${data.tasks.filter((t: any) => t.Derail_Days > 0).length} delayed

Top Delays: ${data.tasks.filter((t: any) => t.Derail_Days > 0).sort((a: any, b: any) => b.Derail_Days - a.Derail_Days).slice(0, 5).map((t: any) => t.Task_Name).join(', ')}

Return JSON: {"status": "Red|Amber|Green", "headline": "one sentence", "actions": ["action1", "action2"]}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/\`\`\`json|```/g, '').trim();
    
    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      return NextResponse.json({ status: "Amber", headline: "Analysis in progress", actions: [] });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
