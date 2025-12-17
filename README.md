# AI Project Manager

Eine Electron Desktop-App, die Projektziele mithilfe von AI (Groq API) in strukturierte Tasks, Meilensteine und Zeitschatzungen zerlegt.

## Features

### Kernfunktionen
- **AI-Projektanalyse**: Beschreibe dein Projektziel und die AI erstellt automatisch Meilensteine, Tasks und Zeitschatzungen
- **Feature-Vorschlage**: Nach der Analyse schlagt die AI passende Features vor, die du hinzufugen kannst
- **AI Chat**: Direkter Chat mit der AI fur Hilfe bei Tasks und Fragen

### Ansichten
- **Listen-Ansicht**: Klassische hierarchische Darstellung mit Meilensteinen und Tasks
- **Kanban-Board**: Tasks nach Status (Todo, In Progress, Done) organisiert
- **Gantt-Chart**: Timeline-Ansicht aller Tasks uber 14 Tage

### Task-Management
- **Prioritaten**: Hoch, Mittel, Niedrig mit farblicher Markierung
- **Tags**: Kategorisierung von Tasks (frontend, backend, bug, feature, etc.)
- **Subtasks**: Unteraufgaben fur komplexe Tasks
- **AI Task-Aufteilung**: AI teilt grosse Tasks automatisch in Subtasks auf
- **Timer**: Zeiterfassung pro Task mit Start/Stop/Reset
- **Notizen**: Zusatzliche Informationen pro Task
- **Erinnerungen**: Datum/Zeit-basierte Erinnerungen

### Dashboard & Tracking
- **Dashboard**: Ubersicht uber alle Projekte mit KPIs
- **Arbeitszeit-Tracking**: Wochenuebersicht der getrackteten Zeit
- **Statistiken**: Fortschritt, erledigte Tasks, Zeitvergleich

### Export & Reports
- **Markdown-Export**: Projekte als .md Datei exportieren
- **PDF-Export**: Formatierte PDF uber Druckdialog
- **AI Report**: AI generiert professionelle Statusberichte

### UI/UX
- **Dark Mode / Light Mode**: Theme umschaltbar
- **Drag & Drop**: Meilensteine per Drag & Drop umsortieren
- **Suche & Filter**: Tasks durchsuchen und nach Status/Prioritat filtern
- **Keyboard Shortcuts**: Strg+S zum Speichern, Escape zum Schliessen

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
- **Backend**: Electron 28
- **AI**: Groq API (llama-3.3-70b-versatile)
- **Build**: electron-builder

## Projektstruktur

```
ai-project-manager/
├── main.js              # Electron Main Process
├── preload.js           # IPC Bridge
├── public/
│   ├── index.html       # Haupt-UI
│   ├── styles.css       # Styling
│   └── app.js           # Frontend-Logik
├── projects/            # Gespeicherte Projekte (JSON)
├── data/                # App-Daten (Settings, Timetracking)
├── dist/                # Build-Output
└── package.json
```

## Tastenkurzel

| Shortcut | Aktion |
|----------|--------|
| `Strg+S` | Projekt speichern |
| `Escape` | Modals schliessen |

## Screenshots

### Hauptansicht
Die App zeigt Projekte mit Meilensteinen und Tasks in einer ubersichtlichen Liste.

### Kanban-Board
Tasks werden nach Status in Spalten organisiert.

### Gantt-Chart
Timeline-Ansicht fur Projektplanung.

## Lizenz

MIT License
