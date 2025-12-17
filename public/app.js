// State
let currentProject = null;
let currentTheme = localStorage.getItem('theme') || 'light';
let projectToDelete = null;
let currentView = 'list';
let currentFilter = 'all';
let currentPriorityFilter = null;
let searchQuery = '';
let editingTask = null;
let editingMilestoneId = null;
let taskTimers = {};
let chatMessages = [];
let suggestedFeatures = [];
let pendingProjectContext = '';
let splitSubtasks = [];
let currentTimetrackPeriod = 'week';
let draggedElement = null;

// DOM Elements
const elements = {
  themeToggle: document.getElementById('theme-toggle'),
  settingsBtn: document.getElementById('settings-btn'),
  statsBtn: document.getElementById('stats-btn'),
  newProjectBtn: document.getElementById('new-project-btn'),
  projectList: document.getElementById('project-list'),
  inputSection: document.getElementById('input-section'),
  loadingSection: document.getElementById('loading-section'),
  resultsSection: document.getElementById('results-section'),
  projectGoal: document.getElementById('project-goal'),
  projectContext: document.getElementById('project-context'),
  analyzeBtn: document.getElementById('analyze-btn'),
  projectName: document.getElementById('project-name'),
  projectDescription: document.getElementById('project-description'),
  saveBtn: document.getElementById('save-btn'),
  exportMdBtn: document.getElementById('export-md-btn'),
  milestonesContainer: document.getElementById('milestones-container'),
  kanbanContainer: document.getElementById('kanban-container'),
  settingsModal: document.getElementById('settings-modal'),
  closeSettings: document.getElementById('close-settings'),
  apiKeyInput: document.getElementById('api-key-input'),
  modelSelect: document.getElementById('model-select'),
  saveSettingsBtn: document.getElementById('save-settings-btn'),
  deleteModal: document.getElementById('delete-modal'),
  closeDelete: document.getElementById('close-delete'),
  cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
  confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
  taskModal: document.getElementById('task-modal'),
  closeTaskModal: document.getElementById('close-task-modal'),
  saveTaskBtn: document.getElementById('save-task-btn'),
  deleteTaskBtn: document.getElementById('delete-task-btn'),
  statsModal: document.getElementById('stats-modal'),
  closeStats: document.getElementById('close-stats'),
  featuresModal: document.getElementById('features-modal'),
  closeFeatures: document.getElementById('close-features'),
  featuresList: document.getElementById('features-list'),
  featuresLoading: document.getElementById('features-loading'),
  skipFeaturesBtn: document.getElementById('skip-features-btn'),
  addFeaturesBtn: document.getElementById('add-features-btn'),
  generateMoreFeaturesBtn: document.getElementById('generate-more-features-btn'),
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toast-message'),
  searchInput: document.getElementById('search-input'),
  viewToggle: document.getElementById('view-toggle'),
  aiChatFab: document.getElementById('ai-chat-fab'),
  aiChatContainer: document.getElementById('ai-chat-container'),
  closeChat: document.getElementById('close-chat'),
  aiChatMessages: document.getElementById('ai-chat-messages'),
  aiChatInput: document.getElementById('ai-chat-input'),
  aiChatSend: document.getElementById('ai-chat-send'),
  statProgress: document.getElementById('stat-progress'),
  statBarFill: document.getElementById('stat-bar-fill'),
  statTasks: document.getElementById('stat-tasks'),
  statTimeTotal: document.getElementById('stat-time-total'),
  statTimeDone: document.getElementById('stat-time-done'),
  // New elements
  dashboardBtn: document.getElementById('dashboard-btn'),
  timetrackBtn: document.getElementById('timetrack-btn'),
  exportPdfBtn: document.getElementById('export-pdf-btn'),
  aiSummaryBtn: document.getElementById('ai-summary-btn'),
  suggestFeaturesBtn: document.getElementById('suggest-features-btn'),
  aiSplitTaskBtn: document.getElementById('ai-split-task-btn'),
  dashboardModal: document.getElementById('dashboard-modal'),
  closeDashboard: document.getElementById('close-dashboard'),
  dashboardContent: document.getElementById('dashboard-content'),
  timetrackModal: document.getElementById('timetrack-modal'),
  closeTimetrack: document.getElementById('close-timetrack'),
  timetrackContent: document.getElementById('timetrack-content'),
  summaryModal: document.getElementById('summary-modal'),
  closeSummary: document.getElementById('close-summary'),
  summaryContent: document.getElementById('summary-content'),
  summaryLoading: document.getElementById('summary-loading'),
  copySummaryBtn: document.getElementById('copy-summary-btn'),
  splitTaskModal: document.getElementById('split-task-modal'),
  closeSplitTask: document.getElementById('close-split-task'),
  splitTaskContent: document.getElementById('split-task-content'),
  splitTaskLoading: document.getElementById('split-task-loading'),
  cancelSplitBtn: document.getElementById('cancel-split-btn'),
  applySplitBtn: document.getElementById('apply-split-btn'),
  ganttContainer: document.getElementById('gantt-container'),
  ganttBody: document.getElementById('gantt-body'),
  ganttTimelineHeader: document.getElementById('gantt-timeline-header'),
  ganttHoursPerDay: document.getElementById('gantt-hours-per-day'),
  ganttDaysCount: document.getElementById('gantt-days-count'),
  ganttSkipWeekends: document.getElementById('gantt-skip-weekends'),
  // New chart elements
  burndownContainer: document.getElementById('burndown-container'),
  timelineContainer: document.getElementById('timeline-container'),
  heatmapBtn: document.getElementById('heatmap-btn'),
  dependencyBtn: document.getElementById('dependency-btn'),
  heatmapModal: document.getElementById('heatmap-modal'),
  closeHeatmap: document.getElementById('close-heatmap'),
  dependencyModal: document.getElementById('dependency-modal'),
  closeDependency: document.getElementById('close-dependency'),
  sprintModal: document.getElementById('sprint-modal'),
  closeSprint: document.getElementById('close-sprint'),
  generateSprintBtn: document.getElementById('generate-sprint-btn'),
  applySprintBtn: document.getElementById('apply-sprint-btn'),
  autotagModal: document.getElementById('autotag-modal'),
  closeAutotag: document.getElementById('close-autotag'),
  cancelAutotagBtn: document.getElementById('cancel-autotag-btn'),
  applyAutotagBtn: document.getElementById('apply-autotag-btn'),
  exportCsvBtn: document.getElementById('export-csv-btn'),
  aiSprintBtn: document.getElementById('ai-sprint-btn'),
  aiAutotagBtn: document.getElementById('ai-autotag-btn')
};

// Initialize
async function init() {
  applyTheme();
  await loadSettings();
  await loadProjectList();
  setupEventListeners();
  checkApiKey();
  checkReminders();
  setInterval(checkReminders, 60000);
}

// Apply theme
function applyTheme() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  elements.themeToggle.querySelector('.theme-icon').textContent = currentTheme === 'dark' ? '☀️' : '🌙';
}

// Load settings
async function loadSettings() {
  try {
    const settings = await window.electronAPI.getSettings();
    if (settings.model) {
      elements.modelSelect.value = settings.model;
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
}

// Check API key
async function checkApiKey() {
  try {
    const { configured } = await window.electronAPI.checkApiKey();
    if (!configured) {
      showToast('Bitte konfiguriere deinen Groq API-Key in den Einstellungen.', 'warning');
    }
  } catch (e) {
    console.error('Failed to check API key:', e);
  }
}

// Load project list
async function loadProjectList() {
  try {
    const projects = await window.electronAPI.getProjects();
    renderProjectList(projects);
  } catch (e) {
    console.error('Failed to load projects:', e);
    renderProjectList([]);
  }
}

// Render project list
function renderProjectList(projects) {
  if (projects.length === 0) {
    elements.projectList.innerHTML = `
      <div class="empty-state">
        <p>Keine Projekte vorhanden</p>
        <p>Erstelle dein erstes Projekt!</p>
      </div>
    `;
    return;
  }

  elements.projectList.innerHTML = projects.map(project => `
    <div class="project-item ${currentProject?.id === project.id ? 'active' : ''}" data-id="${project.id}">
      <div class="project-item-content">
        <div class="project-item-name">${escapeHtml(project.name)}</div>
        <div class="project-item-date">${formatDate(project.updatedAt)}</div>
      </div>
      <button class="project-item-delete" data-id="${project.id}" title="Löschen">🗑️</button>
    </div>
  `).join('');

  elements.projectList.querySelectorAll('.project-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('project-item-delete')) {
        loadProject(item.dataset.id);
      }
    });
  });

  elements.projectList.querySelectorAll('.project-item-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      confirmDelete(btn.dataset.id);
    });
  });
}

// Load project
async function loadProject(projectId) {
  try {
    const project = await window.electronAPI.getProject(projectId);
    if (!project.error) {
      currentProject = project;
      showResults();
      renderProject();
      loadProjectList();
    } else {
      showToast('Projekt nicht gefunden', 'error');
    }
  } catch (e) {
    showToast('Fehler beim Laden', 'error');
  }
}

// Setup event listeners
function setupEventListeners() {
  // Theme toggle
  elements.themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    applyTheme();
  });

  // Settings
  elements.settingsBtn.addEventListener('click', () => {
    elements.settingsModal.classList.remove('hidden');
  });

  elements.closeSettings.addEventListener('click', () => {
    elements.settingsModal.classList.add('hidden');
  });

  elements.saveSettingsBtn.addEventListener('click', saveSettings);

  // Stats
  elements.statsBtn.addEventListener('click', showStatsModal);
  elements.closeStats.addEventListener('click', () => {
    elements.statsModal.classList.add('hidden');
  });

  // Features modal
  elements.closeFeatures.addEventListener('click', closeFeaturesModal);
  elements.skipFeaturesBtn.addEventListener('click', closeFeaturesModal);
  elements.addFeaturesBtn.addEventListener('click', addSelectedFeatures);
  elements.generateMoreFeaturesBtn.addEventListener('click', generateMoreFeatures);

  // New project
  elements.newProjectBtn.addEventListener('click', newProject);

  // Analyze
  elements.analyzeBtn.addEventListener('click', analyzeProject);

  // Save
  elements.saveBtn.addEventListener('click', saveProject);

  // Export
  elements.exportMdBtn.addEventListener('click', exportMarkdown);
  elements.exportPdfBtn.addEventListener('click', exportPDF);

  // AI Summary
  elements.aiSummaryBtn.addEventListener('click', showAISummary);
  elements.closeSummary.addEventListener('click', () => elements.summaryModal.classList.add('hidden'));
  elements.copySummaryBtn.addEventListener('click', copySummary);

  // Feature Suggestions for existing project
  elements.suggestFeaturesBtn.addEventListener('click', suggestFeaturesForProject);

  // Dashboard
  elements.dashboardBtn.addEventListener('click', showDashboard);
  elements.closeDashboard.addEventListener('click', () => elements.dashboardModal.classList.add('hidden'));

  // Time Tracking
  elements.timetrackBtn.addEventListener('click', showTimeTracking);
  elements.closeTimetrack.addEventListener('click', () => elements.timetrackModal.classList.add('hidden'));

  // AI Split Task
  elements.aiSplitTaskBtn.addEventListener('click', showAISplitTask);
  elements.closeSplitTask.addEventListener('click', () => elements.splitTaskModal.classList.add('hidden'));
  elements.cancelSplitBtn.addEventListener('click', () => elements.splitTaskModal.classList.add('hidden'));
  elements.applySplitBtn.addEventListener('click', applySplitSubtasks);

  // Gantt settings
  elements.ganttHoursPerDay.addEventListener('change', renderGantt);
  elements.ganttDaysCount.addEventListener('change', renderGantt);
  elements.ganttSkipWeekends.addEventListener('change', renderGantt);

  // Project name change
  elements.projectName.addEventListener('change', () => {
    if (currentProject) {
      currentProject.name = elements.projectName.value;
    }
  });

  // Delete modal
  elements.closeDelete.addEventListener('click', () => {
    elements.deleteModal.classList.add('hidden');
  });

  elements.cancelDeleteBtn.addEventListener('click', () => {
    elements.deleteModal.classList.add('hidden');
  });

  elements.confirmDeleteBtn.addEventListener('click', deleteProject);

  // Task modal
  elements.closeTaskModal.addEventListener('click', () => {
    elements.taskModal.classList.add('hidden');
  });

  elements.saveTaskBtn.addEventListener('click', saveTaskChanges);
  elements.deleteTaskBtn.addEventListener('click', deleteCurrentTask);

  document.getElementById('add-subtask-btn').addEventListener('click', addSubtask);

  // Search
  elements.searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderProject();
  });

  // View toggle
  elements.viewToggle.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      elements.viewToggle.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      renderProject();
    });
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderProject();
    });
  });

  document.querySelectorAll('.filter-btn[data-priority]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentPriorityFilter === btn.dataset.priority) {
        currentPriorityFilter = null;
        btn.classList.remove('active');
      } else {
        document.querySelectorAll('.filter-btn[data-priority]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPriorityFilter = btn.dataset.priority;
      }
      renderProject();
    });
  });

  // AI Chat
  elements.aiChatFab.addEventListener('click', () => {
    elements.aiChatContainer.classList.toggle('open');
  });

  elements.closeChat.addEventListener('click', () => {
    elements.aiChatContainer.classList.remove('open');
  });

  elements.aiChatSend.addEventListener('click', sendChatMessage);
  elements.aiChatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
  });

  // Close modals on outside click
  const allModals = [elements.settingsModal, elements.deleteModal, elements.taskModal, elements.statsModal, elements.featuresModal, elements.dashboardModal, elements.timetrackModal, elements.summaryModal, elements.splitTaskModal];
  allModals.forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      allModals.forEach(modal => {
        if (modal) modal.classList.add('hidden');
      });
      elements.aiChatContainer.classList.remove('open');
    }
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      if (currentProject) saveProject();
    }
  });

  // Time tracking tabs
  document.querySelectorAll('.timetrack-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.timetrack-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTimetrackPeriod = tab.dataset.period;
      renderTimeTracking();
    });
  });

  // New Feature Event Listeners
  // CSV Export
  if (elements.exportCsvBtn) {
    elements.exportCsvBtn.addEventListener('click', exportCSV);
  }

  // Heatmap
  if (elements.heatmapBtn) {
    elements.heatmapBtn.addEventListener('click', showHeatmap);
  }
  if (elements.closeHeatmap) {
    elements.closeHeatmap.addEventListener('click', () => elements.heatmapModal.classList.add('hidden'));
  }

  // Dependency Graph
  if (elements.dependencyBtn) {
    elements.dependencyBtn.addEventListener('click', showDependencyGraph);
  }
  if (elements.closeDependency) {
    elements.closeDependency.addEventListener('click', () => elements.dependencyModal.classList.add('hidden'));
  }

  // Sprint Planning
  if (elements.aiSprintBtn) {
    elements.aiSprintBtn.addEventListener('click', () => elements.sprintModal.classList.remove('hidden'));
  }
  if (elements.closeSprint) {
    elements.closeSprint.addEventListener('click', () => elements.sprintModal.classList.add('hidden'));
  }
  if (elements.generateSprintBtn) {
    elements.generateSprintBtn.addEventListener('click', generateSprintPlan);
  }
  if (elements.applySprintBtn) {
    elements.applySprintBtn.addEventListener('click', applySprintPlan);
  }

  // Auto Tags
  if (elements.aiAutotagBtn) {
    elements.aiAutotagBtn.addEventListener('click', generateAutoTags);
  }
  if (elements.closeAutotag) {
    elements.closeAutotag.addEventListener('click', () => elements.autotagModal.classList.add('hidden'));
  }
  if (elements.cancelAutotagBtn) {
    elements.cancelAutotagBtn.addEventListener('click', () => elements.autotagModal.classList.add('hidden'));
  }
  if (elements.applyAutotagBtn) {
    elements.applyAutotagBtn.addEventListener('click', applyAutoTags);
  }
}

