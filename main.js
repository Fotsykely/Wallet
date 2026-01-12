const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');

// Détecte si on est en mode développement (non empaqueté)
const isDev = !app.isPackaged;

let mainWindow;
let serverProcess;

function createWindow() {
  // Démarrer le serveur back-end
  const userDataPath = app.getPath('userData');
  console.log('=== ELECTRON DEBUG INFO ===');
  console.log('Starting server with userDataPath:', userDataPath);
  console.log('isDev:', isDev);
  
  // Chemin vers le serveur selon le mode
  let serverPath;
  if (isDev) {
    serverPath = path.join(__dirname, 'Wallet-back', 'server.js');
  } else {
    const possiblePaths = [
      path.join(__dirname, 'Wallet-back', 'server.js'),
      path.join(__dirname, '..', 'Wallet-back', 'server.js'),
      path.join(process.resourcesPath, 'app', 'Wallet-back', 'server.js'),
      path.join(app.getAppPath(), 'Wallet-back', 'server.js'),
    ];
    
    serverPath = possiblePaths.find(p => fs.existsSync(p));
    
    if (!serverPath) {
      console.error('❌ Server file not found!');
      return;
    }
  }
  
  console.log('✅ Final server path:', serverPath);
  
  try {
    serverProcess = fork(serverPath, [userDataPath], {
      silent: false,
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      env: {
        ...process.env,
        USER_DATA_PATH: userDataPath
      }
    });

    console.log('✅ Server process created with PID:', serverProcess.pid);

    // Écouter les événements du processus serveur
    serverProcess.on('error', (err) => {
      console.error('❌ Server process error:', err);
    });

    serverProcess.on('exit', (code, signal) => {
      console.log(`⚠️ Server process exited with code: ${code}, signal: ${signal}`);
      serverProcess = null; // Important : réinitialiser la référence
    });

    // Logs du serveur
    if (serverProcess.stdout) {
      serverProcess.stdout.on('data', (data) => {
        console.log('📤 Server stdout:', data.toString());
      });
    }

    if (serverProcess.stderr) {
      serverProcess.stderr.on('data', (data) => {
        console.error('📤 Server stderr:', data.toString());
      });
    }

    setTimeout(() => {
      createMainWindow();
    }, 2000);

  } catch (error) {
    console.error('❌ Failed to start server process:', error);
    createMainWindow();
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'Wallet-front', 'dist', 'index.html'));
  }

  // IMPORTANT : Gérer la fermeture de la fenêtre
  mainWindow.on('closed', function () {
    console.log('🔄 Main window closed, killing server...');
    killServerProcess();
    mainWindow = null;
  });
}

// Fonction pour arrêter proprement le serveur
function killServerProcess() {
  if (serverProcess && !serverProcess.killed) {
    console.log('🔄 Killing server process with PID:', serverProcess.pid);
    
    try {
      // Essayer d'abord un arrêt propre
      serverProcess.kill('SIGTERM');
      
      // Si ça ne marche pas après 5 secondes, forcer l'arrêt
      setTimeout(() => {
        if (serverProcess && !serverProcess.killed) {
          console.log('🔥 Force killing server process...');
          serverProcess.kill('SIGKILL');
        }
      }, 5000);
      
    } catch (error) {
      console.error('❌ Error killing server process:', error);
    }
    
    serverProcess = null;
  }
}

// Événements de l'application
app.on('ready', createWindow);

// IMPORTANT : Gérer la fermeture de l'application
app.on('window-all-closed', function () {
  console.log('🔄 All windows closed, killing server...');
  killServerProcess();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IMPORTANT : Gérer l'arrêt de l'application
app.on('before-quit', (event) => {
  console.log('🔄 App is quitting, killing server...');
  killServerProcess();
});

// IMPORTANT : Gérer les signaux système
process.on('SIGINT', () => {
  console.log('🔄 Received SIGINT, killing server...');
  killServerProcess();
  app.quit();
});

process.on('SIGTERM', () => {
  console.log('🔄 Received SIGTERM, killing server...');
  killServerProcess();
  app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});