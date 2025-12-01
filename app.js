// Configuração
const API_URL = "https://script.google.com/macros/s/AKfycby1RlOGjnMX18Cu-SDEoRMvdKlhNFdLDZRBVHXGkQKu4CCtKSRfFP2T4AyyjWejIDTUZA/exec";
let connectionStatus = false;
let currentEditItem = null;
let currentEditType = '';

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    testConnection();
    loadArquivos();
    loadAulas();
    loadUsuarios();
});

// ============================================
// FUNÇÕES DE UI
// ============================================
function switchTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelector(`[onclick="switchTab('${tabId}')"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
    document.querySelector('.main-content').scrollTop = 0;
}

function showAlert(message, type = 'success', tab = 'adicionar') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    
    const alertContainer = document.getElementById(`${tab}Alert`);
    if (alertContainer) {
        alertContainer.innerHTML = '';
        alertContainer.appendChild(alertDiv);
    }
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// ============================================
// FUNÇÕES DE API
// ============================================
async function callAPI(params) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
            queryParams.append(key, params[key]);
        }
    });
    
    const url = `${API_URL}?${queryParams.toString()}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow'
        });
        
        return await response.json();
        
    } catch (error) {
        console.error('API Error:', error);
        return { 
            success: false, 
            error: error.message,
            message: 'Falha na conexão com a API'
        };
    }
}

// Teste de conexão
async function testConnection() {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const footerStatus = document.getElementById('apiStatusFooter');
    
    statusText.innerHTML = '<span class="loading"></span> Testando...';
    
    try {
        const result = await callAPI({ action: 'list' });
        
        if (result.success) {
            connectionStatus = true;
            statusDot.className = 'status-dot online';
            statusText.textContent = 'Conectado';
            footerStatus.textContent = '✅ Online';
            showAlert('API conectada com sucesso!', 'success', 'adicionar');
        } else {
            throw new Error(result.error || 'Falha na conexão');
        }
        
    } catch (error) {
        connectionStatus = false;
        statusDot.className = 'status-dot';
        statusText.textContent = 'Desconectado';
        footerStatus.textContent = '❌ Offline';
        showAlert(`Falha na conexão: ${error.message}`, 'error', 'adicionar');
    }
}

// ============================================
// FUNÇÕES PARA ARQUIVOS
// ============================================
async function loadArquivos() {
    const listDiv = document.getElementById('arquivosList');
    listDiv.innerHTML = '<div class="loading-text"><div class="loading"></div><span>Carregando arquivos...</span></div>';
    
    const result = await callAPI({ 
        action: 'read', 
        sheet: 'Arquivos',
        limit: 100 
    });
    
    if (result.success && result.data && result.data.data) {
        renderArquivosList(result.data.data);
    } else {
        listDiv.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Erro ao carregar arquivos</p></div>';
    }
}

