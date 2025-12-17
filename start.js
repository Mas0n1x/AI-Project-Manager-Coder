// Wrapper script to start Electron without ELECTRON_RUN_AS_NODE
const { spawn } = require('child_process');
const path = require('path');

// Remove the problematic environment variable
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

// Find electron executable
const electronPath = require('electron');

// Start electron
const child = spawn(electronPath, ['.'], {
  stdio: 'inherit',
  env: env,
  cwd: __dirname
});

child.on('close', (code) => {
  process.exit(code);
});
