# AI Project Manager

Eine Electron Desktop-App, die Projektziele mithilfe von AI (Groq API) in strukturierte Tasks, Meilensteine und Zeitschätzungen zerlegt.

## Features

### Kernfunktionen
- **AI-Projektanalyse**: Beschreibe dein Projektziel und die AI erstellt automatisch Meilensteine, Tasks und Zeitschätzungen
- **Feature-Vorschläge**: Nach der Analyse schlägt die AI passende Features vor, die du hinzufügen kannst
- **AI Chat**: Direkter Chat mit der AI für Hilfe bei Tasks und Fragen
- **AI Sprint-Planung**: AI plant optimale Sprint-Reihenfolge basierend auf Prioritäten und Kapazität
- **Automatische Tags**: AI kategorisiert Tasks automatisch mit passenden Tags
- **Claude Code Prompt Generator**: Generiert optimierte Prompts für AI-Coding-Tools pro Task

### Ansichten
- **Listen-Ansicht**: Klassische hierarchische Darstellung mit Meilensteinen und Tasks
- **Kanban-Board**: Tasks nach Status (Todo, In Progress, Done) organisiert
- **Gantt-Chart**: Timeline-Ansicht aller Tasks mit konfigurierbaren Arbeitsstunden
- **Burndown-Chart**: Visualisierung des Projektfortschritts über Zeit
- **Milestone-Timeline**: Übersicht aller Meilensteine auf einer Zeitachse

### Task-Management
- **Prioritäten**: Hoch, Mittel, Niedrig mit farblicher Markierung
- **Tags**: Kategorisierung von Tasks (frontend, backend, bug, feature, etc.)
- **Subtasks**: Unteraufgaben für komplexe Tasks
- **AI Task-Aufteilung**: AI teilt große Tasks automatisch in Subtasks auf
- **Timer**: Zeiterfassung pro Task mit Start/Stop/Reset
- **Notizen**: Zusätzliche Informationen pro Task
- **Erinnerungen**: Datum/Zeit-basierte Erinnerungen
- **Prompt Generator**: Generiert Claude Code Prompts in verschiedenen Stilen (Detailliert, Minimal, Schritt-für-Schritt, Review, Debug, Tests)

### Dashboard & Tracking
- **Dashboard**: Übersicht über alle Projekte mit KPIs
- **Arbeitszeit-Tracking**: Wochenübersicht der getrackteten Zeit
- **Statistiken**: Fortschritt, erledigte Tasks, Zeitvergleich
- **Heatmap**: Visualisierung wann am meisten gearbeitet wurde
- **Dependency-Graph**: Visualisierung der Task-Abhängigkeiten

### Export & Reports
- **Markdown-Export**: Projekte als .md Datei exportieren
- **PDF-Export**: Formatierte PDF über Druckdialog
- **CSV-Export**: Tasks als Tabelle exportieren
- **AI Report**: AI generiert professionelle Statusberichte

### UI/UX
- **Dark Mode / Light Mode**: Premium Dark Theme mit Neon-Grünen Akzenten
- **Drag & Drop**: Meilensteine per Drag & Drop umsortieren
- **Suche & Filter**: Tasks durchsuchen und nach Status/Priorität filtern
- **Keyboard Shortcuts**: Strg+S zum Speichern, Escape zum Schließen

## Installation

### Voraussetzungen
- Node.js 18+
- npm

### Setup

```bash
# Repository klonen
git clone <repository-url>
cd ai-project-manager

# Dependencies installieren
npm install

# .env Datei erstellen
echo "GROQ_API_KEY=dein_groq_api_key" > .env
```

### Groq API Key

