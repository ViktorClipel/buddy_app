// Arquivo: frontend/main.js

const { app, BrowserWindow, ipcMain, Menu, screen } = require('electron');
const path = require('node:path');
const stateManager = require('./stateManager');
const bootstrapper = require('./bootstrapper');

global.pythonProcess = null;

const windows = {
  panel: null, buddy: null, log: null,
  inputBar: null, speechBubble: null, boot: null
};

let streamState = {
    isStreaming: false,
    fullResponse: "",
    chunkQueue: [], 
    isBubbleReady: false
};

function calculateReadingTime(text) {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const time = (words / wordsPerMinute) * 60 * 1000;
    const minimumTime = 3000;
    const maximumTime = 15000;
    return Math.max(minimumTime, Math.min(time, maximumTime));
}

const createWindow = (name, options) => {
  if (windows[name] && !windows[name].isDestroyed()) {
    windows[name].focus();
    return null;
  }
  const window = new BrowserWindow(options);
  const filePath = path.join(__dirname, 'views', name, `${name}.html`);
  window.loadFile(filePath); 
  window.on('closed', () => { 
      if (name === 'speechBubble') {
          streamState.isBubbleReady = false;
      }
      windows[name] = null; 
  });
  windows[name] = window;
  return window;
};

app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    const bootWindow = createWindow('boot', {
        width: 500, height: 300, frame: false, resizable: false,
        webPreferences: { preload: path.join(__dirname, 'load.js') },
    });
    
    const streamHandlers = {
        onStreamChunk: handleStreamChunk,
        onStreamEnd: handleStreamEnd,
        onError: (error) => handleStreamEnd(`Ocorreu um erro: ${error}`),
    };

    try {
        await bootstrapper.runBootSequence(bootWindow, streamHandlers);
        if (bootWindow && !bootWindow.isDestroyed()) {
            bootWindow.webContents.send('boot-sequence-complete');
        }
    } catch (error) {
        console.error("Falha fatal na sequência de inicialização:", error);
        setTimeout(() => app.quit(), 5000);
    }
});

ipcMain.on('boot-continue', () => {
    if (windows.boot && !windows.boot.isDestroyed()) windows.boot.close();
    const panelWindow = createWindow('panel', {
        width: 600, height: 400,
        webPreferences: { preload: path.join(__dirname, 'load.js') },
    });
    panelWindow.on('closed', () => app.quit());
});

app.on('quit', () => {
    if (global.pythonProcess) global.pythonProcess.kill();
});

function createSpeechBubbleIfNeeded() {
    if (windows.speechBubble && !windows.speechBubble.isDestroyed()) return;
    if (!windows.buddy || windows.buddy.isDestroyed()) return;
    
    const [buddyX, buddyY] = windows.buddy.getPosition();
    const [buddyWidth, buddyHeight] = windows.buddy.getSize();
    
    const bubbleWidth = 280;
    const bubbleHeight = 150; // Um pouco mais de altura para o scroll
    const spaceOnRight = screen.getPrimaryDisplay().workAreaSize.width - (buddyX + buddyWidth);
        
    let bubbleX = (spaceOnRight > (bubbleWidth + 10)) ? buddyX + buddyWidth : buddyX - bubbleWidth;
    const bubbleY = Math.round(buddyY + (buddyHeight / 2) - (bubbleHeight / 2));

    const speechBubbleWindow = createWindow('speechBubble', {
        width: bubbleWidth, height: bubbleHeight,
        x: bubbleX, y: bubbleY,
        transparent: true, frame: false, resizable: false,
        skipTaskbar: true, alwaysOnTop: true, focusable: false,
        webPreferences: { preload: path.join(__dirname, 'load.js') }
    });
}

function handleStreamChunk(chunk) {
    if (!streamState.isStreaming) {
        streamState.isStreaming = true;
        streamState.fullResponse = "";
        createSpeechBubbleIfNeeded();
    }
    
    streamState.fullResponse += chunk;

    if (windows.speechBubble && !windows.speechBubble.isDestroyed()) {
        windows.speechBubble.webContents.send('stream-append-chunk', chunk);
    }
}

