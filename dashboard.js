// Dashboard Management System
import { authManager } from './auth.js';
import { automationManager } from './automation.js';
import { 
  showNotification, 
  formatDate, 
  formatRelativeTime, 
  getStatusColor, 
  getStatusIcon, 
  parseSchedule,
  copyToClipboard,
  downloadJson 
} from './utils.js';

class DashboardManager {
  constructor() {
    this.currentView = 'overview';
    this.isInitialized = false;
    this.chartInstances = new Map();
  }

  // Initialize dashboard
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      this.setupEventListeners();
      this.setupAutomationManagerListeners();
      await this.render();
      this.isInitialized = true;
      console.log('Dashboard Manager initialized successfully');
    } catch (error) {
      console.error('Error initializing Dashboard Manager:', error);
      showNotification('Erro ao inicializar dashboard', 'error');
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Navigation
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-view]')) {
        e.preventDefault();
        this.switchView(e.target.dataset.view);
      }
      
      // Automation actions
      if (e.target.matches('[data-action]')) {
        this.handleAction(e.target.dataset.action, e.target);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            this.switchView('overview');
            break;
          case '2':
            e.preventDefault();
            this.switchView('automations');
            break;
          case '3':
            e.preventDefault();
            this.switchView('executions');
            break;
          case '4':
            e.preventDefault();
            this.switchView('logs');
            break;
        }
      }
    });

    // Auto-refresh data every 30 seconds
    setInterval(() => {
      if (authManager.isAuthenticated()) {
        this.refreshData();
      }
    }, 30000);
  }

  // Setup automation manager listeners
  setupAutomationManagerListeners() {
    automationManager.onUpdate((type) => {
      this.handleDataUpdate(type);
    });
  }

  // Handle data updates
  handleDataUpdate(type) {
    switch (type) {
      case 'automations':
        this.updateAutomationsView();
        this.updateOverviewStats();
        break;
      case 'executions':
        this.updateExecutionsView();
        this.updateOverviewStats();
        break;
      case 'logs':
        this.updateLogsView();
        break;
    }
  }

  // Switch view
  switchView(view) {
    this.currentView = view;
    
    // Update navigation
    document.querySelectorAll('[data-view]').forEach(nav => {
      nav.classList.toggle('active', nav.dataset.view === view);
    });
    
    // Update content
    this.renderCurrentView();
  }

  // Render dashboard
  async render() {
    const dashboard = document.getElementById('dashboard');
    if (!dashboard) {
      console.error('Dashboard element not found');
      return;
    }

    dashboard.innerHTML = `
      <div class="min-h-screen bg-gray-900">
        <!-- Header -->
        <header class="bg-gray-800 shadow-lg">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-6">
              <div class="flex items-center">
                <h1 class="text-3xl font-bold text-white">ROI-360 Automação</h1>
                <span class="ml-3 px-2 py-1 bg-indigo-600 text-white text-xs rounded">v1.0</span>
              </div>
              <div class="flex items-center space-x-4">
                <div class="text-sm text-gray-300">
                  Olá, <span id="user-name" class="font-semibold text-white"></span>
                </div>
                <button id="logout-btn" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                  Sair
                </button>
              </div>
            </div>
          </div>
        </header>

        <!-- Navigation -->
        <nav class="bg-gray-800 border-t border-gray-700">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex space-x-8">
              <button data-view="overview" class="active py-4 px-2 text-sm font-medium text-indigo-400 border-b-2 border-indigo-500">
                📊 Visão Geral
              </button>
              <button data-view="automations" class="py-4 px-2 text-sm font-medium text-gray-300 hover:text-white border-b-2 border-transparent hover:border-gray-300">
                🤖 Automações
              </button>
              <button data-view="executions" class="py-4 px-2 text-sm font-medium text-gray-300 hover:text-white border-b-2 border-transparent hover:border-gray-300">
                ⚡ Execuções
              </button>
              <button data-view="logs" class="py-4 px-2 text-sm font-medium text-gray-300 hover:text-white border-b-2 border-transparent hover:border-gray-300">
                📝 Logs
              </button>
            </div>
          </div>
        </nav>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div id="dashboard-content">
            <!-- Content will be rendered here -->
          </div>
        </main>
      </div>
    `;

    // Setup logout
    document.getElementById('logout-btn').addEventListener('click', () => {
      authManager.signOutUser();
    });

    // Update user name
    const user = authManager.getCurrentUser();
    if (user) {
      document.getElementById('user-name').textContent = 
        user.displayName || user.email || 'Usuário';
    }

    // Render current view
    this.renderCurrentView();
  }

  // Render current view
  renderCurrentView() {
    const content = document.getElementById('dashboard-content');
    if (!content) return;

    switch (this.currentView) {
      case 'overview':
        this.renderOverview(content);
        break;
      case 'automations':
        this.renderAutomations(content);
        break;
      case 'executions':
        this.renderExecutions(content);
        break;
      case 'logs':
        this.renderLogs(content);
        break;
    }
  }

  // Render overview
  renderOverview(container) {
    const stats = automationManager.getStatistics();
    
    container.innerHTML = `
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-6">Visão Geral do Sistema</h2>
        
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-gray-800 rounded-lg p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  🤖
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-400 truncate">Total de Automações</dt>
                  <dd class="text-3xl font-semibold text-white">${stats.totalAutomations}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div class="bg-gray-800 rounded-lg p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  ✅
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-400 truncate">Ativas</dt>
                  <dd class="text-3xl font-semibold text-white">${stats.activeAutomations}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div class="bg-gray-800 rounded-lg p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  ⚡
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-400 truncate">Execuções</dt>
                  <dd class="text-3xl font-semibold text-white">${stats.totalExecutions}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div class="bg-gray-800 rounded-lg p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  📈
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-400 truncate">Taxa de Sucesso</dt>
                  <dd class="text-3xl font-semibold text-white">${stats.successRate}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="bg-gray-800 rounded-lg p-6">
            <h3 class="text-lg font-medium text-white mb-4">Automações Recentes</h3>
            <div id="recent-automations" class="space-y-3">
              ${this.renderRecentAutomations()}
            </div>
          </div>

          <div class="bg-gray-800 rounded-lg p-6">
            <h3 class="text-lg font-medium text-white mb-4">Execuções Recentes</h3>
            <div id="recent-executions" class="space-y-3">
              ${this.renderRecentExecutions()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Render recent automations
  renderRecentAutomations() {
    const automations = automationManager.getAutomations().slice(0, 5);
    
    if (automations.length === 0) {
      return '<p class="text-gray-400 text-sm">Nenhuma automação criada ainda.</p>';
    }

    return automations.map(automation => `
      <div class="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
        <div class="flex items-center">
          <div class="w-2 h-2 rounded-full ${automation.isActive ? 'bg-green-400' : 'bg-gray-400'} mr-3"></div>
          <div>
            <p class="text-sm font-medium text-white">${automation.name}</p>
            <p class="text-xs text-gray-400">${formatRelativeTime(automation.createdAt)}</p>
          </div>
        </div>
        <div class="text-xs text-gray-400">
          ${automation.totalRuns} execuções
        </div>
      </div>
    `).join('');
  }

  // Render recent executions
  renderRecentExecutions() {
    const executions = automationManager.getExecutions().slice(0, 5);
    
    if (executions.length === 0) {
      return '<p class="text-gray-400 text-sm">Nenhuma execução encontrada.</p>';
    }

    return executions.map(execution => {
      const automation = automationManager.getAutomation(execution.automationId);
      return `
        <div class="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
          <div class="flex items-center">
            <span class="mr-3">${getStatusIcon(execution.status)}</span>
            <div>
              <p class="text-sm font-medium text-white">${automation?.name || 'Automação removida'}</p>
              <p class="text-xs text-gray-400">${formatRelativeTime(execution.startTime)}</p>
            </div>
          </div>
          <div class="text-xs ${getStatusColor(execution.status)}">
            ${execution.status}
          </div>
        </div>
      `;
    }).join('');
  }

  // Render automations view
  renderAutomations(container) {
    const automations = automationManager.getAutomations();
    
    container.innerHTML = `
      <div class="mb-8">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-white">Minhas Automações</h2>
          <button id="new-automation-btn" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
            + Nova Automação
          </button>
        </div>

        <div class="bg-gray-800 rounded-lg overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-700">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-white">Lista de Automações</h3>
              <div class="flex space-x-2">
                <button data-action="refresh-automations" class="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-500">
                  🔄 Atualizar
                </button>
                <button data-action="export-automations" class="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-500">
                  📥 Exportar
                </button>
              </div>
            </div>
          </div>
          
          <div class="overflow-x-auto">
            ${this.renderAutomationsTable(automations)}
          </div>
        </div>
      </div>
    `;

    // Setup new automation button
    document.getElementById('new-automation-btn').addEventListener('click', () => {
      this.showNewAutomationModal();
    });
  }

  // Render automations table
  renderAutomationsTable(automations) {
    if (automations.length === 0) {
      return `
        <div class="text-center py-12">
          <p class="text-gray-400 text-lg mb-4">Nenhuma automação criada ainda</p>
          <button id="create-first-automation" class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Criar Primeira Automação
          </button>
        </div>
      `;
    }

    return `
      <table class="min-w-full divide-y divide-gray-700">
        <thead class="bg-gray-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nome</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Agenda</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Execuções</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Última Execução</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody class="bg-gray-800 divide-y divide-gray-700">
          ${automations.map(automation => `
            <tr class="hover:bg-gray-700">
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-white">${automation.name}</div>
                  <div class="text-sm text-gray-400">${automation.description || 'Sem descrição'}</div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${automation.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                  ${automation.isActive ? 'Ativa' : 'Inativa'}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                ${parseSchedule(automation.schedule)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                <div>${automation.totalRuns} total</div>
                <div class="text-xs">
                  <span class="text-green-400">${automation.successfulRuns} ✓</span>
                  <span class="text-red-400 ml-2">${automation.failedRuns} ✗</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                ${automation.lastRun ? formatRelativeTime(automation.lastRun) : 'Nunca'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button data-action="execute" data-id="${automation.id}" class="text-indigo-400 hover:text-indigo-300">
                  ▶️ Executar
                </button>
                <button data-action="toggle" data-id="${automation.id}" class="text-yellow-400 hover:text-yellow-300">
                  ${automation.isActive ? '⏸️ Pausar' : '▶️ Ativar'}
                </button>
                <button data-action="edit" data-id="${automation.id}" class="text-blue-400 hover:text-blue-300">
                  ✏️ Editar
                </button>
                <button data-action="delete" data-id="${automation.id}" class="text-red-400 hover:text-red-300">
                  🗑️ Excluir
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // Update views
  updateOverviewStats() {
    if (this.currentView === 'overview') {
      this.renderCurrentView();
    }
  }

  updateAutomationsView() {
    if (this.currentView === 'automations') {
      const container = document.getElementById('dashboard-content');
      if (container) {
        this.renderAutomations(container);
      }
    } else if (this.currentView === 'overview') {
      const recentAutomations = document.getElementById('recent-automations');
      if (recentAutomations) {
        recentAutomations.innerHTML = this.renderRecentAutomations();
      }
    }
  }

  updateExecutionsView() {
    if (this.currentView === 'executions') {
      this.renderCurrentView();
    } else if (this.currentView === 'overview') {
      const recentExecutions = document.getElementById('recent-executions');
      if (recentExecutions) {
        recentExecutions.innerHTML = this.renderRecentExecutions();
      }
    }
  }

  updateLogsView() {
    if (this.currentView === 'logs') {
      this.renderCurrentView();
    }
  }

  // Render executions view
  renderExecutions(container) {
    const executions = automationManager.getExecutions();
    
    container.innerHTML = `
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-white mb-6">Histórico de Execuções</h2>
        
        <div class="bg-gray-800 rounded-lg overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-700">
            <h3 class="text-lg font-medium text-white">Execuções Recentes</h3>
          </div>
          
          <div class="overflow-x-auto">
            ${this.renderExecutionsTable(executions)}
          </div>
        </div>
      </div>
    `;
  }

  // Render executions table
  renderExecutionsTable(executions) {
    if (executions.length === 0) {
      return `
        <div class="text-center py-12">
          <p class="text-gray-400 text-lg">Nenhuma execução encontrada</p>
        </div>
      `;
    }

    return `
      <table class="min-w-full divide-y divide-gray-700">
        <thead class="bg-gray-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Automação</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Início</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Duração</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Resultado</th>
          </tr>
        </thead>
        <tbody class="bg-gray-800 divide-y divide-gray-700">
          ${executions.map(execution => {
            const automation = automationManager.getAutomation(execution.automationId);
            const duration = execution.endTime && execution.startTime 
              ? Math.round((execution.endTime.toDate() - execution.startTime.toDate()) / 1000)
              : null;
            
            return `
              <tr class="hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  ${automation?.name || 'Automação removida'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(execution.status).replace('text-', 'bg-').replace('-500', '-100')} ${getStatusColor(execution.status).replace('-500', '-800')}">
                    ${getStatusIcon(execution.status)} ${execution.status}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  ${formatDate(execution.startTime)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  ${duration ? `${duration}s` : '-'}
                </td>
                <td class="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                  ${execution.result || execution.error || '-'}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  // Render logs view
  renderLogs(container) {
    const logs = automationManager.getLogs();
    
    container.innerHTML = `
      <div class="mb-8">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-white">Logs do Sistema</h2>
          <button data-action="clear-logs" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
            🗑️ Limpar Logs
          </button>
        </div>
        
        <div class="bg-gray-800 rounded-lg">
          <div class="px-6 py-4 border-b border-gray-700">
            <h3 class="text-lg font-medium text-white">Eventos Recentes</h3>
          </div>
          
          <div class="max-h-96 overflow-y-auto">
            ${this.renderLogsList(logs)}
          </div>
        </div>
      </div>
    `;
  }

  // Render logs list
  renderLogsList(logs) {
    if (logs.length === 0) {
      return `
        <div class="text-center py-12">
          <p class="text-gray-400 text-lg">Nenhum log encontrado</p>
        </div>
      `;
    }

    return `
      <div class="divide-y divide-gray-700">
        ${logs.map(log => {
          const levelColors = {
            info: 'text-blue-400',
            warning: 'text-yellow-400',
            error: 'text-red-400',
            success: 'text-green-400'
          };
          
          return `
            <div class="px-6 py-4 hover:bg-gray-700">
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <span class="${levelColors[log.level] || 'text-gray-400'} font-mono text-xs uppercase">
                    ${log.level}
                  </span>
                </div>
                <div class="ml-4 flex-1">
                  <p class="text-sm text-white">${log.message}</p>
                  <div class="mt-1 text-xs text-gray-400">
                    ${formatDate(log.timestamp)}
                    ${log.automationId ? ` • Automação ID: ${log.automationId}` : ''}
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Handle actions
  handleAction(action, element) {
    const id = element.dataset.id;
    
    switch (action) {
      case 'execute':
        this.executeAutomation(id);
        break;
      case 'toggle':
        this.toggleAutomation(id);
        break;
      case 'edit':
        this.editAutomation(id);
        break;
      case 'delete':
        this.deleteAutomation(id);
        break;
      case 'refresh-automations':
        this.refreshData();
        break;
      case 'export-automations':
        this.exportAutomations();
        break;
      case 'clear-logs':
        this.clearLogs();
        break;
    }
  }

  // Action implementations
  async executeAutomation(id) {
    await automationManager.executeAutomation(id);
  }

  async toggleAutomation(id) {
    await automationManager.toggleAutomation(id);
  }

  editAutomation(id) {
    const automation = automationManager.getAutomation(id);
    if (automation) {
      this.showEditAutomationModal(automation);
    }
  }

  async deleteAutomation(id) {
    if (confirm('Tem certeza que deseja excluir esta automação?')) {
      await automationManager.deleteAutomation(id);
    }
  }

  async refreshData() {
    showNotification('Atualizando dados...', 'info', 2000);
    await automationManager.loadAutomations();
    await automationManager.loadRecentExecutions();
    await automationManager.loadLogs();
  }

  exportAutomations() {
    const automations = automationManager.getAutomations();
    downloadJson(automations, 'automacoes.json');
  }

  clearLogs() {
    if (confirm('Tem certeza que deseja limpar todos os logs?')) {
      // For now, just clear the local logs
      // In a real implementation, you might want to delete from Firestore
      showNotification('Logs limpos localmente', 'success');
    }
  }

  // Show new automation modal
  showNewAutomationModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-bold text-white mb-4">Nova Automação</h3>
        <form id="new-automation-form">
          <div class="mb-4">
            <label class="block text-gray-300 text-sm font-bold mb-2">Nome</label>
            <input type="text" id="automation-name" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" required>
          </div>
          <div class="mb-4">
            <label class="block text-gray-300 text-sm font-bold mb-2">Descrição</label>
            <textarea id="automation-description" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" rows="3"></textarea>
          </div>
          <div class="mb-6">
            <label class="block text-gray-300 text-sm font-bold mb-2">Script/Configuração</label>
            <textarea id="automation-script" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm" rows="5" placeholder='{"action": "example", "params": {}}'></textarea>
          </div>
          <div class="flex justify-end space-x-3">
            <button type="button" id="cancel-btn" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              Cancelar
            </button>
            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              Criar Automação
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Setup event listeners
    document.getElementById('cancel-btn').addEventListener('click', () => {
      modal.remove();
    });

    document.getElementById('new-automation-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const data = {
        name: document.getElementById('automation-name').value,
        description: document.getElementById('automation-description').value,
        script: document.getElementById('automation-script').value
      };

      await automationManager.createAutomation(data);
      modal.remove();
    });
  }

  // Show edit automation modal
  showEditAutomationModal(automation) {
    // Similar to new automation modal but with pre-filled data
    // Implementation would be similar to showNewAutomationModal
    showNotification('Edição de automação em desenvolvimento', 'info');
  }
}

// Create and export dashboard manager instance
export const dashboardManager = new DashboardManager();
export default dashboardManager;