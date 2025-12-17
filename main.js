const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Data directories (initialized after app ready)
let DATA_DIR;
let PROJECTS_DIR;
let SETTINGS_FILE;

// Determine data directory (portable: next to exe, dev: in project)
function getDataDir() {
  if (app.isPackaged) {
    return path.join(path.dirname(process.execPath), 'data');
  }
  return path.join(__dirname, 'data');
}

function initDataPaths() {
  DATA_DIR = getDataDir();
  PROJECTS_DIR = path.join(DATA_DIR, 'projects');
  SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
}

// Ensure directories exist
function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });
}

// Groq Client
let Groq;
let groqClient = null;
let currentModelName = 'llama-3.3-70b-versatile';

async function initGroq(apiKey) {
  if (!Groq) {
    const module = await import('groq-sdk');
    Groq = module.default;
  }
  if (apiKey && apiKey.startsWith('gsk_')) {
    groqClient = new Groq({ apiKey });
    return true;
  }
  return false;
}

// Load settings
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      const settings = JSON.parse(data);
      if (settings.apiKey) {
        initGroq(settings.apiKey);
      }
      if (settings.model) {
        currentModelName = settings.model;
      }
      return settings;
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return { apiKey: '', model: 'llama-3.3-70b-versatile', language: 'de', theme: 'light' };
}

// Save settings
function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
  if (settings.apiKey) initGroq(settings.apiKey);
  if (settings.model) currentModelName = settings.model;
}

// Create main window
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'icon.ico'),
    title: 'AI Project Manager'
  });

  mainWindow.loadFile(path.join(__dirname, 'public', 'index.html'));

  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);
}

