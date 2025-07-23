const bubbleContent = document.getElementById('bubble-content');

// Limpa o conteúdo quando um novo stream começa
window.electronAPI.onStreamStart(() => {
    bubbleContent.textContent = '';
});

// A cada pedaço de texto, apenas o adiciona ao conteúdo
window.electronAPI.onStreamAppendChunk((chunk) => {
    bubbleContent.textContent += chunk;
});

// A função onStreamEnd não precisa fazer nada aqui, 
// pois o main.js já cuida de fechar o balão.
window.electronAPI.onStreamEnd(() => {
    // Nenhuma ação necessária aqui.
});