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
  ganttTimelineHeader: document.getElementById('gantt-timeline-header')
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

  if (currentView === 'list') {
    elements.milestonesContainer.style.display = 'flex';
    renderMilestones();
  } else if (currentView === 'kanban') {
    elements.kanbanContainer.classList.add('active');
    renderKanban();
  } else if (currentView === 'gantt') {
    elements.ganttContainer.classList.remove('hidden');
    renderGantt();
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
        <button class="task-action-btn" onclick="editTask('${milestoneId}', '${task.id}')">✏️</button>
        <button class="task-action-btn" onclick="askAIAboutTask('${milestoneId}', '${task.id}')">🤖</button>
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
  // Keep existing features that are selected
  const existingTitles = suggestedFeatures.map(f => f.title.toLowerCase());

  elements.featuresList.classList.add('hidden');
  elements.featuresLoading.classList.remove('hidden');

  try {
    const result = await window.electronAPI.suggestFeatures({
      projectName: currentProject.name,
      projectDescription: currentProject.description,
      context: pendingProjectContext,
      excludeFeatures: existingTitles
    });

    if (result.error) {
      showToast('Weitere Vorschläge konnten nicht geladen werden', 'warning');
      elements.featuresLoading.classList.add('hidden');
      elements.featuresList.classList.remove('hidden');
      return;
    }

    // Filter out duplicates and add new features
    const newFeatures = (result.features || []).filter(f =>
      !existingTitles.includes(f.title.toLowerCase())
    );

    if (newFeatures.length === 0) {
      showToast('Keine weiteren neuen Features gefunden', 'info');
      elements.featuresLoading.classList.add('hidden');
      elements.featuresList.classList.remove('hidden');
      return;
    }

    suggestedFeatures = [...suggestedFeatures, ...newFeatures];
    renderFeaturesList();
    showToast(`${newFeatures.length} neue Features hinzugefügt!`);
  } catch (e) {
    showToast('Fehler beim Laden weiterer Vorschläge', 'error');
    elements.featuresLoading.classList.add('hidden');
    elements.featuresList.classList.remove('hidden');
  }
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

  // Generate 14 days from today
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push({
      date: d,
      label: `${d.getDate()}.${d.getMonth() + 1}`,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      isToday: i === 0
    });
  }

  // Render header
  elements.ganttTimelineHeader.innerHTML = days.map(d =>
    `<div class="gantt-day ${d.isWeekend ? 'weekend' : ''} ${d.isToday ? 'today' : ''}">${d.label}</div>`
  ).join('');

  // Render rows
  let currentDay = 0;
  elements.ganttBody.innerHTML = allTasks.map(task => {
    // Calculate bar position based on task index (simplified scheduling)
    const startDay = currentDay;
    const duration = Math.ceil(task.estimatedHours / 4) || 1; // 4 hours = 1 day
    currentDay = (currentDay + duration) % 14;

    const barLeft = startDay * 40 + 4;
    const barWidth = Math.max(duration * 40 - 8, 32);

    return `
      <div class="gantt-row">
        <div class="gantt-row-task" title="${escapeHtml(task.title)}">
          <span class="priority-indicator ${task.priority || 'medium'}" style="display: inline-block; margin-right: 6px;"></span>
          ${escapeHtml(task.title)}
        </div>
        <div class="gantt-row-timeline">
          ${days.map(d => `<div class="gantt-row-cell ${d.isWeekend ? 'weekend' : ''}"></div>`).join('')}
          <div class="gantt-bar ${task.completed ? 'completed' : ''} priority-${task.priority || 'medium'}"
               style="left: ${barLeft}px; width: ${barWidth}px;">
            ${task.estimatedHours}h
          </div>
        </div>
      </div>
    `;
  }).join('');
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

// Start
init();
