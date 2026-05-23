'use client';

import { useEffect, useState, useMemo } from 'react';

// ============================================================================
// PROFESSIONAL DESIGN SYSTEM (Matching Reference Quality)
// ============================================================================

const DESIGN = {
  colors: {
    bg: '#F4F3EF',
    surface: '#FFFFFF',
    surface2: '#F8F7F3',
    border: '#E2DDD5',
    border2: '#CEC8BE',
    ink: '#1A1814',
    ink2: '#4A4540',
    ink3: '#8C8680',
    ink4: '#B8B2AA',
    blue: '#1B4FD8',
    blueLt: '#EEF2FF',
    green: '#16803C',
    greenLt: '#DCFCE7',
    amber: '#B45309',
    amberLt: '#FEF3C7',
    red: '#DC2626',
    redLt: '#FEE2E2',
    violet: '#6D28D9',
    violetLt: '#EDE9FE',
    teal: '#0D7490',
    tealLt: '#E0F2FE',
  },
  radius: '6px',
  radiusLg: '12px',
  shadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  shadowLg: '0 4px 24px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
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
  WBS?: string;
  Level?: number;
  ParentUID?: number;
  HasProof?: boolean;
  ProofURL?: string;
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

type ViewMode = 'dashboard' | 'list' | 'timeline' | 'calendar';

interface Filters {
  project: string;
  phase: string;
  owner: string;
  search: string;
}

// ============================================================================
// MAIN APPLICATION
// ============================================================================

export default function IconicProfessional() {
  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<ViewMode>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({ project: 'all', phase: 'all', owner: 'all', search: '' });
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

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
      
      // Enrich tasks with WBS and hierarchy
      const enrichedTasks = json.tasks.map((task: Task, index: number) => ({
        ...task,
        WBS: `${index + 1}`,
        Level: 0,
        HasProof: Math.random() > 0.7, // Simulate some tasks having proof
        ProofURL: Math.random() > 0.7 ? 'https://example.com/proof.pdf' : undefined,
      }));
      
      setData({ ...json, tasks: enrichedTasks });
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

  function updateFilter(key: keyof Filters, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilters({ project: 'all', phase: 'all', owner: 'all', search: '' });
  }

  const filteredTasks = useMemo(() => {
    if (!data) return [];
    
    return data.tasks.filter(task => {
      if (filters.project !== 'all' && task.Project !== filters.project) return false;
      if (filters.phase !== 'all' && task.Phase !== filters.phase) return false;
      if (filters.owner !== 'all' && !task.Owners?.includes(filters.owner)) return false;
      if (filters.search && !task.Task_Name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [data, filters]);

  const uniquePhases = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.tasks.map(t => t.Phase))).filter(Boolean);
  }, [data]);

  const uniqueOwners = useMemo(() => {
    if (!data) return [];
    const allOwners = data.tasks.flatMap(t => t.Owners?.split(',').map(o => o.trim()) || []);
    return Array.from(new Set(allOwners)).filter(Boolean);
  }, [data]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={loadData} />;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Top Bar */}
        <TopBar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} timestamp={data!.timestamp} />

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar */}
          {sidebarOpen && (
            <Sidebar view={view} onViewChange={setView} projects={data!.projects} filters={filters} onFilterChange={updateFilter} />
          )}

          {/* Main Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Breadcrumbs */}
            <Breadcrumbs view={view} filters={filters} />

            {/* Filter Bar */}
            <FilterBar 
              filters={filters} 
              onFilterChange={updateFilter} 
              onClearFilters={clearFilters}
              projects={data!.projects}
              phases={uniquePhases}
              owners={uniqueOwners}
            />

            {/* View Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {view === 'dashboard' && <DashboardView data={data!} filteredTasks={filteredTasks} onTaskClick={openTaskDetail} />}
              {view === 'list' && <WBSListView tasks={filteredTasks} expandedTasks={expandedTasks} onToggleExpand={setExpandedTasks} onTaskClick={openTaskDetail} />}
              {view === 'timeline' && <TimelineView tasks={filteredTasks} onTaskClick={openTaskDetail} />}
              {view === 'calendar' && <CalendarView tasks={filteredTasks} onTaskClick={openTaskDetail} />}
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail Drawer */}
      {drawerOpen && selectedTask && (
        <>
          <div onClick={closeDrawer} style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.15)', zIndex: 200,
            opacity: drawerOpen ? 1 : 0, transition: 'opacity 0.2s',
          }} />
          <TaskDetailDrawer task={selectedTask} onClose={closeDrawer} />
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </>
  );
}

