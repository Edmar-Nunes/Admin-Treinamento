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
        
        const data = await response.json();
        return data;
        
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
                            <
