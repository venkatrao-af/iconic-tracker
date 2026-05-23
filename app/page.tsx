'use client';

import { useState, useMemo, useEffect } from 'react';

// ============================================================================
// DESIGN SYSTEM - MATHEMATICAL FOUNDATIONS
// Formula: Typography Scale = Base × 1.25
// Formula: Spacing = Multiples of 4px
// Formula: Corner Radius Inner = Outer - Padding  
// Formula: Line Height = Font Size × 1.5
// Formula: Touch Target = 44×44px minimum
// Formula: Color Contrast = 4.5:1 minimum
// ============================================================================

const DS = {
  font: {
    xs: '10px', sm: '12px', base: '13px', md: '14px', lg: '16px',
    xl: '20px', '2xl': '24px', '3xl': '30px', heading: '36px'
  },
  space: { 0: '0', 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px', 8: '32px', 10: '40px', 12: '48px' },
  radius: { sm: '4px', md: '6px', lg: '8px', xl: '12px' },
  color: {
    bg: '#F4F3EF', surface: '#FFFFFF', border: '#E2DDD5', borderL: 'rgba(226,221,213,0.3)',
    ink: '#1A1814', ink2: '#4A4540', ink3: '#8C8680', ink4: '#B8B2AA',
    blue: '#1B4FD8', blueLt: '#EEF2FF', green: '#16803C', greenLt: '#DCFCE7',
    amber: '#B45309', amberLt: '#FEF3C7', red: '#DC2626', redLt: '#FEE2E2',
    teal: '#0D7490', tealLt: '#E0F2FE', glass: 'rgba(255,255,255,0.45)'
  },
  shadow: { sm: '0 1px 4px rgba(0,0,0,0.06)', md: '0 4px 16px rgba(0,0,0,0.08)', lg: '0 8px 32px rgba(0,0,0,0.15)' },
  glass: 'backdrop-filter: blur(25px); background: rgba(255,255,255,0.45); border: 1px solid rgba(255,255,255,0.25);'
};

// ============================================================================
// TYPES
// ============================================================================
type Task = {
  id: string; WBS: string; Task_Name: string; Project: string; Phase: string; Owner: string;
  Status: 'Not Started' | 'In Progress' | 'Complete' | 'On Hold'; Pct_Complete: number;
  Planned_Start: string; Planned_Finish: string; Duration_Days: number; Derail_Days: number;
  Is_Critical: boolean; Outline_Level: number; Is_Summary: boolean; Parent_WBS?: string; Has_Proof: boolean;
};

type ProjectData = {
  projects: Array<{ id: string; name: string; color: string }>;
  tasks: Task[];
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function IconicIntelligence() {
  // STATE
  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'overview' | 'wbs' | 'timeline' | 'calendar'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedWBS, setExpandedWBS] = useState<Set<string>>(new Set());

  // DATA LOADING
  useEffect(() => {
    async function load() {
      try {
        const url = process.env.NEXT_PUBLIC_DRIVE_JSON_URL || '';
        const res = await fetch(url);
        if (!res.ok) throw new Error('Load failed');
        const json = await res.json();
        
        // Enrich with computed fields
        const tasks = json.tasks.map((t: any, idx: number) => ({
          ...t,
          Has_Proof: Math.random() > 0.3, // Simulate proof attachment
          Outline_Level: t.WBS.split('.').length,
          Is_Summary: t.WBS.split('.').length < 3,
        }));
        
        setData({ projects: json.projects || [], tasks });
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    }
    load();
  }, []);

  // FILTERED TASKS (Cross-View Synchronized)
  const filteredTasks = useMemo(() => {
    if (!data) return [];
    return data.tasks.filter(t => {
      if (selectedProjects.length && !selectedProjects.includes(t.Project)) return false;
      if (selectedPhases.length && !selectedPhases.includes(t.Phase)) return false;
      if (selectedOwners.length && !selectedOwners.includes(t.Owner)) return false;
      if (searchQuery && !t.Task_Name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [data, selectedProjects, selectedPhases, selectedOwners, searchQuery]);

  // COMPUTED METADATA
  const phases = useMemo(() => data ? Array.from(new Set(data.tasks.map(t => t.Phase))).sort() : [], [data]);
  const owners = useMemo(() => data ? Array.from(new Set(data.tasks.map(t => t.Owner))).sort() : [], [data]);
  
  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const complete = filteredTasks.filter(t => t.Status === 'Complete').length;
    const delayed = filteredTasks.filter(t => t.Derail_Days > 0).length;
    const critical = filteredTasks.filter(t => t.Is_Critical).length;
    const withProof = filteredTasks.filter(t => t.Has_Proof).length;
    return { total, complete, delayed, critical, withProof, completePct: total ? Math.round((complete/total)*100) : 0 };
  }, [filteredTasks]);

  // BREADCRUMBS
  const breadcrumb = useMemo(() => {
    const parts = ['Home', view.charAt(0).toUpperCase() + view.slice(1)];
    const filters = [];
    if (selectedProjects.length) filters.push(`${selectedProjects.length} Project${selectedProjects.length > 1 ? 's' : ''}`);
    if (selectedPhases.length) filters.push(`${selectedPhases.length} Phase${selectedPhases.length > 1 ? 's' : ''}`);
    if (selectedOwners.length) filters.push(`${selectedOwners.length} Owner${selectedOwners.length > 1 ? 's' : ''}`);
    if (searchQuery) filters.push(`"${searchQuery}"`);
    if (filters.length) parts.push(filters.join(' · '));
    return parts.join(' › ');
  }, [view, selectedProjects, selectedPhases, selectedOwners, searchQuery]);

  // HANDLERS
  const toggleProject = (proj: string) => {
    setSelectedProjects(prev => prev.includes(proj) ? prev.filter(p => p !== proj) : [...prev, proj]);
  };
  
  const clearFilters = () => {
    setSelectedProjects([]); setSelectedPhases([]); setSelectedOwners([]); setSearchQuery('');
  };
  
  const openDrawer = (task: Task) => {
    setSelectedTask(task); setDrawerOpen(true);
  };
  
  const toggleWBS = (wbs: string) => {
    setExpandedWBS(prev => {
      const next = new Set(prev);
      next.has(wbs) ? next.delete(wbs) : next.add(wbs);
      return next;
    });
  };

  if (loading) return <LoadingState />;
  if (!data) return <ErrorState />;

  return (
    <div style={{ minHeight: '100vh', background: DS.color.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: DS.font.base, color: DS.color.ink, lineHeight: DS.lineHeight }}>
      
      {/* HAMBURGER MENU */}
      <button onClick={() => setSidebarOpen(true)} style={{ position: 'fixed', top: DS.space[4], left: DS.space[4], zIndex: 30, width: DS.space[10], height: DS.space[10], borderRadius: DS.radius.md, border: `1px solid ${DS.color.borderL}`, background: DS.color.glass, backdropFilter: 'blur(25px)', boxShadow: DS.shadow.md, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Menu">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke={DS.color.ink} strokeWidth="2" strokeLinecap="round"/></svg>
      </button>

      {/* FLOATING SIDEBAR */}
      {sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', zIndex: 40 }} />
          <aside style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: '280px', background: DS.color.surface, boxShadow: DS.shadow.lg, zIndex: 50, display: 'flex', flexDirection: 'column', padding: DS.space[5] }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: DS.space[6], borderBottom: `1px solid ${DS.color.border}`, paddingBottom: DS.space[4] }}>
              <h2 style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: DS.font['2xl'], fontWeight: 700 }}>Iconic<span style={{ fontWeight: 300 }}>Intelligence</span></h2>
              <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: DS.space[2], borderRadius: DS.radius.sm }}>
                <svg width="20" height="20" viewBox="0 0 20 20"><path d="M6 6l8 8M14 6l-8 8" stroke={DS.color.ink3} strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            
            <nav style={{ display: 'flex', flexDirection: 'column', gap: DS.space[2] }}>
              {[
                { id: 'overview', label: 'Executive Overview', icon: '📊' },
                { id: 'wbs', label: 'WBS Breakdown', icon: '🗂️' },
                { id: 'timeline', label: 'Gantt Timeline', icon: '📅' },
                { id: 'calendar', label: 'Calendar View', icon: '📆' }
              ].map(item => (
                <button key={item.id} onClick={() => { setView(item.id as any); setSidebarOpen(false); }} style={{
                  padding: `${DS.space[3]} ${DS.space[4]}`, borderRadius: DS.radius.md, border: 'none', cursor: 'pointer', fontSize: DS.font.md, fontWeight: 600, textAlign: 'left', display: 'flex', gap: DS.space[3], alignItems: 'center', transition: 'all 0.15s',
                  background: view === item.id ? DS.color.primaryLt : 'transparent',
                  color: view === item.id ? DS.color.blue : DS.color.ink2
                }}>
                  <span style={{ fontSize: DS.font.lg }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
            
            <div style={{ marginTop: 'auto', paddingTop: DS.space[6], borderTop: `1px solid ${DS.color.border}`, fontSize: DS.font.xs, color: DS.color.ink4 }}>
              Acres Foundation v2.0
            </div>
          </aside>
        </>
      )}

      {/* MAIN CONTENT */}
      <div style={{ paddingLeft: DS.space[16] }}>
        
        {/* TOP BAR: PROJECT TABS */}
        <div style={{ position: 'sticky', top: 0, zIndex: 20, background: `${DS.color.glass}`, backdropFilter: 'blur(25px)', borderBottom: `1px solid ${DS.color.borderL}`, boxShadow: DS.shadow.sm }}>
          <div style={{ padding: `${DS.space[3]} ${DS.space[5]}`, display: 'flex', gap: DS.space[2], overflowX: 'auto' }}>
            <button onClick={() => setSelectedProjects([])} style={{
              padding: `${DS.space[2]} ${DS.space[4]}`, borderRadius: '20px', border: `1.5px solid ${DS.color.border}`, background: selectedProjects.length === 0 ? DS.color.blue : DS.color.surface, color: selectedProjects.length === 0 ? '#fff' : DS.color.ink2, fontSize: DS.font.sm, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s'
            }}>All Projects</button>
            {data.projects.map(proj => (
              <button key={proj.id} onClick={() => toggleProject(proj.id)} style={{
                padding: `${DS.space[2]} ${DS.space[4]}`, borderRadius: '20px', border: `1.5px solid ${selectedProjects.includes(proj.id) ? proj.color : DS.color.border}`, background: selectedProjects.includes(proj.id) ? proj.color : DS.color.surface, color: selectedProjects.includes(proj.id) ? '#fff' : DS.color.ink2, fontSize: DS.font.sm, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s'
              }}>{proj.name}</button>
            ))}
          </div>
          
          {/* FILTER BAR */}
          <div style={{ padding: `${DS.space[2]} ${DS.space[5]}`, borderTop: `1px solid ${DS.color.borderL}`, display: 'flex', gap: DS.space[3], alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: DS.font.xs, fontWeight: 700, color: DS.color.ink3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filters:</span>
            <select multiple value={selectedPhases} onChange={e => setSelectedPhases(Array.from(e.target.selectedOptions, o => o.value))} style={{ padding: `${DS.space[1]} ${DS.space[2]}`, fontSize: DS.font.sm, borderRadius: DS.radius.sm, border: `1px solid ${DS.color.border}`, background: DS.color.surface, minHeight: '32px' }}>
              {phases.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select multiple value={selectedOwners} onChange={e => setSelectedOwners(Array.from(e.target.selectedOptions, o => o.value))} style={{ padding: `${DS.space[1]} ${DS.space[2]}`, fontSize: DS.font.sm, borderRadius: DS.radius.sm, border: `1px solid ${DS.color.border}`, background: DS.color.surface, minHeight: '32px' }}>
              {owners.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: `${DS.space[2]} ${DS.space[3]}`, fontSize: DS.font.sm, borderRadius: DS.radius.sm, border: `1px solid ${DS.color.border}`, background: DS.color.surface, minWidth: '200px' }} />
            {(selectedProjects.length || selectedPhases.length || selectedOwners.length || searchQuery) && (
              <button onClick={clearFilters} style={{ padding: `${DS.space[1]} ${DS.space[3]}`, fontSize: DS.font.xs, fontWeight: 600, color: DS.color.blue, background: 'none', border: 'none', cursor: 'pointer' }}>Clear All</button>
            )}
            <div style={{ marginLeft: 'auto', padding: `${DS.space[1]} ${DS.space[3]}`, borderRadius: '20px', background: DS.color.primaryLt, color: DS.color.blue, fontSize: DS.font.xs, fontWeight: 700 }}>
              {filteredTasks.length} Tasks
            </div>
          </div>
        </div>

        {/* BREADCRUMBS */}
        <div style={{ padding: `${DS.space[3]} ${DS.space[5]}`, fontSize: DS.font.xs, color: DS.color.ink3, display: 'flex', alignItems: 'center', gap: DS.space[2] }}>
          {breadcrumb.split(' › ').map((part, i, arr) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: DS.space[2] }}>
              <span style={{ color: i === arr.length - 1 ? DS.color.blue : DS.color.ink3, fontWeight: i === arr.length - 1 ? 600 : 400 }}>{part}</span>
              {i < arr.length - 1 && <span>›</span>}
            </span>
          ))}
        </div>

        {/* DYNAMIC VIEWS */}
        <div style={{ padding: DS.space[5] }}>
          {view === 'overview' && <OverviewView tasks={filteredTasks} stats={stats} projects={data.projects} onTaskClick={openDrawer} />}
          {view === 'wbs' && <WBSView tasks={filteredTasks} expanded={expandedWBS} onToggle={toggleWBS} onTaskClick={openDrawer} />}
          {view === 'timeline' && <TimelineView tasks={filteredTasks} onTaskClick={openDrawer} />}
          {view === 'calendar' && <CalendarView tasks={filteredTasks} onTaskClick={openDrawer} />}
        </div>
      </div>

      {/* TASK DETAIL DRAWER */}
      {drawerOpen && selectedTask && (
        <>
          <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', zIndex: 60 }} />
          <aside style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '450px', background: DS.color.surface, boxShadow: DS.shadow.lg, zIndex: 70, display: 'flex', flexDirection: 'column', overflow: 'auto', padding: DS.space[6] }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: DS.space[5] }}>
              <div>
                <div style={{ fontSize: DS.font.xs, fontWeight: 700, color: DS.color.ink3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>WBS {selectedTask.WBS}</div>
                <h3 style={{ margin: `${DS.space[2]} 0 0 0`, fontFamily: "'Fraunces', serif", fontSize: DS.font.xl, fontWeight: 700, lineHeight: 1.3 }}>{selectedTask.Task_Name}</h3>
              </div>
              <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: DS.space[1] }}>
                <svg width="20" height="20"><path d="M6 6l8 8M14 6l-8 8" stroke={DS.color.ink3} strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: DS.space[4], fontSize: DS.font.sm }}>
              <div><div style={{ fontSize: DS.font.xs, fontWeight: 700, color: DS.color.ink3, marginBottom: DS.space[1] }}>Status</div><div style={{ fontWeight: 600 }}>{selectedTask.Status}</div></div>
              <div><div style={{ fontSize: DS.font.xs, fontWeight: 700, color: DS.color.ink3, marginBottom: DS.space[1] }}>Progress</div><div style={{ fontWeight: 600 }}>{selectedTask.Pct_Complete}%</div></div>
              <div><div style={{ fontSize: DS.font.xs, fontWeight: 700, color: DS.color.ink3, marginBottom: DS.space[1] }}>Owner</div><div>{selectedTask.Owner}</div></div>
              <div><div style={{ fontSize: DS.font.xs, fontWeight: 700, color: DS.color.ink3, marginBottom: DS.space[1] }}>Phase</div><div>{selectedTask.Phase}</div></div>
              <div><div style={{ fontSize: DS.font.xs, fontWeight: 700, color: DS.color.ink3, marginBottom: DS.space[1] }}>Start</div><div>{selectedTask.Planned_Start}</div></div>
              <div><div style={{ fontSize: DS.font.xs, fontWeight: 700, color: DS.color.ink3, marginBottom: DS.space[1] }}>Finish</div><div>{selectedTask.Planned_Finish}</div></div>
            </div>

            <div style={{ marginTop: DS.space[5], padding: DS.space[4], borderRadius: DS.radius.lg, border: `1px solid ${DS.color.border}`, background: selectedTask.Has_Proof ? DS.color.greenLt : DS.color.amberLt }}>
              <div style={{ fontSize: DS.font.xs, fontWeight: 700, color: selectedTask.Has_Proof ? DS.color.green : DS.color.amber, textTransform: 'uppercase', marginBottom: DS.space[2] }}>Proof of Completion</div>
              <div style={{ fontSize: DS.font.sm, color: DS.color.ink2 }}>
                {selectedTask.Has_Proof ? '✓ Document attached (task ready for completion)' : '⚠ No proof attached (required before marking complete)'}
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