// New project
function newProject() {
  currentProject = null;
  elements.projectGoal.value = '';
  elements.projectContext.value = '';
  showInput();
  loadProjectList();
}

// Analyze project
async function analyzeProject() {
  const goal = elements.projectGoal.value.trim();
  if (!goal) {
    showToast('Bitte beschreibe dein Projektziel', 'warning');
    return;
  }

  const context = elements.projectContext.value.trim();
  pendingProjectContext = context;
  showLoading();

  try {
    const result = await window.electronAPI.analyze({ goal, context });

    if (!result.error) {
      // Add default properties to tasks
      result.milestones.forEach(m => {
        m.tasks.forEach(t => {
          t.priority = t.priority || 'medium';
          t.tags = t.tags || [];
          t.notes = t.notes || '';
          t.subtasks = t.subtasks || [];
          t.reminder = t.reminder || null;
          t.timerSeconds = t.timerSeconds || 0;
          t.status = t.status || 'todo';
        });
      });
      currentProject = result;
      showResults();
      renderProject();

      // Show feature suggestions modal
      showFeatureSuggestions();
    } else {
      showInput();
      showToast(result.error || 'Analyse fehlgeschlagen', 'error');
    }
  } catch (e) {
    showInput();
    showToast('Fehler bei der Analyse', 'error');
  }
}

// Save project
async function saveProject() {
  if (!currentProject) return;

  currentProject.name = elements.projectName.value || currentProject.name;

  try {
    const result = await window.electronAPI.saveProject(currentProject);

    if (!result.error) {
      showToast('Gespeichert!');
      loadProjectList();
    } else {
      showToast('Speichern fehlgeschlagen', 'error');
    }
  } catch (e) {
    showToast('Fehler beim Speichern', 'error');
  }
}

// Save settings
async function saveSettings() {
  const apiKey = elements.apiKeyInput.value;
  const model = elements.modelSelect.value;

  try {
    const result = await window.electronAPI.saveSettings({ apiKey, model });

    if (result.success) {
      elements.settingsModal.classList.add('hidden');
      elements.apiKeyInput.value = '';
      showToast('Gespeichert!');
      checkApiKey();
    } else {
      showToast('Speichern fehlgeschlagen', 'error');
    }
  } catch (e) {
    showToast('Fehler beim Speichern', 'error');
  }
}

// Confirm delete
function confirmDelete(projectId) {
  projectToDelete = projectId;
  elements.deleteModal.classList.remove('hidden');
}

// Delete project
async function deleteProject() {
  if (!projectToDelete) return;

  try {
    const result = await window.electronAPI.deleteProject(projectToDelete);

    if (result.success) {
      if (currentProject && currentProject.id === projectToDelete) {
        newProject();
      }
      showToast('Gelöscht!');
      loadProjectList();
    } else {
      showToast('Löschen fehlgeschlagen', 'error');
    }
  } catch (e) {
    showToast('Fehler beim Löschen', 'error');
  }

  projectToDelete = null;
  elements.deleteModal.classList.add('hidden');
}

// Export Markdown
async function exportMarkdown() {
  if (!currentProject) return;

  await saveProject();

  try {
    const markdown = await window.electronAPI.exportMarkdown(currentProject);

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Markdown exportiert!');
  } catch (e) {
    showToast('Export fehlgeschlagen', 'error');
  }
}

// Show sections
function showInput() {
  elements.inputSection.classList.remove('hidden');
  elements.loadingSection.classList.add('hidden');
  elements.resultsSection.classList.add('hidden');
}

function showLoading() {
  elements.inputSection.classList.add('hidden');
  elements.loadingSection.classList.remove('hidden');
  elements.resultsSection.classList.add('hidden');
}

function showResults() {
  elements.inputSection.classList.add('hidden');
  elements.loadingSection.classList.add('hidden');
  elements.resultsSection.classList.remove('hidden');
}

// Render project
function renderProject() {
  if (!currentProject) return;

  elements.projectName.value = currentProject.name;
  elements.projectDescription.textContent = currentProject.description;

  updateStats();

  // Hide all views first
  elements.milestonesContainer.style.display = 'none';
  elements.kanbanContainer.classList.remove('active');
  elements.ganttContainer.classList.add('hidden');
  if (elements.burndownContainer) elements.burndownContainer.classList.add('hidden');
  if (elements.timelineContainer) elements.timelineContainer.classList.add('hidden');

  if (currentView === 'list') {
    elements.milestonesContainer.style.display = 'flex';
    renderMilestones();
  } else if (currentView === 'kanban') {
    elements.kanbanContainer.classList.add('active');
    renderKanban();
  } else if (currentView === 'gantt') {
    elements.ganttContainer.classList.remove('hidden');
    renderGantt();
  } else if (currentView === 'burndown') {
    if (elements.burndownContainer) {
      elements.burndownContainer.classList.remove('hidden');
      renderBurndown();
    }
  } else if (currentView === 'timeline') {
    if (elements.timelineContainer) {
      elements.timelineContainer.classList.remove('hidden');
      renderTimeline();
    }
  }
}

// Filter tasks
function filterTasks(tasks) {
  return tasks.filter(task => {
    // Search filter
    if (searchQuery) {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery) ||
        (task.description && task.description.toLowerCase().includes(searchQuery)) ||
        (task.notes && task.notes.toLowerCase().includes(searchQuery));
      if (!matchesSearch) return false;
    }

    // Status filter
    if (currentFilter === 'pending' && task.completed) return false;
    if (currentFilter === 'completed' && !task.completed) return false;

    // Priority filter
    if (currentPriorityFilter && task.priority !== currentPriorityFilter) return false;

    return true;
  });
}

// Render milestones
function renderMilestones() {
  const milestones = currentProject.milestones || [];

  elements.milestonesContainer.innerHTML = milestones.map((milestone, index) => {
    const filteredTasks = filterTasks(milestone.tasks);
    const milestoneHours = milestone.tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    return `
      <div class="milestone" data-id="${milestone.id}" data-index="${index}" draggable="true">
        <div class="milestone-header">
          <span class="drag-handle" title="Ziehen zum Sortieren">⠿</span>
          <span class="milestone-icon" onclick="toggleMilestone('${milestone.id}')">📁</span>
          <span class="milestone-title" onclick="toggleMilestone('${milestone.id}')">${escapeHtml(milestone.name)}</span>
          <span class="milestone-time">${milestoneHours}h</span>
          <span class="milestone-toggle" onclick="toggleMilestone('${milestone.id}')">▼</span>
        </div>
        <div class="tasks-container">
          ${filteredTasks.map((task) => renderTask(task, milestone.id)).join('')}
        </div>
      </div>
    `;
  }).join('');

  // Add drag & drop event listeners
  initMilestoneDragDrop();
}

// Initialize drag & drop for milestones
function initMilestoneDragDrop() {
  const milestones = document.querySelectorAll('.milestone[draggable="true"]');

  milestones.forEach(milestone => {
    milestone.addEventListener('dragstart', handleMilestoneDragStart);
    milestone.addEventListener('dragend', handleMilestoneDragEnd);
    milestone.addEventListener('dragover', handleMilestoneDragOver);
    milestone.addEventListener('drop', handleMilestoneDrop);
    milestone.addEventListener('dragenter', handleMilestoneDragEnter);
    milestone.addEventListener('dragleave', handleMilestoneDragLeave);
  });
}

function handleMilestoneDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.dataset.id);
}

function handleMilestoneDragEnd(e) {
  this.classList.remove('dragging');
  document.querySelectorAll('.milestone').forEach(m => m.classList.remove('drag-over'));
  draggedElement = null;
}

function handleMilestoneDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleMilestoneDragEnter(e) {
  e.preventDefault();
  if (this !== draggedElement) {
    this.classList.add('drag-over');
  }
}

function handleMilestoneDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleMilestoneDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');

  if (draggedElement && this !== draggedElement) {
    const fromIndex = parseInt(draggedElement.dataset.index);
    const toIndex = parseInt(this.dataset.index);

    // Reorder milestones
    const milestones = currentProject.milestones;
    const [removed] = milestones.splice(fromIndex, 1);
    milestones.splice(toIndex, 0, removed);

    // Save and re-render
    saveProject();
    renderMilestones();
    updateStats();
  }
}

// Render single task
function renderTask(task, milestoneId) {
  const priorityClass = `priority-${task.priority || 'medium'}-border`;
  const tags = (task.tags || []).map(tag =>
    `<span class="tag tag-${tag}">${tag}</span>`
  ).join('');

  const subtasksHtml = (task.subtasks || []).length > 0 ? `
    <div class="task-subtasks">
      ${task.subtasks.map((st, idx) => `
        <div class="subtask ${st.completed ? 'completed' : ''}">
          <input type="checkbox" class="subtask-checkbox"
            ${st.completed ? 'checked' : ''}
            onchange="toggleSubtask('${milestoneId}', '${task.id}', ${idx})">
          <span class="subtask-title">${escapeHtml(st.title)}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  const notesHtml = task.notes ? `<div class="task-notes">📝 ${escapeHtml(task.notes)}</div>` : '';

  const reminderHtml = task.reminder ? `
    <span class="reminder-badge">⏰ ${formatDateTime(task.reminder)}</span>
  ` : '';

  const timerDisplay = formatTimer(task.timerSeconds || 0);
  const timerRunning = taskTimers[task.id] ? 'running' : '';

  return `
    <div class="task ${task.completed ? 'completed' : ''} ${priorityClass}" data-milestone="${milestoneId}" data-task="${task.id}">
      <input
        type="checkbox"
        class="task-checkbox"
        ${task.completed ? 'checked' : ''}
        onchange="toggleTask('${milestoneId}', '${task.id}')"
      >
      <div class="task-main">
        <div class="task-header">
          <span class="priority-indicator ${task.priority || 'medium'}"></span>
          <span class="task-title">${escapeHtml(task.title)}</span>
          <div class="task-tags">${tags}</div>
          ${reminderHtml}
        </div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          <span class="task-time">⏱️ ${task.estimatedHours}h</span>
          <div class="timer ${timerRunning}">
            <span class="timer-display">${timerDisplay}</span>
            <button class="timer-btn" onclick="toggleTimer('${milestoneId}', '${task.id}')">${taskTimers[task.id] ? '⏸️' : '▶️'}</button>
            <button class="timer-btn" onclick="resetTimer('${milestoneId}', '${task.id}')">🔄</button>
          </div>
        </div>
        ${notesHtml}
        ${subtasksHtml}
      </div>
      <div class="task-actions">
        <button class="task-action-btn" onclick="editTask('${milestoneId}', '${task.id}')" title="Bearbeiten">✏️</button>
        <button class="task-action-btn" onclick="askAIAboutTask('${milestoneId}', '${task.id}')" title="AI Hilfe">🤖</button>
        <button class="task-action-btn prompt-btn" onclick="generatePrompt('${milestoneId}', '${task.id}')" title="Claude Code Prompt">📋</button>
      </div>
    </div>
  `;
}

