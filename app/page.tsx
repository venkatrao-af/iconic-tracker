'use client';

import { useEffect, useState, useMemo } from 'react';

// ============================================================================
// DESIGN SYSTEM - Professional Light Theme
// ============================================================================

const DESIGN = {
  colors: {
    primary: '#0F766E',
    primaryLight: '#14B8A6',
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    info: '#2563EB',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
    background: '#FFFFFF',
    surface: '#FAFAFA',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
  },
  radius: { sm: '4px', md: '8px', lg: '12px' },
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
};

// ============================================================================
// TYPES
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

interface ProjectData {
  timestamp: string;
  version: string;
  tasks: Task[];
  projects: Project[];
}

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
  mentions: string[];
}

interface ActivityLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

type ViewMode = 'dashboard' | 'gantt' | 'calendar' | 'list';

// ============================================================================
// MAIN APPLICATION
// ============================================================================

export default function IconicComplete() {
  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<ViewMode>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const url = process.env.NEXT_PUBLIC_DRIVE_JSON_URL;
    if (!url) {
      setError('Data source not configured');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(url);
      const json = await response.json();
      setData(json);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  function openTaskDetail(task: Task) {
    setSelectedTask(task);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setTimeout(() => setSelectedTask(null), 300);
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={loadData} />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: DESIGN.colors.surface }}>
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} view={view} onViewChange={setView} />

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: sidebarOpen ? '280px' : '0', transition: '0.2s' }}>
        <TopBar sidebarOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} data={data!} />
        
        <main style={{ flex: 1, padding: DESIGN.spacing['2xl'], overflowY: 'auto' }}>
          {view === 'dashboard' && <DashboardView data={data!} onTaskClick={openTaskDetail} />}
          {view === 'gantt' && <GanttView data={data!} onTaskClick={openTaskDetail} />}
          {view === 'calendar' && <CalendarView data={data!} onTaskClick={openTaskDetail} />}
          {view === 'list' && <ListView data={data!} onTaskClick={openTaskDetail} />}
        </main>
      </div>

      {/* Task Detail Drawer */}
      {drawerOpen && selectedTask && (
        <TaskDetailDrawer task={selectedTask} onClose={closeDrawer} />
      )}

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div onClick={closeDrawer} style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 998,
          animation: 'fadeIn 0.2s',
        }} />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}

// ============================================================================
// LOADING & ERROR STATES
// ============================================================================

function LoadingState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: DESIGN.colors.background }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: `4px solid ${DESIGN.colors.gray200}`, borderTopColor: DESIGN.colors.primary, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
        <div style={{ fontSize: '16px', color: DESIGN.colors.gray600 }}>Loading Portfolio...</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string, onRetry: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: DESIGN.colors.background, padding: DESIGN.spacing.xl }}>
      <div style={{ maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: DESIGN.spacing.lg }}>⚠️</div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: DESIGN.colors.gray900, marginBottom: DESIGN.spacing.md }}>Failed to Load</h2>
        <p style={{ fontSize: '14px', color: DESIGN.colors.gray600, marginBottom: DESIGN.spacing.xl }}>{error}</p>
        <button onClick={onRetry} style={{
          padding: `${DESIGN.spacing.md} ${DESIGN.spacing.xl}`,
          backgroundColor: DESIGN.colors.primary,
          color: '#FFFFFF',
          border: 'none',
          borderRadius: DESIGN.radius.md,
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
        }}>Retry</button>
      </div>
    </div>
  );
}

// ============================================================================
// SIDEBAR
// ============================================================================

