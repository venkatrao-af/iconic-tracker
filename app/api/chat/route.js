import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, bootstrapData } = await req.json();

    const result = await streamText({
      model: google('gemini-2.0-flash-exp'),
      messages,
      system: `You are an expert construction project management AI assistant for Iconic Project Tracker at Acres Foundation.

You have access to live project data across 5 projects: AVANTA (Chembur School Extension - 52% complete), RAYA (Raya Terraces - 0%), PAWNA (Pawna Retreat - 0%), CHEMBUR (School Extension - 0%), and MULUND (6th Floor - 0%).

Current data snapshot:
- Total tasks: ${bootstrapData.tasks?.length || 0}
- Critical path tasks: ${bootstrapData.critical_path?.length || 0}
- Active resources: ${bootstrapData.resources?.length || 0}
- Projects: ${bootstrapData.projects?.map((p: any) => p.Project_Short).join(', ')}

When analyzing data:
1. Be specific with numbers (e.g., "56 at-risk tasks" not "many tasks")
2. Identify bottlenecks (e.g., "Ajay at 73% utilization - consider reassigning 2 tasks to Vipin")
3. Prioritize critical path tasks and health status
4. Provide actionable recommendations

Use the filterDashboard tool to help users focus on specific projects or task types.`,
      tools: {
        filterDashboard: tool({
          description: 'Filter the dashboard to show specific projects, phases, or task types. Use this when user asks to "show", "filter", "focus on" specific data.',
          parameters: z.object({
            project: z.string().optional().describe('Project short code: AVANTA, RAYA, PAWNA, CHEMBUR, or MULUND'),
            reason: z.string().describe('Why you are applying this filter'),
          }),
          execute: async ({ project, reason }) => {
            return { success: true, project, reason };
          },
        }),
        
        analyzeRisk: tool({
          description: 'Analyze risk factors for a specific phase or project. Use when user asks about risks, delays, or problems.',
          parameters: z.object({
            target: z.string().describe('What to analyze (project name, phase name, or "portfolio")'),
            focusArea: z.enum(['schedule', 'resources', 'critical_path', 'overall']).describe('What aspect to focus on'),
          }),
          execute: async ({ target, focusArea }) => {
            const phases = bootstrapData.phases || [];
            const tasks = bootstrapData.tasks || [];
            const resources = bootstrapData.resources || [];
            
            let analysis = {
              target,
              focusArea,
              findings: [] as string[],
              recommendations: [] as string[],
            };

            if (focusArea === 'resources') {
              const highUtilization = resources.filter((r: any) => r.Utilization_Pct > 70);
              analysis.findings.push(`${highUtilization.length} resources above 70% utilization`);
              if (highUtilization.length > 0) {
                analysis.recommendations.push(`Consider redistributing work from: ${highUtilization.map((r: any) => r.Owner_Name).join(', ')}`);
              }
            }

            if (focusArea === 'critical_path') {
              const criticalTasks = bootstrapData.critical_path || [];
              const delayed = criticalTasks.filter((t: any) => t.Derail_Days > 0);
              analysis.findings.push(`${delayed.length} critical path tasks are delayed`);
              if (delayed.length > 0) {
                analysis.recommendations.push('Expedite these critical tasks to avoid cascading delays');
              }
            }

            return analysis;
          },
        }),
      },
      temperature: 0.7,
      maxTokens: 2000,
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