// Render Kanban
function renderKanban() {
  const allTasks = [];
  currentProject.milestones.forEach(m => {
    m.tasks.forEach(t => {
      allTasks.push({ ...t, milestoneId: m.id, milestoneName: m.name });
    });
  });

  const filteredTasks = filterTasks(allTasks);

  const todoTasks = filteredTasks.filter(t => !t.completed && t.status !== 'inprogress');
  const inprogressTasks = filteredTasks.filter(t => !t.completed && t.status === 'inprogress');
  const doneTasks = filteredTasks.filter(t => t.completed);

  document.getElementById('kanban-todo').innerHTML = todoTasks.map(t => renderKanbanTask(t)).join('');
  document.getElementById('kanban-inprogress').innerHTML = inprogressTasks.map(t => renderKanbanTask(t)).join('');
  document.getElementById('kanban-done').innerHTML = doneTasks.map(t => renderKanbanTask(t)).join('');

  document.getElementById('kanban-todo-count').textContent = todoTasks.length;
  document.getElementById('kanban-inprogress-count').textContent = inprogressTasks.length;
  document.getElementById('kanban-done-count').textContent = doneTasks.length;
}

function renderKanbanTask(task) {
  const tags = (task.tags || []).slice(0, 2).map(tag =>
    `<span class="tag tag-${tag}">${tag}</span>`
  ).join('');

  return `
    <div class="kanban-task" data-milestone="${task.milestoneId}" data-task="${task.id}"
         onclick="editTask('${task.milestoneId}', '${task.id}')" draggable="true"
         ondragstart="dragStart(event)" ondragend="dragEnd(event)">
      <div class="kanban-task-title">
        <span class="priority-indicator ${task.priority || 'medium'}"></span>
        ${escapeHtml(task.title)}
      </div>
      <div class="kanban-task-meta">
        <div class="task-tags">${tags}</div>
        <span>⏱️ ${task.estimatedHours}h</span>
      </div>
    </div>
  `;
}

// Drag and drop for Kanban
window.dragStart = function(e) {
  e.target.style.opacity = '0.5';
  e.dataTransfer.setData('text/plain', JSON.stringify({
    milestoneId: e.target.dataset.milestone,
    taskId: e.target.dataset.task
  }));
};

window.dragEnd = function(e) {
  e.target.style.opacity = '1';
};

document.querySelectorAll('.kanban-tasks').forEach(column => {
  column.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  column.addEventListener('drop', (e) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    const status = column.parentElement.dataset.status;

    const milestone = currentProject.milestones.find(m => m.id === data.milestoneId);
    if (milestone) {
      const task = milestone.tasks.find(t => t.id === data.taskId);
      if (task) {
        if (status === 'done') {
          task.completed = true;
          task.status = 'done';
        } else if (status === 'inprogress') {
          task.completed = false;
          task.status = 'inprogress';
        } else {
          task.completed = false;
          task.status = 'todo';
        }
        renderProject();
      }
    }
  });
});

// Toggle milestone collapse
window.toggleMilestone = function(milestoneId) {
  const milestone = document.querySelector(`.milestone[data-id="${milestoneId}"]`);
  if (milestone) {
    milestone.classList.toggle('collapsed');
  }
};

// Toggle task completion
window.toggleTask = function(milestoneId, taskId) {
  const milestone = currentProject.milestones.find(m => m.id === milestoneId);
  if (milestone) {
    const task = milestone.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      task.status = task.completed ? 'done' : 'todo';
      renderProject();
    }
  }
};

// Toggle subtask
window.toggleSubtask = function(milestoneId, taskId, subtaskIndex) {
  const milestone = currentProject.milestones.find(m => m.id === milestoneId);
  if (milestone) {
    const task = milestone.tasks.find(t => t.id === taskId);
    if (task && task.subtasks && task.subtasks[subtaskIndex]) {
      task.subtasks[subtaskIndex].completed = !task.subtasks[subtaskIndex].completed;
      renderProject();
    }
  }
};

// Timer functions
window.toggleTimer = function(milestoneId, taskId) {
  if (taskTimers[taskId]) {
    clearInterval(taskTimers[taskId]);
    delete taskTimers[taskId];
  } else {
    taskTimers[taskId] = setInterval(() => {
      const milestone = currentProject.milestones.find(m => m.id === milestoneId);
      if (milestone) {
        const task = milestone.tasks.find(t => t.id === taskId);
        if (task) {
          task.timerSeconds = (task.timerSeconds || 0) + 1;
          const timerEl = document.querySelector(`.task[data-task="${taskId}"] .timer-display`);
          if (timerEl) {
            timerEl.textContent = formatTimer(task.timerSeconds);
          }
        }
      }
    }, 1000);
  }
  renderProject();
};

window.resetTimer = function(milestoneId, taskId) {
  if (taskTimers[taskId]) {
    clearInterval(taskTimers[taskId]);
    delete taskTimers[taskId];
  }
  const milestone = currentProject.milestones.find(m => m.id === milestoneId);
  if (milestone) {
    const task = milestone.tasks.find(t => t.id === taskId);
    if (task) {
      task.timerSeconds = 0;
      renderProject();
    }
  }
};

function formatTimer(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Edit task
window.editTask = function(milestoneId, taskId) {
  const milestone = currentProject.milestones.find(m => m.id === milestoneId);
  if (!milestone) return;

  const task = milestone.tasks.find(t => t.id === taskId);
  if (!task) return;

  editingTask = task;
  editingMilestoneId = milestoneId;

  document.getElementById('task-title-input').value = task.title;
  document.getElementById('task-description-input').value = task.description || '';
  document.getElementById('task-priority-select').value = task.priority || 'medium';
  document.getElementById('task-hours-input').value = task.estimatedHours;
  document.getElementById('task-tags-input').value = (task.tags || []).join(', ');
  document.getElementById('task-notes-input').value = task.notes || '';
  document.getElementById('task-reminder-input').value = task.reminder || '';

  renderSubtasksList();

  elements.taskModal.classList.remove('hidden');
};

function renderSubtasksList() {
  const container = document.getElementById('subtasks-list');
  const subtasks = editingTask.subtasks || [];

  container.innerHTML = subtasks.map((st, idx) => `
    <div class="subtask" style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
      <input type="checkbox" ${st.completed ? 'checked' : ''} onchange="updateSubtaskComplete(${idx}, this.checked)">
      <input type="text" class="form-input" value="${escapeHtml(st.title)}" onchange="updateSubtaskTitle(${idx}, this.value)" style="flex: 1;">
      <button class="btn btn-danger btn-sm" onclick="removeSubtask(${idx})">×</button>
    </div>
  `).join('');
}

window.updateSubtaskComplete = function(idx, completed) {
  if (editingTask.subtasks && editingTask.subtasks[idx]) {
    editingTask.subtasks[idx].completed = completed;
  }
};

window.updateSubtaskTitle = function(idx, title) {
  if (editingTask.subtasks && editingTask.subtasks[idx]) {
    editingTask.subtasks[idx].title = title;
  }
};

window.removeSubtask = function(idx) {
  if (editingTask.subtasks) {
    editingTask.subtasks.splice(idx, 1);
    renderSubtasksList();
  }
};

function addSubtask() {
  const input = document.getElementById('new-subtask-input');
  const title = input.value.trim();
  if (!title) return;

  if (!editingTask.subtasks) editingTask.subtasks = [];
  editingTask.subtasks.push({ title, completed: false });
  input.value = '';
  renderSubtasksList();
}

function saveTaskChanges() {
  if (!editingTask) return;

  editingTask.title = document.getElementById('task-title-input').value;
  editingTask.description = document.getElementById('task-description-input').value;
  editingTask.priority = document.getElementById('task-priority-select').value;
  editingTask.estimatedHours = parseFloat(document.getElementById('task-hours-input').value) || 0;
  editingTask.tags = document.getElementById('task-tags-input').value.split(',').map(t => t.trim()).filter(t => t);
  editingTask.notes = document.getElementById('task-notes-input').value;
  editingTask.reminder = document.getElementById('task-reminder-input').value || null;

  elements.taskModal.classList.add('hidden');
  editingTask = null;
  editingMilestoneId = null;
  renderProject();
}

function deleteCurrentTask() {
  if (!editingTask || !editingMilestoneId) return;

  const milestone = currentProject.milestones.find(m => m.id === editingMilestoneId);
  if (milestone) {
    milestone.tasks = milestone.tasks.filter(t => t.id !== editingTask.id);
  }

  elements.taskModal.classList.add('hidden');
  editingTask = null;
  editingMilestoneId = null;
  renderProject();
}

// AI Chat
window.askAIAboutTask = function(milestoneId, taskId) {
  const milestone = currentProject.milestones.find(m => m.id === milestoneId);
  if (!milestone) return;

  const task = milestone.tasks.find(t => t.id === taskId);
  if (!task) return;

  elements.aiChatContainer.classList.add('open');
  elements.aiChatInput.value = `Hilf mir bei diesem Task: "${task.title}"`;
  elements.aiChatInput.focus();
};

async function sendChatMessage() {
  const message = elements.aiChatInput.value.trim();
  if (!message) return;

  elements.aiChatInput.value = '';

  // Add user message
  const userMsgEl = document.createElement('div');
  userMsgEl.className = 'ai-message user';
  userMsgEl.textContent = message;
  elements.aiChatMessages.appendChild(userMsgEl);
  elements.aiChatMessages.scrollTop = elements.aiChatMessages.scrollHeight;

  try {
    const projectContext = currentProject ? {
      name: currentProject.name,
      description: currentProject.description
    } : null;

    const result = await window.electronAPI.chat({ message, projectContext });

    const assistantMsgEl = document.createElement('div');
    assistantMsgEl.className = 'ai-message assistant';
    assistantMsgEl.textContent = result.response || result.error || 'Keine Antwort';
    elements.aiChatMessages.appendChild(assistantMsgEl);
    elements.aiChatMessages.scrollTop = elements.aiChatMessages.scrollHeight;
  } catch (e) {
    const errorMsgEl = document.createElement('div');
    errorMsgEl.className = 'ai-message assistant';
    errorMsgEl.textContent = 'Fehler: ' + e.message;
    elements.aiChatMessages.appendChild(errorMsgEl);
  }
}

// Update stats
function updateStats() {
  if (!currentProject) return;

  let totalTasks = 0;
  let completedTasks = 0;
  let totalHours = 0;
  let completedHours = 0;

  for (const milestone of currentProject.milestones || []) {
    for (const task of milestone.tasks || []) {
      totalTasks++;
      totalHours += task.estimatedHours || 0;
      if (task.completed) {
        completedTasks++;
        completedHours += task.estimatedHours || 0;
      }
    }
  }

  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  elements.statProgress.textContent = `${percentage}%`;
  elements.statBarFill.style.width = `${percentage}%`;
  elements.statTasks.textContent = `${completedTasks}/${totalTasks}`;
  elements.statTimeTotal.textContent = `${totalHours}h`;
  elements.statTimeDone.textContent = `${completedHours}h`;
}

// Stats modal
function showStatsModal() {
  if (!currentProject) {
    showToast('Kein Projekt ausgewählt', 'warning');
    return;
  }

  let totalTasks = 0;
  let completedTasks = 0;
  let totalHours = 0;
  let completedHours = 0;
  let timerHours = 0;
  const priorityCounts = { high: 0, medium: 0, low: 0 };
  const tagCounts = {};

  for (const milestone of currentProject.milestones || []) {
    for (const task of milestone.tasks || []) {
      totalTasks++;
      totalHours += task.estimatedHours || 0;
      timerHours += (task.timerSeconds || 0) / 3600;
      priorityCounts[task.priority || 'medium']++;

      (task.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });

      if (task.completed) {
        completedTasks++;
        completedHours += task.estimatedHours || 0;
      }
    }
  }

  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  document.getElementById('stats-details').innerHTML = `
    <div class="stats-container" style="margin-bottom: 24px;">
      <div class="stat-card">
        <h3>Gesamt-Fortschritt</h3>
        <div class="stat-value success">${percentage}%</div>
        <div class="stat-bar">
          <div class="stat-bar-fill" style="width: ${percentage}%; background-color: var(--success);"></div>
        </div>
      </div>
      <div class="stat-card">
        <h3>Tasks</h3>
        <div class="stat-value">${completedTasks} / ${totalTasks}</div>
      </div>
      <div class="stat-card">
        <h3>Geschätzte Zeit</h3>
        <div class="stat-value">${totalHours.toFixed(1)}h</div>
      </div>
      <div class="stat-card">
        <h3>Getrackte Zeit</h3>
        <div class="stat-value info">${timerHours.toFixed(1)}h</div>
      </div>
    </div>

    <h3 style="margin-bottom: 12px;">Prioritäten</h3>
    <div style="display: flex; gap: 16px; margin-bottom: 24px;">
      <div style="flex: 1; text-align: center;">
        <div style="font-size: 2rem; color: var(--danger);">🔴</div>
        <div style="font-weight: 600;">${priorityCounts.high}</div>
        <div style="font-size: 0.85rem; color: var(--text-muted);">Hoch</div>
      </div>
      <div style="flex: 1; text-align: center;">
        <div style="font-size: 2rem; color: var(--warning);">🟡</div>
        <div style="font-weight: 600;">${priorityCounts.medium}</div>
        <div style="font-size: 0.85rem; color: var(--text-muted);">Mittel</div>
      </div>
      <div style="flex: 1; text-align: center;">
        <div style="font-size: 2rem; color: var(--success);">🟢</div>
        <div style="font-weight: 600;">${priorityCounts.low}</div>
        <div style="font-size: 0.85rem; color: var(--text-muted);">Niedrig</div>
      </div>
    </div>

    ${Object.keys(tagCounts).length > 0 ? `
      <h3 style="margin-bottom: 12px;">Tags</h3>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        ${Object.entries(tagCounts).map(([tag, count]) =>
          `<span class="tag tag-${tag}">${tag}: ${count}</span>`
        ).join('')}
      </div>
    ` : ''}
  `;

  elements.statsModal.classList.remove('hidden');
}