function Sidebar({ open, onToggle, view, onViewChange }: any) {
  if (!open) return null;

  return (
    <div style={{
      width: '280px',
      backgroundColor: DESIGN.colors.background,
      borderRight: `1px solid ${DESIGN.colors.gray200}`,
      position: 'fixed',
      height: '100vh',
      overflowY: 'auto',
      zIndex: 50,
    }}>
      <div style={{ padding: DESIGN.spacing.xl, borderBottom: `1px solid ${DESIGN.colors.gray200}` }}>
        <div style={{ fontSize: '18px', fontWeight: 800, color: DESIGN.colors.gray900 }}>Iconic</div>
        <div style={{ fontSize: '12px', color: DESIGN.colors.gray500, marginTop: '2px' }}>Portfolio Intelligence</div>
      </div>

      <div style={{ padding: DESIGN.spacing.lg }}>
        <div style={{ fontSize: '10px', fontWeight: 600, color: DESIGN.colors.gray500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: DESIGN.spacing.sm }}>Views</div>
        {[
          { id: 'dashboard' as ViewMode, label: 'Dashboard', icon: '📊' },
          { id: 'list' as ViewMode, label: 'Task List', icon: '📝' },
          { id: 'gantt' as ViewMode, label: 'Timeline', icon: '📅' },
          { id: 'calendar' as ViewMode, label: 'Calendar', icon: '🗓️' },
        ].map(item => (
          <div key={item.id} onClick={() => onViewChange(item.id)} style={{
            padding: `${DESIGN.spacing.sm} ${DESIGN.spacing.md}`,
            marginBottom: '2px',
            borderRadius: DESIGN.radius.md,
            cursor: 'pointer',
            backgroundColor: view === item.id ? DESIGN.colors.gray100 : 'transparent',
            color: view === item.id ? DESIGN.colors.primary : DESIGN.colors.gray700,
            fontSize: '13px',
            fontWeight: view === item.id ? 600 : 500,
            display: 'flex',
            alignItems: 'center',
            gap: DESIGN.spacing.sm,
          }}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// TOP BAR
// ============================================================================

function TopBar({ sidebarOpen, onToggle, data }: any) {
  return (
    <div style={{
      height: '64px',
      backgroundColor: DESIGN.colors.background,
      borderBottom: `1px solid ${DESIGN.colors.gray200}`,
      display: 'flex',
      alignItems: 'center',
      padding: `0 ${DESIGN.spacing.xl}`,
      gap: DESIGN.spacing.lg,
    }}>
      <button onClick={onToggle} style={{
        width: '44px',
        height: '44px',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: DESIGN.radius.md,
        color: DESIGN.colors.gray600,
      }}>☰</button>

      <div style={{ flex: 1, display: 'flex', gap: DESIGN.spacing.sm, overflowX: 'auto' }}>
        {data.projects.map((project: Project) => (
          <div key={project.Project} style={{
            padding: `${DESIGN.spacing.sm} ${DESIGN.spacing.md}`,
            borderRadius: '999px',
            border: `2px solid ${project.Color || DESIGN.colors.primary}`,
            backgroundColor: (project.Color || DESIGN.colors.primary) + '10',
            color: project.Color || DESIGN.colors.primary,
            fontSize: '12px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>{project.Short || project.Project}</div>
        ))}
      </div>

      <div style={{ fontSize: '12px', color: DESIGN.colors.gray500 }}>
        Last updated: {new Date(data.timestamp).toLocaleDateString()}
      </div>
    </div>
  );
}

// ============================================================================
// DASHBOARD VIEW WITH CHARTS
// ============================================================================

function DashboardView({ data, onTaskClick }: { data: ProjectData, onTaskClick: (task: Task) => void }) {
  const stats = useMemo(() => {
    const total = data.tasks.length;
    const completed = data.tasks.filter(t => t.Pct_Complete === 100).length;
    const delayed = data.tasks.filter(t => t.Derail_Days > 0).length;
    const critical = data.tasks.filter(t => t.Is_Critical === 'Yes').length;
    return { total, completed, delayed, critical, completionRate: ((completed / total) * 100).toFixed(1) };
  }, [data]);

  const projectStats = useMemo(() => {
    return data.projects.map(p => {
      const tasks = data.tasks.filter(t => t.Project === p.Project);
      const delayed = tasks.filter(t => t.Derail_Days > 0).length;
      return { ...p, delayed, tasks: tasks.length };
    });
  }, [data]);

  return (
    <div>
      {/* Hero KPI */}
      <div style={{
        backgroundColor: DESIGN.colors.background,
        borderRadius: DESIGN.radius.lg,
        padding: DESIGN.spacing.xl,
        marginBottom: DESIGN.spacing.xl,
        boxShadow: DESIGN.shadow.md,
        border: `3px solid ${parseFloat(stats.completionRate) > 75 ? DESIGN.colors.success : parseFloat(stats.completionRate) > 50 ? DESIGN.colors.warning : DESIGN.colors.danger}`,
      }}>
        <div style={{ fontSize: '12px', color: DESIGN.colors.gray500, fontWeight: 600, marginBottom: DESIGN.spacing.xs }}>PORTFOLIO STATUS</div>
        <div style={{ fontSize: '36px', fontWeight: 800, color: parseFloat(stats.completionRate) > 75 ? DESIGN.colors.success : parseFloat(stats.completionRate) > 50 ? DESIGN.colors.warning : DESIGN.colors.danger }}>
          {parseFloat(stats.completionRate) > 75 ? 'On Track' : parseFloat(stats.completionRate) > 50 ? 'At Risk' : 'Critical'}
        </div>
        <div style={{ fontSize: '14px', color: DESIGN.colors.gray600 }}>{stats.completionRate}% Complete · {stats.delayed} Delayed</div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: DESIGN.spacing.lg, marginBottom: DESIGN.spacing.xl }}>
        <KPICard label="Total Tasks" value={stats.total.toString()} color={DESIGN.colors.primary} />
        <KPICard label="Completed" value={stats.completed.toString()} color={DESIGN.colors.success} />
        <KPICard label="Delayed" value={stats.delayed.toString()} color={DESIGN.colors.danger} />
        <KPICard label="Critical" value={stats.critical.toString()} color={DESIGN.colors.warning} />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: DESIGN.spacing.xl, marginBottom: DESIGN.spacing.xl }}>
        <CompletionChart data={projectStats} />
        <DelayChart data={projectStats} />
      </div>

      {/* Project Cards */}
      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: DESIGN.spacing.lg }}>Projects ({data.projects.length})</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: DESIGN.spacing.lg }}>
        {projectStats.map(project => <ProjectCard key={project.Project} project={project} tasks={data.tasks} onTaskClick={onTaskClick} />)}
      </div>
    </div>
  );
}