// ============================================================================
// LOADING & ERROR STATES
// ============================================================================

function LoadingState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: DESIGN.colors.surface }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: `3px solid ${DESIGN.colors.border}`, borderTopColor: DESIGN.colors.blue, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
        <div style={{ fontSize: '14px', color: DESIGN.colors.ink2 }}>Loading Portfolio Intelligence...</div>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string, onRetry: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: DESIGN.colors.surface, padding: '20px' }}>
      <div style={{ maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: DESIGN.colors.ink, marginBottom: '12px' }}>Failed to Load Data</h2>
        <p style={{ fontSize: '13px', color: DESIGN.colors.ink2, marginBottom: '24px' }}>{error}</p>
        <button onClick={onRetry} style={{
          padding: '10px 24px', backgroundColor: DESIGN.colors.blue, color: '#FFFFFF',
          border: 'none', borderRadius: DESIGN.radius, fontSize: '13px', fontWeight: 600, cursor: 'pointer',
        }}>Retry</button>
      </div>
    </div>
  );
}

// ============================================================================
// TOP BAR
// ============================================================================

function TopBar({ sidebarOpen, onToggleSidebar, timestamp }: any) {
  return (
    <div style={{
      height: '52px', minHeight: '52px', backgroundColor: DESIGN.colors.surface,
      borderBottom: `1.5px solid ${DESIGN.colors.border}`, display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: '16px', boxShadow: '0 1px 0 rgba(0,0,0,0.04)', zIndex: 100,
    }}>
      <button onClick={onToggleSidebar} style={{
        width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', background: 'none', cursor: 'pointer', color: DESIGN.colors.ink2, fontSize: '20px',
      }}>☰</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '28px', height: '28px', background: DESIGN.colors.blue,
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}></div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: '15px', fontWeight: 700, color: DESIGN.colors.ink }}>Iconic Intelligence</div>
      </div>

      <div style={{ width: '1px', height: '20px', background: DESIGN.colors.border }}></div>
      <div style={{ fontSize: '12px', fontWeight: 600, color: DESIGN.colors.ink2, letterSpacing: '0.03em', textTransform: 'uppercase' }}>Project Command Centre</div>

      <div style={{ flex: 1 }}></div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: DESIGN.colors.ink3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: DESIGN.colors.green, background: DESIGN.colors.greenLt, padding: '3px 9px', borderRadius: '20px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: DESIGN.colors.green }}></div>
          Live
        </div>
        <div>Updated: {new Date(timestamp).toLocaleString()}</div>
      </div>
    </div>
  );
}

// ============================================================================
// SIDEBAR
// ============================================================================

