const path = require('node:path');
const { spawn } = require('child_process');
const paths = require('./paths');
const stateManager = require('./stateManager');

// Helper para enviar status para a janela de boot
function sendStatus(bootWindow, stepId, message, success = null) {
    if (bootWindow && !bootWindow.isDestroyed()) {
        bootWindow.webContents.send('boot-status-update', { stepId, message, success });
    }
}

function startPythonBackend(buddyDataPath) {
    const PYTHON_SCRIPT_DIR = path.join(__dirname, '..', 'backend');
    const VENV_DIR = path.join(PYTHON_SCRIPT_DIR, '.venv');
    const PYTHON_EXECUTABLE = path.join(VENV_DIR, process.platform === 'win32' ? 'Scripts' : 'bin', 'python');
    
    return new Promise((resolve, reject) => {
        const scriptArgs = ['main.py', '--data-path', buddyDataPath];
        const pythonProcess = spawn(PYTHON_EXECUTABLE, scriptArgs, { cwd: PYTHON_SCRIPT_DIR, windowsHide: true });

        global.pythonProcess = pythonProcess;

        const handleData = (data) => {
            const output = data.toString();
            console.log(`[Backend Log]: ${output}`);
            if (output.includes("Application startup complete")) {
                resolve(pythonProcess);
            }
        };

        pythonProcess.stdout.on('data', handleData);
        pythonProcess.stderr.on('data', handleData);

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Processo do backend falhou com código ${code}`));
            }
        });
        
        pythonProcess.on('error', (err) => {
            reject(new Error(`Falha ao iniciar o processo do backend: ${err.message}`));
        });
    });
}

/**
 * Executa a sequência de inicialização passo a passo.
 * @param {BrowserWindow} bootWindow A janela de boot para enviar os status.
 */
async function runBootSequence(bootWindow, mainJsHandler) {
    try {
        // --- Passo 1: Sistema de arquivos ---
        sendStatus(bootWindow, 'fs-init', 'Inicializando sistema de arquivos...');
        const buddyDataPath = paths.getBuddyDataPath();
        // ✨ CORREÇÃO AQUI: initializeState só precisa do caminho dos dados ✨
        stateManager.initializeState(buddyDataPath);
        sendStatus(bootWindow, 'fs-init', 'Inicializando sistema de arquivos...', true);

        // --- Passo 2: Backend da IA ---
        sendStatus(bootWindow, 'backend-init', 'Iniciando backend da IA...');
        await startPythonBackend(buddyDataPath);
        sendStatus(bootWindow, 'backend-init', 'Iniciando backend da IA...', true);

        // --- Passo 3: Conexão e Verificação da IA ---
        sendStatus(bootWindow, 'ws-connect', 'Conectando aos serviços de IA...');
        // ✨ CORREÇÃO AQUI: awaitConnection é quem precisa dos handlers ✨
        await stateManager.awaitConnection(mainJsHandler);
        sendStatus(bootWindow, 'ws-connect', 'Conectando aos serviços de IA...', true);

    } catch (error) {
        sendStatus(bootWindow, 'error', `Erro na inicialização: ${error.message}`, false);
        throw error;
    }
}

module.exports = {
    runBootSequence
};