// Reminders
function checkReminders() {
  if (!currentProject) return;

  const now = new Date();

  for (const milestone of currentProject.milestones || []) {
    for (const task of milestone.tasks || []) {
      if (task.reminder && !task.completed) {
        const reminderDate = new Date(task.reminder);
        if (reminderDate <= now && reminderDate > new Date(now.getTime() - 60000)) {
          showToast(`⏰ Erinnerung: ${task.title}`, 'warning');
          if (Notification.permission === 'granted') {
            new Notification('AI Project Manager', {
              body: `Erinnerung: ${task.title}`,
              icon: '📋'
            });
          }
        }
      }
    }
  }
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

// Show toast notification
function showToast(message, type = 'success') {
  elements.toastMessage.textContent = message;
  elements.toast.className = `toast ${type}`;
  elements.toast.classList.remove('hidden');

  setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 3000);
}

// Utility functions
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Feature Suggestions Modal
async function showFeatureSuggestions() {
  elements.featuresModal.classList.remove('hidden');
  elements.featuresList.classList.add('hidden');
  elements.featuresLoading.classList.remove('hidden');
  suggestedFeatures = [];

  try {
    const result = await window.electronAPI.suggestFeatures({
      projectName: currentProject.name,
      projectDescription: currentProject.description,
      context: pendingProjectContext
    });

    if (result.error) {
      showToast('Feature-Vorschläge konnten nicht geladen werden', 'warning');
      elements.featuresModal.classList.add('hidden');
      return;
    }

    suggestedFeatures = result.features || [];
    renderFeaturesList();
  } catch (e) {
    showToast('Fehler beim Laden der Vorschläge', 'error');
    elements.featuresModal.classList.add('hidden');
  }
}

// Suggest features for an existing project
async function suggestFeaturesForProject() {
  if (!currentProject) {
    showToast('Kein Projekt ausgewählt', 'warning');
    return;
  }

  // Get existing task titles to exclude from suggestions
  const existingTasks = [];
  for (const milestone of currentProject.milestones || []) {
    for (const task of milestone.tasks || []) {
      existingTasks.push(task.title.toLowerCase());
    }
  }

  // Show modal with loading
  elements.featuresModal.classList.remove('hidden');
  elements.featuresList.classList.add('hidden');
  elements.featuresLoading.classList.remove('hidden');

  try {
    const result = await window.electronAPI.suggestFeatures({
      projectName: currentProject.name,
      projectDescription: currentProject.description,
      context: currentProject.context || '',
      excludeFeatures: existingTasks
    });

    if (result.error) {
      showToast(result.error, 'error');
      elements.featuresModal.classList.add('hidden');
      return;
    }

    suggestedFeatures = result.features || [];
    pendingProjectContext = currentProject.context || '';
    renderFeaturesList();
  } catch (e) {
    showToast('Fehler beim Laden der Vorschläge', 'error');
    elements.featuresModal.classList.add('hidden');
  }
}

function renderFeaturesList() {
  elements.featuresLoading.classList.add('hidden');
  elements.featuresList.classList.remove('hidden');

  if (suggestedFeatures.length === 0) {
    elements.featuresList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 24px;">Keine Feature-Vorschläge verfügbar.</p>';
    return;
  }

  elements.featuresList.innerHTML = suggestedFeatures.map((feature, idx) => {
    const complexityLabel = {
      easy: 'Einfach',
      medium: 'Mittel',
      hard: 'Komplex'
    }[feature.complexity] || 'Mittel';

    return `
      <div class="feature-item" data-index="${idx}" onclick="toggleFeatureSelection(${idx})">
        <input type="checkbox" class="feature-checkbox" id="feature-${idx}" onclick="event.stopPropagation()">
        <div class="feature-content">
          <div class="feature-header">
            <span class="feature-icon">${feature.icon || '✨'}</span>
            <span class="feature-title">${escapeHtml(feature.title)}</span>
            <span class="feature-complexity ${feature.complexity || 'medium'}">${complexityLabel}</span>
          </div>
          <div class="feature-description">${escapeHtml(feature.description)}</div>
          <div class="feature-estimate">⏱️ Geschätzt: ${feature.estimatedHours || 2}h</div>
        </div>
      </div>
    `;
  }).join('');

  // Sync checkbox clicks with feature item selection
  elements.featuresList.querySelectorAll('.feature-checkbox').forEach((checkbox, idx) => {
    checkbox.addEventListener('change', () => {
      const item = checkbox.closest('.feature-item');
      if (checkbox.checked) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  });
}

window.toggleFeatureSelection = function(idx) {
  const item = elements.featuresList.querySelector(`[data-index="${idx}"]`);
  const checkbox = item.querySelector('.feature-checkbox');

  checkbox.checked = !checkbox.checked;
  if (checkbox.checked) {
    item.classList.add('selected');
  } else {
    item.classList.remove('selected');
  }
};

function closeFeaturesModal() {
  elements.featuresModal.classList.add('hidden');
  suggestedFeatures = [];
}

async function generateMoreFeatures() {
  // Save currently selected indices
  const selectedIndices = new Set();
  elements.featuresList.querySelectorAll('.feature-checkbox:checked').forEach(checkbox => {
    const item = checkbox.closest('.feature-item');
    selectedIndices.add(parseInt(item.dataset.index));
  });

  // Keep existing feature titles to exclude
  const existingTitles = suggestedFeatures.map(f => f.title.toLowerCase());
  const startIndex = suggestedFeatures.length;

  // Show loading indicator below existing features
  elements.featuresLoading.classList.remove('hidden');

  try {
    const result = await window.electronAPI.suggestFeatures({
      projectName: currentProject.name,
      projectDescription: currentProject.description,
      context: pendingProjectContext,
      excludeFeatures: existingTitles
    });

    elements.featuresLoading.classList.add('hidden');

    if (result.error) {
      showToast('Weitere Vorschläge konnten nicht geladen werden', 'warning');
      return;
    }

    // Filter out duplicates
    const newFeatures = (result.features || []).filter(f =>
      !existingTitles.includes(f.title.toLowerCase())
    );

    if (newFeatures.length === 0) {
      showToast('Keine weiteren neuen Features gefunden', 'info');
      return;
    }

    // Add new features to array
    suggestedFeatures = [...suggestedFeatures, ...newFeatures];

    // Append new features to DOM (don't re-render existing ones)
    appendNewFeatures(newFeatures, startIndex);

    // Restore selections
    selectedIndices.forEach(idx => {
      const item = elements.featuresList.querySelector(`[data-index="${idx}"]`);
      if (item) {
        const checkbox = item.querySelector('.feature-checkbox');
        checkbox.checked = true;
        item.classList.add('selected');
      }
    });

    showToast(`${newFeatures.length} neue Features hinzugefügt!`);
  } catch (e) {
    showToast('Fehler beim Laden weiterer Vorschläge', 'error');
    elements.featuresLoading.classList.add('hidden');
  }
}

function appendNewFeatures(features, startIndex) {
  const complexityLabels = {
    easy: 'Einfach',
    medium: 'Mittel',
    hard: 'Komplex'
  };

  features.forEach((feature, i) => {
    const idx = startIndex + i;
    const complexityLabel = complexityLabels[feature.complexity] || 'Mittel';

    const featureHtml = `
      <div class="feature-item" data-index="${idx}" onclick="toggleFeatureSelection(${idx})">
        <input type="checkbox" class="feature-checkbox" id="feature-${idx}" onclick="event.stopPropagation()">
        <div class="feature-content">
          <div class="feature-header">
            <span class="feature-icon">${feature.icon || '✨'}</span>
            <span class="feature-title">${escapeHtml(feature.title)}</span>
            <span class="feature-complexity ${feature.complexity || 'medium'}">${complexityLabel}</span>
          </div>
          <div class="feature-description">${escapeHtml(feature.description)}</div>
          <div class="feature-estimate">⏱️ Geschätzt: ${feature.estimatedHours || 2}h</div>
        </div>
      </div>
    `;

    elements.featuresList.insertAdjacentHTML('beforeend', featureHtml);

    // Add event listener for the new checkbox
    const newItem = elements.featuresList.querySelector(`[data-index="${idx}"]`);
    const checkbox = newItem.querySelector('.feature-checkbox');
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        newItem.classList.add('selected');
      } else {
        newItem.classList.remove('selected');
      }
    });
  });
}