function KPICard({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div style={{
      backgroundColor: DESIGN.colors.background,
      borderRadius: DESIGN.radius.lg,
      padding: DESIGN.spacing.xl,
      boxShadow: DESIGN.shadow.sm,
      border: `1px solid ${DESIGN.colors.gray200}`,
    }}>
      <div style={{ fontSize: '10px', fontWeight: 600, color: DESIGN.colors.gray500, textTransform: 'uppercase', marginBottom: DESIGN.spacing.sm }}>{label}</div>
      <div style={{ fontSize: '36px', fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function CompletionChart({ data }: { data: any[] }) {
  const maxValue = Math.max(...data.map(d => d.Task_Count));
  
  return (
    <div style={{ backgroundColor: DESIGN.colors.background, borderRadius: DESIGN.radius.lg, padding: DESIGN.spacing.xl, boxShadow: DESIGN.shadow.md }}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: DESIGN.spacing.xl }}>Completion Progress</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: DESIGN.spacing.md, height: '200px' }}>
        {data.map(project => (
          <div key={project.Project} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: DESIGN.spacing.sm }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
              <div style={{ 
                width: '100%', 
                height: `${(project.Pct_Complete / 100) * 100}%`, 
                backgroundColor: project.Color || DESIGN.colors.primary,
                borderRadius: `${DESIGN.radius.sm} ${DESIGN.radius.sm} 0 0`,
                position: 'relative',
              }}>
                <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '12px', fontWeight: 700, color: DESIGN.colors.gray900 }}>
                  {project.Pct_Complete}%
                </div>
              </div>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: project.Color || DESIGN.colors.primary, textAlign: 'center' }}>{project.Short}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DelayChart({ data }: { data: any[] }) {
  const maxDelay = Math.max(...data.map(d => d.delayed || 0), 1);
  
  return (
    <div style={{ backgroundColor: DESIGN.colors.background, borderRadius: DESIGN.radius.lg, padding: DESIGN.spacing.xl, boxShadow: DESIGN.shadow.md }}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: DESIGN.spacing.xl }}>Delayed Tasks by Project</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: DESIGN.spacing.md }}>
        {data.map(project => (
          <div key={project.Project} style={{ display: 'flex', alignItems: 'center', gap: DESIGN.spacing.md }}>
            <div style={{ width: '80px', fontSize: '12px', fontWeight: 600, color: project.Color || DESIGN.colors.primary }}>{project.Short}</div>
            <div style={{ flex: 1, height: '32px', backgroundColor: DESIGN.colors.gray100, borderRadius: DESIGN.radius.sm, position: 'relative', overflow: 'hidden' }}>
              <div style={{ 
                width: `${((project.delayed || 0) / maxDelay) * 100}%`, 
                height: '100%', 
                backgroundColor: project.delayed > 5 ? DESIGN.colors.danger : project.delayed > 2 ? DESIGN.colors.warning : DESIGN.colors.success,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: DESIGN.spacing.sm,
              }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFF' }}>{project.delayed}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project, tasks, onTaskClick }: any) {
  const projectTasks = tasks.filter((t: Task) => t.Project === project.Project);
  const delayed = projectTasks.filter((t: Task) => t.Derail_Days > 0);
  
  return (
    <div style={{
      backgroundColor: DESIGN.colors.background,
      borderRadius: DESIGN.radius.lg,
      padding: DESIGN.spacing.xl,
      boxShadow: DESIGN.shadow.sm,
      border: `1px solid ${DESIGN.colors.gray200}`,
      borderLeft: `4px solid ${project.Color || DESIGN.colors.primary}`,
    }}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: DESIGN.spacing.md }}>{project.Short || project.Project}</h3>
      <div style={{ marginBottom: DESIGN.spacing.md }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: DESIGN.spacing.xs, fontSize: '12px' }}>
          <span style={{ color: DESIGN.colors.gray600 }}>Progress</span>
          <span style={{ fontWeight: 600, color: DESIGN.colors.primary }}>{project.Pct_Complete}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: DESIGN.colors.gray200, borderRadius: DESIGN.radius.sm, overflow: 'hidden' }}>
          <div style={{ width: `${project.Pct_Complete}%`, height: '100%', backgroundColor: DESIGN.colors.primary }}></div>
        </div>
      </div>
      
      {delayed.length > 0 && (
        <div style={{ marginTop: DESIGN.spacing.md }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: DESIGN.colors.gray500, marginBottom: DESIGN.spacing.sm }}>DELAYED TASKS ({delayed.length})</div>
          {delayed.slice(0, 3).map((task: Task) => (
            <div key={task.Task_UID} onClick={() => onTaskClick(task)} style={{
              padding: DESIGN.spacing.sm,
              backgroundColor: DESIGN.colors.gray50,
              borderRadius: DESIGN.radius.sm,
              marginBottom: '2px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.Task_Name}</span>
              <span style={{ color: DESIGN.colors.danger, fontWeight: 700, marginLeft: DESIGN.spacing.sm }}>+{task.Derail_Days}d</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// LIST VIEW
// ============================================================================

function ListView({ data, onTaskClick }: { data: ProjectData, onTaskClick: (task: Task) => void }) {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: DESIGN.spacing.lg }}>All Tasks ({data.tasks.length})</h2>
      <div style={{ backgroundColor: DESIGN.colors.background, borderRadius: DESIGN.radius.lg, overflow: 'hidden', boxShadow: DESIGN.shadow.md }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: DESIGN.colors.gray50, borderBottom: `2px solid ${DESIGN.colors.gray200}` }}>
              <th style={{ padding: DESIGN.spacing.md, textAlign: 'left', fontSize: '12px', fontWeight: 700, color: DESIGN.colors.gray600 }}>Task</th>
              <th style={{ padding: DESIGN.spacing.md, textAlign: 'left', fontSize: '12px', fontWeight: 700, color: DESIGN.colors.gray600 }}>Project</th>
              <th style={{ padding: DESIGN.spacing.md, textAlign: 'left', fontSize: '12px', fontWeight: 700, color: DESIGN.colors.gray600 }}>Status</th>
              <th style={{ padding: DESIGN.spacing.md, textAlign: 'right', fontSize: '12px', fontWeight: 700, color: DESIGN.colors.gray600 }}>Progress</th>
              <th style={{ padding: DESIGN.spacing.md, textAlign: 'right', fontSize: '12px', fontWeight: 700, color: DESIGN.colors.gray600 }}>Delay</th>
            </tr>
          </thead>
          <tbody>
            {data.tasks.slice(0, 50).map((task) => (
              <tr key={task.Task_UID} onClick={() => onTaskClick(task)} style={{ borderBottom: `1px solid ${DESIGN.colors.gray200}`, cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = DESIGN.colors.gray50} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={{ padding: DESIGN.spacing.md, fontSize: '13px' }}>{task.Task_Name}</td>
                <td style={{ padding: DESIGN.spacing.md, fontSize: '12px', color: DESIGN.colors.gray600 }}>{task.Project}</td>
                <td style={{ padding: DESIGN.spacing.md, fontSize: '12px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: DESIGN.radius.sm, backgroundColor: task.Status === 'Complete' ? DESIGN.colors.success + '15' : DESIGN.colors.warning + '15', color: task.Status === 'Complete' ? DESIGN.colors.success : DESIGN.colors.warning }}>{task.Status}</span>
                </td>
                <td style={{ padding: DESIGN.spacing.md, fontSize: '13px', textAlign: 'right', fontWeight: 600, color: DESIGN.colors.primary }}>{task.Pct_Complete}%</td>
                <td style={{ padding: DESIGN.spacing.md, fontSize: '13px', textAlign: 'right', fontWeight: 600, color: task.Derail_Days > 0 ? DESIGN.colors.danger : DESIGN.colors.success }}>
                  {task.Derail_Days > 0 ? `+${task.Derail_Days}d` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// GANTT VIEW (FUNCTIONAL)
// ============================================================================

function GanttView({ data, onTaskClick }: { data: ProjectData, onTaskClick: (task: Task) => void }) {
  const tasksWithDates = data.tasks.filter(t => t.Planned_Start && t.Planned_Finish).slice(0, 20);
  
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: DESIGN.spacing.lg }}>Timeline View (First 20 Tasks)</h2>
      <div style={{ backgroundColor: DESIGN.colors.background, borderRadius: DESIGN.radius.lg, padding: DESIGN.spacing.xl, boxShadow: DESIGN.shadow.md, overflowX: 'auto' }}>
        {tasksWithDates.map(task => (
          <div key={task.Task_UID} onClick={() => onTaskClick(task)} style={{ 
            marginBottom: DESIGN.spacing.md, 
            padding: DESIGN.spacing.md, 
            backgroundColor: DESIGN.colors.gray50, 
            borderRadius: DESIGN.radius.sm,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: DESIGN.spacing.lg,
          }}>
            <div style={{ width: '200px', fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.Task_Name}</div>
            <div style={{ flex: 1, height: '24px', backgroundColor: DESIGN.colors.gray200, borderRadius: DESIGN.radius.sm, position: 'relative' }}>
              <div style={{ 
                width: `${task.Pct_Complete}%`, 
                height: '100%', 
                backgroundColor: task.Derail_Days > 0 ? DESIGN.colors.danger : DESIGN.colors.success,
                borderRadius: DESIGN.radius.sm,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: DESIGN.spacing.sm,
              }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#FFF' }}>{task.Pct_Complete}%</span>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: DESIGN.colors.gray600, width: '100px' }}>{task.Duration_Days} days</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// CALENDAR VIEW (FUNCTIONAL)
// ============================================================================

function CalendarView({ data, onTaskClick }: { data: ProjectData, onTaskClick: (task: Task) => void }) {
  const tasksWithDates = data.tasks.filter(t => t.Planned_Start).slice(0, 30);
  
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: DESIGN.spacing.lg }}>Calendar View (Upcoming 30 Tasks)</h2>
      <div style={{ backgroundColor: DESIGN.colors.background, borderRadius: DESIGN.radius.lg, padding: DESIGN.spacing.xl, boxShadow: DESIGN.shadow.md }}>
        {tasksWithDates.map(task => (
          <div key={task.Task_UID} onClick={() => onTaskClick(task)} style={{
            padding: DESIGN.spacing.md,
            borderBottom: `1px solid ${DESIGN.colors.gray200}`,
            cursor: 'pointer',
            display: 'flex',
            gap: DESIGN.spacing.lg,
            alignItems: 'center',
          }}>
            <div style={{ width: '100px', fontSize: '12px', fontWeight: 700, color: DESIGN.colors.primary }}>{task.Planned_Start}</div>
            <div style={{ flex: 1, fontSize: '13px' }}>{task.Task_Name}</div>
            <div style={{ fontSize: '11px', color: DESIGN.colors.gray600 }}>{task.Project}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// TASK DETAIL DRAWER (THE KEY FEATURE!)
// ============================================================================

function TaskDetailDrawer({ task, onClose }: { task: Task, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'comments' | 'documents'>('details');
  const [comments, setComments] = useState<Comment[]>([
    { id: '1', author: 'John Doe', text: 'Updated task progress to 60%', timestamp: '2024-01-15 14:30', mentions: [] },
    { id: '2', author: 'Jane Smith', text: '@John Doe Please review the latest changes', timestamp: '2024-01-15 15:45', mentions: ['John Doe'] },
  ]);
  const [newComment, setNewComment] = useState('');
  const [activityLog] = useState<ActivityLog[]>([
    { id: '1', action: 'Progress Updated', user: 'John Doe', timestamp: '2024-01-15 14:30', details: 'Changed from 50% to 60%' },
    { id: '2', action: 'Status Changed', user: 'Jane Smith', timestamp: '2024-01-14 10:15', details: 'Changed from Not Started to In Progress' },
    { id: '3', action: 'Task Created', user: 'System', timestamp: '2024-01-10 09:00', details: 'Task initialized' },
  ]);

  function addComment() {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: Date.now().toString(),
      author: 'Current User',
      text: newComment,
      timestamp: new Date().toISOString(),
      mentions: [],
    };
    setComments([...comments, comment]);
    setNewComment('');
  }

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      bottom: 0,
      width: '600px',
      backgroundColor: DESIGN.colors.background,
      boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideIn 0.3s',
    }}>
      {/* Header */}
      <div style={{ padding: DESIGN.spacing.xl, borderBottom: `1px solid ${DESIGN.colors.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Task Details</h2>
        <button onClick={onClose} style={{ width: '32px', height: '32px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px', color: DESIGN.colors.gray600 }}>×</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${DESIGN.colors.gray200}`, padding: `0 ${DESIGN.spacing.xl}` }}>
        {[
          { id: 'details' as const, label: 'Details' },
          { id: 'activity' as const, label: 'Activity' },
          { id: 'comments' as const, label: 'Comments' },
          { id: 'documents' as const, label: 'Documents' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: DESIGN.spacing.md,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeTab === tab.id ? 700 : 500,
            color: activeTab === tab.id ? DESIGN.colors.primary : DESIGN.colors.gray600,
            borderBottom: activeTab === tab.id ? `2px solid ${DESIGN.colors.primary}` : '2px solid transparent',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: DESIGN.spacing.xl }}>
        {activeTab === 'details' && (
          <div>
            <DetailRow label="Task Name" value={task.Task_Name} />
            <DetailRow label="Project" value={task.Project} />
            <DetailRow label="Status" value={task.Status} />
            <DetailRow label="Phase" value={task.Phase} />
            <DetailRow label="Owner" value={task.Owners || 'Unassigned'} />
            <DetailRow label="Progress" value={`${task.Pct_Complete}%`} />
            <DetailRow label="Delay" value={task.Derail_Days > 0 ? `+${task.Derail_Days} days` : 'On Time'} />
            <DetailRow label="Duration" value={`${task.Duration_Days} days`} />
            <DetailRow label="Planned Start" value={task.Planned_Start} />
            <DetailRow label="Planned Finish" value={task.Planned_Finish} />
            <DetailRow label="Critical Path" value={task.Is_Critical} />
          </div>
        )}

        {activeTab === 'activity' && (
          <div>
            {activityLog.map(log => (
              <div key={log.id} style={{ marginBottom: DESIGN.spacing.lg, paddingBottom: DESIGN.spacing.lg, borderBottom: `1px solid ${DESIGN.colors.gray200}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: DESIGN.spacing.xs }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{log.action}</span>
                  <span style={{ fontSize: '11px', color: DESIGN.colors.gray500 }}>{log.timestamp}</span>
                </div>
                <div style={{ fontSize: '12px', color: DESIGN.colors.gray600 }}>{log.user}</div>
                <div style={{ fontSize: '12px', color: DESIGN.colors.gray600, marginTop: DESIGN.spacing.xs }}>{log.details}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'comments' && (
          <div>
            {comments.map(comment => (
              <div key={comment.id} style={{ marginBottom: DESIGN.spacing.lg, paddingBottom: DESIGN.spacing.lg, borderBottom: `1px solid ${DESIGN.colors.gray200}` }}>
                <div style={{ display: 'flex', gap: DESIGN.spacing.md, marginBottom: DESIGN.spacing.sm }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: DESIGN.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '14px', fontWeight: 700 }}>
                    {comment.author[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: DESIGN.spacing.xs }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{comment.author}</span>
                      <span style={{ fontSize: '11px', color: DESIGN.colors.gray500 }}>{comment.timestamp}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: DESIGN.colors.gray700 }}>{comment.text}</div>
                  </div>
                </div>
              </div>
            ))}
            
            <div style={{ marginTop: DESIGN.spacing.xl }}>
              <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment... (Use @ to mention)" style={{
                width: '100%',
                minHeight: '80px',
                padding: DESIGN.spacing.md,
                border: `1px solid ${DESIGN.colors.gray300}`,
                borderRadius: DESIGN.radius.md,
                fontSize: '13px',
                fontFamily: 'inherit',
                resize: 'vertical',
              }} />
              <button onClick={addComment} style={{
                marginTop: DESIGN.spacing.md,
                padding: `${DESIGN.spacing.sm} ${DESIGN.spacing.lg}`,
                backgroundColor: DESIGN.colors.primary,
                color: '#FFF',
                border: 'none',
                borderRadius: DESIGN.radius.md,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}>Post Comment</button>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <div style={{ padding: DESIGN.spacing.xl, textAlign: 'center', border: `2px dashed ${DESIGN.colors.gray300}`, borderRadius: DESIGN.radius.md }}>
              <div style={{ fontSize: '48px', marginBottom: DESIGN.spacing.md }}>📎</div>
              <div style={{ fontSize: '14px', color: DESIGN.colors.gray600, marginBottom: DESIGN.spacing.md }}>Proof of Completion Documents</div>
              <button style={{
                padding: `${DESIGN.spacing.sm} ${DESIGN.spacing.lg}`,
                backgroundColor: DESIGN.colors.primary,
                color: '#FFF',
                border: 'none',
                borderRadius: DESIGN.radius.md,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}>Upload Document</button>
            </div>
            <div style={{ marginTop: DESIGN.spacing.lg }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: DESIGN.colors.gray500, marginBottom: DESIGN.spacing.md }}>UPLOADED FILES (2)</div>
              <DocumentItem name="Site Photos.pdf" size="2.4 MB" date="2024-01-15" />
              <DocumentItem name="Progress Report.docx" size="156 KB" date="2024-01-14" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div style={{ marginBottom: DESIGN.spacing.md, paddingBottom: DESIGN.spacing.md, borderBottom: `1px solid ${DESIGN.colors.gray200}` }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: DESIGN.colors.gray500, marginBottom: DESIGN.spacing.xs, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '14px', color: DESIGN.colors.gray900 }}>{value}</div>
    </div>
  );
}

function DocumentItem({ name, size, date }: { name: string, size: string, date: string }) {
  return (
    <div style={{ padding: DESIGN.spacing.md, backgroundColor: DESIGN.colors.gray50, borderRadius: DESIGN.radius.sm, marginBottom: DESIGN.spacing.sm, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>{name}</div>
        <div style={{ fontSize: '11px', color: DESIGN.colors.gray500 }}>{size} · {date}</div>
      </div>
      <button style={{ padding: `${DESIGN.spacing.xs} ${DESIGN.spacing.md}`, backgroundColor: DESIGN.colors.background, border: `1px solid ${DESIGN.colors.gray300}`, borderRadius: DESIGN.radius.sm, fontSize: '12px', cursor: 'pointer' }}>Download</button>
    </div>
  );
}
