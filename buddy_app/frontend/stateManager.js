// Arquivo: frontend/stateManager.js
const { app } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const WebSocket = require('ws');

let historyPath = null; 
const state = {
    conversationHistory: []
};
let ws = null;
const BACKEND_URL_WS = 'ws://127.0.0.1:8000/api/ws';

let connectionPromise = null;

// ✨ O handler agora é um objeto com múltiplas funções ✨
function connectWebSocket(handlers) {
    if (connectionPromise) return connectionPromise;

    connectionPromise = new Promise((resolve, reject) => {
        ws = new WebSocket(BACKEND_URL_WS);

        ws.on('open', () => {
            console.log('Conectado ao backend via WebSocket. Aguardando handshake...');
        });

        ws.on('message', (data) => {
            const message = JSON.parse(data);

            // ✨ Roteia a mensagem para o handler correto com base no 'type' ✨
            switch (message.type) {
                case 'handshake':
                    if (message.model_status === 'loaded') {
                        console.log('Handshake recebido com sucesso. Modelo de IA está pronto.');
                        if (handlers.onHandshakeSuccess) handlers.onHandshakeSuccess();
                        resolve();
                    } else {
                        const error = new Error('Falha ao carregar o modelo de IA no backend.');
                        console.error('Handshake falhou:', error);
                        if (handlers.onHandshakeError) handlers.onHandshakeError(error);
                        reject(error);
                    }
                    break;
                case 'stream_chunk':
                    if (handlers.onStreamChunk) handlers.onStreamChunk(message.payload);
                    break;
                case 'stream_end':
                    if (handlers.onStreamEnd) handlers.onStreamEnd();
                    break;
                case 'error':
                    if (handlers.onError) handlers.onError(message.error);
                    break;
                // O 'response' antigo ainda pode ser tratado para retrocompatibilidade
                case 'response':
                    if (handlers.onStreamChunk) handlers.onStreamChunk(message.response);
                    if (handlers.onStreamEnd) handlers.onStreamEnd();
                    break;
                default:
                    // Se for uma resposta completa sem 'type', trata como um chunk único
                    if (message.response) {
                        if (handlers.onStreamChunk) handlers.onStreamChunk(message.response);
                        if (handlers.onStreamEnd) handlers.onStreamEnd();
                    }
            }
        });

        ws.on('close', () => {
            console.log('Desconectado do backend.');
            ws = null;
            connectionPromise = null;
            if (handlers.onDisconnect) handlers.onDisconnect();
        });

        ws.on('error', (error) => {
            console.error('Erro no WebSocket:', error.message);
            if (handlers.onError) handlers.onError(error.message);
            reject(error);
            connectionPromise = null;
        });
    });
    return connectionPromise;
}

function sendOverWebSocket(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
    } else {
        console.error('WebSocket não está conectado. A mensagem não foi enviada.');
    }
}

function saveHistory() {
    if (!historyPath) return; 
    try {
        fs.writeFileSync(historyPath, JSON.stringify(state.conversationHistory, null, 2));
    } catch (error) {
        console.error('Falha ao salvar o histórico:', error);
    }
}

function loadHistory() {
    if (!historyPath) return; 
    try {
        if (fs.existsSync(historyPath)) {
            const data = fs.readFileSync(historyPath, 'utf8');
            state.conversationHistory = JSON.parse(data);
        }
    } catch (error) {
        console.error('Falha ao carregar o histórico:', error);
        state.conversationHistory = [];
    }
}

function getHistory() {
    return [...state.conversationHistory];
}

function addMessage(message) {
    state.conversationHistory.push(message);
}

function initializeState(buddyDataPath) {
    historyPath = path.join(buddyDataPath, 'history.json');
    loadHistory();
    app.on('will-quit', saveHistory);
}

function awaitConnection(handlers) {
    return connectWebSocket(handlers);
}

module.exports = {
    initializeState,
    getHistory,
    addMessage,
    sendOverWebSocket,
    awaitConnection,
};