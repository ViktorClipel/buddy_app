const messageLog = document.getElementById('message-log');

function appendMessage(message) {
    const messageDiv = document.createElement('div');
    const senderClass = message.role === 'user' ? 'user-message' : 'buddy-message';
    messageDiv.classList.add('message', senderClass);
    messageDiv.textContent = message.parts.join(' '); // Junta partes se houver mais de uma
    messageLog.appendChild(messageDiv);
    messageLog.scrollTop = messageLog.scrollHeight;
}

// Ouve o evento com o histórico completo enviado pelo main.js
window.electronAPI.onFullHistory((history) => {
    messageLog.innerHTML = ''; // Limpa o log antigo
    history.forEach(appendMessage);
});

// Ouve o evento com uma nova mensagem para adicionar ao log
window.electronAPI.onNewLogMessage((message) => {
    appendMessage(message);
});