function renderArquivosList(arquivos) {
    const listDiv = document.getElementById('arquivosList');
    
    if (!arquivos || arquivos.length === 0) {
        listDiv.innerHTML = '<div class="empty-state"><i class="fas fa-folder-open"></i><p>Nenhum arquivo cadastrado</p></div>';
        return;
    }
    
    let html = '';
    arquivos.forEach(arquivo => {
        html += `
            <div class="data-item view-mode" data-id="${arquivo.id}" data-type="arquivo">
                <div class="data-header">
                    <div class="data-title">${arquivo.nome}</div>
                    <div class="data-actions">
                        <button class="action-btn edit-btn" onclick="editItem('arquivo', '${arquivo.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteItem('arquivo', '${arquivo.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="data-fields">
                    <div class="field-row">
                        <span class="field-label">ID:</span>
                        <span class="field-value">${arquivo.id}</span>
                        <input type="text" class="field-input" value="${arquivo.id}" data-field="id" style="display: none;">
                    </div>
                    <div class="field-row">
                        <span class="field-label">Nome:</span>
                        <span class="field-value">${arquivo.nome}</span>
                        <input type="text" class="field-input" value="${arquivo.nome}" data-field="nome" style="display: none;">
                    </div>
                    <div class="field-row">
                        <span class="field-label">Link:</span>
                        <span class="field-value">${arquivo.link}</span>
                        <input type="text" class="field-input" value="${arquivo.link}" data-field="link" style="display: none;">
                    </div>
                    <div class="field-row">
                        <span class="field-label">Tipo:</span>
                        <span class="field-value">${arquivo.tipo}</span>
                        <select class="field-input" data-field="tipo" style="display: none;">
                            <option value="link" ${arquivo.tipo === 'link' ? 'selected' : ''}>Link</option>
                            <option value="download" ${arquivo.tipo === 'download' ? 'selected' : ''}>Download</option>
                            <option value="video" ${arquivo.tipo === 'video' ? 'selected' : ''}>Video</option>
                            <option value="documento" ${arquivo.tipo === 'documento' ? 'selected' : ''}>Documento</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    });
    
    listDiv.innerHTML = html;
    showAlert(`${arquivos.length} arquivos carregados`, 'success', 'arquivos');
}

function filterArquivos() {
    const searchTerm = document.getElementById('searchArquivos').value.toLowerCase();
    const items = document.querySelectorAll('#arquivosList .data-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

// ============================================
// FUNÇÕES PARA AULAS
// ============================================
async function loadAulas() {
    const listDiv = document.getElementById('aulasList');
    listDiv.innerHTML = '<div class="loading-text"><div class="loading"></div><span>Carregando aulas...</span></div>';
    
    const result = await callAPI({ 
        action: 'read', 
        sheet: 'Aulas',
        limit: 100 
    });
    
    if (result.success && result.data && result.data.data) {
        renderAulasList(result.data.data);
    } else {
        listDiv.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Erro ao carregar aulas</p></div>';
    }
}

function renderAulasList(aulas) {
    const listDiv = document.getElementById('aulasList');
    
    if (!aulas || aulas.length === 0) {
        listDiv.innerHTML = '<div class="empty-state"><i class="fas fa-video"></i><p>Nenhuma aula cadastrada</p></div>';
        return;
    }
    
    let html = '';
    aulas.forEach(aula => {
        html += `
            <div class="data-item view-mode" data-id="${aula.nome}" data-type="aula">
                <div class="data-header">
                    <div class="data-title">${aula.nome}</div>
                    <div class="data-actions">
                        <button class="action-btn edit-btn" onclick="editItem('aula', '${aula.nome}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteItem('aula', '${aula.nome}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="data-fields">
                    <div class="field-row">
                        <span class="field-label">Categoria:</span>
                        <span class="field-value">${aula.categoria || ''}</span>
                        <input type="text" class="field-input" value="${aula.categoria || ''}" data-field="categoria" style="display: none;">
                    </div>
                    <div class="field-row">
                        <span class="field-label">Nome:</span>
                        <span class="field-value">${aula.nome}</span>
                        <input type="text" class="field-input" value="${aula.nome}" data-field="nome" style="display: none;">
                    </div>
                    <div class="field-row">
                        <span class="field-label">URL:</span>
                        <span class="field-value">${aula.url || ''}</span>
                        <input type="text" class="field-input" value="${aula.url || ''}" data-field="url" style="display: none;">
                    </div>
                    <div class="field-row">
                        <span class="field-label">Tipo:</span>
                        <span class="field-value">${aula.tipo || ''}</span>
                        <select class="field-input" data-field="tipo" style="display: none;">
                            <option value="video" ${aula.tipo === 'video' ? 'selected' : ''}>Video</option>
                            <option value="texto" ${aula.tipo === 'texto' ? 'selected' : ''}>Texto</option>
                            <option value="quiz" ${aula.tipo === 'quiz' ? 'selected' : ''}>Quiz</option>
                            <option value="projeto" ${aula.tipo === 'projeto' ? 'selected' : ''}>Projeto</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    });
    
    listDiv.innerHTML = html;
    showAlert(`${aulas.length} aulas carregadas`, 'success', 'aulas');
}

