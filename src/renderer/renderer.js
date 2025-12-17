// Translations
const translations = {
  de: null,
  en: null
};

// State
let currentProject = null;
let currentLanguage = 'de';
let currentTheme = 'light';
let projectToDelete = null;

// DOM Elements
const elements = {
  languageSelect: document.getElementById('language-select'),
  themeToggle: document.getElementById('theme-toggle'),
  settingsBtn: document.getElementById('settings-btn'),
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
  exportPdfBtn: document.getElementById('export-pdf-btn'),
  exportMdBtn: document.getElementById('export-md-btn'),
  milestonesContainer: document.getElementById('milestones-container'),
  progressText: document.getElementById('progress-text'),
  progressPercentage: document.getElementById('progress-percentage'),
  progressFill: document.getElementById('progress-fill'),
  timeCompleted: document.getElementById('time-completed'),
  timeTotal: document.getElementById('time-total'),
  settingsModal: document.getElementById('settings-modal'),
  closeSettings: document.getElementById('close-settings'),
  apiKeyInput: document.getElementById('api-key-input'),
  modelSelect: document.getElementById('model-select'),
  saveSettingsBtn: document.getElementById('save-settings-btn'),
  deleteModal: document.getElementById('delete-modal'),
  closeDelete: document.getElementById('close-delete'),
  cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
  confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toast-message')
};

// Initialize
async function init() {
  await loadTranslations();
  await loadSettings();
  await loadProjectList();
  setupEventListeners();
  checkApiKey();
}

// Load translations
async function loadTranslations() {
  try {
    const deResponse = await fetch('../i18n/de.json');
    translations.de = await deResponse.json();

    const enResponse = await fetch('../i18n/en.json');
    translations.en = await enResponse.json();
  } catch (error) {
    console.error('Failed to load translations:', error);
  }
}

// Apply translations
function applyTranslations() {
  const t = translations[currentLanguage] || translations.de;
  if (!t) return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) {
      el.textContent = t[key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) {
      el.placeholder = t[key];
    }
  });
}

// Translate function
function t(key) {
  const trans = translations[currentLanguage] || translations.de;
  return trans?.[key] || key;
}

// Load settings
async function loadSettings() {
  const result = await window.api.getSettings();
  if (result.success) {
    const settings = result.data;
    currentLanguage = settings.language || 'de';
    currentTheme = settings.theme || 'light';

    elements.languageSelect.value = currentLanguage;
    elements.apiKeyInput.value = settings.apiKey || '';
    elements.modelSelect.value = settings.model || 'gpt-4';

    applyTheme();
    applyTranslations();
  }
}

// Apply theme
function applyTheme() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  elements.themeToggle.querySelector('.theme-icon').textContent =
    currentTheme === 'dark' ? '☀️' : '🌙';
}

// Check API key
async function checkApiKey() {
  const result = await window.api.checkApiKey();
  if (!result.configured) {
    // Show settings modal if API key is not configured
    const settings = await window.api.getSettings();
    if (!settings.data?.apiKey) {
      showToast(t('apiKeyRequired'), 'warning');
    }
  }
}

// Load project list
async function loadProjectList() {
  const result = await window.api.listProjects();
  if (result.success) {
    renderProjectList(result.data);
  }
}

