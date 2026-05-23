import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { message, data, history } = await request.json();
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const context = `You are an AI assistant for Acres Foundation's construction portfolio management system. You have access to real-time project data.

Current Portfolio Status:
- Total Tasks: ${data.tasks.length}
- Completed: ${data.tasks.filter((t: any) => t.Pct_Complete === 100).length} (${((data.tasks.filter((t: any) => t.Pct_Complete === 100).length / data.tasks.length) * 100).toFixed(1)}%)
- In Progress: ${data.tasks.filter((t: any) => t.Pct_Complete > 0 && t.Pct_Complete < 100).length}
- Not Started: ${data.tasks.filter((t: any) => t.Pct_Complete === 0).length}
- Delayed: ${data.tasks.filter((t: any) => t.Derail_Days > 0).length}
- Critical Path Tasks: ${data.tasks.filter((t: any) => t.Is_Critical === 'Yes').length}

Active Projects:
${data.projects.filter((p: any) => p.Task_Count > 0).map((p: any) => 
  \`- \${p.Short || p.Project}: \${p.Task_Count} tasks, \${p.Pct_Complete}% complete\`
).join('\\n')}

Top Delayed Tasks:
${data.tasks
  .filter((t: any) => t.Derail_Days > 0)
  .sort((a: any, b: any) => b.Derail_Days - a.Derail_Days)
  .slice(0, 5)
  .map((t: any) => \`- \${t.Task_Name} (\${t.Project}): \${t.Derail_Days} days behind, Owner: \${t.Owners || 'Unassigned'}\`)
  .join('\\n')}

Instructions:
- Be specific with numbers and project names
- Provide actionable insights
- Reference actual tasks and delays from the data
- Keep responses concise (2-4 sentences)
- Use professional construction management terminology
- When asked about risks, prioritize by derail days and critical path
- When asked for recommendations, be specific about which tasks/projects

User Question: ${message}`;

    const result = await model.generateContent(context);
    const response = result.response.text();

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
