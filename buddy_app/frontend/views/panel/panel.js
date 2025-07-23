const startButton = document.getElementById('start-button');
const closeButton = document.getElementById('close-button');
const openLogButton = document.getElementById('open-log-button');

startButton.addEventListener('click', () => {
    window.electronAPI.startBuddy();
});

closeButton.addEventListener('click', () => { 
    window.electronAPI.closeBuddy();
});

openLogButton.addEventListener('click', () => {
    window.electronAPI.openLog();
});