const { app } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

/**
 * Determina e exporta o caminho absoluto para a pasta de dados do usuário.
 * Esta função garante que a pasta 'buddy_data' seja criada ao lado da pasta da aplicação.
 */
function getBuddyDataPath() {
    const isPackaged = app.isPackaged;

    // A alteração está aqui:
    // Em modo de desenvolvimento, subimos um nível a partir da pasta 'frontend' 
    // para chegar à raiz do projeto (ex: /buddy_app/).
    const basePath = isPackaged 
        ? path.dirname(app.getPath('exe')) 
        : path.join(app.getAppPath(), '..'); 

    const dataDir = path.join(basePath, 'buddy_data');

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    return dataDir;
}

module.exports = {
    getBuddyDataPath,
};