function addSelectedFeatures() {
  const selectedIndices = [];
  elements.featuresList.querySelectorAll('.feature-checkbox:checked').forEach(checkbox => {
    const item = checkbox.closest('.feature-item');
    selectedIndices.push(parseInt(item.dataset.index));
  });

  if (selectedIndices.length === 0) {
    closeFeaturesModal();
    return;
  }

  // Find or create a "Features" milestone
  let featuresMilestone = currentProject.milestones.find(m =>
    m.name.toLowerCase().includes('feature') || m.name.toLowerCase().includes('erweiterung')
  );

  if (!featuresMilestone) {
    featuresMilestone = {
      id: generateUUID(),
      name: 'Zusätzliche Features',
      tasks: []
    };
    currentProject.milestones.push(featuresMilestone);
  }

  // Add selected features as tasks
  selectedIndices.forEach(idx => {
    const feature = suggestedFeatures[idx];
    if (feature) {
      const task = {
        id: generateUUID(),
        title: feature.title,
        description: feature.description,
        estimatedHours: feature.estimatedHours || 2,
        priority: feature.complexity === 'hard' ? 'high' : (feature.complexity === 'easy' ? 'low' : 'medium'),
        tags: ['feature'],
        notes: '',
        subtasks: [],
        reminder: null,
        timerSeconds: 0,
        status: 'todo',
        completed: false
      };
      featuresMilestone.tasks.push(task);
    }
  });

  // Update total estimated hours
  let totalHours = 0;
  currentProject.milestones.forEach(m => {
    m.tasks.forEach(t => {
      totalHours += t.estimatedHours || 0;
    });
  });
  currentProject.totalEstimatedHours = totalHours;

  showToast(`${selectedIndices.length} Feature(s) hinzugefügt!`);
  closeFeaturesModal();
  renderProject();
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============== NEW FEATURES ==============

// PDF Export
async function exportPDF() {
  if (!currentProject) return;
  await saveProject();

  // Create PDF content as HTML
  let totalTasks = 0, completedTasks = 0, totalHours = 0, completedHours = 0;

  let html = `
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { color: #6366f1; }
        h2 { color: #374151; margin-top: 24px; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat { background: #f3f4f6; padding: 16px; border-radius: 8px; }
        .task { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .task.completed { color: #9ca3af; text-decoration: line-through; }
        .priority-high { border-left: 3px solid #ef4444; padding-left: 8px; }
        .priority-medium { border-left: 3px solid #f59e0b; padding-left: 8px; }
        .priority-low { border-left: 3px solid #10b981; padding-left: 8px; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(currentProject.name)}</h1>
      <p><em>${escapeHtml(currentProject.description)}</em></p>
  `;

  for (const milestone of currentProject.milestones || []) {
    const mHours = milestone.tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
    html += `<h2>${escapeHtml(milestone.name)} (${mHours}h)</h2>`;

    for (const task of milestone.tasks || []) {
      totalTasks++;
      totalHours += task.estimatedHours || 0;
      if (task.completed) {
        completedTasks++;
        completedHours += task.estimatedHours || 0;
      }
      html += `
        <div class="task ${task.completed ? 'completed' : ''} priority-${task.priority || 'medium'}">
          <strong>${task.completed ? '✓' : '○'} ${escapeHtml(task.title)}</strong> (${task.estimatedHours}h)
          ${task.description ? `<br><small>${escapeHtml(task.description)}</small>` : ''}
        </div>
      `;
    }
  }

  const progress = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
  html += `
      <hr style="margin-top: 24px;">
      <p><strong>Fortschritt:</strong> ${progress}% | <strong>Tasks:</strong> ${completedTasks}/${totalTasks} | <strong>Zeit:</strong> ${completedHours}/${totalHours}h</p>
      <p><small>Generiert am ${new Date().toLocaleDateString('de-DE')}</small></p>
    </body>
    </html>
  `;

  // Open print dialog (acts as PDF export in Electron)
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();

  showToast('PDF-Druckdialog geöffnet!');
}

// AI Summary/Report
async function showAISummary() {
  if (!currentProject) {
    showToast('Kein Projekt ausgewählt', 'warning');
    return;
  }

  elements.summaryModal.classList.remove('hidden');
  elements.summaryContent.innerHTML = '';
  elements.summaryLoading.classList.remove('hidden');

  try {
    const result = await window.electronAPI.generateSummary(currentProject);
    elements.summaryLoading.classList.add('hidden');

    if (result.error) {
      elements.summaryContent.innerHTML = `<p style="color: var(--danger);">Fehler: ${result.error}</p>`;
      return;
    }

    elements.summaryContent.innerHTML = `<div class="summary-content">${escapeHtml(result.summary).replace(/\n/g, '<br>')}</div>`;
  } catch (e) {
    elements.summaryLoading.classList.add('hidden');
    elements.summaryContent.innerHTML = `<p style="color: var(--danger);">Fehler beim Generieren des Reports</p>`;
  }
}

function copySummary() {
  const summaryText = elements.summaryContent.innerText;
  navigator.clipboard.writeText(summaryText).then(() => {
    showToast('Report kopiert!');
  });
}

// Dashboard
async function showDashboard() {
  elements.dashboardModal.classList.remove('hidden');
  elements.dashboardContent.innerHTML = '<div class="features-loading"><div class="spinner"></div><p>Lade Projekte...</p></div>';

  try {
    const projects = await window.electronAPI.getAllProjectsFull();

    let totalProjects = projects.length;
    let totalTasks = 0, completedTasks = 0, totalHours = 0, trackedHours = 0;

    for (const project of projects) {
      for (const milestone of project.milestones || []) {
        for (const task of milestone.tasks || []) {
          totalTasks++;
          totalHours += task.estimatedHours || 0;
          trackedHours += (task.timerSeconds || 0) / 3600;
          if (task.completed) completedTasks++;
        }
      }
    }

    let html = `
      <div class="dashboard-summary">
        <div class="dashboard-summary-card">
          <h4>Projekte</h4>
          <div class="value">${totalProjects}</div>
        </div>
        <div class="dashboard-summary-card">
          <h4>Tasks Gesamt</h4>
          <div class="value">${totalTasks}</div>
        </div>
        <div class="dashboard-summary-card">
          <h4>Erledigt</h4>
          <div class="value" style="color: var(--success);">${completedTasks}</div>
        </div>
        <div class="dashboard-summary-card">
          <h4>Getrackte Zeit</h4>
          <div class="value">${trackedHours.toFixed(1)}h</div>
        </div>
      </div>
      <h3 style="margin-bottom: 16px;">Alle Projekte</h3>
      <div class="dashboard-grid">
    `;

    for (const project of projects) {
      let pTasks = 0, pCompleted = 0, pHours = 0;
      for (const m of project.milestones || []) {
        for (const t of m.tasks || []) {
          pTasks++;
          pHours += t.estimatedHours || 0;
          if (t.completed) pCompleted++;
        }
      }
      const progress = pTasks > 0 ? Math.round(pCompleted / pTasks * 100) : 0;

      html += `
        <div class="dashboard-project-card" onclick="loadProjectFromDashboard('${project.id}')">
          <h3>${escapeHtml(project.name)}</h3>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%;"></div>
          </div>
          <div class="dashboard-project-meta">
            <span>${pCompleted}/${pTasks} Tasks</span>
            <span>${pHours}h</span>
          </div>
        </div>
      `;
    }

    html += '</div>';
    elements.dashboardContent.innerHTML = html;
  } catch (e) {
    elements.dashboardContent.innerHTML = '<p style="color: var(--danger);">Fehler beim Laden</p>';
  }
}

window.loadProjectFromDashboard = async function(projectId) {
  elements.dashboardModal.classList.add('hidden');
  await loadProject(projectId);
};

// Time Tracking
async function showTimeTracking() {
  elements.timetrackModal.classList.remove('hidden');
  renderTimeTracking();
}

async function renderTimeTracking() {
  if (!currentProject) {
    elements.timetrackContent.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Kein Projekt ausgewählt</p>';
    return;
  }

  // Calculate time per day
  const now = new Date();
  const days = [];
  const dayLabels = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  let daysToShow = currentTimetrackPeriod === 'week' ? 7 : (currentTimetrackPeriod === 'month' ? 30 : 90);

  for (let i = daysToShow - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().split('T')[0],
      label: currentTimetrackPeriod === 'week' ? dayLabels[d.getDay()] : `${d.getDate()}.${d.getMonth() + 1}`,
      seconds: 0
    });
  }

  // Aggregate tracked time from tasks
  let totalTracked = 0;
  const taskTimes = [];

  for (const milestone of currentProject.milestones || []) {
    for (const task of milestone.tasks || []) {
      if (task.timerSeconds > 0) {
        totalTracked += task.timerSeconds;
        taskTimes.push({
          title: task.title,
          seconds: task.timerSeconds
        });
      }
    }
  }

  // For simplicity, distribute tracked time evenly (in a real app, you'd track per day)
  const avgPerDay = days.length > 0 ? totalTracked / days.length : 0;
  days.forEach(d => d.seconds = avgPerDay);

  const maxSeconds = Math.max(...days.map(d => d.seconds), 3600);
  const chartHeight = 160;

  let html = `
    <div class="timetrack-chart" style="padding-bottom: 40px;">
      ${days.map(d => {
        const height = maxSeconds > 0 ? (d.seconds / maxSeconds * chartHeight) : 4;
        const hours = (d.seconds / 3600).toFixed(1);
        return `
          <div class="timetrack-bar" style="height: ${height}px;">
            <span class="timetrack-bar-value">${hours}h</span>
            <span class="timetrack-bar-label">${d.label}</span>
          </div>
        `;
      }).join('')}
    </div>

    <div class="timetrack-details">
      <div class="timetrack-detail-card">
        <h4>Gesamt getrackte Zeit</h4>
        <div style="font-size: 2rem; font-weight: 700;">${(totalTracked / 3600).toFixed(1)}h</div>
      </div>
      <div class="timetrack-detail-card">
        <h4>Top Tasks nach Zeit</h4>
        ${taskTimes.sort((a, b) => b.seconds - a.seconds).slice(0, 5).map(t => `
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid var(--border-color);">
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 70%;">${escapeHtml(t.title)}</span>
            <span style="font-weight: 600;">${(t.seconds / 3600).toFixed(1)}h</span>
          </div>
        `).join('') || '<p style="color: var(--text-muted);">Keine Daten</p>'}
      </div>
    </div>
  `;

  elements.timetrackContent.innerHTML = html;
}

// AI Split Task
async function showAISplitTask() {
  if (!editingTask) {
    showToast('Kein Task ausgewählt', 'warning');
    return;
  }

  elements.taskModal.classList.add('hidden');
  elements.splitTaskModal.classList.remove('hidden');
  elements.splitTaskContent.innerHTML = '';
  elements.splitTaskLoading.classList.remove('hidden');
  splitSubtasks = [];

  try {
    const result = await window.electronAPI.splitTask({
      task: editingTask,
      projectContext: currentProject?.description
    });

    elements.splitTaskLoading.classList.add('hidden');

    if (result.error) {
      elements.splitTaskContent.innerHTML = `<p style="color: var(--danger);">Fehler: ${result.error}</p>`;
      return;
    }

    splitSubtasks = result.subtasks || [];
    renderSplitSubtasks();
  } catch (e) {
    elements.splitTaskLoading.classList.add('hidden');
    elements.splitTaskContent.innerHTML = `<p style="color: var(--danger);">Fehler beim Analysieren</p>`;
  }
}

function renderSplitSubtasks() {
  if (splitSubtasks.length === 0) {
    elements.splitTaskContent.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Keine Subtasks generiert</p>';
    return;
  }

  elements.splitTaskContent.innerHTML = splitSubtasks.map((st, idx) => `
    <div class="split-subtask-item">
      <input type="checkbox" checked data-index="${idx}">
      <div class="split-subtask-content">
        <div class="split-subtask-title">${escapeHtml(st.title)}</div>
        <div class="split-subtask-desc">${escapeHtml(st.description || '')}</div>
        <div class="split-subtask-meta">⏱️ ${st.estimatedHours || 0.5}h</div>
      </div>
    </div>
  `).join('');
}

function applySplitSubtasks() {
  if (!editingTask || !editingMilestoneId) {
    elements.splitTaskModal.classList.add('hidden');
    return;
  }

  const selectedIndices = [];
  elements.splitTaskContent.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
    selectedIndices.push(parseInt(cb.dataset.index));
  });

  if (selectedIndices.length === 0) {
    elements.splitTaskModal.classList.add('hidden');
    return;
  }

  // Add selected subtasks to the task
  if (!editingTask.subtasks) editingTask.subtasks = [];

  selectedIndices.forEach(idx => {
    const st = splitSubtasks[idx];
    if (st) {
      editingTask.subtasks.push({
        title: st.title,
        completed: false
      });
    }
  });

  showToast(`${selectedIndices.length} Subtask(s) hinzugefügt!`);
  elements.splitTaskModal.classList.add('hidden');
  splitSubtasks = [];
  renderProject();
}

