'use client';

import { useEffect, useState, useMemo } from 'react';

// ============================================================================
// DESIGN SYSTEM - Professional Light Theme
// Based on 8px grid, mathematical spacing, proper contrast ratios
// ============================================================================

const DESIGN = {
  // Color System - Professional Light Theme (WCAG AAA compliant)
  colors: {
    // Primary
    primary: '#0F766E',      // Teal 700
    primaryLight: '#14B8A6', // Teal 500
    primaryDark: '#115E59',  // Teal 800
    
    // Semantic
    success: '#059669',   // Green 600
    warning: '#D97706',   // Amber 600
    danger: '#DC2626',    // Red 600
    info: '#2563EB',      // Blue 600
    
    // Neutrals (4.5:1 minimum contrast)
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
    
    // Surface
    background: '#FFFFFF',
    surface: '#FAFAFA',
    surfaceHover: '#F5F5F5',
  },
  
  // Typography Scale (1.25 ratio)
  typography: {
    xs: '12px',    // Line height: 16.8px (12 × 1.4)
    sm: '13px',    // Line height: 18.2px
    base: '14px',  // Line height: 19.6px
    md: '16px',    // Line height: 22.4px
    lg: '18px',    // Line height: 25.2px
    xl: '20px',    // Line height: 28px
    '2xl': '24px', // Line height: 33.6px
    '3xl': '30px', // Line height: 42px
  },
  
  // Spacing Scale (8px baseline)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
    '4xl': '64px',
  },
  
  // Border Radius (nested formula: inner = outer - padding)
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  
  // Shadows (layered depth)
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  
  // Touch Targets (44×44px minimum)
  touchTarget: '44px',
  
  // Transitions
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

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
  WBS: string;
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

interface Filters {
  selectedProjects: string[];
  selectedPhases: string[];
  selectedOwners: string[];
  selectedStatus: string[];
  searchQuery: string;
}

type ViewMode = 'portfolio' | 'gantt' | 'calendar' | 'list' | 'insights';

// ============================================================================
// MAIN APPLICATION
// ============================================================================