function handleStreamEnd(error = null) {
    if (!streamState.isStreaming && !error) return;

    if (windows.speechBubble && !windows.speechBubble.isDestroyed()) {
        windows.speechBubble.webContents.send('stream-end-ui');
    }

    const responseToSave = error || streamState.fullResponse;
    if (responseToSave) {
        const modelMessage = { role: 'model', parts: [responseToSave] };
        stateManager.addMessage(modelMessage);
        if (windows.log && !windows.log.isDestroyed()) {
            windows.log.webContents.send('new-log-message', modelMessage);
        }
    }
    
    const displayDuration = calculateReadingTime(streamState.fullResponse);
    setTimeout(() => {
        if(windows.speechBubble && !windows.speechBubble.isDestroyed()) {
            windows.speechBubble.close();
        }
    }, displayDuration);
    
    streamState.isStreaming = false;
    streamState.fullResponse = "";
}

// --- Comunicação Inter-Processos (IPC) ---
ipcMain.on('start-buddy', () => {
  createWindow('buddy', {
    width: 200, height: 200, transparent: true, frame: false,
    resizable: false, skipTaskbar: true, alwaysOnTop: true,
    webPreferences: { preload: path.join(__dirname, 'load.js') },
  });
});

ipcMain.on('close-buddy', () => {
  if (windows.inputBar) windows.inputBar.close();
  if (windows.log) windows.log.close();
  if (windows.speechBubble) windows.speechBubble.close();
  if (windows.buddy) windows.buddy.close();
});

ipcMain.on('toggle-input-bar', () => {
    if (windows.inputBar && !windows.inputBar.isDestroyed()) {
        windows.inputBar.close();
    } else {
        if (!windows.buddy || windows.buddy.isDestroyed()) return;
        const [buddyX, buddyY] = windows.buddy.getPosition();
        const [buddyWidth, buddyHeight] = windows.buddy.getSize();
        createWindow('inputBar', {
            width: 400, height: 65,
            x: Math.round(buddyX + (buddyWidth / 2) - 200),
            y: Math.round(buddyY + buddyHeight),
            transparent: true, frame: false,
            resizable: false, skipTaskbar: true, alwaysOnTop: true,
            webPreferences: { preload: path.join(__dirname, 'load.js') }
        });
    }
});

ipcMain.on('open-log', () => {
  const logWindow = createWindow('log', {
    width: 450,
    height: 600,
    webPreferences: { preload: path.join(__dirname, 'load.js') }
  });
  if (logWindow) {
    logWindow.once('ready-to-show', () => {
        logWindow.webContents.send('full-history', stateManager.getHistory());
    });
  }
});

ipcMain.on('open-panel', () => {
    if (windows.panel) windows.panel.focus();
});

ipcMain.on('send-prompt', (event, prompt) => {
    const userMessage = { role: 'user', parts: [prompt] };
    stateManager.addMessage(userMessage);
    if (windows.log && !windows.log.isDestroyed()) {
        windows.log.webContents.send('new-log-message', userMessage);
    }
    const currentHistory = stateManager.getHistory();
    const CONTEXT_LIMIT = 20;
    stateManager.sendOverWebSocket({ messages: currentHistory.slice(-CONTEXT_LIMIT) });
});

ipcMain.on('resend-last-prompt', () => {
    const fullHistory = stateManager.getHistory();
    const lastUserIndex = fullHistory.map(m => m.role).lastIndexOf('user');
    if (lastUserIndex === -1) {
        console.log("Nenhum prompt do usuário para reenviar.");
        return;
    }
    const historyToSend = fullHistory.slice(0, lastUserIndex + 1);
    console.log(`[Reenviando Prompt]: ${historyToSend[historyToSend.length - 1].parts[0]}`);
    const CONTEXT_LIMIT = 20;
    stateManager.sendOverWebSocket({ messages: historyToSend.slice(-CONTEXT_LIMIT) });
});

ipcMain.on('move-buddy-window', (event, delta) => {
    if (windows.buddy && !windows.buddy.isDestroyed()) {
        const [x, y] = windows.buddy.getPosition();
        windows.buddy.setPosition(x + delta.x, y + delta.y);
    }
});