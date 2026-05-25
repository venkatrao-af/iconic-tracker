'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useChat } from 'ai/react';
import { format, parseISO, differenceInDays, addDays, startOfWeek } from 'date-fns';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS (From Google Sheets Schema)
// ═══════════════════════════════════════════════════════════════════════════

interface Phase {
  Phase_UID: string;
  Phase_Name: string;
  Project: string;
  Project_Short: string;
  Total_Tasks: number;
  Leaf_Tasks: number;
  Pct_Complete: number;
  Status: string;
  Health: 'On Track' | 'At Risk' | 'Critical';
  Overdue_Tasks: number;
  Critical_Tasks: number;
  At_Risk_Tasks: number;
  Owners: string;
  Planned_Start: string;
  Planned_Finish: string;
}

interface Resource {
  Owner_Name: string;
  Active_Tasks: number;
  Overdue_Tasks: number;
  Critical_Tasks: number;
  Concurrent_Tasks: number;
  Peak_Load_Date: string;
  Peak_Load_Count: number;
  Utilization_Pct: number;
  Burnout_Risk: 'Low' | 'Medium' | 'High';
  Projects: string;
}

interface HeatmapWeek {
  Week_Starting: string;
  Week_Ending: string;
  Tasks_Due: number;
  Critical_Due: number;
  Milestones_Due: number;
  Overdue_Carryover: number;
  Total_Pressure: number;
  Risk_Level: string;
  Top_Projects: string;
}

interface Task {
  Task_UID: string;
  Project: string;
  Project_Short: string;
  Task_Name: string;
  Phase: string;
  Owners: string;
  Status: string;
  Health: string;
  Pct_Complete: number;
  Planned_Start: string;
  Planned_Finish: string;
  Is_Critical: string;
  Derail_Days: number;
  Action_Required: string;
}

interface Project {
  Project_UID: string;
  Project_Name: string;
  Project_Short: string;
  Color: string;
  Status: string;
  Health: string;
  Pct_Complete: number;
  Total_Tasks: number;
  Critical_Tasks: number;
  Overdue_Tasks: number;
  Milestones_Count: number;
}

