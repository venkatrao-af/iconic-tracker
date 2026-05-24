'use client';

import { useState, useEffect, useRef } from 'react';
import { IconicAPI } from '../lib/iconic-api';
import { IconicCache } from '../lib/iconic-cache';
import '../globals.css';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filters, setFilters] = useState({
    project: 'all',
    status: 'all',
    health: 'all',
    phase: 'all',
    owner: 'all'
  });
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const cached = await IconicCache.get('bootstrap');
        if (cached) {
          setData(cached);
          setLoading(false);
          const fresh = await IconicAPI.bootstrap();
          setData(fresh);
          await IconicCache.set('bootstrap', fresh);
        } else {
          const fresh = await IconicAPI.bootstrap();
          setData(fresh);
          await IconicCache.set('bootstrap', fresh);
          setLoading(false);
        }
      } catch (err) {
        console.error('Load error:', err);
        setError(err.message);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const applyFilters = (tasks) => {
    if (!tasks) return [];
    return tasks.filter(t => {
      if (filters.project !== 'all' && t.Project_Short !== filters.project) return false;
      if (filters.status !== 'all' && t.Status !== filters.status) return false;
      if (filters.health !== 'all' && t.Health !== filters.health) return false;
      if (filters.phase !== 'all' && t.Phase !== filters.phase) return false;
      if (filters.owner !== 'all' && !t.Owners?.includes(filters.owner)) return false;
      return true;
    });
  };

  const clearFilters = () => {
    setFilters({ project: 'all', status: 'all', health: 'all', phase: 'all', owner: 'all' });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p style={{ color: '#6b7280' }}>Loading construction intelligence...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>⚠️ Connection Error</h2>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>{error || 'No data available'}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry Connection
        </button>
      </div>
    );
  }

  const filteredTasks = applyFilters(data.tasks || []);
  const hasActiveFilters = Object.values(filters).some(v => v !== 'all');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Floating Sidebar */}
      <aside style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: sidebarOpen ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed)',
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        borderRight: 'var(--glass-border)',
        boxShadow: 'var(--shadow-depth)',
        transition: 'width var(--transition-base)',
        zIndex: 1000,
        overflow: 'hidden'
      }}>
        <div style={{ padding: 'var(--space-6)', overflowY: 'auto', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-8)' }}>
            {sidebarOpen && <h2 style={{ fontSize: 'var(--font-size-xl)', color: 'var(--acres-teal)', fontWeight: 700 }}>Iconic</h2>}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn btn-secondary"
              style={{ minWidth: '44px', padding: 'var(--space-3)' }}
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>

          {sidebarOpen && (
            <>
              <nav style={{ marginBottom: 'var(--space-8)' }}>
                <NavItem active={activeView === 'overview'} onClick={() => setActiveView('overview')} icon="📊">
                  Overview
                </NavItem>
                <NavItem active={activeView === 'phases'} onClick={() => setActiveView('phases')} icon="🏗️">
                  Phase Health
                </NavItem>
                <NavItem active={activeView === 'resources'} onClick={() => setActiveView('resources')} icon="👥">
                  Resources
                </NavItem>
                <NavItem active={activeView === 'heatmap'} onClick={() => setActiveView('heatmap')} icon="📅">
                  Schedule
                </NavItem>
                <NavItem active={activeView === 'gantt'} onClick={() => setActiveView('gantt')} icon="📈">
                  Gantt Timeline
                </NavItem>
                <NavItem active={activeView === 'calendar'} onClick={() => setActiveView('calendar')} icon="🗓️">
                  Calendar
                </NavItem>
                <NavItem active={activeView === 'list'} onClick={() => setActiveView('list')} icon="📋">
                  Task List
                </NavItem>
              </nav>

              <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: 'var(--space-4)' }}>
                <p style={{ fontSize: 'var(--font-size-xs)', color: '#9ca3af', marginBottom: 'var(--space-3)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Filters
                </p>
                <FilterSelect label="Project" value={filters.project} onChange={(v) => setFilters({...filters, project: v})}>
                  <option value="all">All Projects</option>
                  {data.projects?.map(p => <option key={p.Project_Short} value={p.Project_Short}>{p.Project_Name}</option>)}
                </FilterSelect>
                <FilterSelect label="Status" value={filters.status} onChange={(v) => setFilters({...filters, status: v})}>
                  <option value="all">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Overdue">Overdue</option>
                  <option value="At Risk">At Risk</option>
                  <option value="Not Started">Not Started</option>
                </FilterSelect>
                <FilterSelect label="Health" value={filters.health} onChange={(v) => setFilters({...filters, health: v})}>
                  <option value="all">All Health</option>
                  <option value="On Track">On Track</option>
                  <option value="At Risk">At Risk</option>
                  <option value="Critical">Critical</option>
                </FilterSelect>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="btn btn-secondary" style={{ width: '100%', marginTop: 'var(--space-4)', fontSize: 'var(--font-size-xs)' }}>
                    Clear Filters
                  </button>
                )}
              </div>

              <div style={{ marginTop: 'var(--space-8)', padding: 'var(--space-4)', background: 'rgba(20, 160, 133, 0.1)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: 'var(--font-size-xs)', color: '#6b7280' }}>
                  Last Sync: {data.lastSync ? new Date(data.lastSync).toLocaleString() : 'N/A'}
                </p>
                <p style={{ fontSize: 'var(--font-size-xs)', color: '#6b7280', marginTop: 'var(--space-1)' }}>
                  Version: {data.buildVersion}
                </p>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        marginLeft: sidebarOpen ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed)',
        width: `calc(100% - ${sidebarOpen ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed)'})`,
        padding: 'var(--space-8)',
        transition: 'margin-left var(--transition-base), width var(--transition-base)',
        position: 'relative'
      }}>
        {/* Header */}
        <header style={{ marginBottom: 'var(--space-8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 700, color: '#1f2937', marginBottom: 'var(--space-2)' }}>
              {activeView === 'overview' && 'Portfolio Overview'}
              {activeView === 'phases' && 'Phase Health Analysis'}
              {activeView === 'resources' && 'Resource Utilization'}
              {activeView === 'heatmap' && '12-Week Schedule Forecast'}
              {activeView === 'gantt' && 'Gantt Timeline'}
              {activeView === 'calendar' && 'Project Calendar'}
              {activeView === 'list' && 'Task Master List'}
            </h1>
            <p style={{ fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>
              {filteredTasks.length} of {data.tasks?.length || 0} tasks
              {hasActiveFilters && ' (filtered)'}
            </p>
          </div>
          <button 
            onClick={() => setChatOpen(!chatOpen)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            🤖 AI Assistant
          </button>
        </header>

        {/* Views */}
        {activeView === 'overview' && <OverviewView data={data} filteredTasks={filteredTasks} filters={filters} setFilters={setFilters} />}
        {activeView === 'phases' && <PhasesView data={data} />}
        {activeView === 'resources' && <ResourcesView data={data} />}
        {activeView === 'heatmap' && <HeatmapView data={data} />}
        {activeView === 'gantt' && <GanttView filteredTasks={filteredTasks} projects={data.projects} />}
        {activeView === 'calendar' && <CalendarView filteredTasks={filteredTasks} milestones={data.milestones} />}
        {activeView === 'list' && <ListView filteredTasks={filteredTasks} />}
      </main>

      {/* AI Chat Panel */}
      {chatOpen && <AIChatPanel data={data} onClose={() => setChatOpen(false)} />}
    </div>
  );
}

// Nav Item Component
function NavItem({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: 'var(--space-3) var(--space-4)',
        background: active ? 'var(--acres-teal)' : 'transparent',
        color: active ? 'white' : '#374151',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        textAlign: 'left',
        cursor: 'pointer',
        fontSize: 'var(--font-size-sm)',
        fontWeight: active ? 600 : 500,
        marginBottom: 'var(--space-2)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        transition: 'all var(--transition-fast)',
        minHeight: 'var(--touch-min)'
      }}
    >
      <span>{icon}</span>
      <span>{children}</span>
    </button>
  );
}

// Filter Select Component
function FilterSelect({ label, value, onChange, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <label style={{ display: 'block', fontSize: 'var(--font-size-xs)', color: '#6b7280', marginBottom: 'var(--space-2)', fontWeight: 600 }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: 'var(--space-2) var(--space-3)',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-sm)',
          cursor: 'pointer'
        }}
      >
        {children}
      </select>
    </div>
  );
}

