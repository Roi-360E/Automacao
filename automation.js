// Core Automation System
import { db } from './firebase-config.js';
import { authManager } from './auth.js';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { showNotification, generateId, getTimestamp } from './utils.js';

class AutomationManager {
  constructor() {
    this.automations = new Map();
    this.executions = new Map();
    this.logs = [];
    this.listeners = new Map();
    this.isInitialized = false;
  }

  // Initialize automation manager
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      await this.loadAutomations();
      await this.loadRecentExecutions();
      this.setupRealtimeListeners();
      this.isInitialized = true;
      console.log('Automation Manager initialized successfully');
    } catch (error) {
      console.error('Error initializing Automation Manager:', error);
      showNotification('Erro ao inicializar sistema de automação', 'error');
    }
  }

  // Load user's automations
  async loadAutomations() {
    const user = authManager.getCurrentUser();
    if (!user) return;

    try {
      const q = query(
        collection(db, 'automations'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      this.automations.clear();
      
      snapshot.forEach(doc => {
        this.automations.set(doc.id, { id: doc.id, ...doc.data() });
      });
      
      console.log(`Loaded ${this.automations.size} automations`);
    } catch (error) {
      console.error('Error loading automations:', error);
      showNotification('Erro ao carregar automações', 'error');
    }
  }

  // Load recent executions
  async loadRecentExecutions() {
    const user = authManager.getCurrentUser();
    if (!user) return;

    try {
      const q = query(
        collection(db, 'executions'),
        where('userId', '==', user.uid),
        orderBy('startTime', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      this.executions.clear();
      
      snapshot.forEach(doc => {
        this.executions.set(doc.id, { id: doc.id, ...doc.data() });
      });
      
      console.log(`Loaded ${this.executions.size} recent executions`);
    } catch (error) {
      console.error('Error loading executions:', error);
      showNotification('Erro ao carregar execuções', 'error');
    }
  }

  // Setup real-time listeners
  setupRealtimeListeners() {
    const user = authManager.getCurrentUser();
    if (!user) return;

    // Listen to automations changes
    const automationsQuery = query(
      collection(db, 'automations'),
      where('userId', '==', user.uid)
    );
    
    this.listeners.set('automations', onSnapshot(automationsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = { id: change.doc.id, ...change.doc.data() };
        
        if (change.type === 'added' || change.type === 'modified') {
          this.automations.set(change.doc.id, data);
        } else if (change.type === 'removed') {
          this.automations.delete(change.doc.id);
        }
      });
      
      // Trigger UI update
      this.notifyUpdate('automations');
    }));

    // Listen to executions changes
    const executionsQuery = query(
      collection(db, 'executions'),
      where('userId', '==', user.uid),
      orderBy('startTime', 'desc'),
      limit(20)
    );
    
    this.listeners.set('executions', onSnapshot(executionsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = { id: change.doc.id, ...change.doc.data() };
        
        if (change.type === 'added' || change.type === 'modified') {
          this.executions.set(change.doc.id, data);
        } else if (change.type === 'removed') {
          this.executions.delete(change.doc.id);
        }
      });
      
      // Trigger UI update
      this.notifyUpdate('executions');
    }));
  }

  // Create new automation
  async createAutomation(automationData) {
    const user = authManager.getCurrentUser();
    if (!user) {
      showNotification('Usuário não autenticado', 'error');
      return null;
    }

    try {
      const automation = {
        name: automationData.name,
        description: automationData.description || '',
        script: automationData.script || '',
        schedule: automationData.schedule || null,
        isActive: automationData.isActive !== false,
        userId: user.uid,
        createdAt: getTimestamp(),
        updatedAt: getTimestamp(),
        lastRun: null,
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0
      };

      const docRef = await addDoc(collection(db, 'automations'), automation);
      
      showNotification('Automação criada com sucesso!', 'success');
      
      // Log the creation
      await this.addLog({
        message: `Automação "${automation.name}" criada`,
        level: 'info',
        automationId: docRef.id
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating automation:', error);
      showNotification('Erro ao criar automação', 'error');
      return null;
    }
  }

  // Update automation
  async updateAutomation(automationId, updates) {
    try {
      const updateData = {
        ...updates,
        updatedAt: getTimestamp()
      };

      await updateDoc(doc(db, 'automations', automationId), updateData);
      
      showNotification('Automação atualizada com sucesso!', 'success');
      
      // Log the update
      await this.addLog({
        message: `Automação atualizada`,
        level: 'info',
        automationId: automationId
      });
      
      return true;
    } catch (error) {
      console.error('Error updating automation:', error);
      showNotification('Erro ao atualizar automação', 'error');
      return false;
    }
  }

  // Delete automation
  async deleteAutomation(automationId) {
    try {
      await deleteDoc(doc(db, 'automations', automationId));
      
      showNotification('Automação excluída com sucesso!', 'success');
      
      // Log the deletion
      await this.addLog({
        message: `Automação excluída`,
        level: 'warning',
        automationId: automationId
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting automation:', error);
      showNotification('Erro ao excluir automação', 'error');
      return false;
    }
  }

  // Execute automation manually
  async executeAutomation(automationId) {
    const automation = this.automations.get(automationId);
    if (!automation) {
      showNotification('Automação não encontrada', 'error');
      return null;
    }

    const user = authManager.getCurrentUser();
    if (!user) {
      showNotification('Usuário não autenticado', 'error');
      return null;
    }

    try {
      // Create execution record
      const execution = {
        automationId: automationId,
        userId: user.uid,
        status: 'running',
        startTime: getTimestamp(),
        endTime: null,
        logs: [],
        result: null,
        error: null
      };

      const executionRef = await addDoc(collection(db, 'executions'), execution);
      const executionId = executionRef.id;

      // Update automation last run
      await updateDoc(doc(db, 'automations', automationId), {
        lastRun: getTimestamp(),
        totalRuns: automation.totalRuns + 1
      });

      // Log execution start
      await this.addLog({
        message: `Execução iniciada para "${automation.name}"`,
        level: 'info',
        automationId: automationId,
        executionId: executionId
      });

      // Simulate automation execution
      await this.runAutomationScript(automation, executionId);

      return executionId;
    } catch (error) {
      console.error('Error executing automation:', error);
      showNotification('Erro ao executar automação', 'error');
      return null;
    }
  }

  // Run automation script (simulated for now)
  async runAutomationScript(automation, executionId) {
    try {
      // Simulate script execution time
      const executionTime = Math.random() * 3000 + 1000; // 1-4 seconds
      
      await new Promise(resolve => setTimeout(resolve, executionTime));
      
      // Simulate success/failure (90% success rate)
      const isSuccess = Math.random() > 0.1;
      
      const endTime = getTimestamp();
      const updateData = {
        status: isSuccess ? 'completed' : 'failed',
        endTime: endTime,
        result: isSuccess ? 'Execução concluída com sucesso' : null,
        error: isSuccess ? null : 'Erro simulado durante a execução'
      };

      // Update execution record
      await updateDoc(doc(db, 'executions', executionId), updateData);

      // Update automation stats
      const automation_doc = doc(db, 'automations', automation.id);
      if (isSuccess) {
        await updateDoc(automation_doc, {
          successfulRuns: automation.successfulRuns + 1
        });
      } else {
        await updateDoc(automation_doc, {
          failedRuns: automation.failedRuns + 1
        });
      }

      // Log execution completion
      await this.addLog({
        message: `Execução ${isSuccess ? 'concluída' : 'falhou'} para "${automation.name}"`,
        level: isSuccess ? 'info' : 'error',
        automationId: automation.id,
        executionId: executionId
      });

      showNotification(
        `Execução ${isSuccess ? 'concluída' : 'falhou'}: ${automation.name}`, 
        isSuccess ? 'success' : 'error'
      );

    } catch (error) {
      console.error('Error running automation script:', error);
      
      // Update execution as failed
      await updateDoc(doc(db, 'executions', executionId), {
        status: 'failed',
        endTime: getTimestamp(),
        error: error.message
      });

      // Log error
      await this.addLog({
        message: `Erro na execução de "${automation.name}": ${error.message}`,
        level: 'error',
        automationId: automation.id,
        executionId: executionId
      });
    }
  }

  // Add log entry
  async addLog(logData) {
    const user = authManager.getCurrentUser();
    if (!user) return;

    try {
      const log = {
        message: logData.message,
        level: logData.level || 'info',
        timestamp: getTimestamp(),
        automationId: logData.automationId || null,
        executionId: logData.executionId || null,
        userId: user.uid
      };

      await addDoc(collection(db, 'logs'), log);
      
      // Add to local logs for immediate UI update
      this.logs.unshift(log);
      
      // Keep only last 100 logs in memory
      if (this.logs.length > 100) {
        this.logs = this.logs.slice(0, 100);
      }
      
      this.notifyUpdate('logs');
    } catch (error) {
      console.error('Error adding log:', error);
    }
  }

  // Load logs
  async loadLogs(limit = 50) {
    const user = authManager.getCurrentUser();
    if (!user) return;

    try {
      const q = query(
        collection(db, 'logs'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );
      
      const snapshot = await getDocs(q);
      this.logs = [];
      
      snapshot.forEach(doc => {
        this.logs.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`Loaded ${this.logs.length} logs`);
      this.notifyUpdate('logs');
    } catch (error) {
      console.error('Error loading logs:', error);
      showNotification('Erro ao carregar logs', 'error');
    }
  }

  // Toggle automation active state
  async toggleAutomation(automationId) {
    const automation = this.automations.get(automationId);
    if (!automation) return false;

    return await this.updateAutomation(automationId, {
      isActive: !automation.isActive
    });
  }

  // Get automation by ID
  getAutomation(automationId) {
    return this.automations.get(automationId);
  }

  // Get all automations
  getAutomations() {
    return Array.from(this.automations.values());
  }

  // Get active automations
  getActiveAutomations() {
    return this.getAutomations().filter(automation => automation.isActive);
  }

  // Get executions for automation
  getExecutionsForAutomation(automationId) {
    return Array.from(this.executions.values())
      .filter(execution => execution.automationId === automationId);
  }

  // Get all executions
  getExecutions() {
    return Array.from(this.executions.values());
  }

  // Get recent logs
  getLogs() {
    return this.logs;
  }

  // Get statistics
  getStatistics() {
    const automations = this.getAutomations();
    const executions = this.getExecutions();
    
    const totalAutomations = automations.length;
    const activeAutomations = automations.filter(a => a.isActive).length;
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.status === 'completed').length;
    const failedExecutions = executions.filter(e => e.status === 'failed').length;
    const runningExecutions = executions.filter(e => e.status === 'running').length;
    
    const successRate = totalExecutions > 0 
      ? Math.round((successfulExecutions / totalExecutions) * 100) 
      : 0;

    return {
      totalAutomations,
      activeAutomations,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      runningExecutions,
      successRate
    };
  }

  // Update listeners
  updateListeners = new Set();

  // Add update listener
  onUpdate(callback) {
    this.updateListeners.add(callback);
  }

  // Remove update listener
  offUpdate(callback) {
    this.updateListeners.delete(callback);
  }

  // Notify update
  notifyUpdate(type) {
    this.updateListeners.forEach(callback => {
      try {
        callback(type);
      } catch (error) {
        console.error('Error in update callback:', error);
      }
    });
  }

  // Cleanup listeners
  cleanup() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    this.updateListeners.clear();
    this.isInitialized = false;
  }
}

// Create and export automation manager instance
export const automationManager = new AutomationManager();
export default automationManager;