function filterAulas() {
    const searchTerm = document.getElementById('searchAulas').value.toLowerCase();
    const items = document.querySelectorAll('#aulasList .data-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

// ============================================
// FUNÇÕES PARA USUÁRIOS
// ============================================
async function loadUsuarios() {
    const listDiv = document.getElementById('usuariosList');
    listDiv.innerHTML = '<div class="loading-text"><div class="loading"></div><span>Carregando usuários...</span></div>';
    
    const result = await callAPI({ 
        action: 'read', 
        sheet: 'Usuarios',
        limit: 100 
    });
    
    if (result.success && result.data && result.data.data) {
        renderUsuariosList(result.data.data);
    } else {
        listDiv.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Erro ao carregar usuários</p></div>';
    }
}

function renderUsuariosList(usuarios) {
    const listDiv = document.getElementById('usuariosList');
    
    if (!usuarios || usuarios.length === 0) {
        listDiv.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>Nenhum usuário cadastrado</p></div>';
        return;
    }
    
    let html = '';
    usuarios.forEach(user => {
        html += `
            <div class="data-item view-mode" data-id="${user.codigo}" data-type="usuario">
                <div class="data-header">
                    <div class="data-title">${user.apelido || user.codigo}</div>
                    <div class="data-actions">
                        <button class="action-btn edit-btn" onclick="editItem('usuario', '${user.codigo}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteItem('usuario', '${user.codigo}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="data-fields">
                    <div class="field-row">
                        <span class="field-label">Código:</span>
                        <span class="field-value">${user.codigo}</span>
                        <input type="text" class="field-input" value="${user.codigo}" data-field="codigo" style="display: none;">
                    </div>
                    <div class="field-row">
                        <span class="field-label">Apelido:</span>
                        <span class="field-value">${user.apelido || ''}</span>
                        <input type="text" class="field-input" value="${user.apelido || ''}" data-field="apelido" style="display: none;">
                    </div>
                    <div class="field-row">
                        <span class="field-label">Aulas Concl.:</span>
                        <span class="field-value">${user['aulas concluídas'] || '0'}</span>
                        <input type="number" class="field-input" value="${user['aulas concluídas'] || '0'}" data-field="aulas concluídas" style="display: none;">
                    </div>
                    <div class="field-row">
                        <span class="field-label">Aulas Disp.:</span>
                        <span class="field-value">${user['aulas disponíveis'] || '0'}</span>
                        <input type="number" class="field-input" value="${user['aulas disponíveis'] || '0'}" data-field="aulas disponíveis" style="display: none;">
                    </div>
                    <div class="field-row">
                        <span class="field-label">Últ. Acesso:</span>
                        <span class="field-value">${user['ultimo acesso'] || 'Nunca'}</span>
                        <input type="text" class="field-input" value="${user['ultimo acesso'] || ''}" data-field="ultimo acesso" style="display: none;">
                    </div>
                    <div class="field-row">
                        <span class="field-label">Acesso Trein.:</span>
                        <span class="field-value">${user['acesso treinamento'] || 'não'}</span>
                        <select class="field-input" data-field="acesso treinamento" style="display: none;">
                            <option value="sim" ${user['acesso treinamento'] === 'sim' ? 'selected' : ''}>Sim</option>
                            <option value="não" ${user['acesso treinamento'] === 'não' ? 'selected' : ''}>Não</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    });
    
    listDiv.innerHTML = html;
    showAlert(`${usuarios.length} usuários carregados`, 'success', 'usuarios');
}

function filterUsuarios() {
    const searchTerm = document.getElementById('searchUsuarios').value.toLowerCase();
    const items = document.querySelectorAll('#usuariosList .data-item');
    
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

// ============================================
// FUNÇÕES DE EDIÇÃO (MODAL)
// ============================================
async function editItem(type, id) {
    currentEditType = type;
    
    // Encontrar o item na lista
    const items = document.querySelectorAll(`.data-item[data-type="${type}"][data-id="${id}"]`);
    if (items.length === 0) return;
    
    const item = items[0];
    currentEditItem = {
        type: type,
        id: id,
        element: item
    };
    
    // Coletar dados atuais
    const fields = {};
    item.querySelectorAll('.field-row').forEach(row => {
        const label = row.querySelector('.field-label').textContent.replace(':', '').trim();
        const value = row.querySelector('.field-value').textContent;
        fields[label] = value;
    });
    
    // Abrir modal de edição
    openEditModal(type, id, fields);
}

function openEditModal(type, id, fields) {
    const modal = document.getElementById('editModal');
    const title = document.getElementById('editModalTitle');
    const content = document.getElementById('editModalContent');
    
    title.textContent = `Editar ${type}: ${id}`;
    
    let html = '<div style="display: flex; flex-direction: column; gap: 15px;">';
    
    Object.keys(fields).forEach(field => {
        const value = fields[field];
        
        // Determinar tipo de input baseado no campo
        let inputHTML = '';
        if (field.toLowerCase().includes('acesso')) {
            inputHTML = `
                <select class="form-input" data-field="${field}">
                    <option value="sim" ${value === 'sim' ? 'selected' : ''}>Sim</option>
                    <option value="não" ${value === 'não' ? 'selected' : ''}>Não</option>
                </select>
            `;
        } else if (field.toLowerCase().includes('aulas') || field.toLowerCase().includes('concl') || field.toLowerCase().includes('disp')) {
            inputHTML = `<input type="number" class="form-input" data-field="${field}" value="${value}" min="0">`;
        } else if (field.toLowerCase().includes('url') || field.toLowerCase().includes('link')) {
            inputHTML = `<input type="url" class="form-input" data-field="${field}" value="${value}">`;
        } else {
            inputHTML = `<input type="text" class="form-input" data-field="${field}" value="${value}">`;
        }
        
        html += `
            <div class="form-group">
                <label class="form-label">${field}:</label>
                ${inputHTML}
            </div>
        `;
    });
    
    html += '</div>';
    content.innerHTML = html;
    modal.style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    currentEditItem = null;
    currentEditType = '';
}

async function saveEdit() {
    if (!currentEditItem) return;
    
    const modal = document.getElementById('editModal');
    const inputs = modal.querySelectorAll('[data-field]');
    
    // Coletar dados atualizados
    const updateData = {
        action: 'edit',
        sheet: currentEditType === 'arquivo' ? 'Arquivos' : 
               currentEditType === 'aula' ? 'Aulas' : 'Usuarios'
    };
    
    // Campo de identificação
    if (currentEditType === 'arquivo') {
        updateData.idValue = currentEditItem.id;
        updateData.idField = 'id';
    } else if (currentEditType === 'aula') {
        updateData.idValue = currentEditItem.id;
        updateData.idField = 'nome';
    } else if (currentEditType === 'usuario') {
        updateData.idValue = currentEditItem.id;
        updateData.idField = 'codigo';
    }
    
    // Adicionar campos atualizados
    inputs.forEach(input => {
        const field = input.getAttribute('data-field');
        updateData[field] = input.value;
    });
    
    // Enviar para API
    const result = await callAPI(updateData);
    
    if (result.success) {
        showAlert(`${currentEditType} atualizado com sucesso!`, 'success', currentEditType + 's');
        
        // Recarregar lista
        if (currentEditType === 'arquivo') loadArquivos();
        else if (currentEditType === 'aula') loadAulas();
        else if (currentEditType === 'usuario') loadUsuarios();
        
        closeEditModal();
    } else {
        showAlert(`Erro ao atualizar: ${result.error}`, 'error', currentEditType + 's');
    }
}

// ============================================
// FUNÇÕES PARA DELETAR
// ============================================
async function deleteItem(type, id) {
    if (!confirm(`Tem certeza que deseja excluir este ${type}?`)) {
        return;
    }
    
    const sheetName = type === 'arquivo' ? 'Arquivos' : 
                     type === 'aula' ? 'Aulas' : 'Usuarios';
    
    const idField = type === 'arquivo' ? 'id' : 
                   type === 'aula' ? 'nome' : 'codigo';
    
    const result = await callAPI({
        action: 'delete',
        sheet: sheetName,
        idField: idField,
        idValue: id
    });
    
    if (result.success) {
        showAlert(`${type} excluído com sucesso!`, 'success', type + 's');
        
        // Recarregar lista
        if (type === 'arquivo') loadArquivos();
        else if (type === 'aula') loadAulas();
        else if (type === 'usuario') loadUsuarios();
    } else {
        showAlert(`Erro ao excluir: ${result.error}`, 'error', type + 's');
    }
}

// ============================================
// FUNÇÕES PARA ADICIONAR NOVOS
// ============================================
async function addNovoArquivo() {
    const id = document.getElementById('novoArqId').value;
    const nome = document.getElementById('novoArqNome').value;
    const link = document.getElementById('novoArqLink').value;
    const tipo = document.getElementById('novoArqTipo').value;
    
    if (!id || !nome || !link) {
        showAlert('Preencha todos os campos obrigatórios', 'error', 'adicionar');
        return;
    }
    
    const result = await callAPI({
        action: 'add',
        sheet: 'Arquivos',
        id: id,
        nome: nome,
        link: link,
        tipo: tipo
    });
    
    if (result.success) {
        showAlert('Arquivo adicionado com sucesso!', 'success', 'adicionar');
        
        // Limpar formulário
        document.getElementById('novoArqId').value = 'ARQ' + Date.now().toString().slice(-4);
        document.getElementById('novoArqNome').value = '';
        document.getElementById('novoArqLink').value = 'https://drive.google.com/';
        
        // Recarregar lista
        loadArquivos();
        
        // Mudar para aba de arquivos
        switchTab('arquivos');
    } else {
        showAlert(`Erro: ${result.error || 'Falha ao adicionar'}`, 'error', 'adicionar');
    }
}

async function addNovaAula() {
    const categoria = document.getElementById('novaAulaCategoria').value;
    const nome = document.getElementById('novaAulaNome').value;
    const url = document.getElementById('novaAulaUrl').value;
    const tipo = document.getElementById('novaAulaTipo').value;
    
    if (!categoria || !nome || !url) {
        showAlert('Preencha todos os campos obrigatórios', 'error', 'adicionar');
        return;
    }
    
    const result = await callAPI({
        action: 'add',
        sheet: 'Aulas',
        categoria: categoria,
        nome: nome,
        url: url,
        tipo: tipo
    });
    
    if (result.success) {
        showAlert('Aula adicionada com sucesso!', 'success', 'adicionar');
        
        // Limpar formulário
        document.getElementById('novaAulaCategoria').value = '';
        document.getElementById('novaAulaNome').value = '';
        document.getElementById('novaAulaUrl').value = 'https://';
        
        // Recarregar lista
        loadAulas();
        
        // Mudar para aba de aulas
        switchTab('aulas');
    } else {
        showAlert(`Erro: ${result.error || 'Falha ao adicionar'}`, 'error', 'adicionar');
    }
}

async function addNovoUsuario() {
    const codigo = document.getElementById('novoUserCodigo').value;
    const apelido = document.getElementById('novoUserApelido').value;
    const concluidas = document.getElementById('novoUserConcluidas').value;
    const disponiveis = document.getElementById('novoUserDisponiveis').value;
    const treinamento = document.getElementById('novoUserTreinamento').value;
    
    if (!codigo || !apelido) {
        showAlert('Código e Apelido são obrigatórios', 'error', 'adicionar');
        return;
    }
    
    const result = await callAPI({
        action: 'add',
        sheet: 'Usuarios',
        codigo: codigo,
        apelido: apelido,
        'aulas concluídas': concluidas,
        'aulas disponíveis': disponiveis,
        'acesso treinamento': treinamento
    });
    
    if (result.success) {
        showAlert('Usuário adicionado com sucesso!', 'success', 'adicionar');
        
        // Limpar formulário
        document.getElementById('novoUserCodigo').value = 'USR' + Date.now().toString().slice(-4);
        document.getElementById('novoUserApelido').value = '';
        document.getElementById('novoUserConcluidas').value = '0';
        document.getElementById('novoUserDisponiveis').value = '10';
        
        // Recarregar lista
        loadUsuarios();
        
        // Mudar para aba de usuários
        switchTab('usuarios');
    } else {
        showAlert(`Erro: ${result.error || 'Falha ao adicionar'}`, 'error', 'adicionar');
    }
}

// ============================================
// EVENT LISTENERS E ATALHOS
// ============================================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeEditModal();
    }
});

// Auto-conexão a cada 30 segundos
setInterval(() => {
    if (!connectionStatus) {
        testConnection();
    }
}, 30000);