// Overview View (same as before)
function OverviewView({ data, filteredTasks, filters, setFilters }) {
  const completedCount = filteredTasks.filter(t => t.Status === 'Completed').length;
  const overdueCount = filteredTasks.filter(t => t.Status === 'Overdue').length;
  const criticalCount = filteredTasks.filter(t => t.Is_Critical === 'YES').length;
  const avgPct = filteredTasks.length > 0 ? Math.round(filteredTasks.reduce((sum, t) => sum + (t.Pct_Complete || 0), 0) / filteredTasks.length) : 0;

  return (
    <div>
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="kpi-card">
          <div className="kpi-value">{avgPct}%</div>
          <div className="kpi-label">Portfolio Complete</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: '#3B82F6' }}>{filteredTasks.length}</div>
          <div className="kpi-label">Active Tasks</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: '#EF4444' }}>{overdueCount}</div>
          <div className="kpi-label">Overdue</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: '#F59E0B' }}>{criticalCount}</div>
          <div className="kpi-label">Critical Path</div>
        </div>
      </div>

      <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>Projects</h2>
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-8)' }}>
        {data.projects?.map(project => {
          const projectTasks = data.tasks?.filter(t => t.Project_Short === project.Project_Short) || [];
          const projectOverdue = projectTasks.filter(t => t.Status === 'Overdue').length;
          const projectCritical = projectTasks.filter(t => t.Is_Critical === 'YES').length;
          
          return (
            <div key={project.Project_UID} className="glass-card" style={{ cursor: 'pointer' }} onClick={() => setFilters({...filters, project: project.Project_Short})}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{project.Project_Name}</h3>
                <span className={`badge badge-${project.Health?.toLowerCase().replace(' ', '-')}`}>{project.Health}</span>
              </div>
              <div style={{ background: '#e5e7eb', height: '8px', borderRadius: '4px', marginBottom: 'var(--space-4)', overflow: 'hidden' }}>
                <div style={{ background: project.Color, height: '100%', width: `${project.Pct_Complete}%`, transition: 'width 0.3s ease' }}></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
                <div>
                  <div style={{ color: '#6b7280', fontSize: 'var(--font-size-xs)' }}>Progress</div>
                  <div style={{ fontWeight: 600 }}>{project.Pct_Complete}%</div>
                </div>
                <div>
                  <div style={{ color: '#6b7280', fontSize: 'var(--font-size-xs)' }}>Overdue</div>
                  <div style={{ fontWeight: 600, color: projectOverdue > 0 ? '#EF4444' : '#10B981' }}>{projectOverdue}</div>
                </div>
                <div>
                  <div style={{ color: '#6b7280', fontSize: 'var(--font-size-xs)' }}>Critical</div>
                  <div style={{ fontWeight: 600, color: projectCritical > 0 ? '#F59E0B' : '#6b7280' }}>{projectCritical}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {data.insights && (
        <div className="glass-card">
          <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Executive Summary</h2>
          <p style={{ color: '#374151', lineHeight: 'var(--line-height-relaxed)' }}>{data.insights.executiveSummary}</p>
          
          {data.insights.criticalPressure?.length > 0 && (
            <div style={{ marginTop: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-3)', color: '#EF4444' }}>
                🚨 Critical Pressure Points
              </h3>
              {data.insights.criticalPressure.slice(0, 5).map((item, i) => (
                <div key={i} style={{ padding: 'var(--space-3)', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)' }}>
                  <strong>{item.taskName}</strong> ({item.project}) - {item.derailDays} days delayed
                  {item.owners && <span style={{ color: '#6b7280', fontSize: 'var(--font-size-sm)' }}> • Owner: {item.owners}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Phases View (same as before)
function PhasesView({ data }) {
  return (
    <div className="grid grid-2">
      {data.phases?.map(phase => (
        <div key={phase.Phase_UID} className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{phase.Phase_Name}</h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: '#6b7280' }}>{phase.Project}</p>
            </div>
            <span className={`badge badge-${phase.Health?.toLowerCase().replace(' ', '-')}`}>{phase.Health}</span>
          </div>
          <div style={{ background: '#e5e7eb', height: '8px', borderRadius: '4px', marginBottom: 'var(--space-4)' }}>
            <div style={{ background: 'var(--acres-teal)', height: '100%', width: `${phase.Pct_Complete}%` }}></div>
          </div>
          <div className="grid grid-3" style={{ fontSize: 'var(--font-size-sm)' }}>
            <div>
              <div style={{ color: '#6b7280', fontSize: 'var(--font-size-xs)' }}>Tasks</div>
              <div style={{ fontWeight: 600 }}>{phase.Leaf_Tasks}</div>
            </div>
            <div>
              <div style={{ color: '#6b7280', fontSize: 'var(--font-size-xs)' }}>Overdue</div>
              <div style={{ fontWeight: 600, color: phase.Overdue_Tasks > 0 ? '#EF4444' : '#10B981' }}>{phase.Overdue_Tasks}</div>
            </div>
            <div>
              <div style={{ color: '#6b7280', fontSize: 'var(--font-size-xs)' }}>Critical</div>
              <div style={{ fontWeight: 600 }}>{phase.Critical_Tasks}</div>
            </div>
          </div>
          {phase.Owners && (
            <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', color: '#6b7280' }}>Team: {phase.Owners}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Resources View (same as before)
function ResourcesView({ data }) {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Owner</th>
            <th>Active</th>
            <th>Overdue</th>
            <th>Critical</th>
            <th>Concurrent</th>
            <th>Utilization</th>
            <th>Burnout Risk</th>
            <th>Projects</th>
          </tr>
        </thead>
        <tbody>
          {data.resources?.map((resource, i) => (
            <tr key={i}>
              <td style={{ fontWeight: 600 }}>{resource.Owner_Name}</td>
              <td>{resource.Active_Tasks}</td>
              <td style={{ color: resource.Overdue_Tasks > 0 ? '#EF4444' : '#6b7280' }}>{resource.Overdue_Tasks}</td>
              <td style={{ color: resource.Critical_Tasks > 0 ? '#F59E0B' : '#6b7280' }}>{resource.Critical_Tasks}</td>
              <td>{resource.Concurrent_Tasks}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ flex: 1, background: '#e5e7eb', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      background: resource.Utilization_Pct > 90 ? '#EF4444' : resource.Utilization_Pct > 70 ? '#F59E0B' : '#10B981',
                      height: '100%',
                      width: `${resource.Utilization_Pct}%`
                    }}></div>
                  </div>
                  <span style={{ fontSize: 'var(--font-size-xs)', minWidth: '40px' }}>{resource.Utilization_Pct}%</span>
                </div>
              </td>
              <td>
                <span className={`badge ${
                  resource.Burnout_Risk === 'Critical' ? 'badge-critical' :
                  resource.Burnout_Risk === 'High' ? 'badge-at-risk' :
                  resource.Burnout_Risk === 'Medium' ? 'badge-in-progress' :
                  'badge-on-track'
                }`}>
                  {resource.Burnout_Risk}
                </span>
              </td>
              <td style={{ fontSize: 'var(--font-size-xs)', color: '#6b7280' }}>{resource.Projects}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Heatmap View (same as before)
function HeatmapView({ data }) {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Week</th>
            <th>Tasks Due</th>
            <th>Critical Due</th>
            <th>Milestones</th>
            <th>Overdue Carryover</th>
            <th>Total Pressure</th>
            <th>Risk Level</th>
            <th>Projects</th>
          </tr>
        </thead>
        <tbody>
          {data.heatmap?.map((week, i) => {
            const weekStart = new Date(week.Week_Starting);
            const weekEnd = new Date(week.Week_Ending);
            return (
              <tr key={i} style={{ background: week.Risk_Level === 'Critical' ? 'rgba(239, 68, 68, 0.05)' : week.Risk_Level === 'High' ? 'rgba(245, 158, 11, 0.05)' : 'transparent' }}>
                <td style={{ fontWeight: 600 }}>
                  {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </td>
                <td>{week.Tasks_Due}</td>
                <td style={{ color: week.Critical_Due > 0 ? '#EF4444' : '#6b7280' }}>{week.Critical_Due}</td>
                <td style={{ color: week.Milestones_Due > 0 ? '#3B82F6' : '#6b7280' }}>{week.Milestones_Due}</td>
                <td style={{ color: week.Overdue_Carryover > 0 ? '#F59E0B' : '#6b7280' }}>{week.Overdue_Carryover}</td>
                <td style={{ fontWeight: 600 }}>{week.Total_Pressure}</td>
                <td>
                  <span className={`badge ${
                    week.Risk_Level === 'Critical' ? 'badge-critical' :
                    week.Risk_Level === 'High' ? 'badge-at-risk' :
                    week.Risk_Level === 'Medium' ? 'badge-in-progress' :
                    'badge-on-track'
                  }`}>
                    {week.Risk_Level}
                  </span>
                </td>
                <td style={{ fontSize: 'var(--font-size-xs)', color: '#6b7280' }}>{week.Top_Projects}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// NEW: Gantt View
function GanttView({ filteredTasks, projects }) {
  const tasksWithDates = filteredTasks.filter(t => t.Planned_Start && t.Planned_Finish && t.Is_Summary === 'NO');
  
  if (tasksWithDates.length === 0) {
    return <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
      <p style={{ color: '#6b7280' }}>No tasks with dates to display</p>
    </div>;
  }

  const dates = tasksWithDates.map(t => [new Date(t.Planned_Start), new Date(t.Planned_Finish)]).flat();
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  const daySpan = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
  
  const projectColors = {
    'AVANTA': '#EC4899',
    'RAYA': '#F59E0B',
    'CHEMBUR': '#14A085',
    'MULUND': '#3B82F6',
    'PAWNA': '#8B5CF6'
  };

  return (
    <div className="glass-card" style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: '1200px' }}>
        {/* Timeline Header */}
        <div style={{ display: 'flex', marginBottom: 'var(--space-4)', paddingLeft: '300px', borderBottom: '2px solid #e5e7eb', paddingBottom: 'var(--space-2)' }}>
          {Array.from({ length: Math.min(12, Math.ceil(daySpan / 30)) }).map((_, i) => {
            const monthDate = new Date(minDate);
            monthDate.setMonth(monthDate.getMonth() + i);
            return (
              <div key={i} style={{ flex: 1, fontSize: 'var(--font-size-xs)', fontWeight: 600, color: '#6b7280' }}>
                {monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
            );
          })}
        </div>

        {/* Gantt Rows */}
        {tasksWithDates.slice(0, 50).map((task, i) => {
          const start = new Date(task.Planned_Start);
          const finish = new Date(task.Planned_Finish);
          const taskStart = Math.max(0, (start - minDate) / (1000 * 60 * 60 * 24));
          const taskDuration = (finish - start) / (1000 * 60 * 60 * 24);
          const leftPercent = (taskStart / daySpan) * 100;
          const widthPercent = (taskDuration / daySpan) * 100;
          
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-2)', minHeight: '32px', position: 'relative' }}>
              <div style={{ width: '300px', fontSize: 'var(--font-size-xs)', paddingRight: 'var(--space-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: projectColors[task.Project_Short] || '#6b7280', marginRight: 'var(--space-2)' }}></span>
                {task.Task_Name}
              </div>
              <div style={{ flex: 1, position: 'relative', height: '24px' }}>
                <div style={{
                  position: 'absolute',
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  height: '100%',
                  background: task.Is_Critical === 'YES' ? '#EF4444' : projectColors[task.Project_Short] || '#14A085',
                  borderRadius: 'var(--radius-sm)',
                  opacity: task.Status === 'Completed' ? 0.5 : 1,
                  border: task.Status === 'Overdue' ? '2px solid #DC2626' : 'none'
                }}>
                  <div style={{ padding: '2px 6px', fontSize: '10px', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    {task.Pct_Complete}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {tasksWithDates.length > 50 && (
          <p style={{ marginTop: 'var(--space-4)', textAlign: 'center', color: '#6b7280', fontSize: 'var(--font-size-sm)' }}>
            Showing first 50 of {tasksWithDates.length} tasks
          </p>
        )}
      </div>
    </div>
  );
}

// NEW: Calendar View
function CalendarView({ filteredTasks, milestones }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());
  
  const getTasksForDate = (day) => {
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    return filteredTasks.filter(t => {
      if (!t.Planned_Finish) return false;
      const finishDate = new Date(t.Planned_Finish).toISOString().split('T')[0];
      return finishDate === dateStr;
    });
  };

  const getMilestonesForDate = (day) => {
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    return (milestones || []).filter(m => {
      if (!m.Target_Date) return false;
      const targetDate = new Date(m.Target_Date).toISOString().split('T')[0];
      return targetDate === dateStr;
    });
  };

  const weeks = [];
  let week = new Array(7).fill(null);
  let dayCounter = 1;

  for (let i = 0; i < startingDayOfWeek; i++) {
    week[i] = null;
  }

  for (let i = startingDayOfWeek; i < 7 && dayCounter <= daysInMonth; i++) {
    week[i] = dayCounter++;
  }
  weeks.push([...week]);

  while (dayCounter <= daysInMonth) {
    week = new Array(7).fill(null);
    for (let i = 0; i < 7 && dayCounter <= daysInMonth; i++) {
      week[i] = dayCounter++;
    }
    weeks.push([...week]);
  }

  const isToday = (day) => {
    const now = new Date();
    return day && now.getDate() === day && now.getMonth() === month && now.getFullYear() === year;
  };

  return (
    <div className="glass-card">
      {/* Calendar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button onClick={prevMonth} className="btn btn-secondary" style={{ padding: 'var(--space-2) var(--space-4)' }}>←</button>
          <button onClick={today} className="btn btn-secondary" style={{ padding: 'var(--space-2) var(--space-4)' }}>Today</button>
          <button onClick={nextMonth} className="btn btn-secondary" style={{ padding: 'var(--space-2) var(--space-4)' }}>→</button>
        </div>
      </div>

      {/* Day Headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '1px' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} style={{ padding: 'var(--space-3)', background: 'rgba(20, 160, 133, 0.1)', textAlign: 'center', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: '#e5e7eb' }}>
        {weeks.map((week, weekIdx) => (
          week.map((day, dayIdx) => {
            const tasks = day ? getTasksForDate(day) : [];
            const dayMilestones = day ? getMilestonesForDate(day) : [];
            
            return (
              <div 
                key={`${weekIdx}-${dayIdx}`}
                style={{
                  minHeight: '100px',
                  padding: 'var(--space-2)',
                  background: day ? 'white' : '#f9fafb',
                  border: isToday(day) ? '2px solid var(--acres-teal)' : 'none',
                  position: 'relative'
                }}
              >
                {day && (
                  <>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-2)', color: isToday(day) ? 'var(--acres-teal)' : '#374151' }}>
                      {day}
                    </div>
                    {dayMilestones.map((m, i) => (
                      <div key={i} style={{ fontSize: '10px', background: '#3B82F6', color: 'white', borderRadius: 'var(--radius-sm)', padding: '2px 4px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        💎 {m.Milestone_Name}
                      </div>
                    ))}
                    {tasks.slice(0, 3).map((t, i) => (
                      <div 
                        key={i}
                        style={{
                          fontSize: '10px',
                          background: t.Status === 'Overdue' ? '#FEE2E2' : t.Status === 'Completed' ? '#D1FAE5' : '#DBEAFE',
                          color: t.Status === 'Overdue' ? '#991B1B' : t.Status === 'Completed' ? '#065F46' : '#1E40AF',
                          borderRadius: 'var(--radius-sm)',
                          padding: '2px 4px',
                          marginBottom: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {t.Task_Name}
                      </div>
                    ))}
                    {tasks.length > 3 && (
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
                        +{tasks.length - 3} more
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        ))}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-6)', fontSize: 'var(--font-size-xs)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{ width: '12px', height: '12px', background: '#3B82F6', borderRadius: '50%' }}></div>
          <span>Milestone</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{ width: '12px', height: '12px', background: '#DBEAFE', borderRadius: 'var(--radius-sm)' }}></div>
          <span>Task Due</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{ width: '12px', height: '12px', background: '#FEE2E2', borderRadius: 'var(--radius-sm)' }}></div>
          <span>Overdue</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{ width: '12px', height: '12px', background: '#D1FAE5', borderRadius: 'var(--radius-sm)' }}></div>
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}

// List View (same as before)
function ListView({ filteredTasks }) {
  const [sortBy, setSortBy] = useState('Planned_Finish');
  const [sortDir, setSortDir] = useState('asc');

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (sortDir === 'asc') return aVal > bVal ? 1 : -1;
    return aVal < bVal ? 1 : -1;
  });

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th style={{ cursor: 'pointer' }} onClick={() => { setSortBy('Task_Name'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
              Task
            </th>
            <th>Project</th>
            <th>Phase</th>
            <th>Status</th>
            <th>Health</th>
            <th>Progress</th>
            <th>Owner</th>
            <th style={{ cursor: 'pointer' }} onClick={() => { setSortBy('Planned_Finish'); setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }}>
              Due Date
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedTasks.slice(0, 100).map((task, i) => (
            <tr key={i}>
              <td style={{ fontWeight: 500, maxWidth: '300px' }} className="truncate">{task.Task_Name}</td>
              <td>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: task.Project_Short === 'AVANTA' ? '#EC4899' : task.Project_Short === 'RAYA' ? '#F59E0B' : task.Project_Short === 'CHEMBUR' ? '#14A085' : task.Project_Short === 'MULUND' ? '#3B82F6' : '#8B5CF6', marginRight: 'var(--space-2)' }}></span>
                {task.Project_Short}
              </td>
              <td style={{ fontSize: 'var(--font-size-xs)', color: '#6b7280' }}>{task.Phase}</td>
              <td>
                <span className={`badge badge-${task.Status?.toLowerCase().replace(' ', '-')}`}>
                  {task.Status}
                </span>
              </td>
              <td>
                <span className={`badge badge-${task.Health?.toLowerCase().replace(' ', '-')}`}>
                  {task.Health}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ flex: 1, background: '#e5e7eb', height: '6px', borderRadius: '3px', overflow: 'hidden', minWidth: '60px' }}>
                    <div style={{ background: 'var(--acres-teal)', height: '100%', width: `${task.Pct_Complete}%` }}></div>
                  </div>
                  <span style={{ fontSize: 'var(--font-size-xs)', minWidth: '35px' }}>{task.Pct_Complete}%</span>
                </div>
              </td>
              <td style={{ fontSize: 'var(--font-size-xs)', color: '#6b7280' }}>{task.Owners || '-'}</td>
              <td style={{ fontSize: 'var(--font-size-xs)' }}>
                {task.Planned_Finish ? new Date(task.Planned_Finish).toLocaleDateString() : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sortedTasks.length > 100 && (
        <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: '#6b7280', fontSize: 'var(--font-size-sm)' }}>
          Showing first 100 of {sortedTasks.length} tasks
        </div>
      )}
    </div>
  );
}

// NEW: AI Chat Panel
function AIChatPanel({ data, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I can help you understand your project data. Try asking:\n\n• Which phase is most at risk?\n• Who is overloaded this week?\n• What\'s our critical path status?\n• Show me overdue tasks' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await IconicAPI.chat(userMessage, {
        tasks: data.tasks?.length || 0,
        projects: data.projects?.length || 0,
        phases: data.phases?.length || 0
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: response.response || 'Sorry, I couldn\'t process that request.' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Unable to process your request. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    'Which phases are critical?',
    'Who is overloaded?',
    'What tasks are overdue?',
    'Portfolio status?'
  ];

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      height: '100vh',
      width: '400px',
      background: 'var(--glass-bg)',
      backdropFilter: 'var(--glass-blur)',
      WebkitBackdropFilter: 'var(--glass-blur)',
      borderLeft: 'var(--glass-border)',
      boxShadow: 'var(--shadow-depth)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--acres-teal)' }}>🤖 AI Assistant</h2>
        <button onClick={onClose} className="btn btn-secondary" style={{ padding: 'var(--space-2) var(--space-3)' }}>✕</button>
      </div>

      {/* Quick Questions */}
      <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        <p style={{ fontSize: 'var(--font-size-xs)', color: '#6b7280', marginBottom: 'var(--space-2)', fontWeight: 600 }}>Quick Questions</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => { setInput(q); sendMessage(); }}
              className="filter-pill"
              style={{ fontSize: 'var(--font-size-xs)' }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4)' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{
              background: msg.role === 'user' ? 'var(--acres-teal)' : 'white',
              color: msg.role === 'user' ? 'white' : '#374151',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              marginLeft: msg.role === 'user' ? '20%' : '0',
              marginRight: msg.role === 'user' ? '0' : '20%',
              fontSize: 'var(--font-size-sm)',
              lineHeight: 'var(--line-height-relaxed)',
              whiteSpace: 'pre-wrap'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ padding: 'var(--space-3)', color: '#6b7280', fontSize: 'var(--font-size-sm)' }}>
            <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: 'var(--space-4)', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about your projects..."
            style={{
              flex: 1,
              padding: 'var(--space-3)',
              border: '1px solid #e5e7eb',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)'
            }}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            className="btn btn-primary"
            disabled={!input.trim() || loading}
            style={{ padding: 'var(--space-3) var(--space-5)' }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