export default function IconicSaaS() {
  // State Management
  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<ViewMode>('portfolio');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    selectedProjects: [],
    selectedPhases: [],
    selectedOwners: [],
    selectedStatus: [],
    searchQuery: '',
  });

  // Load Data
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const url = process.env.NEXT_PUBLIC_DRIVE_JSON_URL;
    if (!url) {
      setError('Configuration error: Data source not configured');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(url);
      const json = await response.json();
      setData(json);
      // Initialize with all projects selected
      setFilters(prev => ({
        ...prev,
        selectedProjects: json.projects.map((p: Project) => p.Project),
      }));
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  // Filtered Data (Cross-Filtering Logic)
  const filteredData = useMemo(() => {
    if (!data) return { tasks: [], projects: [] };

    let tasks = data.tasks;

    // Apply filters
    if (filters.selectedProjects.length > 0) {
      tasks = tasks.filter(t => filters.selectedProjects.includes(t.Project));
    }
    if (filters.selectedPhases.length > 0) {
      tasks = tasks.filter(t => filters.selectedPhases.includes(t.Phase));
    }
    if (filters.selectedOwners.length > 0) {
      tasks = tasks.filter(t => filters.selectedOwners.includes(t.Owners));
    }
    if (filters.selectedStatus.length > 0) {
      tasks = tasks.filter(t => filters.selectedStatus.includes(t.Status));
    }
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      tasks = tasks.filter(t => 
        t.Task_Name.toLowerCase().includes(query) ||
        t.Project.toLowerCase().includes(query) ||
        t.Phase.toLowerCase().includes(query)
      );
    }

    const projects = data.projects.filter(p => 
      filters.selectedProjects.length === 0 || filters.selectedProjects.includes(p.Project)
    );

    return { tasks, projects };
  }, [data, filters]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadData} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: DESIGN.colors.background }}>
      {/* Sidebar */}
      <Sidebar 
        open={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        view={view}
        onViewChange={setView}
        data={data!}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: sidebarOpen ? '280px' : '0', transition: DESIGN.transition.base }}>
        {/* Top Bar */}
        <TopBar 
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          data={data!}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* View Content */}
        <main style={{ flex: 1, padding: DESIGN.spacing['2xl'], backgroundColor: DESIGN.colors.surface, overflowY: 'auto' }}>
          {view === 'portfolio' && <PortfolioView data={filteredData} />}
          {view === 'gantt' && <GanttView data={filteredData} />}
          {view === 'calendar' && <CalendarView data={filteredData} />}
          {view === 'list' && <ListView data={filteredData} filters={filters} onFiltersChange={setFilters} />}
          {view === 'insights' && <InsightsView data={filteredData} />}
        </main>
      </div>
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
        <div style={{ width: '48px', height: '48px', border: '4px solid ' + DESIGN.colors.gray200, borderTopColor: DESIGN.colors.primary, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
        <div style={{ fontSize: DESIGN.typography.md, color: DESIGN.colors.gray600 }}>Loading Portfolio Intelligence...</div>
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
        <h2 style={{ fontSize: DESIGN.typography['2xl'], fontWeight: 700, color: DESIGN.colors.gray900, marginBottom: DESIGN.spacing.md }}>Failed to Load Data</h2>
        <p style={{ fontSize: DESIGN.typography.base, color: DESIGN.colors.gray600, marginBottom: DESIGN.spacing.xl }}>{error}</p>
        <button
          onClick={onRetry}
          style={{
            padding: `${DESIGN.spacing.md} ${DESIGN.spacing.xl}`,
            backgroundColor: DESIGN.colors.primary,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: DESIGN.radius.md,
            fontSize: DESIGN.typography.base,
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: DESIGN.touchTarget,
          }}
        >
          Retry Loading
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================

function Sidebar({ open, onToggle, view, onViewChange, data, filters, onFiltersChange }: any) {
  if (!open) return null;

const phases = Array.from(new Set(data.tasks.map((t: Task) => t.Phase).filter(Boolean)));
const owners = Array.from(new Set(data.tasks.map((t: Task) => t.Owners).filter(Boolean)));
const statuses = Array.from(new Set(data.tasks.map((t: Task) => t.Status).filter(Boolean)));

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
      {/* Logo */}
      <div style={{ padding: DESIGN.spacing.xl, borderBottom: `1px solid ${DESIGN.colors.gray200}` }}>
        <div style={{ fontSize: DESIGN.typography.lg, fontWeight: 800, color: DESIGN.colors.gray900 }}>Iconic</div>
        <div style={{ fontSize: DESIGN.typography.xs, color: DESIGN.colors.gray500, marginTop: '2px' }}>Portfolio Intelligence</div>
      </div>

      {/* Navigation */}
      <div style={{ padding: DESIGN.spacing.lg }}>
        <div style={{ fontSize: DESIGN.typography.xs, fontWeight: 600, color: DESIGN.colors.gray500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: DESIGN.spacing.sm }}>Views</div>
        {[
          { id: 'portfolio' as ViewMode, label: 'Portfolio Health', icon: '📊' },
          { id: 'list' as ViewMode, label: 'Task List', icon: '📝' },
          { id: 'gantt' as ViewMode, label: 'Timeline', icon: '📅' },
          { id: 'calendar' as ViewMode, label: 'Calendar', icon: '🗓️' },
          { id: 'insights' as ViewMode, label: 'AI Insights', icon: '🤖' },
        ].map(item => (
          <div
            key={item.id}
            onClick={() => onViewChange(item.id)}
            style={{
              padding: `${DESIGN.spacing.sm} ${DESIGN.spacing.md}`,
              marginBottom: '2px',
              borderRadius: DESIGN.radius.md,
              cursor: 'pointer',
              backgroundColor: view === item.id ? DESIGN.colors.gray100 : 'transparent',
              color: view === item.id ? DESIGN.colors.primary : DESIGN.colors.gray700,
              fontSize: DESIGN.typography.sm,
              fontWeight: view === item.id ? 600 : 500,
              display: 'flex',
              alignItems: 'center',
              gap: DESIGN.spacing.sm,
              transition: DESIGN.transition.fast,
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ padding: DESIGN.spacing.lg, borderTop: `1px solid ${DESIGN.colors.gray200}` }}>
        <div style={{ fontSize: DESIGN.typography.xs, fontWeight: 600, color: DESIGN.colors.gray500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: DESIGN.spacing.md }}>Filters</div>
        
        <FilterSection title="Phase" items={phases} selected={filters.selectedPhases} onChange={(phases) => onFiltersChange({ ...filters, selectedPhases: phases })} />
        <FilterSection title="Owner" items={owners} selected={filters.selectedOwners} onChange={(owners) => onFiltersChange({ ...filters, selectedOwners: owners })} />
        <FilterSection title="Status" items={statuses} selected={filters.selectedStatus} onChange={(statuses) => onFiltersChange({ ...filters, selectedStatus: statuses })} />
      </div>
    </div>
  );
}

function FilterSection({ title, items, selected, onChange }: any) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ marginBottom: DESIGN.spacing.lg }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: `${DESIGN.spacing.sm} 0`,
          cursor: 'pointer',
          fontSize: DESIGN.typography.sm,
          fontWeight: 500,
          color: DESIGN.colors.gray700,
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: DESIGN.typography.xs, color: DESIGN.colors.gray400 }}>{expanded ? '−' : '+'}</span>
      </div>
      {expanded && (
        <div style={{ paddingLeft: DESIGN.spacing.sm }}>
          {items.slice(0, 10).map((item: string) => (
            <label key={item} style={{ display: 'flex', alignItems: 'center', gap: DESIGN.spacing.sm, padding: `${DESIGN.spacing.xs} 0`, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selected.includes(item)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selected, item]);
                  } else {
                    onChange(selected.filter((s: string) => s !== item));
                  }
                }}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: DESIGN.typography.xs, color: DESIGN.colors.gray600 }}>{item || '(No value)'}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TOP BAR COMPONENT
// ============================================================================

function TopBar({ sidebarOpen, onSidebarToggle, data, filters, onFiltersChange }: any) {
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
      {/* Hamburger */}
      <button
        onClick={onSidebarToggle}
        style={{
          width: DESIGN.touchTarget,
          height: DESIGN.touchTarget,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: DESIGN.radius.md,
          color: DESIGN.colors.gray600,
        }}
      >
        <span style={{ fontSize: '20px' }}>☰</span>
      </button>

      {/* Project Selector */}
      <div style={{ flex: 1, display: 'flex', gap: DESIGN.spacing.sm, overflowX: 'auto' }}>
        {data.projects.map((project: Project) => {
          const isSelected = filters.selectedProjects.includes(project.Project);
          return (
            <button
              key={project.Project}
              onClick={() => {
                if (isSelected && filters.selectedProjects.length === 1) return; // Keep at least one selected
                onFiltersChange({
                  ...filters,
                  selectedProjects: isSelected
                    ? filters.selectedProjects.filter((p: string) => p !== project.Project)
                    : [...filters.selectedProjects, project.Project],
                });
              }}
              style={{
                padding: `${DESIGN.spacing.sm} ${DESIGN.spacing.md}`,
                borderRadius: DESIGN.radius.full,
                border: `2px solid ${isSelected ? project.Color || DESIGN.colors.primary : DESIGN.colors.gray300}`,
                backgroundColor: isSelected ? (project.Color || DESIGN.colors.primary) + '10' : DESIGN.colors.background,
                color: isSelected ? project.Color || DESIGN.colors.primary : DESIGN.colors.gray600,
                fontSize: DESIGN.typography.sm,
                fontWeight: isSelected ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: DESIGN.transition.fast,
              }}
            >
              {project.Short || project.Project}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search tasks..."
        value={filters.searchQuery}
        onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
        style={{
          width: '240px',
          padding: `${DESIGN.spacing.sm} ${DESIGN.spacing.md}`,
          border: `1px solid ${DESIGN.colors.gray300}`,
          borderRadius: DESIGN.radius.md,
          fontSize: DESIGN.typography.sm,
          outline: 'none',
        }}
      />

      {/* Refresh */}
      <button
        style={{
          width: DESIGN.touchTarget,
          height: DESIGN.touchTarget,
          border: `1px solid ${DESIGN.colors.gray300}`,
          backgroundColor: DESIGN.colors.background,
          borderRadius: DESIGN.radius.md,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
        }}
        title="Refresh Data"
      >
        🔄
      </button>
    </div>
  );
}

// ============================================================================
// PORTFOLIO VIEW (Chairman's Dashboard)
// ============================================================================

function PortfolioView({ data }: { data: { tasks: Task[], projects: Project[] } }) {
  // Calculate metrics
  const totalTasks = data.tasks.length;
  const completedTasks = data.tasks.filter(t => t.Pct_Complete === 100).length;
  const delayedTasks = data.tasks.filter(t => t.Derail_Days > 0).length;
  const criticalTasks = data.tasks.filter(t => t.Is_Critical === 'Yes').length;
  const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0';
  const delayRate = totalTasks > 0 ? ((delayedTasks / totalTasks) * 100).toFixed(1) : '0';

  // Portfolio health status
  const getHealthStatus = () => {
    const delay = parseFloat(delayRate);
    if (delay < 10) return { label: 'On Track', color: DESIGN.colors.success };
    if (delay < 25) return { label: 'At Risk', color: DESIGN.colors.warning };
    return { label: 'Critical', color: DESIGN.colors.danger };
  };

  const health = getHealthStatus();

  // Top risks (Pareto: focus on top 20% that cause 80% of problems)
  const topRisks = data.tasks
    .filter(t => t.Derail_Days > 0)
    .sort((a, b) => b.Derail_Days - a.Derail_Days)
    .slice(0, 5);

  return (
    <div>
      {/* Hero KPI - 5 Second Rule: Immediate Answer to "Are we on track?" */}
      <div style={{
        backgroundColor: DESIGN.colors.background,
        borderRadius: DESIGN.radius.xl,
        padding: DESIGN.spacing['2xl'],
        marginBottom: DESIGN.spacing.xl,
        boxShadow: DESIGN.shadow.md,
        border: `3px solid ${health.color}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: DESIGN.typography.sm, color: DESIGN.colors.gray500, fontWeight: 600, marginBottom: DESIGN.spacing.xs }}>PORTFOLIO STATUS</div>
            <div style={{ fontSize: DESIGN.typography['3xl'], fontWeight: 800, color: health.color }}>{health.label}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: DESIGN.typography['2xl'], fontWeight: 700, color: DESIGN.colors.gray900 }}>{completionRate}%</div>
            <div style={{ fontSize: DESIGN.typography.sm, color: DESIGN.colors.gray600 }}>Complete</div>
          </div>
        </div>
      </div>

      {/* Rule of 6: Maximum 6 KPIs for cognitive ease */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: DESIGN.spacing.lg, marginBottom: DESIGN.spacing['2xl'] }}>
        <KPICard label="Total Tasks" value={totalTasks.toString()} subtitle={`${data.projects.length} projects`} color={DESIGN.colors.primary} />
        <KPICard label="Completed" value={completedTasks.toString()} subtitle={`${completionRate}% done`} color={DESIGN.colors.success} />
        <KPICard label="Delayed" value={delayedTasks.toString()} subtitle={`${delayRate}% of total`} color={DESIGN.colors.danger} />
        <KPICard label="Critical Path" value={criticalTasks.toString()} subtitle="High priority" color={DESIGN.colors.warning} />
      </div>

      {/* Project Cards - Progressive Disclosure */}
      <h2 style={{ fontSize: DESIGN.typography.xl, fontWeight: 700, color: DESIGN.colors.gray900, marginBottom: DESIGN.spacing.lg }}>
        Active Projects ({data.projects.length})
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: DESIGN.spacing.lg, marginBottom: DESIGN.spacing['2xl'] }}>
        {data.projects.map(project => <ProjectCard key={project.Project} project={project} tasks={data.tasks} />)}
      </div>

      {/* Top Risks - Pareto Principle: Show the vital few */}
      {topRisks.length > 0 && (
        <>
          <h2 style={{ fontSize: DESIGN.typography.xl, fontWeight: 700, color: DESIGN.colors.gray900, marginBottom: DESIGN.spacing.lg }}>
            ⚠️ Top Risks (Intervention Required)
          </h2>
          <div style={{ backgroundColor: DESIGN.colors.background, borderRadius: DESIGN.radius.lg, overflow: 'hidden', boxShadow: DESIGN.shadow.md }}>
            {topRisks.map((task, idx) => (
              <div key={task.Task_UID} style={{
                padding: DESIGN.spacing.lg,
                borderBottom: idx < topRisks.length - 1 ? `1px solid ${DESIGN.colors.gray200}` : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: DESIGN.typography.base, fontWeight: 600, color: DESIGN.colors.gray900, marginBottom: DESIGN.spacing.xs }}>{task.Task_Name}</div>
                  <div style={{ fontSize: DESIGN.typography.sm, color: DESIGN.colors.gray600 }}>
                    {task.Project} · {task.Phase} {task.Owners && `· ${task.Owners}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginLeft: DESIGN.spacing.lg }}>
                  <div style={{ fontSize: DESIGN.typography['2xl'], fontWeight: 700, color: task.Derail_Days > 30 ? DESIGN.colors.danger : DESIGN.colors.warning }}>
                    +{task.Derail_Days}
                  </div>
                  <div style={{ fontSize: DESIGN.typography.xs, color: DESIGN.colors.gray600 }}>days</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function KPICard({ label, value, subtitle, color }: { label: string, value: string, subtitle: string, color: string }) {
  return (
    <div style={{
      backgroundColor: DESIGN.colors.background,
      borderRadius: DESIGN.radius.lg,
      padding: DESIGN.spacing.xl,
      boxShadow: DESIGN.shadow.sm,
      border: `1px solid ${DESIGN.colors.gray200}`,
    }}>
      <div style={{ fontSize: DESIGN.typography.xs, fontWeight: 600, color: DESIGN.colors.gray500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: DESIGN.spacing.sm }}>{label}</div>
      <div style={{ fontSize: DESIGN.typography['3xl'], fontWeight: 800, color, marginBottom: DESIGN.spacing.xs }}>{value}</div>
      <div style={{ fontSize: DESIGN.typography.sm, color: DESIGN.colors.gray600 }}>{subtitle}</div>
    </div>
  );
}

function ProjectCard({ project, tasks }: { project: Project, tasks: Task[] }) {
  const projectTasks = tasks.filter(t => t.Project === project.Project);
  const delayed = projectTasks.filter(t => t.Derail_Days > 0).length;
  const completed = projectTasks.filter(t => t.Pct_Complete === 100).length;
  const status = delayed === 0 ? 'On Track' : delayed < 5 ? 'At Risk' : 'Critical';
  const statusColor = status === 'On Track' ? DESIGN.colors.success : status === 'At Risk' ? DESIGN.colors.warning : DESIGN.colors.danger;

  return (
    <div style={{
      backgroundColor: DESIGN.colors.background,
      borderRadius: DESIGN.radius.lg,
      padding: DESIGN.spacing.xl,
      boxShadow: DESIGN.shadow.sm,
      border: `1px solid ${DESIGN.colors.gray200}`,
      borderLeft: `4px solid ${project.Color || DESIGN.colors.primary}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: DESIGN.spacing.lg }}>
        <div>
          <h3 style={{ fontSize: DESIGN.typography.lg, fontWeight: 700, color: DESIGN.colors.gray900, marginBottom: DESIGN.spacing.xs }}>{project.Short || project.Project}</h3>
          <div style={{ fontSize: DESIGN.typography.sm, color: DESIGN.colors.gray600 }}>{project.Task_Count} tasks</div>
        </div>
        <span style={{
          padding: `${DESIGN.spacing.xs} ${DESIGN.spacing.md}`,
          borderRadius: DESIGN.radius.md,
          backgroundColor: statusColor + '15',
          color: statusColor,
          fontSize: DESIGN.typography.xs,
          fontWeight: 700,
          textTransform: 'uppercase',
        }}>
          {status}
        </span>
      </div>

      <div style={{ marginBottom: DESIGN.spacing.md }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: DESIGN.spacing.xs }}>
          <span style={{ fontSize: DESIGN.typography.sm, color: DESIGN.colors.gray600 }}>Progress</span>
          <span style={{ fontSize: DESIGN.typography.sm, fontWeight: 600, color: DESIGN.colors.primary }}>{project.Pct_Complete}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: DESIGN.colors.gray200, borderRadius: DESIGN.radius.sm, overflow: 'hidden' }}>
          <div style={{ width: `${project.Pct_Complete}%`, height: '100%', backgroundColor: DESIGN.colors.primary, transition: DESIGN.transition.slow }}></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: DESIGN.spacing.md, fontSize: DESIGN.typography.sm }}>
        <div><div style={{ color: DESIGN.colors.gray600 }}>Done</div><div style={{ color: DESIGN.colors.success, fontWeight: 700 }}>{completed}</div></div>
        <div><div style={{ color: DESIGN.colors.gray600 }}>Active</div><div style={{ color: DESIGN.colors.warning, fontWeight: 700 }}>{projectTasks.length - completed}</div></div>
        <div><div style={{ color: DESIGN.colors.gray600 }}>Delayed</div><div style={{ color: DESIGN.colors.danger, fontWeight: 700 }}>{delayed}</div></div>
      </div>
    </div>
  );
}

// ============================================================================
// LIST VIEW (Detailed Task Management)
// ============================================================================

function ListView({ data, filters, onFiltersChange }: any) {
  const [sortBy, setSortBy] = useState<keyof Task>('Derail_Days');
  const [sortDesc, setSortDesc] = useState(true);

  const sortedTasks = [...data.tasks].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDesc ? bVal - aVal : aVal - bVal;
    }
    return 0;
  });

  function handleSort(field: keyof Task) {
    if (sortBy === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(field);
      setSortDesc(true);
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: DESIGN.typography.xl, fontWeight: 700, color: DESIGN.colors.gray900, marginBottom: DESIGN.spacing.lg }}>
        Task List ({data.tasks.length} tasks)
      </h2>

      <div style={{ backgroundColor: DESIGN.colors.background, borderRadius: DESIGN.radius.lg, overflow: 'hidden', boxShadow: DESIGN.shadow.md }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: DESIGN.colors.gray50, borderBottom: `2px solid ${DESIGN.colors.gray200}` }}>
              <TableHeader label="Task" field="Task_Name" sortBy={sortBy} sortDesc={sortDesc} onSort={handleSort} />
              <TableHeader label="Project" field="Project" sortBy={sortBy} sortDesc={sortDesc} onSort={handleSort} />
              <TableHeader label="Phase" field="Phase" sortBy={sortBy} sortDesc={sortDesc} onSort={handleSort} />
              <TableHeader label="Status" field="Status" sortBy={sortBy} sortDesc={sortDesc} onSort={handleSort} />
              <TableHeader label="Progress" field="Pct_Complete" sortBy={sortBy} sortDesc={sortDesc} onSort={handleSort} />
              <TableHeader label="Delay" field="Derail_Days" sortBy={sortBy} sortDesc={sortDesc} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {sortedTasks.slice(0, 100).map((task, idx) => (
              <tr key={task.Task_UID} style={{ borderBottom: `1px solid ${DESIGN.colors.gray200}` }}>
                <td style={{ padding: DESIGN.spacing.md, fontSize: DESIGN.typography.sm, color: DESIGN.colors.gray900 }}>{task.Task_Name}</td>
                <td style={{ padding: DESIGN.spacing.md, fontSize: DESIGN.typography.sm, color: DESIGN.colors.gray600 }}>{task.Project}</td>
                <td style={{ padding: DESIGN.spacing.md, fontSize: DESIGN.typography.xs, color: DESIGN.colors.gray600 }}>{task.Phase}</td>
                <td style={{ padding: DESIGN.spacing.md }}>
                  <span style={{
                    padding: `2px 8px`,
                    borderRadius: DESIGN.radius.sm,
                    fontSize: DESIGN.typography.xs,
                    fontWeight: 600,
                    backgroundColor: task.Status === 'Complete' ? DESIGN.colors.success + '15' : task.Status === 'In Progress' ? DESIGN.colors.warning + '15' : DESIGN.colors.gray200,
                    color: task.Status === 'Complete' ? DESIGN.colors.success : task.Status === 'In Progress' ? DESIGN.colors.warning : DESIGN.colors.gray600,
                  }}>
                    {task.Status}
                  </span>
                </td>
                <td style={{ padding: DESIGN.spacing.md, fontSize: DESIGN.typography.sm, fontWeight: 600, color: DESIGN.colors.primary }}>{task.Pct_Complete}%</td>
                <td style={{ padding: DESIGN.spacing.md, fontSize: DESIGN.typography.sm, fontWeight: 600, color: task.Derail_Days > 0 ? DESIGN.colors.danger : DESIGN.colors.success }}>
                  {task.Derail_Days > 0 ? `+${task.Derail_Days}d` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.tasks.length > 100 && (
        <div style={{ marginTop: DESIGN.spacing.lg, textAlign: 'center', fontSize: DESIGN.typography.sm, color: DESIGN.colors.gray600 }}>
          Showing 100 of {data.tasks.length} tasks
        </div>
      )}
    </div>
  );
}

function TableHeader({ label, field, sortBy, sortDesc, onSort }: any) {
  const isActive = sortBy === field;
  return (
    <th
      onClick={() => onSort(field)}
      style={{
        padding: DESIGN.spacing.md,
        textAlign: 'left',
        fontSize: DESIGN.typography.xs,
        fontWeight: 700,
        color: DESIGN.colors.gray600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {label} {isActive && (sortDesc ? '↓' : '↑')}
    </th>
  );
}

// ============================================================================
// GANTT VIEW (Placeholder)
// ============================================================================

function GanttView({ data }: any) {
  return (
    <div style={{ textAlign: 'center', padding: DESIGN.spacing['3xl'] }}>
      <div style={{ fontSize: '64px', marginBottom: DESIGN.spacing.xl }}>📅</div>
      <h2 style={{ fontSize: DESIGN.typography['2xl'], fontWeight: 700, color: DESIGN.colors.gray900, marginBottom: DESIGN.spacing.md }}>
        Interactive Gantt Chart
      </h2>
      <p style={{ fontSize: DESIGN.typography.base, color: DESIGN.colors.gray600 }}>
        Timeline visualization coming in next iteration
      </p>
    </div>
  );
}

// ============================================================================
// CALENDAR VIEW (Placeholder)
// ============================================================================

function CalendarView({ data }: any) {
  return (
    <div style={{ textAlign: 'center', padding: DESIGN.spacing['3xl'] }}>
      <div style={{ fontSize: '64px', marginBottom: DESIGN.spacing.xl }}>🗓️</div>
      <h2 style={{ fontSize: DESIGN.typography['2xl'], fontWeight: 700, color: DESIGN.colors.gray900, marginBottom: DESIGN.spacing.md }}>
        Calendar & Milestones
      </h2>
      <p style={{ fontSize: DESIGN.typography.base, color: DESIGN.colors.gray600 }}>
        Milestone tracking coming in next iteration
      </p>
    </div>
  );
}

// ============================================================================
// INSIGHTS VIEW (AI-Powered)
// ============================================================================

function InsightsView({ data }: any) {
  return (
    <div style={{ textAlign: 'center', padding: DESIGN.spacing['3xl'] }}>
      <div style={{ fontSize: '64px', marginBottom: DESIGN.spacing.xl }}>🤖</div>
      <h2 style={{ fontSize: DESIGN.typography['2xl'], fontWeight: 700, color: DESIGN.colors.gray900, marginBottom: DESIGN.spacing.md }}>
        AI-Powered Insights
      </h2>
      <p style={{ fontSize: DESIGN.typography.base, color: DESIGN.colors.gray600 }}>
        Gemini intelligence integration coming in next iteration
      </p>
    </div>
  );
}
