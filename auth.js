// Authentication System
import { auth, db } from './firebase-config.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { showNotification } from './utils.js';

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.authStateCallbacks = [];
    this.initAuthStateListener();
  }

  // Initialize authentication state listener
  initAuthStateListener() {
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      
      if (user) {
        // User is signed in
        await this.loadUserProfile(user.uid);
        this.showDashboard();
      } else {
        // User is signed out
        this.showAuthModal();
      }
      
      // Call registered callbacks
      this.authStateCallbacks.forEach(callback => callback(user));
    });
  }

  // Register callback for auth state changes
  onAuthStateChange(callback) {
    this.authStateCallbacks.push(callback);
  }

  // Load user profile from Firestore
  async loadUserProfile(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        this.currentUser.profile = userDoc.data();
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      showNotification('Login realizado com sucesso!', 'success');
      return result.user;
    } catch (error) {
      console.error('Sign in error:', error);
      let message = 'Erro ao fazer login';
      
      switch (error.code) {
        case 'auth/user-not-found':
          message = 'Usuário não encontrado';
          break;
        case 'auth/wrong-password':
          message = 'Senha incorreta';
          break;
        case 'auth/invalid-email':
          message = 'Email inválido';
          break;
        case 'auth/too-many-requests':
          message = 'Muitas tentativas. Tente novamente mais tarde';
          break;
      }
      
      showNotification(message, 'error');
      throw error;
    }
  }

  // Register new user
  async register(email, password, name) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile
      await updateProfile(result.user, { displayName: name });
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        email: email,
        name: name,
        createdAt: serverTimestamp(),
        settings: {
          theme: 'dark',
          notifications: true,
          language: 'pt-BR'
        }
      });
      
      showNotification('Conta criada com sucesso!', 'success');
      return result.user;
    } catch (error) {
      console.error('Registration error:', error);
      let message = 'Erro ao criar conta';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'Email já está em uso';
          break;
        case 'auth/weak-password':
          message = 'Senha muito fraca';
          break;
        case 'auth/invalid-email':
          message = 'Email inválido';
          break;
      }
      
      showNotification(message, 'error');
      throw error;
    }
  }

  // Sign out user
  async signOutUser() {
    try {
      await signOut(auth);
      showNotification('Logout realizado com sucesso!', 'success');
    } catch (error) {
      console.error('Sign out error:', error);
      showNotification('Erro ao fazer logout', 'error');
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      showNotification('Email de recuperação enviado!', 'success');
    } catch (error) {
      console.error('Password reset error:', error);
      let message = 'Erro ao enviar email de recuperação';
      
      if (error.code === 'auth/user-not-found') {
        message = 'Usuário não encontrado';
      }
      
      showNotification(message, 'error');
      throw error;
    }
  }

  // Show authentication modal
  showAuthModal() {
    const existingModal = document.getElementById('auth-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-gray-900 p-8 rounded-lg max-w-md w-full mx-4">
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-white mb-2">ROI-360 Automação</h2>
          <p class="text-gray-400">Faça login para acessar o dashboard</p>
        </div>
        
        <div class="flex border-b border-gray-700 mb-6">
          <button id="login-tab" class="flex-1 py-2 text-center border-b-2 border-indigo-500 text-indigo-400">Login</button>
          <button id="register-tab" class="flex-1 py-2 text-center border-b-2 border-transparent text-gray-400">Registrar</button>
        </div>
        
        <form id="auth-form">
          <div id="login-form">
            <div class="mb-4">
              <label class="block text-gray-300 text-sm font-bold mb-2">Email</label>
              <input type="email" id="login-email" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" required>
            </div>
            <div class="mb-6">
              <label class="block text-gray-300 text-sm font-bold mb-2">Senha</label>
              <input type="password" id="login-password" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" required>
            </div>
            <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
              Entrar
            </button>
            <button type="button" id="forgot-password" class="w-full mt-2 text-indigo-400 hover:text-indigo-300 text-sm">
              Esqueci minha senha
            </button>
          </div>
          
          <div id="register-form" class="hidden">
            <div class="mb-4">
              <label class="block text-gray-300 text-sm font-bold mb-2">Nome</label>
              <input type="text" id="register-name" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
            </div>
            <div class="mb-4">
              <label class="block text-gray-300 text-sm font-bold mb-2">Email</label>
              <input type="email" id="register-email" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
            </div>
            <div class="mb-6">
              <label class="block text-gray-300 text-sm font-bold mb-2">Senha</label>
              <input type="password" id="register-password" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" minlength="6">
            </div>
            <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">
              Criar Conta
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    this.setupAuthModalEvents();
  }

  // Setup authentication modal events
  setupAuthModalEvents() {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authForm = document.getElementById('auth-form');
    const forgotPasswordBtn = document.getElementById('forgot-password');

    let isLoginMode = true;

    loginTab.addEventListener('click', () => {
      isLoginMode = true;
      loginTab.className = 'flex-1 py-2 text-center border-b-2 border-indigo-500 text-indigo-400';
      registerTab.className = 'flex-1 py-2 text-center border-b-2 border-transparent text-gray-400';
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    });

    registerTab.addEventListener('click', () => {
      isLoginMode = false;
      registerTab.className = 'flex-1 py-2 text-center border-b-2 border-indigo-500 text-indigo-400';
      loginTab.className = 'flex-1 py-2 text-center border-b-2 border-transparent text-gray-400';
      registerForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
    });

    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        if (isLoginMode) {
          const email = document.getElementById('login-email').value;
          const password = document.getElementById('login-password').value;
          await this.signIn(email, password);
        } else {
          const name = document.getElementById('register-name').value;
          const email = document.getElementById('register-email').value;
          const password = document.getElementById('register-password').value;
          await this.register(email, password, name);
        }
      } catch (error) {
        // Error handled in signIn/register methods
      }
    });

    forgotPasswordBtn.addEventListener('click', async () => {
      const email = document.getElementById('login-email').value;
      if (!email) {
        showNotification('Digite seu email primeiro', 'error');
        return;
      }
      
      try {
        await this.resetPassword(email);
      } catch (error) {
        // Error handled in resetPassword method
      }
    });
  }

  // Show dashboard
  showDashboard() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.remove();
    }
    
    // Show dashboard content
    const dashboardElement = document.getElementById('dashboard');
    if (dashboardElement) {
      dashboardElement.classList.remove('hidden');
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }
}

// Create and export auth manager instance
export const authManager = new AuthManager();
export default authManager;