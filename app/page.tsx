'use client';

import { useEffect, useState } from 'react';

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
}

interface Project {
  Project: string;
  Short: string;
  Color: string;
  Task_Count: number;
  Pct_Complete: number;
}

interface PortfolioHealth {
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
  topRisks: any[];
}

interface ProjectData {
  timestamp: string;
  version: string;
  tasks: Task[];
  projects: Project[];
  portfolioHealth: PortfolioHealth;
}

export default function Home() {
  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0A0A0F', color: '#F0F0F5' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '15px' }}>⏳</div>
          <div style={{ fontSize: '18px' }}>Loading Portfolio...</div>
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
            style={{ 
              backgroundColor: '#14A085', 
              color: 'white', 
              border: 'none', 
              padding: '12px 24px', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontSize: '16px',
              width: '100%'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate portfolio metrics
  const totalTasks = data?.tasks?.length || 0;
  const completedTasks = data?.tasks?.filter(t => t.Pct_Complete === 100).length || 0;
  const inProgressTasks = data?.tasks?.filter(t => t.Pct_Complete > 0 && t.Pct_Complete < 100).length || 0;
  const criticalTasks = data?.tasks?.filter(t => t.Is_Critical === 'Yes').length || 0;
  const delayedTasks = data?.tasks?.filter(t => t.Derail_Days > 0).length || 0;
  const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0';

  // Get active projects (with task counts)
  const activeProjects = data?.projects?.filter(p => p.Task_Count > 0) || [];

  // Get top risks (tasks with highest derail days)
  const topRisks = data?.tasks
    ?.filter(t => t.Derail_Days > 0)
    ?.sort((a, b) => b.Derail_Days - a.Derail_Days)
    ?.slice(0, 5) || [];

  // Portfolio health indicator
  const getHealthStatus = () => {
    const delayRate = totalTasks > 0 ? (delayedTasks / totalTasks) * 100 : 0;
    if (delayRate < 10) return { label: 'On Track', color: '#10B981' };
    if (delayRate < 25) return { label: 'At Risk', color: '#F59E0B' };
    return { label: 'Critical', color: '#EF4444' };
  };

  const healthStatus = getHealthStatus();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0F', color: '#F0F0F5' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#13131A', borderBottom: '2px solid #14A085', padding: '20px 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>🏗️ Iconic Project Portfolio</h1>
              <p style={{ margin: '5px 0 0 0', color: '#9CA3AF', fontSize: '14px' }}>Acres Foundation · Construction Intelligence</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>Last Updated</div>
              <div style={{ fontSize: '14px', color: '#14A085' }}>
                {data?.timestamp ? new Date(data.timestamp).toLocaleString('en-IN', { 
                  month: 'short', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px' }}>
        
        {/* Portfolio Health Banner */}
        <div style={{ 
          backgroundColor: '#13131A', 
          padding: '25px 30px', 
          borderRadius: '12px', 
          marginBottom: '30px',
          border: `2px solid ${healthStatus.color}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '5px' }}>PORTFOLIO STATUS</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: healthStatus.color }}>
                {healthStatus.label}
              </div>
            </div>
            <div style={{ fontSize: '18px', color: '#9CA3AF' }}>
              {delayedTasks} of {totalTasks} tasks delayed · {completionRate}% complete
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '20px', 
          marginBottom: '30px' 
        }}>
          <div style={{ backgroundColor: '#13131A', padding: '25px', borderRadius: '12px', border: '1px solid #1F2937' }}>
            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Tasks</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#14A085', marginBottom: '5px' }}>{totalTasks}</div>
            <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Across {activeProjects.length} active projects</div>
          </div>

          <div style={{ backgroundColor: '#13131A', padding: '25px', borderRadius: '12px', border: '1px solid #1F2937' }}>
            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#10B981', marginBottom: '5px' }}>{completedTasks}</div>
            <div style={{ fontSize: '13px', color: '#9CA3AF' }}>{completionRate}% completion rate</div>
          </div>

          <div style={{ backgroundColor: '#13131A', padding: '25px', borderRadius: '12px', border: '1px solid #1F2937' }}>
            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>In Progress</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#F59E0B', marginBottom: '5px' }}>{inProgressTasks}</div>
            <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Active work streams</div>
          </div>

          <div style={{ backgroundColor: '#13131A', padding: '25px', borderRadius: '12px', border: '1px solid #1F2937' }}>
            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Critical Path</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#EF4444', marginBottom: '5px' }}>{criticalTasks}</div>
            <div style={{ fontSize: '13px', color: '#9CA3AF' }}>Tasks on critical path</div>
          </div>
        </div>

        {/* Project Cards */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#F0F0F5' }}>
            Active Projects ({activeProjects.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
            {activeProjects.map((project, idx) => {
              const projectTasks = data?.tasks?.filter(t => t.Project === project.Project) || [];
              const projectDelayed = projectTasks.filter(t => t.Derail_Days > 0).length;
              const projectComplete = projectTasks.filter(t => t.Pct_Complete === 100).length;
              const projectStatus = projectDelayed === 0 ? 'On Track' : projectDelayed < 5 ? 'At Risk' : 'Critical';
              const statusColor = projectStatus === 'On Track' ? '#10B981' : projectStatus === 'At Risk' ? '#F59E0B' : '#EF4444';

              return (
                <div key={idx} style={{ 
                  backgroundColor: '#13131A', 
                  padding: '25px', 
                  borderRadius: '12px', 
                  border: '1px solid #1F2937',
                  borderLeft: `4px solid ${project.Color || '#14A085'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', color: '#F0F0F5', marginBottom: '5px' }}>
                        {project.Short || project.Project}
                      </h3>
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>{project.Task_Count} tasks</div>
                    </div>
                    <div style={{ 
                      padding: '4px 12px', 
                      borderRadius: '6px', 
                      backgroundColor: statusColor + '20',
                      border: `1px solid ${statusColor}`,
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: statusColor
                    }}>
                      {projectStatus}
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Progress</span>
                      <span style={{ fontSize: '13px', color: '#14A085', fontWeight: 'bold' }}>{project.Pct_Complete}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#1F2937', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${project.Pct_Complete}%`, 
                        height: '100%', 
                        backgroundColor: '#14A085',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '13px' }}>
                    <div>
                      <div style={{ color: '#6B7280' }}>Complete</div>
                      <div style={{ color: '#10B981', fontWeight: 'bold' }}>{projectComplete}</div>
                    </div>
                    <div>
                      <div style={{ color: '#6B7280' }}>In Progress</div>
                      <div style={{ color: '#F59E0B', fontWeight: 'bold' }}>{projectTasks.length - projectComplete}</div>
                    </div>
                    <div>
                      <div style={{ color: '#6B7280' }}>Delayed</div>
                      <div style={{ color: '#EF4444', fontWeight: 'bold' }}>{projectDelayed}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Risks */}
        {topRisks.length > 0 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#F0F0F5' }}>
              ⚠️ Top Risks ({topRisks.length})
            </h2>
            <div style={{ backgroundColor: '#13131A', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1F2937' }}>
              {topRisks.map((task, idx) => (
                <div key={idx} style={{ 
                  padding: '20px 25px', 
                  borderBottom: idx < topRisks.length - 1 ? '1px solid #1F2937' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', color: '#F0F0F5', marginBottom: '6px', fontWeight: '500' }}>
                      {task.Task_Name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>
                      {task.Project} · {task.Phase}
                      {task.Owners && <span> · Owner: {task.Owners}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: '20px' }}>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: task.Derail_Days > 30 ? '#EF4444' : task.Derail_Days > 14 ? '#F59E0B' : '#FFD700',
                      marginBottom: '2px'
                    }}>
                      {task.Derail_Days}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>days behind</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '40px', padding: '20px', textAlign: 'center', borderTop: '1px solid #1F2937' }}>
          <div style={{ fontSize: '13px', color: '#6B7280' }}>
            Iconic Project Tracker v{data?.version || '1.0'} · Powered by Vercel · Data from MS Project
          </div>
        </div>
      </div>
    </div>
  );
}