// Gantt Chart
function renderGantt() {
  if (!currentProject) return;

  // Get settings
  const hoursPerDay = parseInt(elements.ganttHoursPerDay.value) || 8;
  const daysCount = parseInt(elements.ganttDaysCount.value) || 14;
  const skipWeekends = elements.ganttSkipWeekends.checked;

  const allTasks = [];
  let taskIndex = 0;

  for (const milestone of currentProject.milestones || []) {
    for (const task of milestone.tasks || []) {
      allTasks.push({
        ...task,
        index: taskIndex++,
        milestoneName: milestone.name
      });
    }
  }

  // Generate days from today
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let dayOffset = 0;
  while (days.length < daysCount) {
    const d = new Date(today);
    d.setDate(d.getDate() + dayOffset);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

    // Skip weekends if option is enabled
    if (!skipWeekends || !isWeekend) {
      days.push({
        date: d,
        label: `${d.getDate()}.${d.getMonth() + 1}`,
        isWeekend: isWeekend,
        isToday: dayOffset === 0,
        dayIndex: days.length
      });
    }
    dayOffset++;
  }

  // Render header
  elements.ganttTimelineHeader.innerHTML = days.map(d =>
    `<div class="gantt-day ${d.isWeekend ? 'weekend' : ''} ${d.isToday ? 'today' : ''}">${d.label}</div>`
  ).join('');

  // Render rows - schedule tasks sequentially
  let currentHours = 0; // Track hours used
  elements.ganttBody.innerHTML = allTasks.map(task => {
    const taskHours = task.estimatedHours || 1;

    // Calculate start day based on accumulated hours
    const startDay = Math.floor(currentHours / hoursPerDay);
    const startHourInDay = currentHours % hoursPerDay;

    // Calculate duration in days (can span multiple days)
    const remainingHoursFirstDay = hoursPerDay - startHourInDay;
    let durationDays;
    if (taskHours <= remainingHoursFirstDay) {
      durationDays = 1;
    } else {
      durationDays = 1 + Math.ceil((taskHours - remainingHoursFirstDay) / hoursPerDay);
    }

    // Update current hours for next task
    currentHours += taskHours;

    // Calculate bar position (40px per day)
    const dayWidth = 40;
    const barLeft = startDay * dayWidth + (startHourInDay / hoursPerDay) * dayWidth + 2;
    const barWidth = Math.max((taskHours / hoursPerDay) * dayWidth - 4, 28);

    // Check if task is within visible range
    if (startDay >= daysCount) {
      return ''; // Task is beyond visible range
    }

    return `
      <div class="gantt-row">
        <div class="gantt-row-task" title="${escapeHtml(task.title)} (${taskHours}h)">
          <span class="priority-indicator ${task.priority || 'medium'}" style="display: inline-block; margin-right: 6px;"></span>
          ${escapeHtml(task.title)}
        </div>
        <div class="gantt-row-timeline">
          ${days.map(d => `<div class="gantt-row-cell ${d.isWeekend ? 'weekend' : ''}"></div>`).join('')}
          <div class="gantt-bar ${task.completed ? 'completed' : ''} priority-${task.priority || 'medium'}"
               style="left: ${barLeft}px; width: ${barWidth}px;"
               title="${taskHours}h - Tag ${startDay + 1}">
            ${taskHours}h
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Show total project duration
  const totalHours = allTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const totalDays = Math.ceil(totalHours / hoursPerDay);
  const summaryEl = document.getElementById('gantt-summary');
  if (!summaryEl) {
    const summary = document.createElement('div');
    summary.id = 'gantt-summary';
    summary.className = 'gantt-summary';
    elements.ganttContainer.appendChild(summary);
  }
  document.getElementById('gantt-summary').innerHTML = `
    <strong>Gesamt:</strong> ${totalHours}h = ${totalDays} Arbeitstage (bei ${hoursPerDay}h/Tag)
  `;
}

// Drag and Drop for Milestones/Tasks
function setupDragAndDrop() {
  // Will be called after rendering milestones
}

window.handleMilestoneDragStart = function(e, milestoneId) {
  draggedElement = { type: 'milestone', id: milestoneId };
  e.target.classList.add('dragging');
};

window.handleMilestoneDragEnd = function(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  draggedElement = null;
};

window.handleMilestoneDragOver = function(e) {
  e.preventDefault();
  if (draggedElement?.type === 'milestone') {
    e.currentTarget.classList.add('drag-over');
  }
};

window.handleMilestoneDragLeave = function(e) {
  e.currentTarget.classList.remove('drag-over');
};

window.handleMilestoneDrop = function(e, targetMilestoneId) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');

  if (!draggedElement || draggedElement.type !== 'milestone') return;
  if (draggedElement.id === targetMilestoneId) return;

  const milestones = currentProject.milestones;
  const draggedIdx = milestones.findIndex(m => m.id === draggedElement.id);
  const targetIdx = milestones.findIndex(m => m.id === targetMilestoneId);

  if (draggedIdx === -1 || targetIdx === -1) return;

  // Reorder
  const [removed] = milestones.splice(draggedIdx, 1);
  milestones.splice(targetIdx, 0, removed);

  renderProject();
  showToast('Meilenstein verschoben');
};

// ============== NEW CHART FEATURES ==============

// CSV Export
async function exportCSV() {
  if (!currentProject) {
    showToast('Kein Projekt ausgewählt', 'warning');
    return;
  }

  let csv = 'Meilenstein,Task,Beschreibung,Status,Priorität,Stunden,Tags\n';

  for (const milestone of currentProject.milestones || []) {
    for (const task of milestone.tasks || []) {
      const status = task.completed ? 'Erledigt' : 'Offen';
      const priority = task.priority || 'medium';
      const tags = (task.tags || []).join(';');
      const desc = (task.description || '').replace(/"/g, '""');
      csv += `"${milestone.name}","${task.title}","${desc}","${status}","${priority}",${task.estimatedHours || 0},"${tags}"\n`;
    }
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentProject.name}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('CSV exportiert!');
}

// Burndown Chart
function renderBurndown() {
  if (!currentProject) return;

  const chartEl = document.getElementById('burndown-chart');
  if (!chartEl) return;

  let totalHours = 0;
  let completedHours = 0;
  let totalTasks = 0;
  let completedTasks = 0;

  for (const milestone of currentProject.milestones || []) {
    for (const task of milestone.tasks || []) {
      totalHours += task.estimatedHours || 0;
      totalTasks++;
      if (task.completed) {
        completedHours += task.estimatedHours || 0;
        completedTasks++;
      }
    }
  }

  const chartWidth = chartEl.offsetWidth - 80;
  const chartHeight = 260;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };

  // Simulate sprint days (14 days default)
  const days = 14;
  const idealDecrement = totalHours / days;

  // Generate data points
  const idealData = [];
  const actualData = [];

  for (let i = 0; i <= days; i++) {
    idealData.push(totalHours - (idealDecrement * i));
    // Simulate progress based on completed percentage
    const progress = completedHours / totalHours || 0;
    const currentDay = Math.floor(days * progress);
    if (i <= currentDay) {
      actualData.push(totalHours - (completedHours * (i / Math.max(currentDay, 1))));
    } else {
      actualData.push(totalHours - completedHours);
    }
  }

  // Calculate scale
  const xScale = (chartWidth - padding.left - padding.right) / days;
  const yScale = (chartHeight - padding.top - padding.bottom) / Math.max(totalHours, 1);

  // Generate SVG paths
  let idealPath = `M ${padding.left} ${padding.top + (totalHours - idealData[0]) * yScale}`;
  let actualPath = `M ${padding.left} ${padding.top + (totalHours - actualData[0]) * yScale}`;
  let areaPath = actualPath;

  for (let i = 1; i <= days; i++) {
    const x = padding.left + i * xScale;
    idealPath += ` L ${x} ${padding.top + (totalHours - idealData[i]) * yScale}`;
    actualPath += ` L ${x} ${padding.top + (totalHours - actualData[i]) * yScale}`;
    areaPath += ` L ${x} ${padding.top + (totalHours - actualData[i]) * yScale}`;
  }

  // Close area path
  areaPath += ` L ${padding.left + days * xScale} ${chartHeight - padding.bottom}`;
  areaPath += ` L ${padding.left} ${chartHeight - padding.bottom} Z`;

  // Generate grid lines
  let gridLines = '';
  const gridSteps = 5;
  for (let i = 0; i <= gridSteps; i++) {
    const y = padding.top + (i / gridSteps) * (chartHeight - padding.top - padding.bottom);
    const value = Math.round(totalHours * (1 - i / gridSteps));
    gridLines += `<line x1="${padding.left}" y1="${y}" x2="${chartWidth}" y2="${y}" stroke="var(--border-color)" stroke-width="1"/>`;
    gridLines += `<text x="${padding.left - 10}" y="${y + 4}" fill="var(--text-muted)" font-size="11" text-anchor="end">${value}h</text>`;
  }

  // Generate x-axis labels
  let xLabels = '';
  for (let i = 0; i <= days; i += 2) {
    const x = padding.left + i * xScale;
    xLabels += `<text x="${x}" y="${chartHeight - 10}" fill="var(--text-muted)" font-size="11" text-anchor="middle">Tag ${i}</text>`;
  }

  chartEl.innerHTML = `
    <svg width="100%" height="${chartHeight}" viewBox="0 0 ${chartWidth + 40} ${chartHeight}">
      <defs>
        <linearGradient id="burndownGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="var(--accent-primary)" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="var(--accent-primary)" stop-opacity="0"/>
        </linearGradient>
      </defs>
      ${gridLines}
      <path d="${areaPath}" fill="url(#burndownGradient)"/>
      <path d="${idealPath}" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-dasharray="8,4"/>
      <path d="${actualPath}" fill="none" stroke="var(--accent-primary)" stroke-width="3" style="filter: drop-shadow(0 0 6px var(--accent-glow));"/>
      ${xLabels}
    </svg>
    <div style="text-align: center; margin-top: 16px; color: var(--text-secondary);">
      <strong style="color: var(--accent-primary);">${completedHours}h</strong> von <strong>${totalHours}h</strong> erledigt
      (${totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0}%)
    </div>
  `;
}

// Milestone Timeline
function renderTimeline() {
  if (!currentProject) return;

  const container = document.getElementById('timeline-content');
  if (!container) return;

  const hoursPerDay = parseInt(elements.ganttHoursPerDay?.value) || 8;
  let accumulatedHours = 0;
  const today = new Date();

  let html = '<div class="timeline-line"></div>';

  for (const milestone of currentProject.milestones || []) {
    let milestoneHours = 0;
    let completedHours = 0;
    let totalTasks = milestone.tasks?.length || 0;
    let completedTasks = 0;

    for (const task of milestone.tasks || []) {
      milestoneHours += task.estimatedHours || 0;
      if (task.completed) {
        completedHours += task.estimatedHours || 0;
        completedTasks++;
      }
    }

    const progress = milestoneHours > 0 ? Math.round(completedHours / milestoneHours * 100) : 0;
    const daysFromStart = Math.ceil(accumulatedHours / hoursPerDay);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysFromStart);

    let statusClass = '';
    if (progress === 100) statusClass = 'completed';
    else if (progress > 0) statusClass = 'in-progress';

    html += `
      <div class="timeline-item ${statusClass}">
        <div class="timeline-dot"></div>
        <div class="timeline-item-header">
          <span class="timeline-item-title">${escapeHtml(milestone.name)}</span>
          <span class="timeline-item-date">${endDate.toLocaleDateString('de-DE')}</span>
        </div>
        <div class="timeline-item-tasks">${completedTasks}/${totalTasks} Tasks • ${milestoneHours}h geschätzt</div>
        <div class="timeline-item-progress">
          <div class="timeline-progress-bar">
            <div class="timeline-progress-fill" style="width: ${progress}%;"></div>
          </div>
          <span class="timeline-progress-text">${progress}%</span>
        </div>
      </div>
    `;

    accumulatedHours += milestoneHours;
  }

  container.innerHTML = html;
}

// Heatmap
function showHeatmap() {
  const modal = document.getElementById('heatmap-modal');
  const grid = document.getElementById('heatmap-grid');
  if (!modal || !grid) return;

  modal.classList.remove('hidden');

  // Generate mock heatmap data (in a real app, this would come from time tracking)
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const hours = Array.from({length: 12}, (_, i) => i + 8); // 8:00 - 19:00

  // Aggregate tracked time from tasks
  const heatData = {};
  if (currentProject) {
    for (const milestone of currentProject.milestones || []) {
      for (const task of milestone.tasks || []) {
        if (task.timerSeconds > 0) {
          // Distribute randomly for demo purposes
          const day = Math.floor(Math.random() * 7);
          const hour = Math.floor(Math.random() * 12) + 8;
          const key = `${day}-${hour}`;
          heatData[key] = (heatData[key] || 0) + task.timerSeconds / 3600;
        }
      }
    }
  }

  const maxValue = Math.max(...Object.values(heatData), 1);

  let html = `<div class="heatmap-hours">`;
  for (const h of hours) {
    html += `<div class="heatmap-hour">${h}</div>`;
  }
  html += '</div>';

  for (let d = 0; d < days.length; d++) {
    html += `<div class="heatmap-row">
      <div class="heatmap-label">${days[d]}</div>
      <div class="heatmap-cells">`;

    for (const h of hours) {
      const key = `${d}-${h}`;
      const value = heatData[key] || 0;
      const level = value === 0 ? 0 : Math.min(4, Math.ceil((value / maxValue) * 4));
      html += `<div class="heatmap-cell level-${level}" title="${days[d]} ${h}:00 - ${value.toFixed(1)}h"></div>`;
    }

    html += '</div></div>';
  }

  grid.innerHTML = html;
}

// Dependency Graph
function showDependencyGraph() {
  const modal = document.getElementById('dependency-modal');
  const graph = document.getElementById('dependency-graph');
  if (!modal || !graph || !currentProject) {
    showToast('Kein Projekt ausgewählt', 'warning');
    return;
  }

  modal.classList.remove('hidden');

  let html = '';

  for (const milestone of currentProject.milestones || []) {
    html += `
      <div class="dependency-milestone">
        <div class="dependency-milestone-title">
          📁 ${escapeHtml(milestone.name)}
        </div>
        <div class="dependency-tasks">
    `;

    const tasks = milestone.tasks || [];
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const hasNext = i < tasks.length - 1;

      html += `
        <div class="dependency-task ${task.completed ? 'completed' : ''}">
          <div class="dependency-task-title">
            <span class="priority-indicator ${task.priority || 'medium'}"></span>
            ${escapeHtml(task.title)}
          </div>
          <div class="dependency-task-meta">
            <span>⏱️ ${task.estimatedHours}h</span>
            <span>${task.completed ? '✅' : '○'}</span>
          </div>
          ${hasNext ? '<div class="dependency-arrow"></div>' : ''}
        </div>
      `;
    }

    html += '</div></div>';
  }

  graph.innerHTML = html;
}

// Sprint Planning
let sprintPlan = null;

async function generateSprintPlan() {
  if (!currentProject) {
    showToast('Kein Projekt ausgewählt', 'warning');
    return;
  }

  const duration = parseInt(document.getElementById('sprint-duration').value) || 14;
  const hoursPerDay = parseInt(document.getElementById('sprint-hours').value) || 8;
  const totalSprintHours = duration * hoursPerDay;

  const loading = document.getElementById('sprint-loading');
  const result = document.getElementById('sprint-result');
  const applyBtn = document.getElementById('apply-sprint-btn');

  loading.classList.remove('hidden');
  result.classList.add('hidden');
  applyBtn.classList.add('hidden');

  try {
    const response = await window.electronAPI.planSprint({
      project: currentProject,
      sprintDays: duration,
      hoursPerDay: hoursPerDay
    });

    loading.classList.add('hidden');

    if (response.error) {
      showToast(response.error, 'error');
      return;
    }

    sprintPlan = response.tasks || [];
    const totalHours = sprintPlan.reduce((sum, t) => sum + (t.hours || 0), 0);

    let html = `
      <div class="sprint-info">
        <div class="sprint-stat">
          <div class="sprint-stat-label">Sprint-Kapazität</div>
          <div class="sprint-stat-value">${totalSprintHours}h</div>
        </div>
        <div class="sprint-stat">
          <div class="sprint-stat-label">Geplante Tasks</div>
          <div class="sprint-stat-value">${sprintPlan.length}</div>
        </div>
        <div class="sprint-stat">
          <div class="sprint-stat-label">Geschätzte Zeit</div>
          <div class="sprint-stat-value">${totalHours}h</div>
        </div>
      </div>
      <h4 style="margin-bottom: 14px;">Empfohlene Reihenfolge:</h4>
      <div class="sprint-tasks">
    `;

    sprintPlan.forEach((task, idx) => {
      html += `
        <div class="sprint-task-item">
          <div class="sprint-task-order">${idx + 1}</div>
          <div class="sprint-task-info">
            <div class="sprint-task-title">${escapeHtml(task.title)}</div>
            <div class="sprint-task-reason">${escapeHtml(task.reason || '')}</div>
          </div>
          <div class="sprint-task-hours">${task.hours}h</div>
        </div>
      `;
    });

    html += '</div>';
    result.innerHTML = html;
    result.classList.remove('hidden');
    applyBtn.classList.remove('hidden');
  } catch (e) {
    loading.classList.add('hidden');
    showToast('Fehler bei der Sprint-Planung', 'error');
  }
}

function applySprintPlan() {
  if (!sprintPlan || !currentProject) return;

  // Mark sprint tasks as "in sprint" or reorder
  const sprintTaskIds = sprintPlan.map(t => t.taskId);

  for (const milestone of currentProject.milestones || []) {
    for (const task of milestone.tasks || []) {
      if (sprintTaskIds.includes(task.id)) {
        task.status = 'inprogress';
        if (!task.tags) task.tags = [];
        if (!task.tags.includes('sprint')) {
          task.tags.push('sprint');
        }
      }
    }
  }

  document.getElementById('sprint-modal').classList.add('hidden');
  showToast('Sprint-Plan übernommen!');
  renderProject();
}

// Auto Tags
let autoTagData = null;

async function generateAutoTags() {
  if (!currentProject) {
    showToast('Kein Projekt ausgewählt', 'warning');
    return;
  }

  const modal = document.getElementById('autotag-modal');
  const loading = document.getElementById('autotag-loading');
  const preview = document.getElementById('autotag-preview');

  modal.classList.remove('hidden');
  loading.classList.remove('hidden');
  preview.innerHTML = '';

  try {
    const response = await window.electronAPI.autoTagTasks({
      project: currentProject
    });

    loading.classList.add('hidden');

    if (response.error) {
      showToast(response.error, 'error');
      modal.classList.add('hidden');
      return;
    }

    autoTagData = response.tags || [];

    let html = '';
    for (const item of autoTagData) {
      html += `
        <div class="autotag-item">
          <span class="autotag-task-title">${escapeHtml(item.title)}</span>
          <div class="autotag-tags">
            ${(item.suggestedTags || []).map(tag =>
              `<span class="autotag-tag-new">${tag}</span>`
            ).join('')}
          </div>
        </div>
      `;
    }

    preview.innerHTML = html || '<p style="color: var(--text-muted); text-align: center;">Keine Tag-Vorschläge verfügbar</p>';
  } catch (e) {
    loading.classList.add('hidden');
    showToast('Fehler beim Generieren der Tags', 'error');
    modal.classList.add('hidden');
  }
}

function applyAutoTags() {
  if (!autoTagData || !currentProject) return;

  for (const tagItem of autoTagData) {
    for (const milestone of currentProject.milestones || []) {
      for (const task of milestone.tasks || []) {
        if (task.id === tagItem.taskId || task.title === tagItem.title) {
          if (!task.tags) task.tags = [];
          for (const newTag of tagItem.suggestedTags || []) {
            if (!task.tags.includes(newTag)) {
              task.tags.push(newTag);
            }
          }
        }
      }
    }
  }

  document.getElementById('autotag-modal').classList.add('hidden');
  showToast('Tags übernommen!');
  renderProject();
}

// ============== PROMPT GENERATOR ==============

let currentPromptTask = null;
let currentPromptMilestone = null;

function generatePrompt(milestoneId, taskId) {
  const milestone = currentProject.milestones.find(m => m.id === milestoneId);
  if (!milestone) return;

  const task = milestone.tasks.find(t => t.id === taskId);
  if (!task) return;

  currentPromptTask = task;
  currentPromptMilestone = milestone;

  // Show task info
  const taskInfoEl = document.getElementById('prompt-task-info');
  const tags = (task.tags || []).map(t => `<span class="tag tag-${t}">${t}</span>`).join('');

  taskInfoEl.innerHTML = `
    <h4>${escapeHtml(task.title)}</h4>
    <p><strong>Meilenstein:</strong> ${escapeHtml(milestone.name)}</p>
    <p><strong>Beschreibung:</strong> ${task.description || 'Keine Beschreibung'}</p>
    <p><strong>Geschätzte Zeit:</strong> ${task.estimatedHours}h</p>
    ${tags ? `<div class="task-tags">${tags}</div>` : ''}
  `;

  // Generate initial prompt
  updateGeneratedPrompt();

  // Show modal
  document.getElementById('prompt-modal').classList.remove('hidden');
}

function updateGeneratedPrompt() {
  if (!currentPromptTask || !currentProject) return;

  const style = document.getElementById('prompt-style').value;
  const extraContext = document.getElementById('prompt-extra-context').value;

  let prompt = '';

  const taskInfo = `
Task: ${currentPromptTask.title}
Beschreibung: ${currentPromptTask.description || 'Keine'}
Meilenstein: ${currentPromptMilestone.name}
Projekt: ${currentProject.name}
Geschätzte Zeit: ${currentPromptTask.estimatedHours}h
Tags: ${(currentPromptTask.tags || []).join(', ') || 'Keine'}`.trim();

  const subtasksInfo = (currentPromptTask.subtasks || []).length > 0
    ? `\nSubtasks:\n${currentPromptTask.subtasks.map((st, i) => `${i + 1}. ${st.title}${st.completed ? ' (erledigt)' : ''}`).join('\n')}`
    : '';

  switch (style) {
    case 'detailed':
      prompt = `Ich arbeite an folgendem Task in meinem Projekt:

${taskInfo}${subtasksInfo}

Projektkontext: ${currentProject.description || 'Keine Beschreibung'}

${extraContext ? `Zusätzlicher Kontext: ${extraContext}\n\n` : ''}Bitte hilf mir bei der Implementierung dieses Tasks. Erkläre deinen Ansatz und zeige den vollständigen Code mit Kommentaren.`;
      break;

    case 'minimal':
      prompt = `Implementiere: ${currentPromptTask.title}

${currentPromptTask.description || ''}${extraContext ? `\n\n${extraContext}` : ''}`;
      break;

    case 'stepbystep':
      prompt = `Ich muss folgenden Task implementieren:

${taskInfo}${subtasksInfo}

${extraContext ? `Zusätzlicher Kontext: ${extraContext}\n\n` : ''}Bitte führe mich Schritt für Schritt durch die Implementierung:
1. Erkläre zuerst den Ansatz
2. Zeige dann jeden Schritt mit Code
3. Erkläre wichtige Entscheidungen
4. Gib Hinweise für Testing`;
      break;

    case 'review':
      prompt = `Bitte überprüfe meinen Code für folgenden Task:

${taskInfo}

${extraContext ? `Code/Kontext: ${extraContext}\n\n` : ''}Bitte prüfe auf:
- Bugs und Fehler
- Performance-Probleme
- Best Practices
- Sicherheitslücken
- Verbesserungsmöglichkeiten`;
      break;

    case 'debug':
      prompt = `Ich habe ein Problem bei folgendem Task:

${taskInfo}

${extraContext ? `Fehlerbeschreibung/Code: ${extraContext}\n\n` : ''}Bitte hilf mir beim Debugging:
1. Analysiere das Problem
2. Erkläre mögliche Ursachen
3. Zeige die Lösung
4. Erkläre wie ich ähnliche Fehler in Zukunft vermeiden kann`;
      break;

    case 'test':
      prompt = `Ich brauche Tests für folgenden Task:

${taskInfo}

${extraContext ? `Zusätzlicher Kontext: ${extraContext}\n\n` : ''}Bitte erstelle:
1. Unit Tests für die Hauptfunktionalität
2. Edge Cases und Grenzwerte
3. Negative Tests (Fehlerbehandlung)
4. Integration Tests falls nötig

Nutze gängige Testing-Patterns und erkläre die Test-Strategie.`;
      break;
  }

  document.getElementById('generated-prompt').value = prompt;
}

function copyPromptToClipboard() {
  const promptText = document.getElementById('generated-prompt').value;

  navigator.clipboard.writeText(promptText).then(() => {
    showToast('Prompt in Zwischenablage kopiert!');
  }).catch(() => {
    // Fallback für ältere Browser
    const textarea = document.getElementById('generated-prompt');
    textarea.select();
    document.execCommand('copy');
    showToast('Prompt kopiert!');
  });
}

// Event Listeners für Prompt Generator
document.addEventListener('DOMContentLoaded', () => {
  const closePromptBtn = document.getElementById('close-prompt');
  const promptStyle = document.getElementById('prompt-style');
  const promptExtraContext = document.getElementById('prompt-extra-context');
  const regenerateBtn = document.getElementById('regenerate-prompt-btn');
  const copyBtn = document.getElementById('copy-prompt-btn');

  if (closePromptBtn) {
    closePromptBtn.addEventListener('click', () => {
      document.getElementById('prompt-modal').classList.add('hidden');
    });
  }

  if (promptStyle) {
    promptStyle.addEventListener('change', updateGeneratedPrompt);
  }

  if (promptExtraContext) {
    promptExtraContext.addEventListener('input', updateGeneratedPrompt);
  }

  if (regenerateBtn) {
    regenerateBtn.addEventListener('click', updateGeneratedPrompt);
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', copyPromptToClipboard);
  }
});

// ============================================
// WEBHOOK SYSTEM
// ============================================

let webhooks = [];

async function loadWebhooks() {
  webhooks = await window.electronAPI.getWebhooks();
  renderWebhookList();
}

function renderWebhookList() {
  const container = document.getElementById('webhook-list');
  if (!container) return;

  if (webhooks.length === 0) {
    container.innerHTML = '<p class="empty-message">Keine Webhooks konfiguriert</p>';
    return;
  }

  container.innerHTML = webhooks.map((webhook, index) => `
    <div class="webhook-item">
      <div class="webhook-item-info">
        <div class="webhook-item-name">${webhook.name || 'Unbenannter Webhook'}</div>
        <div class="webhook-item-url">${webhook.url}</div>
        <div class="webhook-item-events">
          ${webhook.events.taskComplete ? '<span class="webhook-event-badge">Task</span>' : ''}
          ${webhook.events.milestoneComplete ? '<span class="webhook-event-badge">Meilenstein</span>' : ''}
          ${webhook.events.projectComplete ? '<span class="webhook-event-badge">Projekt</span>' : ''}
        </div>
      </div>
      <div class="webhook-item-actions">
        <button class="btn btn-danger btn-sm" onclick="deleteWebhook(${index})">🗑️</button>
      </div>
    </div>
  `).join('');
}

function addWebhook() {
  const url = document.getElementById('webhook-url').value.trim();
  const name = document.getElementById('webhook-name').value.trim();
  const taskComplete = document.getElementById('webhook-task-complete').checked;
  const milestoneComplete = document.getElementById('webhook-milestone-complete').checked;
  const projectComplete = document.getElementById('webhook-project-complete').checked;

  if (!url) {
    showToast('Bitte URL eingeben');
    return;
  }

  webhooks.push({
    url,
    name: name || 'Webhook',
    events: {
      taskComplete,
      milestoneComplete,
      projectComplete
    }
  });

  // Clear inputs
  document.getElementById('webhook-url').value = '';
  document.getElementById('webhook-name').value = '';
  document.getElementById('webhook-task-complete').checked = true;
  document.getElementById('webhook-milestone-complete').checked = false;
  document.getElementById('webhook-project-complete').checked = false;

  renderWebhookList();
  showToast('Webhook hinzugefügt');
}

function deleteWebhook(index) {
  webhooks.splice(index, 1);
  renderWebhookList();
}

async function saveWebhooks() {
  await window.electronAPI.saveWebhooks(webhooks);
  showToast('Webhooks gespeichert');
  document.getElementById('webhook-modal').classList.add('hidden');
}

async function triggerWebhook(eventType, data) {
  for (const webhook of webhooks) {
    if (webhook.events[eventType]) {
      try {
        await window.electronAPI.sendWebhook({
          url: webhook.url,
          payload: {
            event: eventType,
            timestamp: new Date().toISOString(),
            project: currentProject ? { id: currentProject.id, name: currentProject.name } : null,
            data
          }
        });
      } catch (e) {
        console.error('Webhook error:', e);
      }
    }
  }
}

// ============================================
// BACKUP SYSTEM
// ============================================

async function loadBackups() {
  const backups = await window.electronAPI.listBackups();
  renderBackupList(backups);
}

function renderBackupList(backups) {
  const container = document.getElementById('backup-list');
  if (!container) return;

  if (backups.length === 0) {
    container.innerHTML = '<p class="empty-message">Keine Backups vorhanden</p>';
    return;
  }

  container.innerHTML = backups.map(backup => `
    <div class="backup-item">
      <div class="backup-item-info">
        <div class="backup-item-name">${backup.name}</div>
        <div class="backup-item-meta">
          <span>📅 ${new Date(backup.createdAt).toLocaleString('de-DE')}</span>
          <span>📁 ${backup.projectCount} Projekte</span>
          <span>💾 ${(backup.size / 1024).toFixed(1)} KB</span>
        </div>
      </div>
      <div class="backup-item-actions">
        <button class="btn btn-secondary btn-sm" onclick="restoreBackup('${backup.filename}')">♻️ Restore</button>
        <button class="btn btn-danger btn-sm" onclick="deleteBackup('${backup.filename}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

async function createBackup() {
  const name = document.getElementById('backup-name').value.trim();
  const result = await window.electronAPI.createBackup({ name });

  if (result.error) {
    showToast('Fehler: ' + result.error);
  } else {
    showToast(`Backup erstellt: ${result.projectCount} Projekte gesichert`);
    document.getElementById('backup-name').value = '';
    loadBackups();
  }
}

async function restoreBackup(filename) {
  if (!confirm('Backup wiederherstellen? Bestehende Projekte werden überschrieben.')) return;

  const result = await window.electronAPI.restoreBackup({ filename });

  if (result.error) {
    showToast('Fehler: ' + result.error);
  } else {
    showToast(result.message);
    await loadProjects();
  }
}

async function deleteBackup(filename) {
  if (!confirm('Backup wirklich löschen?')) return;

  const result = await window.electronAPI.deleteBackup({ filename });

  if (result.error) {
    showToast('Fehler: ' + result.error);
  } else {
    showToast('Backup gelöscht');
    loadBackups();
  }
}

// ============================================
// ICAL EXPORT
// ============================================

async function exportIcal() {
  if (!currentProject) return;

  const includeCompleted = document.getElementById('ical-include-completed').checked;
  const result = await window.electronAPI.exportIcal({
    project: currentProject,
    includeCompleted
  });

  if (result.error) {
    showToast('Fehler: ' + result.error);
    return;
  }

  // Download iCal file
  const blob = new Blob([result.ical], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentProject.name.replace(/[^a-z0-9]/gi, '_')}.ics`;
  a.click();
  URL.revokeObjectURL(url);

  showToast('iCal exportiert');
  document.getElementById('ical-modal').classList.add('hidden');
}

// ============================================
// TIME COMPARISON REPORT
// ============================================

async function showTimeComparison() {
  if (!currentProject) return;

  const result = await window.electronAPI.getTimeComparison({ projectId: currentProject.id });

  if (result.error) {
    showToast('Fehler: ' + result.error);
    return;
  }

  // Render summary
  const summaryDiv = document.getElementById('timecompare-summary');
  const diffClass = result.totals.difference > 0 ? 'negative' : 'positive';
  summaryDiv.innerHTML = `
    <div class="timecompare-stat">
      <div class="timecompare-stat-label">Geschätzt</div>
      <div class="timecompare-stat-value">${result.totals.estimated.toFixed(1)}h</div>
    </div>
    <div class="timecompare-stat">
      <div class="timecompare-stat-label">Getrackt</div>
      <div class="timecompare-stat-value">${result.totals.tracked.toFixed(1)}h</div>
    </div>
    <div class="timecompare-stat">
      <div class="timecompare-stat-label">Differenz</div>
      <div class="timecompare-stat-value ${diffClass}">${result.totals.difference > 0 ? '+' : ''}${result.totals.difference.toFixed(1)}h</div>
    </div>
    <div class="timecompare-stat">
      <div class="timecompare-stat-label">Abweichung</div>
      <div class="timecompare-stat-value ${diffClass}">${result.totals.percentDiff > 0 ? '+' : ''}${result.totals.percentDiff}%</div>
    </div>
  `;

  // Render milestone chart
  const milestoneChart = document.getElementById('timecompare-milestone-chart');
  const maxMilestoneValue = Math.max(...Object.values(result.byMilestone).flatMap(m => [m.estimated, m.tracked]), 1);
  milestoneChart.innerHTML = Object.entries(result.byMilestone).map(([name, data]) => `
    <div class="chart-bar">
      <div class="chart-bar-label" title="${name}">${name}</div>
      <div class="chart-bar-container">
        <div class="chart-bar-estimated" style="width: ${(data.estimated / maxMilestoneValue) * 100}%" title="Geschätzt: ${data.estimated.toFixed(1)}h"></div>
        <div class="chart-bar-tracked" style="width: ${(data.tracked / maxMilestoneValue) * 100}%" title="Getrackt: ${data.tracked.toFixed(1)}h"></div>
      </div>
      <div class="chart-bar-value">${data.tracked.toFixed(1)}h</div>
    </div>
  `).join('');

  // Render tag chart
  const tagChart = document.getElementById('timecompare-tag-chart');
  const maxTagValue = Math.max(...Object.values(result.byTag).flatMap(t => [t.estimated, t.tracked]), 1);
  if (Object.keys(result.byTag).length > 0) {
    tagChart.innerHTML = Object.entries(result.byTag).map(([name, data]) => `
      <div class="chart-bar">
        <div class="chart-bar-label" title="${name}">${name}</div>
        <div class="chart-bar-container">
          <div class="chart-bar-estimated" style="width: ${(data.estimated / maxTagValue) * 100}%" title="Geschätzt: ${data.estimated.toFixed(1)}h"></div>
          <div class="chart-bar-tracked" style="width: ${(data.tracked / maxTagValue) * 100}%" title="Getrackt: ${data.tracked.toFixed(1)}h"></div>
        </div>
        <div class="chart-bar-value">${data.tracked.toFixed(1)}h</div>
      </div>
    `).join('');
  } else {
    tagChart.innerHTML = '<p class="empty-message">Keine Tags vorhanden</p>';
  }

  // Render table
  const tbody = document.getElementById('timecompare-tbody');
  tbody.innerHTML = result.tasks.map(task => {
    const diffClass = task.difference > 0 ? 'diff-positive' : task.difference < 0 ? 'diff-negative' : '';
    return `
      <tr>
        <td>${task.completed ? '✅' : '⬜'} ${task.title}</td>
        <td>${task.milestone}</td>
        <td>${task.estimated.toFixed(1)}h</td>
        <td>${task.tracked.toFixed(1)}h</td>
        <td class="${diffClass}">${task.difference > 0 ? '+' : ''}${task.difference.toFixed(1)}h (${task.percentDiff > 0 ? '+' : ''}${task.percentDiff}%)</td>
      </tr>
    `;
  }).join('');

  document.getElementById('timecompare-modal').classList.remove('hidden');
}

// ============================================
// CUSTOM DASHBOARD
// ============================================

let dashboardConfig = null;

const widgetNames = {
  'projects-overview': '📁 Projektübersicht',
  'recent-activity': '🕒 Letzte Aktivität',
  'time-this-week': '⏱️ Zeit diese Woche',
  'task-stats': '📊 Task-Statistiken'
};

async function loadDashboardConfig() {
  dashboardConfig = await window.electronAPI.getDashboardConfig();
}

function openDashboardConfig() {
  renderDashboardConfigList();
  document.getElementById('dashboard-config-modal').classList.remove('hidden');
}

function renderDashboardConfigList() {
  const container = document.getElementById('widget-config-list');
  if (!container || !dashboardConfig) return;

  container.innerHTML = dashboardConfig.widgets
    .sort((a, b) => a.position - b.position)
    .map(widget => `
      <div class="widget-config-item" data-widget-id="${widget.id}" draggable="true">
        <div class="widget-config-left">
          <span class="widget-drag-handle">⋮⋮</span>
          <span class="widget-config-name">${widgetNames[widget.type] || widget.type}</span>
        </div>
        <div class="widget-config-toggle ${widget.enabled ? 'active' : ''}"
             onclick="toggleWidget('${widget.id}')"></div>
      </div>
    `).join('');

  // Add drag and drop
  const items = container.querySelectorAll('.widget-config-item');
  items.forEach(item => {
    item.addEventListener('dragstart', handleWidgetDragStart);
    item.addEventListener('dragover', handleWidgetDragOver);
    item.addEventListener('drop', handleWidgetDrop);
    item.addEventListener('dragend', handleWidgetDragEnd);
  });
}

let draggedWidget = null;

function handleWidgetDragStart(e) {
  draggedWidget = e.target;
  e.target.classList.add('dragging');
}

function handleWidgetDragOver(e) {
  e.preventDefault();
}

function handleWidgetDrop(e) {
  e.preventDefault();
  if (draggedWidget !== e.target) {
    const container = document.getElementById('widget-config-list');
    const items = Array.from(container.children);
    const draggedIndex = items.indexOf(draggedWidget);
    const targetIndex = items.indexOf(e.target.closest('.widget-config-item'));

    if (draggedIndex < targetIndex) {
      e.target.closest('.widget-config-item').after(draggedWidget);
    } else {
      e.target.closest('.widget-config-item').before(draggedWidget);
    }

    // Update positions
    const newItems = Array.from(container.children);
    newItems.forEach((item, index) => {
      const widgetId = item.dataset.widgetId;
      const widget = dashboardConfig.widgets.find(w => w.id === widgetId);
      if (widget) widget.position = index;
    });
  }
}

function handleWidgetDragEnd(e) {
  e.target.classList.remove('dragging');
  draggedWidget = null;
}

function toggleWidget(widgetId) {
  const widget = dashboardConfig.widgets.find(w => w.id === widgetId);
  if (widget) {
    widget.enabled = !widget.enabled;
    renderDashboardConfigList();
  }
}

async function saveDashboardConfig() {
  await window.electronAPI.saveDashboardConfig(dashboardConfig);
  showToast('Dashboard-Konfiguration gespeichert');
  document.getElementById('dashboard-config-modal').classList.add('hidden');
}

// ============================================
// MULTI-SELECT TASKS
// ============================================

let selectedTasks = [];
let multiSelectMode = false;

function toggleMultiSelectMode() {
  multiSelectMode = !multiSelectMode;
  document.body.classList.toggle('multi-select-mode', multiSelectMode);

  if (!multiSelectMode) {
    clearTaskSelection();
  }

  renderProject();
}

function toggleTaskSelection(milestoneId, taskId, event) {
  if (!multiSelectMode) return;

  event.stopPropagation();

  const key = `${milestoneId}:${taskId}`;
  const index = selectedTasks.findIndex(t => t.key === key);

  if (index >= 0) {
    selectedTasks.splice(index, 1);
  } else {
    selectedTasks.push({ key, milestoneId, taskId });
  }

  updateMultiSelectToolbar();
  renderProject();
}

function clearTaskSelection() {
  selectedTasks = [];
  updateMultiSelectToolbar();
}

function updateMultiSelectToolbar() {
  let toolbar = document.getElementById('multi-select-toolbar');

  if (selectedTasks.length === 0) {
    if (toolbar) toolbar.remove();
    return;
  }

  if (!toolbar) {
    toolbar = document.createElement('div');
    toolbar.id = 'multi-select-toolbar';
    toolbar.className = 'multi-select-toolbar';
    document.body.appendChild(toolbar);
  }

  toolbar.innerHTML = `
    <span class="multi-select-count">${selectedTasks.length} Tasks ausgewählt</span>
    <div class="multi-select-actions">
      <button class="btn btn-secondary btn-sm" onclick="bulkMarkComplete()">✅ Erledigen</button>
      <button class="btn btn-secondary btn-sm" onclick="bulkSetPriority()">🎯 Priorität</button>
      <button class="btn btn-danger btn-sm" onclick="bulkDeleteTasks()">🗑️ Löschen</button>
      <button class="btn btn-secondary btn-sm" onclick="clearTaskSelection(); renderProject();">✕ Abbrechen</button>
    </div>
  `;
}

async function bulkMarkComplete() {
  for (const selected of selectedTasks) {
    const milestone = currentProject.milestones.find(m => m.id === selected.milestoneId);
    if (milestone) {
      const task = milestone.tasks.find(t => t.id === selected.taskId);
      if (task) {
        task.completed = true;
        await triggerWebhook('taskComplete', { task: task.title });
      }
    }
  }

  await saveProject();
  clearTaskSelection();
  renderProject();
  showToast(`${selectedTasks.length} Tasks als erledigt markiert`);
}

function bulkSetPriority() {
  const priority = prompt('Priorität eingeben (high, medium, low):');
  if (!priority || !['high', 'medium', 'low'].includes(priority)) return;

  for (const selected of selectedTasks) {
    const milestone = currentProject.milestones.find(m => m.id === selected.milestoneId);
    if (milestone) {
      const task = milestone.tasks.find(t => t.id === selected.taskId);
      if (task) task.priority = priority;
    }
  }

  saveProject();
  clearTaskSelection();
  renderProject();
  showToast('Priorität geändert');
}

async function bulkDeleteTasks() {
  if (!confirm(`${selectedTasks.length} Tasks wirklich löschen?`)) return;

  for (const selected of selectedTasks) {
    const milestone = currentProject.milestones.find(m => m.id === selected.milestoneId);
    if (milestone) {
      const taskIndex = milestone.tasks.findIndex(t => t.id === selected.taskId);
      if (taskIndex >= 0) milestone.tasks.splice(taskIndex, 1);
    }
  }

  await saveProject();
  clearTaskSelection();
  renderProject();
  showToast('Tasks gelöscht');
}

// ============================================
// EVENT LISTENERS FOR NEW FEATURES
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Load webhooks and backups
  loadWebhooks();
  loadDashboardConfig();

  // Webhook Modal
  const webhookBtn = document.getElementById('webhook-btn');
  const closeWebhook = document.getElementById('close-webhook');
  const addWebhookBtn = document.getElementById('add-webhook-btn');
  const saveWebhooksBtn = document.getElementById('save-webhooks-btn');

  if (webhookBtn) {
    webhookBtn.addEventListener('click', () => {
      loadWebhooks();
      document.getElementById('webhook-modal').classList.remove('hidden');
    });
  }

  if (closeWebhook) {
    closeWebhook.addEventListener('click', () => {
      document.getElementById('webhook-modal').classList.add('hidden');
    });
  }

  if (addWebhookBtn) {
    addWebhookBtn.addEventListener('click', addWebhook);
  }

  if (saveWebhooksBtn) {
    saveWebhooksBtn.addEventListener('click', saveWebhooks);
  }

  // Backup Modal
  const backupBtn = document.getElementById('backup-btn');
  const closeBackup = document.getElementById('close-backup');
  const createBackupBtn = document.getElementById('create-backup-btn');

  if (backupBtn) {
    backupBtn.addEventListener('click', () => {
      loadBackups();
      document.getElementById('backup-modal').classList.remove('hidden');
    });
  }

  if (closeBackup) {
    closeBackup.addEventListener('click', () => {
      document.getElementById('backup-modal').classList.add('hidden');
    });
  }

  if (createBackupBtn) {
    createBackupBtn.addEventListener('click', createBackup);
  }

  // iCal Export
  const exportIcalBtn = document.getElementById('export-ical-btn');
  const icalBtn = document.querySelector('[id="export-ical-btn"]');
  const closeIcal = document.getElementById('close-ical');

  // Button in results-actions opens modal
  const resultsIcalBtn = document.querySelector('.results-actions #export-ical-btn');
  if (resultsIcalBtn) {
    resultsIcalBtn.addEventListener('click', () => {
      document.getElementById('ical-modal').classList.remove('hidden');
    });
  }

  // Export button in modal
  const modalExportIcalBtn = document.querySelector('#ical-modal #export-ical-btn');
  if (modalExportIcalBtn) {
    modalExportIcalBtn.addEventListener('click', exportIcal);
  }

  if (closeIcal) {
    closeIcal.addEventListener('click', () => {
      document.getElementById('ical-modal').classList.add('hidden');
    });
  }

  // Time Comparison
  const timecompareBtn = document.getElementById('timecompare-btn');
  const closeTimecompare = document.getElementById('close-timecompare');

  if (timecompareBtn) {
    timecompareBtn.addEventListener('click', showTimeComparison);
  }

  if (closeTimecompare) {
    closeTimecompare.addEventListener('click', () => {
      document.getElementById('timecompare-modal').classList.add('hidden');
    });
  }

  // Dashboard Config
  const closeDashboardConfig = document.getElementById('close-dashboard-config');
  const saveDashboardConfigBtn = document.getElementById('save-dashboard-config-btn');

  if (closeDashboardConfig) {
    closeDashboardConfig.addEventListener('click', () => {
      document.getElementById('dashboard-config-modal').classList.add('hidden');
    });
  }

  if (saveDashboardConfigBtn) {
    saveDashboardConfigBtn.addEventListener('click', saveDashboardConfig);
  }

  // Keyboard shortcut for multi-select
  document.addEventListener('keydown', (e) => {
    if (e.key === 'm' && e.ctrlKey) {
      e.preventDefault();
      toggleMultiSelectMode();
    }
  });
});

// Start
init();
