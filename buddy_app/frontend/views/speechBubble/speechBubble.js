const bubbleContainer = document.getElementById('bubble-container');
const bubbleContent = document.getElementById('bubble-content');
const expandIndicator = document.getElementById('expand-indicator');

const INITIAL_HEIGHT = 120;
const EXPANDED_HEIGHT = 300;

let textQueue = '';
let isStreamFinished = false;
let isTyping = false;
const TYPING_SPEED_MS = 20;
const BUFFER_DELAY_MS = 1200;
let thinkingInterval = null;

function typewriterEffect() {
    if (textQueue.length === 0 && isStreamFinished) {
        isTyping = false;
        checkIfShouldExpand(); // Verifica se precisa expandir no final
        return;
    }
    if (textQueue.length > 0) {
        const char = textQueue.substring(0, 1);
        textQueue = textQueue.substring(1);
        bubbleContent.textContent += char;
    }
    setTimeout(typewriterEffect, TYPING_SPEED_MS);
}

function checkIfShouldExpand() {
    // A altura total do conteúdo de texto é maior que a altura visível inicial?
    if (bubbleContent.scrollHeight > INITIAL_HEIGHT - 20) { // -20 para dar uma margem
        expandIndicator.classList.remove('hidden');
    }
}

// Listener para o clique no indicador "..."
expandIndicator.addEventListener('click', () => {
    const isExpanded = bubbleContainer.classList.toggle('expanded');
    if (isExpanded) {
        window.electronAPI.resizeSpeechBubble(EXPANDED_HEIGHT);
    } else {
        window.electronAPI.resizeSpeechBubble(INITIAL_HEIGHT);
    }
});

window.electronAPI.onStreamStart(() => {
    // Garante que a janela e o estado comecem pequenos
    window.electronAPI.resizeSpeechBubble(INITIAL_HEIGHT);
    bubbleContainer.classList.remove('expanded');
    expandIndicator.classList.add('hidden');
    
    bubbleContent.textContent = '.';
    textQueue = '';
    isStreamFinished = false;
    isTyping = false;
    
    let dotCount = 1;
    thinkingInterval = setInterval(() => {
        dotCount = (dotCount % 3) + 1;
        bubbleContent.textContent = '.'.repeat(dotCount);
    }, 400);

    setTimeout(() => {
        clearInterval(thinkingInterval);
        bubbleContent.textContent = '';
        if (!isTyping) {
            isTyping = true;
            typewriterEffect();
        }
    }, BUFFER_DELAY_MS);
});

window.electronAPI.onStreamAppendChunk((chunk) => {
    textQueue += chunk;
});

window.electronAPI.onStreamEnd(() => {
    isStreamFinished = true;
});