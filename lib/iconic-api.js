// lib/iconic-api.js
// Client-side API calls to /api/iconic proxy.

const BASE = '/api/iconic';

async function apiFetch(endpoint, params = {}) {
  const url = new URL(BASE, window.location.origin);
  url.searchParams.set('endpoint', endpoint);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, v);
    }
  });

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

async function apiPost(endpoint, body = {}) {
  const res = await fetch(BASE, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ endpoint, ...body })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const IconicAPI = {
  health:     ()             => apiFetch('health'),
  bootstrap:  ()             => apiFetch('bootstrap'),
  tasks:      (filters = {}) => apiFetch('tasks', filters),
  projects:   ()             => apiFetch('projects'),
  critical:   ()             => apiFetch('critical'),
  milestones: ()             => apiFetch('milestones'),
  analytics:  ()             => apiFetch('analytics'),
  insights:   ()             => apiFetch('insights'),
  triggerSync:()             => apiFetch('sync'),

  comment: (taskUid, taskName, project, author, message, taggedUsers = []) =>
    apiPost('comment', { taskUid, taskName, project, author, message, taggedUsers }),

  chat: (message, context = {}) =>
    apiPost('chat', { message, context })
};