// App ready
app.whenReady().then(() => {
  initDataPaths();
  ensureDirectories();
  loadSettings();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ============== IPC Handlers ==============

// Check API key
ipcMain.handle('check-api-key', () => {
  return { configured: !!groqClient };
});

// Get settings
ipcMain.handle('get-settings', () => {
  const settings = loadSettings();
  return {
    ...settings,
    apiKey: settings.apiKey ? '****' + settings.apiKey.slice(-4) : ''
  };
});

// Save settings
ipcMain.handle('save-settings', (event, newSettings) => {
  try {
    const existing = loadSettings();
    if (!newSettings.apiKey || newSettings.apiKey.startsWith('****')) {
      newSettings.apiKey = existing.apiKey;
    }
    saveSettings(newSettings);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

// Get all projects
ipcMain.handle('get-projects', () => {
  try {
    const files = fs.readdirSync(PROJECTS_DIR);
    const projects = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const data = fs.readFileSync(path.join(PROJECTS_DIR, file), 'utf8');
          const project = JSON.parse(data);
          projects.push({
            id: project.id,
            name: project.name,
            description: project.description,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            totalEstimatedHours: project.totalEstimatedHours
          });
        } catch (e) {}
      }
    }

    projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return projects;
  } catch (error) {
    return [];
  }
});

// Get single project
ipcMain.handle('get-project', (event, projectId) => {
  try {
    const filePath = path.join(PROJECTS_DIR, `${projectId}.json`);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { error: 'Project not found' };
  }
});

// Save project
ipcMain.handle('save-project', (event, project) => {
  try {
    project.updatedAt = new Date().toISOString();
    const filePath = path.join(PROJECTS_DIR, `${project.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(project, null, 2), 'utf8');
    return project;
  } catch (error) {
    return { error: error.message };
  }
});

// Delete project
ipcMain.handle('delete-project', (event, projectId) => {
  try {
    const filePath = path.join(PROJECTS_DIR, `${projectId}.json`);
    fs.unlinkSync(filePath);
    return { success: true };
  } catch (error) {
    return { error: 'Project not found' };
  }
});

// Analyze project with Groq
ipcMain.handle('analyze', async (event, { goal, context }) => {
  if (!groqClient) {
    return { error: 'Groq API key not configured' };
  }

  if (!goal) {
    return { error: 'Goal is required' };
  }

  try {
    const systemPrompt = `Du bist ein erfahrener Projektmanager für KI-gestützte Softwareentwicklung. Der Entwickler nutzt AI-Coding-Tools wie Claude Code, GitHub Copilot oder Cursor.

Analysiere das Projektziel und erstelle eine Projektstruktur mit:
1. Meilensteinen (logische Projektphasen)
2. Tasks (konkrete Arbeitsschritte pro Meilenstein)
3. Zeitschätzungen (optimiert für AI-Coding - deutlich schneller als traditionell!)

WICHTIG: Antworte AUSSCHLIESSLICH mit validem JSON (kein Markdown, keine Erklärungen):

{
  "name": "Kurzer Projektname",
  "milestones": [
    {
      "name": "Meilenstein Name",
      "tasks": [
        {
          "title": "Task Titel",
          "description": "Kurze Beschreibung was zu tun ist",
          "estimatedHours": 0.5
        }
      ]
    }
  ]
}

ZEITSCHÄTZUNGS-RICHTLINIEN FÜR AI-CODING:
- Einfache Komponente/Funktion: 0.25-0.5h (15-30 min)
- Mittlere Feature: 0.5-1h
- Komplexe Logik/Integration: 1-2h
- Große Features mit vielen Teilen: 2-4h
- Setup/Config Tasks: 0.25-0.5h
- Testing/Debugging: 0.5-1h pro Feature
- Mit AI-Tools ist alles 3-5x schneller als traditionell!

Weitere Richtlinien:
- Erstelle 3-6 Meilensteine
- Jeder Meilenstein sollte 2-8 Tasks haben
- Berücksichtige den Kontext für die Technologie-Auswahl
- Tasks sollten konkret und umsetzbar sein
- Beschreibungen sollten prägnant aber informativ sein`;

    const userPrompt = `Projektziel: ${goal}${context ? `\n\nKontext/Technologie: ${context}` : ''}`;

    const response = await groqClient.chat.completions.create({
      model: currentModelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    const content = response.choices[0].message.content;

    // Parse JSON from response
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objectMatch) jsonStr = objectMatch[0];

    const parsed = JSON.parse(jsonStr);

    // Enrich with IDs and metadata
    const now = new Date().toISOString();
    let totalHours = 0;

    const milestones = (parsed.milestones || []).map((milestone, mIndex) => {
      const tasks = (milestone.tasks || []).map((task, tIndex) => {
        const hours = Number(task.estimatedHours) || 2;
        totalHours += hours;
        return {
          id: uuidv4(),
          title: task.title || `Task ${tIndex + 1}`,
          description: task.description || '',
          estimatedHours: hours,
          completed: false
        };
      });
      return {
        id: uuidv4(),
        name: milestone.name || `Meilenstein ${mIndex + 1}`,
        tasks
      };
    });

    const project = {
      id: uuidv4(),
      name: parsed.name || 'Neues Projekt',
      description: goal,
      createdAt: now,
      updatedAt: now,
      milestones,
      totalEstimatedHours: totalHours
    };

    return project;
  } catch (error) {
    console.error('Analyze error:', error);
    return { error: error.message };
  }
});

// Export markdown
ipcMain.handle('export-markdown', (event, project) => {
  let md = `# ${project.name}\n\n`;
  if (project.description) md += `> ${project.description}\n\n`;

  let totalHours = 0;
  let completedHours = 0;

  for (const milestone of project.milestones || []) {
    const milestoneHours = milestone.tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
    totalHours += milestoneHours;

    md += `## ${milestone.name} (${milestoneHours}h)\n\n`;
    for (const task of milestone.tasks || []) {
      const checkbox = task.completed ? '[x]' : '[ ]';
      if (task.completed) completedHours += task.estimatedHours || 0;
      md += `- ${checkbox} **${task.title}** (${task.estimatedHours}h)\n`;
      if (task.description) md += `  - ${task.description}\n`;
    }
    md += '\n';
  }

  md += `---\n\n`;
  md += `**Gesamt:** ${totalHours}h | **Erledigt:** ${completedHours}h (${totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0}%)\n`;

  return md;
});

// Generate feature suggestions
ipcMain.handle('suggest-features', async (event, { projectName, projectDescription, context, excludeFeatures }) => {
  if (!groqClient) {
    return { error: 'Groq API key not configured' };
  }

  try {
    let systemPrompt = `Du bist ein erfahrener Software-Architekt. Basierend auf einem Projekt schlägst du sinnvolle Features vor, die eingebaut werden könnten.

Antworte AUSSCHLIESSLICH mit validem JSON (kein Markdown, keine Erklärungen):

{
  "features": [
    {
      "icon": "🔐",
      "title": "Feature Name",
      "description": "Kurze Beschreibung was das Feature macht und warum es nützlich ist",
      "complexity": "easy|medium|hard",
      "estimatedHours": 2
    }
  ]
}

Richtlinien:
- Schlage 5-8 relevante Features vor
- Sortiere nach Relevanz/Wichtigkeit
- Berücksichtige den Technologie-Stack wenn angegeben
- complexity: "easy" (0.5-2h), "medium" (2-4h), "hard" (4-8h)
- Zeitschätzungen für AI-Coding (3-5x schneller als traditionell)
- Wähle passende Emojis als Icons
- Features sollten konkret und umsetzbar sein`;

    if (excludeFeatures && excludeFeatures.length > 0) {
      systemPrompt += `\n\nWICHTIG: Schlage KEINE Features vor, die diesen ähnlich sind (bereits vorgeschlagen):
${excludeFeatures.map(f => `- ${f}`).join('\n')}

Schlage stattdessen NEUE, ANDERE Features vor!`;
    }

    const userPrompt = `Projekt: ${projectName}
Beschreibung: ${projectDescription}
${context ? `Technologie/Kontext: ${context}` : ''}

Schlage passende Features für dieses Projekt vor.`;

    const response = await groqClient.chat.completions.create({
      model: currentModelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;

    // Parse JSON from response
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objectMatch) jsonStr = objectMatch[0];

    const parsed = JSON.parse(jsonStr);
    return { features: parsed.features || [] };
  } catch (error) {
    console.error('Suggest features error:', error);
    return { error: error.message };
  }
});

// AI Chat - Direkte AI-Hilfe
ipcMain.handle('chat', async (event, { message, projectContext, taskContext }) => {
  if (!groqClient) {
    return { error: 'Groq API key not configured' };
  }

  if (!message) {
    return { error: 'Message is required' };
  }

  try {
    let systemPrompt = `Du bist ein hilfreicher AI-Assistent für Softwareentwicklung. Du hilfst dem Entwickler bei seinem Projekt.

Antworte immer auf Deutsch, sei präzise und hilfreich. Gib konkrete Code-Beispiele wenn passend.`;

    if (projectContext) {
      systemPrompt += `\n\nAktuelles Projekt: ${projectContext.name}
Beschreibung: ${projectContext.description || 'Keine Beschreibung'}`;
    }

    if (taskContext) {
      systemPrompt += `\n\nAktueller Task: ${taskContext.title}
Task-Beschreibung: ${taskContext.description || 'Keine Beschreibung'}`;
    }

    const response = await groqClient.chat.completions.create({
      model: currentModelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    return { response: response.choices[0].message.content };
  } catch (error) {
    console.error('Chat error:', error);
    return { error: error.message };
  }
});

// AI Project Summary/Report
ipcMain.handle('generate-summary', async (event, project) => {
  if (!groqClient) {
    return { error: 'Groq API key not configured' };
  }

  try {
    let totalTasks = 0;
    let completedTasks = 0;
    let totalHours = 0;
    let completedHours = 0;
    let trackedHours = 0;
    const taskList = [];

    for (const milestone of project.milestones || []) {
      for (const task of milestone.tasks || []) {
        totalTasks++;
        totalHours += task.estimatedHours || 0;
        trackedHours += (task.timerSeconds || 0) / 3600;
        if (task.completed) {
          completedTasks++;
          completedHours += task.estimatedHours || 0;
        }
        taskList.push({
          title: task.title,
          milestone: milestone.name,
          completed: task.completed,
          priority: task.priority,
          estimated: task.estimatedHours,
          tracked: ((task.timerSeconds || 0) / 3600).toFixed(1)
        });
      }
    }

    const systemPrompt = `Du bist ein Projekt-Analyst. Erstelle einen professionellen Statusbericht auf Deutsch.

Der Bericht sollte enthalten:
1. Zusammenfassung des Projektstatus
2. Fortschrittsanalyse
3. Zeitvergleich (geschätzt vs. getrackt)
4. Highlights (wichtige erledigte Tasks)
5. Nächste Schritte (offene Tasks mit hoher Priorität)
6. Risiken oder Empfehlungen

Formatiere den Bericht übersichtlich mit Überschriften und Aufzählungen.`;

    const projectData = `
Projekt: ${project.name}
Beschreibung: ${project.description}

Statistiken:
- Tasks gesamt: ${totalTasks}
- Tasks erledigt: ${completedTasks} (${totalTasks > 0 ? Math.round(completedTasks/totalTasks*100) : 0}%)
- Geschätzte Stunden: ${totalHours}h
- Erledigte Stunden: ${completedHours}h
- Getrackte Zeit: ${trackedHours.toFixed(1)}h

Task-Liste:
${taskList.map(t => `- [${t.completed ? 'x' : ' '}] ${t.title} (${t.milestone}) - ${t.priority} - ${t.estimated}h geschätzt, ${t.tracked}h getrackt`).join('\n')}
`;

    const response = await groqClient.chat.completions.create({
      model: currentModelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: projectData }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    return { summary: response.choices[0].message.content };
  } catch (error) {
    console.error('Summary error:', error);
    return { error: error.message };
  }
});

// AI Split Task into Subtasks
ipcMain.handle('split-task', async (event, { task, projectContext }) => {
  if (!groqClient) {
    return { error: 'Groq API key not configured' };
  }

  try {
    const systemPrompt = `Du bist ein erfahrener Projektmanager. Teile den gegebenen Task in kleinere, konkrete Subtasks auf.

Antworte AUSSCHLIESSLICH mit validem JSON:

{
  "subtasks": [
    {
      "title": "Subtask Titel",
      "description": "Kurze Beschreibung",
      "estimatedHours": 0.5
    }
  ]
}

Richtlinien:
- Teile in 3-6 sinnvolle Subtasks auf
- Subtasks sollten konkret und umsetzbar sein
- Zeitschätzungen für AI-Coding (schneller als traditionell)
- Die Summe der Subtask-Zeiten sollte etwa der Original-Zeit entsprechen`;

    const userPrompt = `Task: ${task.title}
Beschreibung: ${task.description || 'Keine'}
Geschätzte Zeit: ${task.estimatedHours}h
${projectContext ? `Projekt-Kontext: ${projectContext}` : ''}

Teile diesen Task in Subtasks auf.`;

    const response = await groqClient.chat.completions.create({
      model: currentModelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const content = response.choices[0].message.content;
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objectMatch) jsonStr = objectMatch[0];

    const parsed = JSON.parse(jsonStr);
    return { subtasks: parsed.subtasks || [] };
  } catch (error) {
    console.error('Split task error:', error);
    return { error: error.message };
  }
});

// Get all projects with full data (for dashboard)
ipcMain.handle('get-all-projects-full', () => {
  try {
    const files = fs.readdirSync(PROJECTS_DIR);
    const projects = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const data = fs.readFileSync(path.join(PROJECTS_DIR, file), 'utf8');
          projects.push(JSON.parse(data));
        } catch (e) {}
      }
    }

    projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return projects;
  } catch (error) {
    return [];
  }
});

// Save time tracking data
ipcMain.handle('save-time-entry', (event, { projectId, taskId, date, seconds }) => {
  try {
    const timeFile = path.join(DATA_DIR, 'timetracking.json');
    let timeData = {};

    if (fs.existsSync(timeFile)) {
      timeData = JSON.parse(fs.readFileSync(timeFile, 'utf8'));
    }

    if (!timeData[projectId]) timeData[projectId] = {};
    if (!timeData[projectId][taskId]) timeData[projectId][taskId] = {};

    const dateKey = date || new Date().toISOString().split('T')[0];
    timeData[projectId][taskId][dateKey] = (timeData[projectId][taskId][dateKey] || 0) + seconds;

    fs.writeFileSync(timeFile, JSON.stringify(timeData, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

// Get time tracking data
ipcMain.handle('get-time-tracking', () => {
  try {
    const timeFile = path.join(DATA_DIR, 'timetracking.json');
    if (fs.existsSync(timeFile)) {
      return JSON.parse(fs.readFileSync(timeFile, 'utf8'));
    }
    return {};
  } catch (error) {
    return {};
  }
});

// AI Sprint Planning
ipcMain.handle('plan-sprint', async (event, { project, sprintDays, hoursPerDay }) => {
  if (!groqClient) {
    return { error: 'Groq API key not configured' };
  }

  try {
    const totalSprintHours = sprintDays * hoursPerDay;

    // Collect open tasks
    const openTasks = [];
    for (const milestone of project.milestones || []) {
      for (const task of milestone.tasks || []) {
        if (!task.completed) {
          openTasks.push({
            id: task.id,
            title: task.title,
            description: task.description || '',
            priority: task.priority || 'medium',
            hours: task.estimatedHours || 1,
            milestone: milestone.name
          });
        }
      }
    }

    if (openTasks.length === 0) {
      return { tasks: [], message: 'Keine offenen Tasks vorhanden' };
    }

    const systemPrompt = `Du bist ein erfahrener Scrum Master. Plane einen Sprint mit optimaler Task-Reihenfolge.

Antworte AUSSCHLIESSLICH mit validem JSON:

{
  "tasks": [
    {
      "taskId": "task-uuid",
      "title": "Task Name",
      "hours": 2,
      "reason": "Kurze Begründung warum dieser Task in dieser Reihenfolge"
    }
  ]
}

Richtlinien:
- Priorisiere nach: Priorität (high > medium > low), Abhängigkeiten, Milestone-Reihenfolge
- Wähle Tasks bis die Sprint-Kapazität (${totalSprintHours}h) erreicht ist
- Sortiere nach optimaler Bearbeitungsreihenfolge
- Gib kurze Begründungen für die Reihenfolge`;

    const taskList = openTasks.map(t =>
      `- [${t.id}] ${t.title} (${t.priority}, ${t.hours}h, ${t.milestone})`
    ).join('\n');

    const userPrompt = `Sprint-Kapazität: ${totalSprintHours}h (${sprintDays} Tage × ${hoursPerDay}h/Tag)

Offene Tasks:
${taskList}

Plane den optimalen Sprint.`;

    const response = await groqClient.chat.completions.create({
      model: currentModelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objectMatch) jsonStr = objectMatch[0];

    const parsed = JSON.parse(jsonStr);
    return { tasks: parsed.tasks || [] };
  } catch (error) {
    console.error('Sprint planning error:', error);
    return { error: error.message };
  }
});

// AI Auto-Tag Tasks
ipcMain.handle('auto-tag-tasks', async (event, { project }) => {
  if (!groqClient) {
    return { error: 'Groq API key not configured' };
  }

  try {
    // Collect all tasks
    const allTasks = [];
    for (const milestone of project.milestones || []) {
      for (const task of milestone.tasks || []) {
        allTasks.push({
          id: task.id,
          title: task.title,
          description: task.description || '',
          existingTags: task.tags || []
        });
      }
    }

    if (allTasks.length === 0) {
      return { tags: [] };
    }

    const systemPrompt = `Du bist ein erfahrener Entwickler. Kategorisiere Tasks mit passenden Tags.

Verfügbare Tags: frontend, backend, api, database, ui, ux, bug, feature, test, docs, security, performance, refactor, setup, deploy

Antworte AUSSCHLIESSLICH mit validem JSON:

{
  "tags": [
    {
      "taskId": "task-uuid",
      "title": "Task Name",
      "suggestedTags": ["tag1", "tag2"]
    }
  ]
}

Richtlinien:
- Analysiere Titel und Beschreibung
- Wähle 1-3 passende Tags pro Task
- Überspringe Tasks die bereits gute Tags haben
- Sei präzise und konsistent`;

    const taskList = allTasks.map(t =>
      `- [${t.id}] ${t.title}${t.description ? ': ' + t.description : ''} (Existing: ${t.existingTags.join(', ') || 'none'})`
    ).join('\n');

    const userPrompt = `Projekt: ${project.name}

Tasks zum Kategorisieren:
${taskList}`;

    const response = await groqClient.chat.completions.create({
      model: currentModelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objectMatch) jsonStr = objectMatch[0];

    const parsed = JSON.parse(jsonStr);
    return { tags: parsed.tags || [] };
  } catch (error) {
    console.error('Auto-tag error:', error);
    return { error: error.message };
  }
});

// ============== Webhook System ==============

// Send webhook notification
ipcMain.handle('send-webhook', async (event, { url, payload }) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return { success: true, status: response.status };
  } catch (error) {
    console.error('Webhook error:', error);
    return { error: error.message };
  }
});

// Get webhooks from settings
ipcMain.handle('get-webhooks', () => {
  try {
    const settings = loadSettings();
    return settings.webhooks || [];
  } catch (error) {
    return [];
  }
});

// Save webhooks to settings
ipcMain.handle('save-webhooks', (event, webhooks) => {
  try {
    const settings = loadSettings();
    settings.webhooks = webhooks;
    saveSettings(settings);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

// ============== Backup System ==============

const BACKUP_DIR = () => path.join(DATA_DIR, 'backups');

// Ensure backup directory exists
function ensureBackupDir() {
  const dir = BACKUP_DIR();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Create backup
ipcMain.handle('create-backup', (event, { name }) => {
  try {
    ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = name || `backup-${timestamp}`;
    const backupPath = path.join(BACKUP_DIR(), `${backupName}.json`);

    // Collect all data
    const backup = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      name: backupName,
      settings: loadSettings(),
      projects: [],
      timeTracking: {}
    };

    // Get all projects
    const files = fs.readdirSync(PROJECTS_DIR);
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const data = fs.readFileSync(path.join(PROJECTS_DIR, file), 'utf8');
          backup.projects.push(JSON.parse(data));
        } catch (e) {}
      }
    }

    // Get time tracking
    const timeFile = path.join(DATA_DIR, 'timetracking.json');
    if (fs.existsSync(timeFile)) {
      backup.timeTracking = JSON.parse(fs.readFileSync(timeFile, 'utf8'));
    }

    // Remove API key from backup for security
    if (backup.settings.apiKey) {
      backup.settings.apiKey = '';
    }

    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf8');

    return {
      success: true,
      path: backupPath,
      name: backupName,
      projectCount: backup.projects.length
    };
  } catch (error) {
    console.error('Backup error:', error);
    return { error: error.message };
  }
});

// List backups
ipcMain.handle('list-backups', () => {
  try {
    ensureBackupDir();
    const files = fs.readdirSync(BACKUP_DIR());
    const backups = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(BACKUP_DIR(), file);
          const stats = fs.statSync(filePath);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          backups.push({
            filename: file,
            name: data.name || file.replace('.json', ''),
            createdAt: data.createdAt || stats.mtime.toISOString(),
            projectCount: data.projects?.length || 0,
            size: stats.size
          });
        } catch (e) {}
      }
    }

    backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return backups;
  } catch (error) {
    return [];
  }
});

// Restore backup
ipcMain.handle('restore-backup', (event, { filename }) => {
  try {
    const backupPath = path.join(BACKUP_DIR(), filename);
    if (!fs.existsSync(backupPath)) {
      return { error: 'Backup not found' };
    }

    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    // Restore projects
    let restoredProjects = 0;
    for (const project of backup.projects || []) {
      const projectPath = path.join(PROJECTS_DIR, `${project.id}.json`);
      fs.writeFileSync(projectPath, JSON.stringify(project, null, 2), 'utf8');
      restoredProjects++;
    }

    // Restore time tracking
    if (backup.timeTracking && Object.keys(backup.timeTracking).length > 0) {
      const timeFile = path.join(DATA_DIR, 'timetracking.json');
      fs.writeFileSync(timeFile, JSON.stringify(backup.timeTracking, null, 2), 'utf8');
    }

    // Restore settings (except API key)
    if (backup.settings) {
      const currentSettings = loadSettings();
      const newSettings = { ...backup.settings, apiKey: currentSettings.apiKey };
      saveSettings(newSettings);
    }

    return {
      success: true,
      restoredProjects,
      message: `${restoredProjects} Projekte wiederhergestellt`
    };
  } catch (error) {
    console.error('Restore error:', error);
    return { error: error.message };
  }
});

// Delete backup
ipcMain.handle('delete-backup', (event, { filename }) => {
  try {
    const backupPath = path.join(BACKUP_DIR(), filename);
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
      return { success: true };
    }
    return { error: 'Backup not found' };
  } catch (error) {
    return { error: error.message };
  }
});

// ============== iCal Export ==============

ipcMain.handle('export-ical', (event, { project, includeCompleted }) => {
  try {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AI Project Manager//DE',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${project.name}`
    ];

    const now = new Date();
    let taskIndex = 0;

    for (const milestone of project.milestones || []) {
      for (const task of milestone.tasks || []) {
        if (!includeCompleted && task.completed) continue;

        taskIndex++;
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() + taskIndex);

        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + (task.estimatedHours || 1));

        const formatDate = (d) => {
          return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        };

        const uid = `${task.id}@aiprojectmanager`;
        const summary = task.title.replace(/,/g, '\\,').replace(/;/g, '\\;');
        const description = (task.description || '').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${formatDate(now)}`);
        lines.push(`DTSTART:${formatDate(startDate)}`);
        lines.push(`DTEND:${formatDate(endDate)}`);
        lines.push(`SUMMARY:${summary}`);
        if (description) lines.push(`DESCRIPTION:${description}`);
        lines.push(`CATEGORIES:${milestone.name}`);
        if (task.priority) lines.push(`PRIORITY:${task.priority === 'high' ? 1 : task.priority === 'low' ? 9 : 5}`);
        lines.push(`STATUS:${task.completed ? 'COMPLETED' : 'NEEDS-ACTION'}`);
        lines.push('END:VEVENT');
      }
    }

    lines.push('END:VCALENDAR');
    return { ical: lines.join('\r\n') };
  } catch (error) {
    console.error('iCal export error:', error);
    return { error: error.message };
  }
});

// ============== Time Comparison Report ==============

ipcMain.handle('get-time-comparison', (event, { projectId }) => {
  try {
    // Get project
    const projectPath = path.join(PROJECTS_DIR, `${projectId}.json`);
    if (!fs.existsSync(projectPath)) {
      return { error: 'Project not found' };
    }

    const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));

    // Get time tracking data
    const timeFile = path.join(DATA_DIR, 'timetracking.json');
    let timeData = {};
    if (fs.existsSync(timeFile)) {
      timeData = JSON.parse(fs.readFileSync(timeFile, 'utf8'));
    }

    const projectTimeData = timeData[projectId] || {};

    // Build comparison data
    const byTag = {};
    const byMilestone = {};
    const byDay = {};
    const tasks = [];

    for (const milestone of project.milestones || []) {
      if (!byMilestone[milestone.name]) {
        byMilestone[milestone.name] = { estimated: 0, tracked: 0 };
      }

      for (const task of milestone.tasks || []) {
        const estimated = task.estimatedHours || 0;
        const trackedSeconds = task.timerSeconds || 0;
        const tracked = trackedSeconds / 3600;

        // Add to milestone totals
        byMilestone[milestone.name].estimated += estimated;
        byMilestone[milestone.name].tracked += tracked;

        // Add to tag totals
        for (const tag of task.tags || []) {
          if (!byTag[tag]) byTag[tag] = { estimated: 0, tracked: 0 };
          byTag[tag].estimated += estimated;
          byTag[tag].tracked += tracked;
        }

        // Add to day totals from time tracking
        const taskTimeData = projectTimeData[task.id] || {};
        for (const [date, seconds] of Object.entries(taskTimeData)) {
          if (!byDay[date]) byDay[date] = 0;
          byDay[date] += seconds / 3600;
        }

        tasks.push({
          id: task.id,
          title: task.title,
          milestone: milestone.name,
          estimated,
          tracked,
          difference: tracked - estimated,
          percentDiff: estimated > 0 ? Math.round(((tracked - estimated) / estimated) * 100) : 0,
          completed: task.completed,
          tags: task.tags || []
        });
      }
    }

    // Calculate totals
    const totalEstimated = tasks.reduce((sum, t) => sum + t.estimated, 0);
    const totalTracked = tasks.reduce((sum, t) => sum + t.tracked, 0);

    return {
      project: { id: project.id, name: project.name },
      totals: {
        estimated: totalEstimated,
        tracked: totalTracked,
        difference: totalTracked - totalEstimated,
        percentDiff: totalEstimated > 0 ? Math.round(((totalTracked - totalEstimated) / totalEstimated) * 100) : 0
      },
      byMilestone,
      byTag,
      byDay,
      tasks
    };
  } catch (error) {
    console.error('Time comparison error:', error);
    return { error: error.message };
  }
});

// ============== Custom Dashboard ==============

ipcMain.handle('get-dashboard-config', () => {
  try {
    const settings = loadSettings();
    return settings.dashboardConfig || {
      widgets: [
        { id: 'projects-overview', type: 'projects-overview', position: 0, enabled: true },
        { id: 'recent-activity', type: 'recent-activity', position: 1, enabled: true },
        { id: 'time-this-week', type: 'time-this-week', position: 2, enabled: true },
        { id: 'task-stats', type: 'task-stats', position: 3, enabled: true }
      ]
    };
  } catch (error) {
    return { widgets: [] };
  }
});

ipcMain.handle('save-dashboard-config', (event, config) => {
  try {
    const settings = loadSettings();
    settings.dashboardConfig = config;
    saveSettings(settings);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});