1. Gehe zu [console.groq.com](https://console.groq.com)
2. Erstelle einen kostenlosen Account
3. Generiere einen API Key
4. Trage den Key in der App unter Einstellungen ein (oder in .env)

### Starten

```bash
# Entwicklungsmodus
npm start

# Produktions-Build erstellen
npm run build
```

Die fertige App befindet sich in `dist/win-unpacked/AI Project Manager.exe`

## Technologie-Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Electron 39
- **AI**: Groq API (llama-3.3-70b-versatile)
- **Build**: electron-builder

## Projektstruktur

```
ai-project-manager/
├── main.js              # Electron Main Process
├── preload.js           # IPC Bridge
├── start.js             # Electron Starter (Umgebungsvariablen-Fix)
├── public/
│   ├── index.html       # Haupt-UI
│   ├── styles.css       # Styling (Premium Dark Theme)
│   └── app.js           # Frontend-Logik
├── data/                # App-Daten (Settings, Timetracking, Projekte)
├── dist/                # Build-Output
└── package.json
```

## Tastenkürzel

| Shortcut | Aktion |
|----------|--------|
| `Strg+S` | Projekt speichern |
| `Escape` | Modals schließen |

## Views & Buttons

### Header-Buttons
| Button | Funktion |
|--------|----------|
| 🏠 | Dashboard mit Projektübersicht |
| ⏱️ | Zeiterfassungs-Übersicht |
| 📊 | Statistiken Modal |
| 🔥 | Heatmap (Arbeitszeit-Visualisierung) |
| 🔗 | Dependency-Graph (Task-Abhängigkeiten) |
| 🌙 | Dark/Light Mode Toggle |
| ⚙️ | Einstellungen |

### Action-Buttons (bei geöffnetem Projekt)
| Button | Funktion |
|--------|----------|
| 💾 | Projekt speichern |
| 📤 MD | Markdown exportieren |
| 📄 PDF | PDF exportieren |
| 📊 CSV | CSV exportieren |
| 🤖 Report | AI-generierten Statusbericht erstellen |
| 🏃 Sprint | AI Sprint-Planung |
| 🏷️ Auto-Tags | AI generiert Tags für alle Tasks |
| 💡 Feature-Ideen | AI schlägt neue Features vor |

### Task-Buttons
| Button | Funktion |
|--------|----------|
| 📋 | Claude Code Prompt Generator |
| ✏️ | Task bearbeiten |
| 🗑️ | Task löschen |
| ▶️ | Timer starten |
| 💬 | AI Chat zu diesem Task |
| ✂️ | Task in Subtasks aufteilen |

## Prompt Generator

Der Prompt Generator (📋 Button bei jedem Task) erstellt optimierte Prompts für AI-Coding-Tools wie Claude Code.

### Prompt-Stile
- **Detailliert**: Vollständiger Prompt mit Projekt-Kontext, Meilenstein und Task-Details
- **Minimal**: Nur die wesentlichen Task-Informationen
- **Schritt-für-Schritt**: Strukturierte Anleitung mit nummerierten Schritten
- **Code Review**: Prompt für Code-Überprüfung
- **Debugging**: Prompt für Fehlersuche
- **Tests**: Prompt für Test-Erstellung

### Verwendung
1. Klicke auf 📋 bei einem Task
2. Wähle den gewünschten Prompt-Stil
3. Optional: Füge zusätzlichen Kontext hinzu
4. Klicke auf "Kopieren" um den Prompt in die Zwischenablage zu kopieren
5. Füge den Prompt in Claude Code oder ein anderes AI-Tool ein

## Screenshots

### Hauptansicht
Die App zeigt Projekte mit Meilensteinen und Tasks in einer übersichtlichen Liste mit Premium Dark Theme.

### Kanban-Board
Tasks werden nach Status in Spalten organisiert.

### Gantt-Chart
Timeline-Ansicht für Projektplanung mit konfigurierbaren Arbeitsstunden pro Tag.

### Burndown-Chart
Visualisierung des Projektfortschritts mit Ideal- und Ist-Linie.

### Milestone-Timeline
Vertikale Zeitachse aller Meilensteine mit Fortschrittsanzeige.

### Prompt Generator
Modal zum Generieren von AI-Coding-Prompts mit verschiedenen Stilen.

## Lizenz

MIT License