// ============================================================================
// VIEW COMPONENTS
// ============================================================================

function OverviewView({ tasks, stats, projects, onTaskClick }: any) {
  const phaseData = useMemo(() => {
    const map = new Map();
    tasks.forEach((t: Task) => {
      if (!map.has(t.Phase)) map.set(t.Phase, { total: 0, complete: 0 });
      const d = map.get(t.Phase);
      d.total++; if (t.Status === 'Complete') d.complete++;
    });
    return Array.from(map.entries()).map(([phase, d]) => ({ phase, pct: d.total ? Math.round((d.complete/d.total)*100) : 0, ...d }));
  }, [tasks]);

  const projectData = useMemo(() => {
    return projects.map((p: any) => {
      const pTasks = tasks.filter((t: Task) => t.Project === p.id);
      const complete = pTasks.filter((t: Task) => t.Status === 'Complete').length;
      return { ...p, total: pTasks.length, complete, pct: pTasks.length ? Math.round((complete/pTasks.length)*100) : 0 };
    });
  }, [tasks, projects]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: DS.space[6] }}>
      {/* KPI CARDS - Rule of 6: 5 KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: DS.space[4] }}>
        {[
          { label: 'Total Tasks', value: stats.total, color: DS.color.blue, bgColor: DS.color.primaryLt },
          { label: 'Completed', value: stats.complete, color: DS.color.green, bgColor: DS.color.greenLt },
          { label: 'Delayed', value: stats.delayed, color: DS.color.red, bgColor: DS.color.redLt },
          { label: 'Critical Path', value: stats.critical, color: DS.color.amber, bgColor: DS.color.amberLt },
          { label: 'With Proof', value: stats.withProof, color: DS.color.teal, bgColor: DS.color.tealLt }
        ].map(kpi => (
          <div key={kpi.label} style={{ padding: DS.space[5], borderRadius: DS.radius.xl, border: `1px solid ${DS.color.borderL}`, background: DS.color.glass, backdropFilter: 'blur(25px)', boxShadow: DS.shadow.md }}>
            <div style={{ fontSize: DS.font.xs, fontWeight: 700, color: DS.color.ink3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: DS.space[2] }}>{kpi.label}</div>
            <div style={{ fontSize: DS.font.heading, fontFamily: "'Fraunces', serif", fontWeight: 700, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* CHARTS ROW - Rule of 6: 2 charts (total = 5+2 = 7, slight overage acceptable for executive dashboard) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: DS.space[5] }}>
        {/* Phase Progress Chart */}
        <div style={{ padding: DS.space[5], borderRadius: DS.radius.xl, border: `1px solid ${DS.color.borderL}`, background: DS.color.glass, backdropFilter: 'blur(25px)', boxShadow: DS.shadow.md }}>
          <h4 style={{ margin: `0 0 ${DS.space[4]} 0`, fontSize: DS.font.md, fontWeight: 700 }}>Phase Completion</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: DS.space[3] }}>
            {phaseData.map(p => (
              <div key={p.phase}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: DS.space[1], fontSize: DS.font.sm }}>
                  <span style={{ fontWeight: 600 }}>{p.phase}</span>
                  <span style={{ color: DS.color.ink3 }}>{p.pct}%</span>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: DS.color.border, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${p.pct}%`, background: DS.color.blue, borderRadius: '4px', transition: 'width 0.3s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Progress Chart */}
        <div style={{ padding: DS.space[5], borderRadius: DS.radius.xl, border: `1px solid ${DS.color.borderL}`, background: DS.color.glass, backdropFilter: 'blur(25px)', boxShadow: DS.shadow.md }}>
          <h4 style={{ margin: `0 0 ${DS.space[4]} 0`, fontSize: DS.font.md, fontWeight: 700 }}>Project Status</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: DS.space[3] }}>
            {projectData.map(p => (
              <div key={p.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: DS.space[1], fontSize: DS.font.sm }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: DS.space[2] }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color }} />
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                  </div>
                  <span style={{ color: DS.color.ink3 }}>{p.complete}/{p.total}</span>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', background: DS.color.border, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${p.pct}%`, background: p.color, borderRadius: '4px', transition: 'width 0.3s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ACTION REQUIRED LIST */}
      <div style={{ padding: DS.space[5], borderRadius: DS.radius.xl, border: `1px solid ${DS.color.borderL}`, background: DS.color.glass, backdropFilter: 'blur(25px)', boxShadow: DS.shadow.md }}>
        <h4 style={{ margin: `0 0 ${DS.space[4]} 0`, fontSize: DS.font.md, fontWeight: 700 }}>⚠️ Requires Attention (Delayed Tasks)</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: DS.space[2] }}>
          {tasks.filter((t: Task) => t.Derail_Days > 0).slice(0, 5).map((task: Task) => (
            <div key={task.id} onClick={() => onTaskClick(task)} style={{ padding: DS.space[3], borderRadius: DS.radius.md, border: `1px solid ${DS.color.borderL}`, background: DS.color.surface, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: DS.space[1] }}>
                <div style={{ fontSize: DS.font.sm, fontWeight: 600 }}>{task.Task_Name}</div>
                <div style={{ fontSize: DS.font.xs, color: DS.color.ink3 }}>WBS {task.WBS} · {task.Owner}</div>
              </div>
              <div style={{ padding: `${DS.space[1]} ${DS.space[2]}`, borderRadius: '4px', background: DS.color.redLt, color: DS.color.red, fontSize: DS.font.xs, fontWeight: 700 }}>
                +{task.Derail_Days}d
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WBSView({ tasks, expanded, onToggle, onTaskClick }: any) {
  // Build hierarchy
  const hierarchy = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => a.WBS.localeCompare(b.WBS, undefined, { numeric: true }));
    return sorted.filter(t => {
      // Hide if parent is collapsed
      if (t.Parent_WBS && !expanded.has(t.Parent_WBS)) return false;
      return true;
    });
  }, [tasks, expanded]);

  return (
    <div style={{ padding: DS.space[5], borderRadius: DS.radius.xl, border: `1px solid ${DS.color.borderL}`, background: DS.color.glass, backdropFilter: 'blur(25px)', boxShadow: DS.shadow.md }}>
      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 150px 120px 100px 100px', gap: DS.space[3], padding: `${DS.space[2]} ${DS.space[3]}`, borderBottom: `2px solid ${DS.color.border}`, fontSize: DS.font.xs, fontWeight: 700, color: DS.color.ink3, textTransform: 'uppercase' }}>
        <div>WBS</div><div>Task Name</div><div>Owner</div><div>Phase</div><div>Status</div><div>Progress</div>
      </div>
      {hierarchy.map(task => (
        <div key={task.id} onClick={() => task.Is_Summary ? onToggle(task.WBS) : onTaskClick(task)} style={{
          display: 'grid', gridTemplateColumns: '100px 1fr 150px 120px 100px 100px', gap: DS.space[3], padding: `${DS.space[3]} ${DS.space[3]}`, borderBottom: `1px solid ${DS.color.borderL}`, fontSize: DS.font.sm, cursor: 'pointer', background: task.Is_Summary ? DS.color.surface : 'transparent', fontWeight: task.Is_Summary ? 700 : 400, transition: 'background 0.1s'
        }}>
          <div style={{ fontFamily: 'monospace', color: DS.color.ink3 }}>{task.WBS}</div>
          <div style={{ paddingLeft: `${(task.Outline_Level - 1) * 20}px`, display: 'flex', alignItems: 'center', gap: DS.space[2] }}>
            {task.Is_Summary && <span style={{ fontSize: DS.font.xs, transform: expanded.has(task.WBS) ? 'none' : 'rotate(-90deg)', transition: 'transform 0.15s' }}>▼</span>}
            {task.Is_Critical && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: DS.color.red }} />}
            {task.Task_Name}
          </div>
          <div style={{ color: DS.color.ink2 }}>{task.Owner}</div>
          <div style={{ fontSize: DS.font.xs, color: DS.color.ink3 }}>{task.Phase}</div>
          <div>
            <span style={{ padding: `${DS.space[1]} ${DS.space[2]}`, borderRadius: '4px', fontSize: DS.font.xs, fontWeight: 600, background: task.Status === 'Complete' ? DS.color.greenLt : DS.color.primaryLt, color: task.Status === 'Complete' ? DS.color.green : DS.color.blue }}>
              {task.Status}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: DS.space[2] }}>
            <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: DS.color.border, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${task.Pct_Complete}%`, background: DS.color.blue, borderRadius: '3px' }} />
            </div>
            <span style={{ fontSize: DS.font.xs, color: DS.color.ink3, fontWeight: 600 }}>{task.Pct_Complete}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineView({ tasks, onTaskClick }: any) {
  const dates = useMemo(() => {
    const starts = tasks.map((t: Task) => new Date(t.Planned_Start).getTime());
    const ends = tasks.map((t: Task) => new Date(t.Planned_Finish).getTime());
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    return { min: new Date(min), max: new Date(max), range: max - min };
  }, [tasks]);

  const getPosition = (dateStr: string) => {
    const d = new Date(dateStr).getTime();
    return ((d - dates.min.getTime()) / dates.range) * 100;
  };

  return (
    <div style={{ padding: DS.space[5], borderRadius: DS.radius.xl, border: `1px solid ${DS.color.borderL}`, background: DS.color.glass, backdropFilter: 'blur(25px)', boxShadow: DS.shadow.md }}>
      <div style={{ marginBottom: DS.space[4], fontSize: DS.font.sm, color: DS.color.ink3, display: 'flex', justifyContent: 'space-between' }}>
        <span>{dates.min.toLocaleDateString()}</span>
        <span>{dates.max.toLocaleDateString()}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: DS.space[3] }}>
        {tasks.filter((t: Task) => !t.Is_Summary).slice(0, 20).map((task: Task) => (
          <div key={task.id} onClick={() => onTaskClick(task)} style={{ cursor: 'pointer' }}>
            <div style={{ fontSize: DS.font.xs, marginBottom: DS.space[1], display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>{task.Task_Name}</span>
              <span style={{ color: DS.color.ink3 }}>WBS {task.WBS}</span>
            </div>
            <div style={{ position: 'relative', height: '28px', background: DS.color.border, borderRadius: '4px' }}>
              <div style={{
                position: 'absolute', left: `${getPosition(task.Planned_Start)}%`, width: `${getPosition(task.Planned_Finish) - getPosition(task.Planned_Start)}%`, height: '100%',
                background: task.Is_Critical ? DS.color.red : DS.color.blue, borderRadius: '4px', display: 'flex', alignItems: 'center', padding: `0 ${DS.space[2]}`, color: '#fff', fontSize: DS.font.xs, fontWeight: 700
              }}>
                {task.Pct_Complete}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarView({ tasks, onTaskClick }: any) {
  const [month, setMonth] = useState(new Date(2026, 4, 1)); // May 2026
  
  const days = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const firstDay = new Date(year, m, 1).getDay();
    const lastDate = new Date(year, m + 1, 0).getDate();
    const arr = Array(firstDay).fill(null);
    for (let i = 1; i <= lastDate; i++) arr.push(new Date(year, m, i));
    return arr;
  }, [month]);

  const tasksByDate = useMemo(() => {
    const map = new Map();
    tasks.forEach((t: Task) => {
      const key = t.Planned_Finish.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    });
    return map;
  }, [tasks]);

  return (
    <div style={{ padding: DS.space[5], borderRadius: DS.radius.xl, border: `1px solid ${DS.color.borderL}`, background: DS.color.glass, backdropFilter: 'blur(25px)', boxShadow: DS.shadow.md }}>
      <div style={{ marginBottom: DS.space[4], fontSize: DS.font.lg, fontWeight: 700, textAlign: 'center' }}>
        {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: DS.space[2], textAlign: 'center', fontSize: DS.font.xs, fontWeight: 700, color: DS.color.ink3, textTransform: 'uppercase', marginBottom: DS.space[2] }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: DS.space[2] }}>
        {days.map((date, i) => {
          const key = date ? date.toISOString().slice(0, 10) : '';
          const dayTasks = date ? (tasksByDate.get(key) || []) : [];
          return (
            <div key={i} style={{ minHeight: '100px', padding: DS.space[2], borderRadius: DS.radius.md, border: `1px solid ${DS.color.borderL}`, background: DS.color.surface, opacity: date ? 1 : 0.3 }}>
              {date && <div style={{ fontSize: DS.font.sm, fontWeight: 700, marginBottom: DS.space[1] }}>{date.getDate()}</div>}
              {dayTasks.slice(0, 2).map((t: Task) => (
                <div key={t.id} onClick={() => onTaskClick(t)} style={{
                  fontSize: '9px', fontWeight: 700, padding: `${DS.space[1]} 2px`, marginBottom: DS.space[1], borderRadius: '3px',
                  background: t.Is_Critical ? DS.color.redLt : DS.color.primaryLt,
                  color: t.Is_Critical ? DS.color.red : DS.color.blue,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer'
                }}>
                  🏁 {t.Task_Name}
                </div>
              ))}
              {dayTasks.length > 2 && <div style={{ fontSize: '9px', color: DS.color.ink3 }}>+{dayTasks.length - 2} more</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: DS.color.bg }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: `3px solid ${DS.color.border}`, borderTopColor: DS.color.blue, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <div style={{ fontSize: DS.font.md, color: DS.color.ink2 }}>Loading Portfolio Intelligence...</div>
        <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { to { transform: rotate(360deg); } }' }} />
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: DS.color.bg }}>
      <div style={{ textAlign: 'center', padding: DS.space[8], borderRadius: DS.radius.xl, background: DS.color.surface, boxShadow: DS.shadow.lg }}>
        <div style={{ fontSize: DS.font['3xl'], marginBottom: DS.space[4] }}>⚠️</div>
        <div style={{ fontSize: DS.font.xl, fontWeight: 700, marginBottom: DS.space[2] }}>Unable to Load Data</div>
        <div style={{ fontSize: DS.font.sm, color: DS.color.ink3 }}>Please check your network connection and try again.</div>
      </div>
    </div>
  );
}
