import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are an expert construction project analyst for Acres Foundation. Analyze this portfolio data and provide 3-5 critical insights.

Portfolio Data:
- Total Tasks: ${data.tasks.length}
- Completed: ${data.tasks.filter((t: any) => t.Pct_Complete === 100).length}
- Delayed: ${data.tasks.filter((t: any) => t.Derail_Days > 0).length}
- Critical Path: ${data.tasks.filter((t: any) => t.Is_Critical === 'Yes').length}

Projects:
${data.projects.map((p: any) => `- ${p.Short}: ${p.Task_Count} tasks, ${p.Pct_Complete}% complete`).join('\\n')}

Top Delays:
${data.tasks
  .filter((t: any) => t.Derail_Days > 0)
  .sort((a: any, b: any) => b.Derail_Days - a.Derail_Days)
  .slice(0, 10)
  .map((t: any) => `- ${t.Task_Name} (${t.Project}): ${t.Derail_Days} days behind`)
  .join('\\n')}

Provide insights in JSON format:
[
  {
    "type": "summary" | "risk" | "recommendation",
    "title": "Brief title",
    "content": "2-3 sentences with specific numbers",
    "priority": "high" | "medium" | "low"
  }
]

Focus on:
1. Critical risks requiring immediate attention
2. Resource bottlenecks
3. Actionable recommendations with specific tasks/projects
4. Patterns across projects

Return ONLY valid JSON array, no markdown.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Clean response and parse JSON
    let insights;
    try {
      const cleaned = response.replace(/\`\`\`json\\n?/g, '').replace(/\`\`\`\\n?/g, '').trim();
      insights = JSON.parse(cleaned);
    } catch (e) {
      // If parsing fails, create a default insight
      insights = [{
        type: 'summary',
        title: 'Portfolio Analysis',
        content: response.substring(0, 200),
        priority: 'medium'
      }];
    }

    return NextResponse.json(insights);
  } catch (error: any) {
    console.error('Gemini insights error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
