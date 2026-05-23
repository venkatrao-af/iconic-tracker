import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { message, data } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Portfolio Assistant. ${data.tasks.length} tasks, ${data.tasks.filter((t: any) => t.Derail_Days > 0).length} delayed. Question: ${message}. Answer in 2-3 sentences with specific numbers.`;

    const result = await model.generateContent(prompt);
    return NextResponse.json({ response: result.response.text() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