// Render project list
function renderProjectList(projects) {
  if (projects.length === 0) {
    elements.projectList.innerHTML = `
      <div class="empty-state">
        <p>${t('noProjects')}</p>
        <p>${t('createFirst')}</p>
      </div>
    `;
    return;
  }

  elements.projectList.innerHTML = projects.map(project => `
    <div class="project-item" data-id="${project.id}">
      <div class="project-item-content">
        <div class="project-item-name">${escapeHtml(project.name)}</div>
        <div class="project-item-date">${formatDate(project.updatedAt)}</div>
      </div>
      <button class="project-item-delete" data-id="${project.id}" title="${t('delete')}">🗑️</button>
    </div>
  `).join('');

  // Add click handlers
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

  // Highlight current project
  if (currentProject) {
    const activeItem = elements.projectList.querySelector(`[data-id="${currentProject.id}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
  }
}

// Load project
async function loadProject(projectId) {
  const result = await window.api.loadProject(projectId);
  if (result.success) {
    currentProject = result.data;
    showResults();
    renderProject();
    loadProjectList(); // Refresh to show active state
  } else {
    showToast(result.error, 'error');
  }
}

// Setup event listeners
function setupEventListeners() {
  // Language change
  elements.languageSelect.addEventListener('change', async () => {
    currentLanguage = elements.languageSelect.value;
    applyTranslations();
    await saveCurrentSettings();
  });

  // Theme toggle
  elements.themeToggle.addEventListener('click', async () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme();
    await saveCurrentSettings();
  });

  // Settings
  elements.settingsBtn.addEventListener('click', () => {
    elements.settingsModal.classList.remove('hidden');
  });

  elements.closeSettings.addEventListener('click', () => {
    elements.settingsModal.classList.add('hidden');
  });

  elements.saveSettingsBtn.addEventListener('click', saveSettings);

  // New project
  elements.newProjectBtn.addEventListener('click', newProject);

  // Analyze
  elements.analyzeBtn.addEventListener('click', analyzeProject);

  // Save
  elements.saveBtn.addEventListener('click', saveProject);

  // Export
  elements.exportPdfBtn.addEventListener('click', () => exportProject('pdf'));
  elements.exportMdBtn.addEventListener('click', () => exportProject('markdown'));

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

  // Close modals on outside click
  elements.settingsModal.addEventListener('click', (e) => {
    if (e.target === elements.settingsModal) {
      elements.settingsModal.classList.add('hidden');
    }
  });

  elements.deleteModal.addEventListener('click', (e) => {
    if (e.target === elements.deleteModal) {
      elements.deleteModal.classList.add('hidden');
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      elements.settingsModal.classList.add('hidden');
      elements.deleteModal.classList.add('hidden');
    }
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      if (currentProject) saveProject();
    }
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

  showLoading();

  const result = await window.api.analyzeProject(goal, context);

  if (result.success) {
    currentProject = result.data;
    showResults();
    renderProject();
  } else {
    showInput();
    showToast(result.error, 'error');
  }
}

// Save project
async function saveProject() {
  if (!currentProject) return;

  currentProject.name = elements.projectName.value || currentProject.name;

  const result = await window.api.saveProject(currentProject);
  if (result.success) {
    showToast(t('saved'));
    loadProjectList();
  } else {
    showToast(result.error, 'error');
  }
}

// Save settings
async function saveSettings() {
  const settings = {
    apiKey: elements.apiKeyInput.value,
    model: elements.modelSelect.value,
    language: currentLanguage,
    theme: currentTheme
  };

  const result = await window.api.saveSettings(settings);
  if (result.success) {
    elements.settingsModal.classList.add('hidden');
    showToast(t('saved'));
  } else {
    showToast(result.error, 'error');
  }
}

// Save current settings (theme/language)
async function saveCurrentSettings() {
  const current = await window.api.getSettings();
  const settings = {
    ...current.data,
    language: currentLanguage,
    theme: currentTheme
  };
  await window.api.saveSettings(settings);
}

// Confirm delete
function confirmDelete(projectId) {
  projectToDelete = projectId;
  elements.deleteModal.classList.remove('hidden');
}

// Delete project
async function deleteProject() {
  if (!projectToDelete) return;

  const result = await window.api.deleteProject(projectToDelete);
  if (result.success) {
    if (currentProject && currentProject.id === projectToDelete) {
      newProject();
    }
    showToast(t('deleted'));
    loadProjectList();
  } else {
    showToast(result.error, 'error');
  }

  projectToDelete = null;
  elements.deleteModal.classList.add('hidden');
}

// Export project
async function exportProject(format) {
  if (!currentProject) return;

  let result;
  if (format === 'pdf') {
    result = await window.api.exportPDF(currentProject);
  } else {
    result = await window.api.exportMarkdown(currentProject);
  }

  if (result.success) {
    showToast(t('exported'));
  } else if (result.error !== 'Export cancelled') {
    showToast(result.error, 'error');
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

  renderMilestones();
  updateProgress();
}

// Render milestones
function renderMilestones() {
  const milestones = currentProject.milestones || [];

  elements.milestonesContainer.innerHTML = milestones.map((milestone, mIndex) => {
    const milestoneHours = milestone.tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

    return `
      <div class="milestone" data-id="${milestone.id}">
        <div class="milestone-header" onclick="toggleMilestone('${milestone.id}')">
          <span class="milestone-icon">📁</span>
          <span class="milestone-title">${escapeHtml(milestone.name)}</span>
          <span class="milestone-time">${milestoneHours}h</span>
          <span class="milestone-toggle">▼</span>
        </div>
        <div class="tasks-container" id="tasks-${milestone.id}">
          ${milestone.tasks.map((task, tIndex) => `
            <div class="task ${task.completed ? 'completed' : ''}" data-milestone="${milestone.id}" data-task="${task.id}">
              <span class="task-drag-handle">⋮⋮</span>
              <input
                type="checkbox"
                class="task-checkbox"
                ${task.completed ? 'checked' : ''}
                onchange="toggleTask('${milestone.id}', '${task.id}')"
              >
              <div class="task-content">
                <div class="task-title">${escapeHtml(task.title)}</div>
                ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
              </div>
              <span class="task-time">${task.estimatedHours}h</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  // Initialize SortableJS for each tasks container
  initDragAndDrop();
}

// Initialize drag and drop
function initDragAndDrop() {
  if (typeof Sortable === 'undefined') {
    // Load SortableJS dynamically if not loaded
    const script = document.createElement('script');
    script.src = '../../node_modules/sortablejs/Sortable.min.js';
    script.onload = () => setupSortables();
    document.head.appendChild(script);
  } else {
    setupSortables();
  }
}

function setupSortables() {
  // Sortable for milestones
  if (typeof Sortable !== 'undefined') {
    new Sortable(elements.milestonesContainer, {
      animation: 150,
      handle: '.milestone-header',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      onEnd: (evt) => {
        const milestones = currentProject.milestones;
        const [moved] = milestones.splice(evt.oldIndex, 1);
        milestones.splice(evt.newIndex, 0, moved);
        milestones.forEach((m, i) => m.order = i);
      }
    });

    // Sortable for tasks within each milestone
    document.querySelectorAll('.tasks-container').forEach(container => {
      new Sortable(container, {
        animation: 150,
        handle: '.task-drag-handle',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        group: 'tasks',
        onEnd: (evt) => {
          const fromMilestoneId = evt.from.id.replace('tasks-', '');
          const toMilestoneId = evt.to.id.replace('tasks-', '');

          const fromMilestone = currentProject.milestones.find(m => m.id === fromMilestoneId);
          const toMilestone = currentProject.milestones.find(m => m.id === toMilestoneId);

          if (fromMilestone && toMilestone) {
            const [movedTask] = fromMilestone.tasks.splice(evt.oldIndex, 1);
            toMilestone.tasks.splice(evt.newIndex, 0, movedTask);

            // Update order
            fromMilestone.tasks.forEach((t, i) => t.order = i);
            toMilestone.tasks.forEach((t, i) => t.order = i);

            updateProgress();
          }
        }
      });
    });
  }
}

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

      // Update UI
      const taskEl = document.querySelector(`.task[data-task="${taskId}"]`);
      if (taskEl) {
        taskEl.classList.toggle('completed', task.completed);
      }

      updateProgress();
    }
  }
};

// Update progress
function updateProgress() {
  if (!currentProject) return;

  let totalHours = 0;
  let completedHours = 0;

  for (const milestone of currentProject.milestones || []) {
    for (const task of milestone.tasks || []) {
      totalHours += task.estimatedHours || 0;
      if (task.completed) {
        completedHours += task.estimatedHours || 0;
      }
    }
  }

  const percentage = totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0;

  elements.progressPercentage.textContent = `${percentage}%`;
  elements.progressFill.style.width = `${percentage}%`;
  elements.timeCompleted.textContent = `${completedHours}h`;
  elements.timeTotal.textContent = `${totalHours}h`;
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
  return date.toLocaleDateString(currentLanguage === 'de' ? 'de-DE' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Start
init();
