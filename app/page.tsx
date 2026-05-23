'use client';

import { useEffect, useState } from 'react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Task {
  Task_UID: number;
  Project: string;
  Task_Name: string;
  Status: string;
  Derail_Days: number;
  Is_Critical: string;
  Pct_Complete: number;
  Phase: string;
  Owners: string;
  Planned_Start: string;
  Planned_Finish: string;
  Duration_Days: number;
}

interface Project {
  Project: string;
  Short: string;
  Color: string;
  Task_Count: number;
  Pct_Complete: number;
}

interface AIInsight {
  type: 'summary' | 'risk' | 'recommendation';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
}

interface ProjectData {
  timestamp: string;
  version: string;
  tasks: Task[];
  projects: Project[];
}

type ViewMode = 'dashboard' | 'gantt' | 'calendar' | 'list';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Home() {
  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<ViewMode>('dashboard');
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [showAI, setShowAI] = useState(true);
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const url = process.env.NEXT_PUBLIC_DRIVE_JSON_URL;
    
    if (!url) {
      setError('Environment variable NEXT_PUBLIC_DRIVE_JSON_URL not configured');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(url);
      const json = await response.json();
      setData(json);
      setLoading(false);
      
      // Load AI insights
      loadAIInsights(json);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function loadAIInsights(portfolioData: ProjectData) {
    try {
      const response = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: portfolioData })
      });
      
      if (response.ok) {
        const insights = await response.json();
        setAiInsights(insights);
      }
    } catch (err) {
      console.error('AI insights error:', err);
    }
  }

  async function sendChatMessage() {
    if (!chatInput.trim() || !data) return;
    
    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);
    
    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          data: data,
          history: chatMessages
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setChatMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setChatLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0A0A0F', color: '#F0F0F5' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '15px' }}>⏳</div>
          <div style={{ fontSize: '18px' }}>Loading Portfolio Intelligence...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0A0A0F' }}>
        <div style={{ backgroundColor: '#13131A', padding: '40px', borderRadius: '12px', maxWidth: '500px', border: '1px solid #EF4444' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px', textAlign: 'center' }}>❌</div>
          <h2 style={{ margin: '0 0 10px 0', color: '#EF4444', textAlign: 'center' }}>Failed to Load Data</h2>
          <p style={{ color: '#9CA3AF', marginBottom: '20px', textAlign: 'center' }}>{error}</p>
          <button 
            onClick={loadData}
            style={{ backgroundColor: '#14A085', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', width: '100%' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0F', color: '#F0F0F5' }}>
      {/* Header */}
      <Header />
      
      {/* Navigation */}
      <Navigation view={view} setView={setView} />
      
      {/* Main Content Area */}
      <div style={{ display: 'flex', maxWidth: '1920px', margin: '0 auto' }}>
        {/* Main View */}
        <div style={{ flex: showAI ? '1 1 70%' : '1 1 100%', padding: '30px', transition: 'flex 0.3s' }}>
          {view === 'dashboard' && <DashboardView data={data!} />}
          {view === 'gantt' && <GanttView data={data!} />}
          {view === 'calendar' && <CalendarView data={data!} />}
          {view === 'list' && <ListView data={data!} />}
        </div>
        
        {/* AI Insights Sidebar */}
        {showAI && (
          <div style={{ flex: '0 0 400px', backgroundColor: '#13131A', borderLeft: '1px solid #1F2937', padding: '30px', overflowY: 'auto', height: 'calc(100vh - 130px)' }}>
            <AIPanel insights={aiInsights} chatMessages={chatMessages} chatInput={chatInput} setChatInput={setChatInput} sendChatMessage={sendChatMessage} chatLoading={chatLoading} />
          </div>
        )}
      </div>
      
      {/* AI Toggle Button */}
      <button
        onClick={() => setShowAI(!showAI)}
        style={{ position: 'fixed', right: showAI ? '420px' : '20px', top: '120px', backgroundColor: '#14A085', color: 'white', border: 'none', padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', zIndex: 1000, transition: 'right 0.3s' }}
      >
        🤖 AI {showAI ? '→' : '←'}
      </button>
    </div>
  );
}

// ============================================================================
// HEADER COMPONENT
// ============================================================================

function Header() {
  return (
    <div style={{ backgroundColor: '#13131A', borderBottom: '2px solid #14A085', padding: '20px 0' }}>
      <div style={{ maxWidth: '1920px', margin: '0 auto', padding: '0 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>🏗️ Iconic Project Intelligence</h1>
          <p style={{ margin: '5px 0 0 0', color: '#9CA3AF', fontSize: '14px' }}>Acres Foundation · AI-Powered Construction Management</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>Phase 3 · Gemini-Powered</div>
          <div style={{ fontSize: '14px', color: '#14A085', fontWeight: 'bold' }}>v3.0</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// NAVIGATION COMPONENT
// ============================================================================

function Navigation({ view, setView }: { view: ViewMode, setView: (v: ViewMode) => void }) {
  const tabs = [
    { id: 'dashboard' as ViewMode, label: '📊 Dashboard', icon: '📊' },
    { id: 'gantt' as ViewMode, label: '📅 Gantt', icon: '📅' },
    { id: 'calendar' as ViewMode, label: '🗓️ Calendar', icon: '🗓️' },
    { id: 'list' as ViewMode, label: '📝 List', icon: '📝' },
  ];

  return (
    <div style={{ backgroundColor: '#13131A', borderBottom: '1px solid #1F2937' }}>
      <div style={{ maxWidth: '1920px', margin: '0 auto', padding: '0 30px', display: 'flex', gap: '5px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            style={{
              padding: '15px 25px',
              backgroundColor: view === tab.id ? '#14A085' : 'transparent',
              color: view === tab.id ? '#FFFFFF' : '#9CA3AF',
              border: 'none',
              borderBottom: view === tab.id ? '3px solid #14A085' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: view === tab.id ? 'bold' : 'normal',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// DASHBOARD VIEW
// ============================================================================

function DashboardView({ data }: { data: ProjectData }) {
  const totalTasks = data.tasks.length;
  const completedTasks = data.tasks.filter(t => t.Pct_Complete === 100).length;
  const inProgressTasks = data.tasks.filter(t => t.Pct_Complete > 0 && t.Pct_Complete < 100).length;
  const criticalTasks = data.tasks.filter(t => t.Is_Critical === 'Yes').length;
  const delayedTasks = data.tasks.filter(t => t.Derail_Days > 0).length;
  const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0';
  const activeProjects = data.projects.filter(p => p.Task_Count > 0);
  const topRisks = data.tasks.filter(t => t.Derail_Days > 0).sort((a, b) => b.Derail_Days - a.Derail_Days).slice(0, 5);

  const getHealthStatus = () => {
    const delayRate = totalTasks > 0 ? (delayedTasks / totalTasks) * 100 : 0;
    if (delayRate < 10) return { label: 'On Track', color: '#10B981' };
    if (delayRate < 25) return { label: 'At Risk', color: '#F59E0B' };
    return { label: 'Critical', color: '#EF4444' };
  };

  const healthStatus = getHealthStatus();

  return (
    <div>
      {/* Portfolio Health Banner */}
      <div style={{ backgroundColor: '#13131A', padding: '25px 30px', borderRadius: '12px', marginBottom: '30px', border: `2px solid ${healthStatus.color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '5px' }}>PORTFOLIO STATUS</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: healthStatus.color }}>{healthStatus.label}</div>
          </div>
          <div style={{ fontSize: '18px', color: '#9CA3AF' }}>
            {delayedTasks} of {totalTasks} tasks delayed · {completionRate}% complete
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <KPICard label="Total Tasks" value={totalTasks} subtitle={`Across ${activeProjects.length} projects`} color="#14A085" />
        <KPICard label="Completed" value={completedTasks} subtitle={`${completionRate}% completion rate`} color="#10B981" />
        <KPICard label="In Progress" value={inProgressTasks} subtitle="Active work streams" color="#F59E0B" />
        <KPICard label="Critical Path" value={criticalTasks} subtitle="Tasks on critical path" color="#EF4444" />
      </div>

      {/* Project Cards */}
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Active Projects ({activeProjects.length})</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {activeProjects.map((project, idx) => <ProjectCard key={idx} project={project} tasks={data.tasks} />)}
      </div>

      {/* Top Risks */}
      {topRisks.length > 0 && (
        <>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>⚠️ Top Risks ({topRisks.length})</h2>
          <div style={{ backgroundColor: '#13131A', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1F2937' }}>
            {topRisks.map((task, idx) => <RiskCard key={idx} task={task} isLast={idx === topRisks.length - 1} />)}
          </div>
        </>
      )}
    </div>
  );
}

function KPICard({ label, value, subtitle, color }: { label: string, value: number, subtitle: string, color: string }) {
  return (
    <div style={{ backgroundColor: '#13131A', padding: '25px', borderRadius: '12px', border: '1px solid #1F2937' }}>
      <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: '36px', fontWeight: 'bold', color, marginBottom: '5px' }}>{value}</div>
      <div style={{ fontSize: '13px', color: '#9CA3AF' }}>{subtitle}</div>
    </div>
  );
}

function ProjectCard({ project, tasks }: { project: Project, tasks: Task[] }) {
  const projectTasks = tasks.filter(t => t.Project === project.Project);
  const projectDelayed = projectTasks.filter(t => t.Derail_Days > 0).length;
  const projectComplete = projectTasks.filter(t => t.Pct_Complete === 100).length;
  const projectStatus = projectDelayed === 0 ? 'On Track' : projectDelayed < 5 ? 'At Risk' : 'Critical';
  const statusColor = projectStatus === 'On Track' ? '#10B981' : projectStatus === 'At Risk' ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ backgroundColor: '#13131A', padding: '25px', borderRadius: '12px', border: '1px solid #1F2937', borderLeft: `4px solid ${project.Color || '#14A085'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', marginBottom: '5px' }}>{project.Short || project.Project}</h3>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>{project.Task_Count} tasks</div>
        </div>
        <div style={{ padding: '4px 12px', borderRadius: '6px', backgroundColor: statusColor + '20', border: `1px solid ${statusColor}`, fontSize: '12px', fontWeight: 'bold', color: statusColor }}>
          {projectStatus}
        </div>
      </div>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Progress</span>
          <span style={{ fontSize: '13px', color: '#14A085', fontWeight: 'bold' }}>{project.Pct_Complete}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: '#1F2937', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${project.Pct_Complete}%`, height: '100%', backgroundColor: '#14A085' }}></div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '13px' }}>
        <div><div style={{ color: '#6B7280' }}>Complete</div><div style={{ color: '#10B981', fontWeight: 'bold' }}>{projectComplete}</div></div>
        <div><div style={{ color: '#6B7280' }}>In Progress</div><div style={{ color: '#F59E0B', fontWeight: 'bold' }}>{projectTasks.length - projectComplete}</div></div>
        <div><div style={{ color: '#6B7280' }}>Delayed</div><div style={{ color: '#EF4444', fontWeight: 'bold' }}>{projectDelayed}</div></div>
      </div>
    </div>
  );
}

function RiskCard({ task, isLast }: { task: Task, isLast: boolean }) {
  return (
    <div style={{ padding: '20px 25px', borderBottom: isLast ? 'none' : '1px solid #1F2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '15px', marginBottom: '6px', fontWeight: '500' }}>{task.Task_Name}</div>
        <div style={{ fontSize: '13px', color: '#6B7280' }}>
          {task.Project} · {task.Phase}
          {task.Owners && <span> · Owner: {task.Owners}</span>}
        </div>
      </div>
      <div style={{ textAlign: 'right', marginLeft: '20px' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: task.Derail_Days > 30 ? '#EF4444' : task.Derail_Days > 14 ? '#F59E0B' : '#FFD700', marginBottom: '2px' }}>{task.Derail_Days}</div>
        <div style={{ fontSize: '12px', color: '#6B7280' }}>days behind</div>
      </div>
    </div>
  );
}

// ============================================================================
// GANTT VIEW (Coming in next file due to size)
// ============================================================================

function GanttView({ data }: { data: ProjectData }) {
  return (
    <div style={{ backgroundColor: '#13131A', padding: '30px', borderRadius: '12px' }}>
      <h2 style={{ marginTop: 0 }}>📅 Gantt Chart View</h2>
      <p style={{ color: '#9CA3AF' }}>Interactive timeline visualization coming in Stage 1B...</p>
      <div style={{ marginTop: '30px', padding: '40px', backgroundColor: '#1F2937', borderRadius: '8px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔨</div>
        <div style={{ fontSize: '18px', color: '#F59E0B' }}>Building Gantt Chart Component...</div>
      </div>
    </div>
  );
}

// ============================================================================
// CALENDAR VIEW
// ============================================================================

function CalendarView({ data }: { data: ProjectData }) {
  return (
    <div style={{ backgroundColor: '#13131A', padding: '30px', borderRadius: '12px' }}>
      <h2 style={{ marginTop: 0 }}>🗓️ Calendar View</h2>
      <p style={{ color: '#9CA3AF' }}>Milestone and deadline tracking coming in Stage 1B...</p>
      <div style={{ marginTop: '30px', padding: '40px', backgroundColor: '#1F2937', borderRadius: '8px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📆</div>
        <div style={{ fontSize: '18px', color: '#F59E0B' }}>Building Calendar Component...</div>
      </div>
    </div>
  );
}

// ============================================================================
// LIST VIEW
// ============================================================================

function ListView({ data }: { data: ProjectData }) {
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<keyof Task>('Derail_Days');
  
  const filteredTasks = data.tasks
    .filter(t => !filter || t.Task_Name.toLowerCase().includes(filter.toLowerCase()) || t.Project.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'Derail_Days' || sortBy === 'Pct_Complete' || sortBy === 'Duration_Days') {
        return (b[sortBy] as number) - (a[sortBy] as number);
      }
      return 0;
    });

  return (
    <div>
      <div style={{ backgroundColor: '#13131A', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search tasks..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: '100%', padding: '12px', backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F0F0F5', fontSize: '15px' }}
        />
      </div>
      
      <div style={{ backgroundColor: '#13131A', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1F2937' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#1F2937' }}>
              <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px', fontWeight: 'bold', color: '#9CA3AF' }}>Task</th>
              <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px', fontWeight: 'bold', color: '#9CA3AF' }}>Project</th>
              <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px', fontWeight: 'bold', color: '#9CA3AF' }}>Status</th>
              <th style={{ padding: '15px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', color: '#9CA3AF', cursor: 'pointer' }} onClick={() => setSortBy('Pct_Complete')}>
                Progress
              </th>
              <th style={{ padding: '15px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', color: '#9CA3AF', cursor: 'pointer' }} onClick={() => setSortBy('Derail_Days')}>
                Delay
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.slice(0, 50).map((task, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #1F2937' }}>
                <td style={{ padding: '15px', fontSize: '14px' }}>{task.Task_Name}</td>
                <td style={{ padding: '15px', fontSize: '13px', color: '#9CA3AF' }}>{task.Project}</td>
                <td style={{ padding: '15px', fontSize: '13px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: task.Status === 'Complete' ? '#10B98120' : task.Status === 'In Progress' ? '#F59E0B20' : '#6B728020', color: task.Status === 'Complete' ? '#10B981' : task.Status === 'In Progress' ? '#F59E0B' : '#6B7280' }}>
                    {task.Status}
                  </span>
                </td>
                <td style={{ padding: '15px', fontSize: '14px', textAlign: 'right', fontWeight: 'bold', color: '#14A085' }}>{task.Pct_Complete}%</td>
                <td style={{ padding: '15px', fontSize: '14px', textAlign: 'right', fontWeight: 'bold', color: task.Derail_Days > 0 ? '#EF4444' : '#10B981' }}>
                  {task.Derail_Days > 0 ? `+${task.Derail_Days}d` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredTasks.length > 50 && (
        <div style={{ marginTop: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
          Showing 50 of {filteredTasks.length} tasks
        </div>
      )}
    </div>
  );
}

// ============================================================================
// AI PANEL
// ============================================================================

function AIPanel({ insights, chatMessages, chatInput, setChatInput, sendChatMessage, chatLoading }: any) {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>🤖</span>
        <span>AI Insights</span>
      </h2>
      
      {/* AI Insights */}
      <div style={{ marginBottom: '30px' }}>
        {insights.length === 0 ? (
          <div style={{ padding: '20px', backgroundColor: '#1F2937', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔮</div>
            <div style={{ fontSize: '14px', color: '#9CA3AF' }}>Generating AI insights...</div>
          </div>
        ) : (
          insights.map((insight: AIInsight, idx: number) => (
            <div key={idx} style={{ padding: '15px', backgroundColor: '#1F2937', borderRadius: '8px', marginBottom: '10px', borderLeft: `3px solid ${insight.priority === 'high' ? '#EF4444' : insight.priority === 'medium' ? '#F59E0B' : '#10B981'}` }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>{insight.title}</div>
              <div style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: '1.5' }}>{insight.content}</div>
            </div>
          ))
        )}
      </div>
      
      {/* Chat Interface */}
      <div style={{ borderTop: '1px solid #1F2937', paddingTop: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>💬 Ask AI</h3>
        
        <div style={{ backgroundColor: '#1F2937', borderRadius: '8px', padding: '15px', maxHeight: '300px', overflowY: 'auto', marginBottom: '15px' }}>
          {chatMessages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
              Ask me anything about your portfolio...
            </div>
          ) : (
            chatMessages.map((msg: any, idx: number) => (
              <div key={idx} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px' }}>
                  {msg.role === 'user' ? '👤 You' : '🤖 AI'}
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.5', color: msg.role === 'user' ? '#14A085' : '#F0F0F5' }}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          
          {chatLoading && (
            <div style={{ textAlign: 'center', color: '#14A085', fontSize: '13px' }}>
              AI is thinking...
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
            placeholder="Ask a question..."
            style={{ flex: 1, padding: '10px', backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '6px', color: '#F0F0F5', fontSize: '14px' }}
          />
          <button
            onClick={sendChatMessage}
            disabled={chatLoading || !chatInput.trim()}
            style={{ padding: '10px 20px', backgroundColor: '#14A085', color: 'white', border: 'none', borderRadius: '6px', cursor: chatLoading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 'bold' }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
