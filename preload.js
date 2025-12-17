const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  checkApiKey: () => ipcRenderer.invoke('check-api-key'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  // Projects
  getProjects: () => ipcRenderer.invoke('get-projects'),
  getProject: (id) => ipcRenderer.invoke('get-project', id),
  saveProject: (project) => ipcRenderer.invoke('save-project', project),
  deleteProject: (id) => ipcRenderer.invoke('delete-project', id),

  // AI Analysis
  analyze: (data) => ipcRenderer.invoke('analyze', data),

  // Feature Suggestions
  suggestFeatures: (data) => ipcRenderer.invoke('suggest-features', data),

  // AI Chat
  chat: (data) => ipcRenderer.invoke('chat', data),

  // AI Summary
  generateSummary: (project) => ipcRenderer.invoke('generate-summary', project),

  // AI Split Task
  splitTask: (data) => ipcRenderer.invoke('split-task', data),

  // Dashboard
  getAllProjectsFull: () => ipcRenderer.invoke('get-all-projects-full'),

  // Time Tracking
  saveTimeEntry: (data) => ipcRenderer.invoke('save-time-entry', data),
  getTimeTracking: () => ipcRenderer.invoke('get-time-tracking'),

  // Export
  exportMarkdown: (project) => ipcRenderer.invoke('export-markdown', project),

  // Sprint Planning
  planSprint: (data) => ipcRenderer.invoke('plan-sprint', data),

  // Auto Tags
  autoTagTasks: (data) => ipcRenderer.invoke('auto-tag-tasks', data)
});
