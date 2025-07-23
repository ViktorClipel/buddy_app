/*
================================================================================
 LÓGICA ANTIGA (ARQUIVADA PARA REFERÊNCIA FUTURA)
 Detecta a intenção de clique vs. arrastar no mesmo botão (botão esquerdo)
================================================================================
let isDragging = false;
let isMouseDown = false;
let startX, startY;
buddyImage.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    isDragging = false;
    startX = e.clientX;
    startY = e.clientY;
});
window.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    const deltaX = Math.abs(e.clientX - startX);
    const deltaY = Math.abs(e.clientY - startY);
    if (deltaX > 5 || deltaY > 5) {
        isDragging = true;
    }
});
window.addEventListener('mouseup', (e) => {
    if (!isMouseDown) return;
    isMouseDown = false;
    if (!isDragging) {
        window.electronAPI.toggleInputBar();
    }
    isDragging = false;
});
*/

//==============================================================================
// NOVA LÓGICA ATIVA
// Botão Esquerdo: Arrastar | Botão Direito: Abrir/Fechar Input
//==============================================================================

// Arquivo: frontend/views/buddy/buddy.js

document.addEventListener('DOMContentLoaded', () => {
    const buddyImage = document.getElementById('buddy-img');

    // Previne o comportamento padrão de arrastar imagem do navegador
    if (buddyImage) {
        buddyImage.addEventListener('dragstart', (e) => e.preventDefault());
    }
    
    //==============================================================================
    // NOVA LÓGICA ATIVA
    // Botão Esquerdo: Arrastar | Botão Direito: Abrir/Fechar Input
    //==============================================================================

    let isLeftMouseDown = false;
    let lastMouseX, lastMouseY;

    // Listener para quando o botão esquerdo é pressionado
    if (buddyImage) {
        buddyImage.addEventListener('mousedown', (e) => {
            // Verifica se é o botão esquerdo (código 0)
            if (e.button === 0) {
                isLeftMouseDown = true;
                lastMouseX = e.screenX;
                lastMouseY = e.screenY;
            }
        });
    }

    // Listener para o movimento do mouse, para arrastar
    window.addEventListener('mousemove', (e) => {
        if (!isLeftMouseDown) return;

        const delta = {
            x: e.screenX - lastMouseX,
            y: e.screenY - lastMouseY
        };

        window.electronAPI.moveBuddyWindow(delta);

        // Atualiza a última posição para o próximo cálculo de movimento
        lastMouseX = e.screenX;
        lastMouseY = e.screenY;
    });

    // Listener para quando o botão esquerdo é solto
    window.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            isLeftMouseDown = false;
        }
    });

    // Listener para o clique com o botão direito
    if (buddyImage) {
        buddyImage.addEventListener('contextmenu', (e) => {
            e.preventDefault(); // Impede o menu de contexto padrão de aparecer
            window.electronAPI.toggleInputBar(); // Abre/fecha a nossa barra de input
        });
    }
});