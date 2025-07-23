const terminalOutput = document.getElementById('terminal-output');
const continuePrompt = document.getElementById('continue-prompt');
const cursor = document.getElementById('cursor');

const spinnerChars = ['-', '\\', '|', '/'];
const runningTasks = {}; // Objeto para rastrear tarefas em andamento

// Ouve as mensagens de status
window.electronAPI.onBootStatusUpdate((status) => {
    const { stepId, message, success } = status;

    // Se a tarefa ainda não tem uma linha na tela, crie uma.
    if (!runningTasks[stepId]) {
        const p = document.createElement('p');
        p.id = `step-${stepId}`;
        
        const textNode = document.createTextNode(`> ${message} `);
        const spinnerElement = document.createElement('span');
        spinnerElement.className = 'spinner';
        
        p.appendChild(textNode);
        p.appendChild(spinnerElement);
        terminalOutput.appendChild(p);

        // Inicia a animação do spinner
        let spinnerIndex = 0;
        const intervalId = setInterval(() => {
            spinnerElement.textContent = spinnerChars[spinnerIndex];
            spinnerIndex = (spinnerIndex + 1) % spinnerChars.length;
        }, 100); // Spinner mais rápido (100ms)

        runningTasks[stepId] = { element: p, intervalId: intervalId };
    }

    // Se o status da tarefa foi concluído (true/false), finaliza a linha
    if (success !== null) {
        const task = runningTasks[stepId];
        if (task) {
            // Para a animação
            clearInterval(task.intervalId);

            // Remove o spinner e adiciona o status final
            const spinnerElement = task.element.querySelector('.spinner');
            if (spinnerElement) spinnerElement.remove();

            const statusIndicator = document.createElement('span');
            statusIndicator.textContent = success ? ' [OK]' : ' [FALHA]';
            statusIndicator.className = success ? 'status-ok' : 'status-fail';
            task.element.appendChild(statusIndicator);
        }
    }
});

// Ouve o sinal de que a sequência de boot terminou
window.electronAPI.onBootSequenceComplete(() => {
    cursor.classList.add('hidden');
    continuePrompt.classList.remove('hidden');

    document.addEventListener('keydown', () => {
        window.electronAPI.bootContinue();
    }, { once: true });
});