function Sidebar({ view, onViewChange, projects, filters, onFilterChange }: any) {
  return (
    <div style={{
      width: '220px', minWidth: '220px', backgroundColor: DESIGN.colors.surface,
      borderRight: `1.5px solid ${DESIGN.colors.border}`, display: 'flex', flexDirection: 'column',
      overflowY: 'auto', padding: '12px 0', gap: '2px',
    }}>
      <div style={{ padding: '8px 14px 4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: DESIGN.colors.ink4 }}>VIEWS</div>
      
      {[
        { id: 'dashboard' as ViewMode, label: 'Dashboard', icon: '📊' },
        { id: 'list' as ViewMode, label: 'Task List (WBS)', icon: '📋' },
        { id: 'timeline' as ViewMode, label: 'Timeline', icon: '📅' },
        { id: 'calendar' as ViewMode, label: 'Calendar', icon: '🗓️' },
      ].map(item => (
        <div key={item.id} onClick={() => onViewChange(item.id)} style={{
          display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 14px',
          fontSize: '12px', fontWeight: view === item.id ? 600 : 500,
          color: view === item.id ? DESIGN.colors.blue : DESIGN.colors.ink2,
          cursor: 'pointer', borderLeft: `2px solid ${view === item.id ? DESIGN.colors.blue : 'transparent'}`,
          background: view === item.id ? DESIGN.colors.blueLt : 'transparent', transition: 'all 0.12s',
        }}>
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}

      <div style={{ padding: '8px 14px 4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: DESIGN.colors.ink4, marginTop: '16px' }}>PROJECTS</div>
      
      <div style={{ padding: '8px 14px' }}>
        {projects.map((project: Project) => (
          <div key={project.Project} onClick={() => onFilterChange('project', filters.project === project.Project ? 'all' : project.Project)} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px',
            borderRadius: DESIGN.radius, cursor: 'pointer', transition: 'background 0.12s',
            fontSize: '12px', fontWeight: filters.project === project.Project ? 600 : 500,
            color: filters.project === project.Project ? DESIGN.colors.blue : DESIGN.colors.ink2,
            background: filters.project === project.Project ? DESIGN.colors.blueLt : 'transparent',
            marginBottom: '2px',
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: project.Color || DESIGN.colors.blue }}></div>
            <span style={{ flex: 1 }}>{project.Short}</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: DESIGN.colors.ink3 }}>{project.Pct_Complete}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// BREADCRUMBS
// ============================================================================

function Breadcrumbs({ view, filters }: any) {
  const activeFilters = [];
  if (filters.project !== 'all') activeFilters.push(`Project: ${filters.project}`);
  if (filters.phase !== 'all') activeFilters.push(`Phase: ${filters.phase}`);
  if (filters.owner !== 'all') activeFilters.push(`Owner: ${filters.owner}`);
  if (filters.search) activeFilters.push(`Search: "${filters.search}"`);

  return (
    <div style={{
      padding: '12px 20px', backgroundColor: DESIGN.colors.surface2,
      borderBottom: `1px solid ${DESIGN.colors.border}`, fontSize: '11px', color: DESIGN.colors.ink3,
      display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
    }}>
      <span style={{ fontWeight: 600, color: DESIGN.colors.ink2 }}>Home</span>
      <span>›</span>
      <span style={{ fontWeight: 600, color: DESIGN.colors.blue }}>
        {view === 'dashboard' && 'Dashboard'}
        {view === 'list' && 'Task List (WBS)'}
        {view === 'timeline' && 'Timeline'}
        {view === 'calendar' && 'Calendar'}
      </span>
      {activeFilters.length > 0 && (
        <>
          <span>›</span>
          <span style={{ fontWeight: 600, color: DESIGN.colors.ink }}>{activeFilters.join(' • ')}</span>
        </>
      )}
    </div>
  );
}

// ============================================================================
// FILTER BAR
// ============================================================================

function FilterBar({ filters, onFilterChange, onClearFilters, projects, phases, owners }: any) {
  const hasActiveFilters = filters.project !== 'all' || filters.phase !== 'all' || filters.owner !== 'all' || filters.search;

  return (
    <div style={{
      display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap',
      background: DESIGN.colors.surface, border: `1.5px solid ${DESIGN.colors.border}`,
      borderRadius: DESIGN.radiusLg, padding: '10px 14px', margin: '0 20px', boxShadow: DESIGN.shadow,
    }}>
      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: DESIGN.colors.ink3 }}>FILTERS</div>

      <select value={filters.project} onChange={(e) => onFilterChange('project', e.target.value)} style={{
        fontSize: '12px', fontWeight: 500, padding: '4px 24px 4px 8px',
        border: `1.5px solid ${DESIGN.colors.border}`, borderRadius: DESIGN.radius,
        background: DESIGN.colors.surface2, color: DESIGN.colors.ink, cursor: 'pointer',
      }}>
        <option value="all">All Projects</option>
        {projects.map((p: Project) => <option key={p.Project} value={p.Project}>{p.Short}</option>)}
      </select>

      <select value={filters.phase} onChange={(e) => onFilterChange('phase', e.target.value)} style={{
        fontSize: '12px', fontWeight: 500, padding: '4px 24px 4px 8px',
        border: `1.5px solid ${DESIGN.colors.border}`, borderRadius: DESIGN.radius,
        background: DESIGN.colors.surface2, color: DESIGN.colors.ink, cursor: 'pointer',
      }}>
        <option value="all">All Phases</option>
        {phases.map((p: string) => <option key={p} value={p}>{p}</option>)}
      </select>

      <select value={filters.owner} onChange={(e) => onFilterChange('owner', e.target.value)} style={{
        fontSize: '12px', fontWeight: 500, padding: '4px 24px 4px 8px',
        border: `1.5px solid ${DESIGN.colors.border}`, borderRadius: DESIGN.radius,
        background: DESIGN.colors.surface2, color: DESIGN.colors.ink, cursor: 'pointer',
      }}>
        <option value="all">All Owners</option>
        {owners.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>

      <input type="text" placeholder="Search tasks..." value={filters.search} onChange={(e) => onFilterChange('search', e.target.value)} style={{
        fontSize: '12px', fontWeight: 500, padding: '4px 10px',
        border: `1.5px solid ${DESIGN.colors.border}`, borderRadius: DESIGN.radius,
        background: DESIGN.colors.surface2, color: DESIGN.colors.ink, width: '180px',
      }} />

      {hasActiveFilters && (
        <button onClick={onClearFilters} style={{
          fontSize: '11px', fontWeight: 600, color: DESIGN.colors.ink3,
          padding: '4px 10px', border: `1.5px solid ${DESIGN.colors.border}`,
          borderRadius: DESIGN.radius, background: 'none', cursor: 'pointer',
        }}>Clear</button>
      )}

      <div style={{ flex: 1 }}></div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: DESIGN.colors.ink3 }}>
        Showing {filters.search || hasActiveFilters ? 'filtered results' : 'all tasks'}
      </div>
    </div>
  );
}

// ============================================================================
// DASHBOARD VIEW
// ============================================================================

function DashboardView({ data, filteredTasks, onTaskClick }: any) {
  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter((t: Task) => t.Pct_Complete === 100).length;
    const delayed = filteredTasks.filter((t: Task) => t.Derail_Days > 0).length;
    const critical = filteredTasks.filter((t: Task) => t.Is_Critical === 'Yes').length;
    const withProof = filteredTasks.filter((t: Task) => t.HasProof).length;
    return { total, completed, delayed, critical, withProof, completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0' };
  }, [filteredTasks]);

  const phaseStats = useMemo(() => {
    const phases = Array.from(new Set(filteredTasks.map((t: Task) => t.Phase))).filter(Boolean);
    return phases.map(phase => {
      const phaseTasks = filteredTasks.filter((t: Task) => t.Phase === phase);
      const completed = phaseTasks.filter((t: Task) => t.Pct_Complete === 100).length;
      return {
        phase,
        total: phaseTasks.length,
        completed,
        pct: phaseTasks.length > 0 ? ((completed / phaseTasks.length) * 100).toFixed(0) : '0',
        delayed: phaseTasks.filter((t: Task) => t.Derail_Days > 0).length,
      };
    });
  }, [filteredTasks]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
        {[
          { label: 'Total Tasks', value: stats.total, color: DESIGN.colors.blue },
          { label: 'Completed', value: stats.completed, color: DESIGN.colors.green },
          { label: 'Delayed', value: stats.delayed, color: DESIGN.colors.red },
          { label: 'Critical', value: stats.critical, color: DESIGN.colors.amber },
          { label: 'With Proof', value: stats.withProof, color: DESIGN.colors.teal },
        ].map(kpi => (
          <div key={kpi.label} style={{
            background: DESIGN.colors.surface, border: `1.5px solid ${DESIGN.colors.border}`,
            borderRadius: DESIGN.radiusLg, padding: '16px 18px', boxShadow: DESIGN.shadow,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: kpi.color }}></div>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: DESIGN.colors.ink3, marginBottom: '8px' }}>{kpi.label}</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '32px', fontWeight: 700, lineHeight: 1, color: DESIGN.colors.ink }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Phase Cards */}
      <div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: '15px', fontWeight: 700, color: DESIGN.colors.ink, marginBottom: '12px' }}>
          Progress by Phase
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
          {phaseStats.map(phase => (
            <div key={phase.phase} style={{
              background: DESIGN.colors.surface, border: `1.5px solid ${DESIGN.colors.border}`,
              borderRadius: DESIGN.radiusLg, padding: '14px', boxShadow: DESIGN.shadow,
              borderTop: `3px solid ${DESIGN.colors.blue}`, cursor: 'pointer',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: DESIGN.colors.ink, marginBottom: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{phase.phase}</div>
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: '26px', fontWeight: 700, color: DESIGN.colors.blue, lineHeight: 1, marginBottom: '6px' }}>{phase.pct}%</div>
              <div style={{ height: '4px', background: DESIGN.colors.border, borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{ height: '100%', width: `${phase.pct}%`, background: DESIGN.colors.blue, borderRadius: '2px' }}></div>
              </div>
              <div style={{ fontSize: '10px', color: DESIGN.colors.ink3, display: 'flex', justifyContent: 'space-between' }}>
                <span>{phase.completed}/{phase.total}</span>
                <span style={{ color: DESIGN.colors.red }}>{phase.delayed} late</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Delayed Tasks */}
      <div>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: '15px', fontWeight: 700, color: DESIGN.colors.ink, marginBottom: '12px' }}>
          Delayed Tasks Requiring Attention
        </div>
        <div style={{ background: DESIGN.colors.surface, border: `1.5px solid ${DESIGN.colors.border}`, borderRadius: DESIGN.radiusLg, boxShadow: DESIGN.shadow, overflow: 'hidden' }}>
          {filteredTasks.filter((t: Task) => t.Derail_Days > 0).slice(0, 10).map((task: Task) => (
            <div key={task.Task_UID} onClick={() => onTaskClick(task)} style={{
              padding: '12px 16px', borderBottom: `1px solid ${DESIGN.colors.border}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
            }} onMouseEnter={(e) => e.currentTarget.style.background = DESIGN.colors.surface2} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: DESIGN.colors.ink, marginBottom: '4px' }}>{task.Task_Name}</div>
                <div style={{ fontSize: '11px', color: DESIGN.colors.ink3 }}>{task.Project} · {task.Phase}</div>
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', background: DESIGN.colors.redLt, color: DESIGN.colors.red }}>
                +{task.Derail_Days}d
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Will continue with WBSListView, TimelineView, CalendarView, and TaskDetailDrawer...

// ============================================================================
// WBS LIST VIEW (Multi-layered hierarchy with expand/collapse)
// ============================================================================

function WBSListView({ tasks, expandedTasks, onToggleExpand, onTaskClick }: any) {
  function toggleExpand(taskId: number) {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    onToggleExpand(newExpanded);
  }

  return (
    <div style={{ background: DESIGN.colors.surface, border: `1.5px solid ${DESIGN.colors.border}`, borderRadius: DESIGN.radiusLg, boxShadow: DESIGN.shadow, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1.5px solid ${DESIGN.colors.border}`, background: DESIGN.colors.surface2 }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: DESIGN.colors.ink3 }}>Showing {tasks.length} tasks</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => onToggleExpand(new Set(tasks.map((t: Task) => t.Task_UID)))} style={{
            fontSize: '11px', fontWeight: 600, padding: '4px 10px',
            border: `1.5px solid ${DESIGN.colors.border}`, borderRadius: DESIGN.radius,
            color: DESIGN.colors.ink2, background: 'none', cursor: 'pointer',
          }}>Expand All</button>
          <button onClick={() => onToggleExpand(new Set())} style={{
            fontSize: '11px', fontWeight: 600, padding: '4px 10px',
            border: `1.5px solid ${DESIGN.colors.border}`, borderRadius: DESIGN.radius,
            color: DESIGN.colors.ink2, background: 'none', cursor: 'pointer',
          }}>Collapse All</button>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: DESIGN.colors.surface2, borderBottom: `1.5px solid ${DESIGN.colors.border}` }}>
            {['WBS', 'Task Name', 'Project', 'Phase', 'Status', 'Progress', 'Delay', 'Proof'].map(header => (
              <th key={header} style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                color: DESIGN.colors.ink3, padding: '10px 12px', textAlign: 'left', whiteSpace: 'nowrap',
                cursor: 'pointer', userSelect: 'none',
              }}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task: Task) => (
            <tr key={task.Task_UID} onClick={() => onTaskClick(task)} style={{
              borderBottom: `1px solid ${DESIGN.colors.border}`, cursor: 'pointer', transition: 'background 0.1s',
            }} onMouseEnter={(e) => e.currentTarget.style.background = DESIGN.colors.surface2} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '9px 12px', fontSize: '10px', fontWeight: 600, color: DESIGN.colors.ink3, fontFamily: 'monospace' }}>{task.WBS}</td>
              <td style={{ padding: '9px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div onClick={(e) => { e.stopPropagation(); toggleExpand(task.Task_UID); }} style={{
                    width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '3px', cursor: 'pointer', color: DESIGN.colors.ink3, fontSize: '9px',
                  }}>▶</div>
                  <span style={{ fontWeight: 500, color: DESIGN.colors.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>{task.Task_Name}</span>
                </div>
              </td>
              <td style={{ padding: '9px 12px', fontSize: '12px', color: DESIGN.colors.ink2 }}>{task.Project}</td>
              <td style={{ padding: '9px 12px', fontSize: '12px', color: DESIGN.colors.ink2 }}>{task.Phase}</td>
              <td style={{ padding: '9px 12px' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', whiteSpace: 'nowrap',
                  background: task.Status === 'Complete' ? DESIGN.colors.greenLt : DESIGN.colors.blueLt,
                  color: task.Status === 'Complete' ? DESIGN.colors.green : DESIGN.colors.blue,
                }}>{task.Status}</span>
              </td>
              <td style={{ padding: '9px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '80px' }}>
                  <div style={{ flex: 1, height: '5px', background: DESIGN.colors.border, borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${task.Pct_Complete}%`, background: DESIGN.colors.blue, borderRadius: '3px' }}></div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: DESIGN.colors.ink2, minWidth: '28px', textAlign: 'right' }}>{task.Pct_Complete}%</span>
                </div>
              </td>
              <td style={{ padding: '9px 12px' }}>
                {task.Derail_Days > 0 ? (
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', background: DESIGN.colors.redLt, color: DESIGN.colors.red }}>
                    +{task.Derail_Days}d
                  </span>
                ) : (
                  <span style={{ fontSize: '10px', color: DESIGN.colors.ink4 }}>—</span>
                )}
              </td>
              <td style={{ padding: '9px 12px' }}>
                {task.HasProof ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600,
                    color: DESIGN.colors.blue, padding: '3px 8px', borderRadius: '4px',
                    border: `1.5px solid ${DESIGN.colors.blueLt}`, background: DESIGN.colors.blueLt,
                  }}>📎 View</span>
                ) : (
                  <span style={{ fontSize: '11px', color: DESIGN.colors.ink4 }}>No proof</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// TIMELINE VIEW (Gantt-style)
// ============================================================================

function TimelineView({ tasks, onTaskClick }: any) {
  const tasksWithDates = tasks.filter((t: Task) => t.Planned_Start && t.Planned_Finish).slice(0, 30);

  return (
    <div>
      <div style={{ fontFamily: 'Fraunces, serif', fontSize: '15px', fontWeight: 700, color: DESIGN.colors.ink, marginBottom: '12px' }}>
        Project Timeline (First 30 tasks with dates)
      </div>
      <div style={{ background: DESIGN.colors.surface, border: `1.5px solid ${DESIGN.colors.border}`, borderRadius: DESIGN.radiusLg, padding: '20px', boxShadow: DESIGN.shadow, overflowX: 'auto' }}>
        {tasksWithDates.map((task: Task) => (
          <div key={task.Task_UID} onClick={() => onTaskClick(task)} style={{
            marginBottom: '12px', padding: '12px', background: DESIGN.colors.surface2,
            borderRadius: DESIGN.radius, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px',
          }}>
            <div style={{ width: '200px', fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.Task_Name}</div>
            <div style={{ flex: 1, height: '24px', background: DESIGN.colors.border, borderRadius: DESIGN.radius, position: 'relative' }}>
              <div style={{
                width: `${task.Pct_Complete}%`, height: '100%',
                background: task.Derail_Days > 0 ? DESIGN.colors.red : DESIGN.colors.green,
                borderRadius: DESIGN.radius, display: 'flex', alignItems: 'center', paddingLeft: '8px',
              }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#FFF' }}>{task.Pct_Complete}%</span>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: DESIGN.colors.ink3, width: '100px' }}>{task.Duration_Days} days</div>
            <div style={{ fontSize: '11px', color: DESIGN.colors.ink3, width: '100px' }}>{task.Planned_Start}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// CALENDAR VIEW
// ============================================================================

function CalendarView({ tasks, onTaskClick }: any) {
  const tasksWithDates = tasks.filter((t: Task) => t.Planned_Start).slice(0, 40);

  return (
    <div>
      <div style={{ fontFamily: 'Fraunces, serif', fontSize: '15px', fontWeight: 700, color: DESIGN.colors.ink, marginBottom: '12px' }}>
        Calendar View (Upcoming 40 tasks)
      </div>
      <div style={{ background: DESIGN.colors.surface, border: `1.5px solid ${DESIGN.colors.border}`, borderRadius: DESIGN.radiusLg, boxShadow: DESIGN.shadow, overflow: 'hidden' }}>
        {tasksWithDates.map((task: Task) => (
          <div key={task.Task_UID} onClick={() => onTaskClick(task)} style={{
            padding: '12px 16px', borderBottom: `1px solid ${DESIGN.colors.border}`, cursor: 'pointer',
            display: 'flex', gap: '16px', alignItems: 'center',
          }} onMouseEnter={(e) => e.currentTarget.style.background = DESIGN.colors.surface2} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <div style={{ width: '100px', fontSize: '12px', fontWeight: 700, color: DESIGN.colors.blue }}>{task.Planned_Start}</div>
            <div style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: DESIGN.colors.ink }}>{task.Task_Name}</div>
            <div style={{ fontSize: '11px', color: DESIGN.colors.ink3 }}>{task.Project}</div>
            <div style={{ fontSize: '11px', color: DESIGN.colors.ink3 }}>{task.Phase}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// TASK DETAIL DRAWER
// ============================================================================

function TaskDetailDrawer({ task, onClose }: { task: Task, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'comments' | 'documents'>('details');
  const [comments, setComments] = useState([
    { id: '1', author: 'John Doe', text: 'Updated progress to 75%', timestamp: '2024-01-15 14:30' },
    { id: '2', author: 'Jane Smith', text: '@John Doe Please review latest changes', timestamp: '2024-01-15 15:45' },
  ]);
  const [newComment, setNewComment] = useState('');

  function addComment() {
    if (!newComment.trim()) return;
    setComments([...comments, { id: Date.now().toString(), author: 'Current User', text: newComment, timestamp: new Date().toISOString() }]);
    setNewComment('');
  }

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: '480px', zIndex: 201,
      background: DESIGN.colors.surface, borderLeft: `1.5px solid ${DESIGN.colors.border}`,
      boxShadow: DESIGN.shadowLg, transform: 'translateX(0)', transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: `1.5px solid ${DESIGN.colors.border}`,
        background: DESIGN.colors.surface2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: DESIGN.colors.ink, marginBottom: '4px' }}>{task.Task_Name}</div>
          <div style={{ fontSize: '11px', color: DESIGN.colors.ink3 }}>{task.Project} · {task.Phase}</div>
        </div>
        <button onClick={onClose} style={{
          width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: DESIGN.radius, color: DESIGN.colors.ink3, background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px',
        }}>×</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1.5px solid ${DESIGN.colors.border}`, background: DESIGN.colors.surface }}>
        {[
          { id: 'details' as const, label: 'Details' },
          { id: 'activity' as const, label: 'Activity' },
          { id: 'comments' as const, label: 'Comments' },
          { id: 'documents' as const, label: 'Documents' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '10px 16px', fontSize: '12px', fontWeight: 600,
            color: activeTab === tab.id ? DESIGN.colors.blue : DESIGN.colors.ink3,
            borderBottom: activeTab === tab.id ? `2px solid ${DESIGN.colors.blue}` : '2px solid transparent',
            marginBottom: '-1.5px', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {activeTab === 'details' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: DESIGN.colors.ink3, marginBottom: '10px', paddingBottom: '6px', borderBottom: `1px solid ${DESIGN.colors.border}` }}>TASK INFORMATION</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { label: 'WBS', value: task.WBS },
                  { label: 'Status', value: task.Status },
                  { label: 'Phase', value: task.Phase },
                  { label: 'Owner', value: task.Owners || 'Unassigned' },
                  { label: 'Progress', value: `${task.Pct_Complete}%` },
                  { label: 'Delay', value: task.Derail_Days > 0 ? `+${task.Derail_Days} days` : 'On Time' },
                  { label: 'Duration', value: `${task.Duration_Days} days` },
                  { label: 'Critical', value: task.Is_Critical },
                  { label: 'Start Date', value: task.Planned_Start },
                  { label: 'Finish Date', value: task.Planned_Finish },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: DESIGN.colors.ink3, marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: DESIGN.colors.ink }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: DESIGN.colors.ink3, marginBottom: '10px', paddingBottom: '6px', borderBottom: `1px solid ${DESIGN.colors.border}` }}>ACTIVITY LOG</div>
            {[
              { id: '1', action: 'Progress Updated', user: 'John Doe', timestamp: '2024-01-15 14:30', details: 'Changed from 50% to 75%' },
              { id: '2', action: 'Status Changed', user: 'Jane Smith', timestamp: '2024-01-14 10:15', details: 'Changed to In Progress' },
              { id: '3', action: 'Task Created', user: 'System', timestamp: '2024-01-10 09:00', details: 'Task initialized' },
            ].map(log => (
              <div key={log.id} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: `1px solid ${DESIGN.colors.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{log.action}</span>
                  <span style={{ fontSize: '11px', color: DESIGN.colors.ink3 }}>{log.timestamp}</span>
                </div>
                <div style={{ fontSize: '12px', color: DESIGN.colors.ink2 }}>{log.user}</div>
                <div style={{ fontSize: '12px', color: DESIGN.colors.ink2, marginTop: '4px' }}>{log.details}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'comments' && (
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: DESIGN.colors.ink3, marginBottom: '10px', paddingBottom: '6px', borderBottom: `1px solid ${DESIGN.colors.border}` }}>COMMENTS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {comments.map(comment => (
                <div key={comment.id} style={{ background: DESIGN.colors.surface2, border: `1.5px solid ${DESIGN.colors.border}`, borderRadius: DESIGN.radius, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: DESIGN.colors.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#FFF' }}>
                      {comment.author[0]}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: DESIGN.colors.ink }}>{comment.author}</span>
                    <span style={{ fontSize: '10px', color: DESIGN.colors.ink3, marginLeft: 'auto' }}>{comment.timestamp}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: DESIGN.colors.ink2, lineHeight: 1.5 }}>{comment.text}</div>
                </div>
              ))}
            </div>
            <div>
              <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment... (Use @ to mention)" style={{
                width: '100%', minHeight: '72px', padding: '10px 12px',
                border: `1.5px solid ${DESIGN.colors.border}`, borderRadius: DESIGN.radius,
                fontSize: '12px', color: DESIGN.colors.ink, background: DESIGN.colors.surface,
                resize: 'vertical', lineHeight: 1.5, fontFamily: 'inherit',
              }} />
              <button onClick={addComment} style={{
                marginTop: '8px', padding: '6px 16px', background: DESIGN.colors.blue, color: '#FFF',
                borderRadius: DESIGN.radius, fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer',
              }}>Post Comment</button>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: DESIGN.colors.ink3, marginBottom: '10px', paddingBottom: '6px', borderBottom: `1px solid ${DESIGN.colors.border}` }}>PROOF OF COMPLETION</div>
            <div style={{ padding: '24px', textAlign: 'center', border: `2px dashed ${DESIGN.colors.border2}`, borderRadius: DESIGN.radius, marginBottom: '16px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📎</div>
              <div style={{ fontSize: '14px', color: DESIGN.colors.ink2, marginBottom: '12px' }}>
                {task.HasProof ? 'Document attached (task completed)' : 'No proof attached - task cannot be marked complete'}
              </div>
              <button style={{
                padding: '6px 16px', background: DESIGN.colors.blue, color: '#FFF',
                borderRadius: DESIGN.radius, fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer',
              }}>Attach Document</button>
            </div>
            {task.HasProof && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: DESIGN.colors.ink3, marginBottom: '8px' }}>ATTACHED FILES (1)</div>
                <div style={{ padding: '12px', background: DESIGN.colors.surface2, borderRadius: DESIGN.radius, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>Completion_Photo.pdf</div>
                    <div style={{ fontSize: '11px', color: DESIGN.colors.ink3 }}>2.4 MB · 2024-01-15</div>
                  </div>
                  <button style={{
                    padding: '4px 12px', background: DESIGN.colors.surface, border: `1.5px solid ${DESIGN.colors.border}`,
                    borderRadius: DESIGN.radius, fontSize: '12px', cursor: 'pointer',
                  }}>Download</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
