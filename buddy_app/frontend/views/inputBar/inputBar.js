// Arquivo: frontend/inputBar.js

const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const menuButton = document.getElementById('menu-button');
const logButton = document.getElementById('log-button');
const resendButton = document.getElementById('resend-button');

// Ações dos botões
menuButton.addEventListener('click', () => {
    window.electronAPI.openPanel();
});

logButton.addEventListener('click', () => {
    window.electronAPI.openLog();
});

resendButton.addEventListener('click', () => {
    window.electronAPI.resendLastPrompt();
});

// Envio do formulário
chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const promptText = chatInput.value.trim();
    if (promptText === '') return;

    // ✨ A linha que faltava: envia o prompt para o main.js
    window.electronAPI.sendPrompt(promptText);

    chatInput.value = '';
    // Podemos fechar a janela após o envio para uma experiência mais limpa
    window.close();
});