interface BootstrapData {
  phases: Phase[];
  resources: Resource[];
  heatmap: HeatmapWeek[];
  tasks: Task[];
  projects: Project[];
  critical_path: Task[];
  milestones: Task[];
  metadata: { last_sync: string };
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const healthColors = {
  'On Track': '#10B981',
  'At Risk': '#F59E0B',
  'Critical': '#EF4444',
};

const healthBgColors = {
  'On Track': 'rgba(16, 185, 129, 0.1)',
  'At Risk': 'rgba(245, 158, 11, 0.1)',
  'Critical': 'rgba(239, 68, 68, 0.1)',
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function IconicDashboard() {
  const [data, setData] = useState<BootstrapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'executive' | 'projects' | 'schedule' | 'resources' | 'ai'>('executive');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  // Load data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/bootstrap');
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter data by selected project
  const filteredData = useMemo(() => {
    if (!data || !selectedProject) return data;
    return {
      ...data,
      phases: data.phases.filter(p => p.Project_Short === selectedProject),
      tasks: data.tasks.filter(t => t.Project_Short === selectedProject),
      critical_path: data.critical_path.filter(t => t.Project_Short === selectedProject),
    };
  }, [data, selectedProject]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading Iconic Tracker...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-red-400 text-xl">Failed to load data</div>
      </div>
    );
  }

  const displayData = filteredData || data;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-teal-400">Iconic Project Tracker</h1>
              <p className="text-sm text-slate-400">
                Last synced: {format(parseISO(data.metadata.last_sync), 'PPpp')}
              </p>
            </div>
            <button
              onClick={() => setAiOpen(!aiOpen)}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors"
            >
              🤖 AI Assistant
            </button>
          </div>

          {/* View Tabs */}
          <nav className="flex gap-2 mt-4 overflow-x-auto">
            {[
              { id: 'executive', label: '📊 Executive', icon: '📊' },
              { id: 'projects', label: '🏗️ Projects', icon: '🏗️' },
              { id: 'schedule', label: '📈 Schedule', icon: '📈' },
              { id: 'resources', label: '👥 Resources', icon: '👥' },
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as any)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeView === view.id
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {view.label}
              </button>
            ))}
          </nav>

          {/* Project Filter Chips */}
          <div className="flex gap-2 mt-3 flex-wrap">
            <button
              onClick={() => setSelectedProject(null)}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                !selectedProject
                  ? 'bg-teal-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              All Projects
            </button>
            {data.projects.map((project) => (
              <button
                key={project.Project_Short}
                onClick={() => setSelectedProject(project.Project_Short)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  selectedProject === project.Project_Short
                    ? 'text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
                style={{
                  backgroundColor: selectedProject === project.Project_Short ? project.Color : undefined,
                }}
              >
                {project.Project_Short}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeView === 'executive' && <ExecutiveView data={displayData} />}
        {activeView === 'projects' && <ProjectsView data={displayData} />}
        {activeView === 'schedule' && <ScheduleView data={displayData} />}
        {activeView === 'resources' && <ResourcesView data={displayData} />}
      </main>

      {/* AI Chat Panel */}
      {aiOpen && (
        <AIChatPanel
          data={displayData}
          onClose={() => setAiOpen(false)}
          onFilterChange={setSelectedProject}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// VIEW COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function ExecutiveView({ data }: { data: BootstrapData }) {
  const portfolioComplete = Math.round(
    data.tasks.reduce((sum, t) => sum + t.Pct_Complete, 0) / data.tasks.length
  );
  const totalCritical = data.critical_path.length;
  const totalOverdue = data.tasks.filter(t => t.Derail_Days > 0).length;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard label="Portfolio Progress" value={`${portfolioComplete}%`} color="#14A085" />
        <KPICard label="Critical Tasks" value={totalCritical.toString()} color="#EF4444" />
        <KPICard label="Projects Active" value={data.projects.length.toString()} color="#F59E0B" />
        <KPICard label="Resources" value={data.resources.length.toString()} color="#10B981" />
      </div>

      {/* Project Cards */}
      <div>
        <h2 className="text-xl font-bold mb-4">Project Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.projects.map((project) => (
            <ProjectCard key={project.Project_UID} project={project} />
          ))}
        </div>
      </div>

      {/* Resource Pressure Heatmap */}
      <div>
        <h2 className="text-xl font-bold mb-4">Resource Utilization</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {data.resources.map((resource) => (
            <ResourcePressureCard key={resource.Owner_Name} resource={resource} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectsView({ data }: { data: BootstrapData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Phase Breakdown</h2>
      {data.phases.map((phase) => (
        <PhaseCard key={phase.Phase_UID} phase={phase} />
      ))}
    </div>
  );
}

function ScheduleView({ data }: { data: BootstrapData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">12-Week Schedule Heatmap</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {data.heatmap.map((week) => (
          <WeekPressureCard key={week.Week_Starting} week={week} />
        ))}
      </div>

      <h2 className="text-2xl font-bold mt-8">Critical Path Tasks</h2>
      <div className="space-y-2">
        {data.critical_path.slice(0, 20).map((task) => (
          <CriticalTaskRow key={task.Task_UID} task={task} />
        ))}
      </div>
    </div>
  );
}

function ResourcesView({ data }: { data: BootstrapData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Resource Command Center</h2>
      <div className="space-y-4">
        {data.resources.map((resource) => (
          <ResourceDetailCard key={resource.Owner_Name} resource={resource} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function KPICard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6">
      <div className="text-sm text-slate-400 mb-2">{label}</div>
      <div className="text-3xl font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (project.Pct_Complete / 100) * circumference;

  return (
    <div
      className="bg-slate-900/50 backdrop-blur border rounded-xl p-6"
      style={{ borderColor: project.Color }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg">{project.Project_Name}</h3>
          <div className="text-sm text-slate-400">{project.Project_Short}</div>
        </div>
        <svg width="80" height="80" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={project.Color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xl font-bold"
            fill="white"
          >
            {project.Pct_Complete}%
          </text>
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-slate-400">Tasks</div>
          <div className="font-semibold">{project.Total_Tasks}</div>
        </div>
        <div>
          <div className="text-slate-400">Critical</div>
          <div className="font-semibold text-red-400">{project.Critical_Tasks}</div>
        </div>
      </div>
      <div
        className="mt-3 px-2 py-1 rounded text-xs font-medium text-center"
        style={{
          backgroundColor: healthBgColors[project.Health as keyof typeof healthBgColors],
          color: healthColors[project.Health as keyof typeof healthColors],
        }}
      >
        {project.Health}
      </div>
    </div>
  );
}

function ResourcePressureCard({ resource }: { resource: Resource }) {
  const intensity = resource.Utilization_Pct / 100;
  const bgColor = `rgba(239, 68, 68, ${Math.max(0.1, intensity)})`;

  return (
    <div
      className="rounded-lg p-3 border border-slate-700"
      style={{ backgroundColor: bgColor }}
    >
      <div className="font-semibold text-sm">{resource.Owner_Name}</div>
      <div className="text-2xl font-bold mt-1">{resource.Utilization_Pct}%</div>
      <div className="text-xs text-slate-200 mt-1">{resource.Active_Tasks} active</div>
      <div className="text-xs mt-1">
        <span
          className={`px-2 py-0.5 rounded ${
            resource.Burnout_Risk === 'High'
              ? 'bg-red-600'
              : resource.Burnout_Risk === 'Medium'
              ? 'bg-yellow-600'
              : 'bg-green-600'
          }`}
        >
          {resource.Burnout_Risk}
        </span>
      </div>
    </div>
  );
}

function PhaseCard({ phase }: { phase: Phase }) {
  return (
    <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg">{phase.Phase_Name}</h3>
          <div className="text-sm text-slate-400">{phase.Project_Short}</div>
        </div>
        <div
          className="px-3 py-1 rounded text-sm font-medium"
          style={{
            backgroundColor: healthBgColors[phase.Health],
            color: healthColors[phase.Health],
          }}
        >
          {phase.Health}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-slate-400">Progress</div>
          <div className="font-semibold text-xl">{phase.Pct_Complete}%</div>
        </div>
        <div>
          <div className="text-slate-400">Tasks</div>
          <div className="font-semibold">{phase.Leaf_Tasks}</div>
        </div>
        <div>
          <div className="text-slate-400">Critical</div>
          <div className="font-semibold text-red-400">{phase.Critical_Tasks}</div>
        </div>
        <div>
          <div className="text-slate-400">At Risk</div>
          <div className="font-semibold text-amber-400">{phase.At_Risk_Tasks}</div>
        </div>
      </div>
      <div className="mt-3 w-full bg-slate-800 rounded-full h-2">
        <div
          className="bg-teal-500 h-2 rounded-full"
          style={{ width: `${phase.Pct_Complete}%` }}
        />
      </div>
    </div>
  );
}

function WeekPressureCard({ week }: { week: HeatmapWeek }) {
  const intensity = Math.min(week.Total_Pressure / 200, 1);
  const bgColor = `rgba(239, 68, 68, ${Math.max(0.2, intensity)})`;

  return (
    <div
      className="rounded-lg p-3 border border-slate-700 hover:scale-105 transition-transform cursor-pointer"
      style={{ backgroundColor: bgColor }}
    >
      <div className="text-xs font-medium">{format(parseISO(week.Week_Starting), 'MMM dd')}</div>
      <div className="text-2xl font-bold mt-1">{week.Total_Pressure}</div>
      <div className="text-xs mt-1">
        {week.Critical_Due > 0 && (
          <div className="text-red-200">🔴 {week.Critical_Due} critical</div>
        )}
        {week.Tasks_Due} due
      </div>
    </div>
  );
}

function CriticalTaskRow({ task }: { task: Task }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 hover:border-teal-500 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium">{task.Task_Name}</div>
          <div className="text-sm text-slate-400 mt-1">
            {task.Project_Short} • {task.Owners || 'Unassigned'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Due</div>
          <div className="font-medium">{format(parseISO(task.Planned_Finish), 'MMM dd')}</div>
        </div>
      </div>
    </div>
  );
}

function ResourceDetailCard({ resource }: { resource: Resource }) {
  return (
    <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg">{resource.Owner_Name}</h3>
          <div className="text-sm text-slate-400">{resource.Projects}</div>
        </div>
        <div
          className={`px-3 py-1 rounded text-sm font-medium ${
            resource.Burnout_Risk === 'High'
              ? 'bg-red-500/20 text-red-400'
              : resource.Burnout_Risk === 'Medium'
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-green-500/20 text-green-400'
          }`}
        >
          {resource.Burnout_Risk} Risk
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 text-sm mb-3">
        <div>
          <div className="text-slate-400">Utilization</div>
          <div className="font-semibold text-xl">{resource.Utilization_Pct}%</div>
        </div>
        <div>
          <div className="text-slate-400">Active</div>
          <div className="font-semibold">{resource.Active_Tasks}</div>
        </div>
        <div>
          <div className="text-slate-400">Critical</div>
          <div className="font-semibold text-red-400">{resource.Critical_Tasks}</div>
        </div>
        <div>
          <div className="text-slate-400">Peak Load</div>
          <div className="font-semibold">{resource.Peak_Load_Count}</div>
        </div>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${
            resource.Utilization_Pct > 80
              ? 'bg-red-500'
              : resource.Utilization_Pct > 60
              ? 'bg-yellow-500'
              : 'bg-green-500'
          }`}
          style={{ width: `${resource.Utilization_Pct}%` }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AI CHAT PANEL
// ═══════════════════════════════════════════════════════════════════════════

function AIChatPanel({
  data,
  onClose,
  onFilterChange,
}: {
  data: BootstrapData;
  onClose: () => void;
  onFilterChange: (project: string | null) => void;
}) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: {
      bootstrapData: data,
    },
    onToolCall({ toolCall }) {
      if (toolCall.toolName === 'filterDashboard') {
        onFilterChange(toolCall.args.project || null);
      }
    },
  });

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="border-b border-slate-800 p-4 flex items-center justify-between">
        <h2 className="font-bold text-lg">🤖 AI Assistant</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-8">
            <div className="text-4xl mb-2">💡</div>
            <p>Ask me anything about your projects!</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="bg-slate-800 rounded p-2">"Which phases are at risk?"</div>
              <div className="bg-slate-800 rounded p-2">"Show me critical tasks"</div>
              <div className="bg-slate-800 rounded p-2">"Resource utilization summary"</div>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-lg p-3 ${
              msg.role === 'user'
                ? 'bg-teal-500 ml-8'
                : 'bg-slate-800 mr-8'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="bg-slate-800 rounded-lg p-3 mr-8">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce delay-200" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-slate-800 p-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about your projects..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
