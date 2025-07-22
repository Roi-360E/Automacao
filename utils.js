// Utility Functions
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Notification system
export function showNotification(message, type = 'info', duration = 4000) {
  // Remove existing notification
  const existingToast = document.getElementById('notification-toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create new notification
  const toast = document.createElement('div');
  toast.id = 'notification-toast';
  toast.className = `fixed bottom-5 right-5 px-6 py-3 rounded-lg text-white font-semibold shadow-lg transition-all duration-300 z-50`;
  
  // Set background color based on type
  switch (type) {
    case 'success':
      toast.classList.add('bg-green-500');
      break;
    case 'error':
      toast.classList.add('bg-red-500');
      break;
    case 'warning':
      toast.classList.add('bg-yellow-500');
      break;
    default:
      toast.classList.add('bg-indigo-500');
  }
  
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Auto remove
  setTimeout(() => {
    toast.remove();
  }, duration);
}

// Format date to Brazilian format
export function formatDate(date) {
  if (!date) return '-';
  
  if (date.toDate) {
    date = date.toDate();
  } else if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Format date to relative time (e.g., "2 hours ago")
export function formatRelativeTime(date) {
  if (!date) return '-';
  
  if (date.toDate) {
    date = date.toDate();
  } else if (typeof date === 'string') {
    date = new Date(date);
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Agora mesmo';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min atrás`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h atrás`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d atrás`;
  }
}

// Validate email format
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
export function validatePassword(password) {
  const minLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  
  return {
    isValid: minLength && hasNumber && hasLetter,
    minLength,
    hasNumber,
    hasLetter
  };
}

// Generate unique ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Deep clone object
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// Format file size
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get execution status color
export function getStatusColor(status) {
  switch (status) {
    case 'running':
      return 'text-blue-500';
    case 'completed':
      return 'text-green-500';
    case 'failed':
      return 'text-red-500';
    case 'pending':
      return 'text-yellow-500';
    default:
      return 'text-gray-500';
  }
}

// Get execution status icon
export function getStatusIcon(status) {
  switch (status) {
    case 'running':
      return '⏳';
    case 'completed':
      return '✅';
    case 'failed':
      return '❌';
    case 'pending':
      return '⏸️';
    default:
      return '❓';
  }
}

// Parse schedule expression to human readable
export function parseSchedule(schedule) {
  if (!schedule) return 'Manual';
  
  // Basic cron-like parsing
  const parts = schedule.split(' ');
  if (parts.length !== 5) return schedule;
  
  const [minute, hour, day, month, weekday] = parts;
  
  if (minute === '0' && hour === '9' && day === '*' && month === '*' && weekday === '*') {
    return 'Diariamente às 9:00';
  } else if (minute === '0' && hour === '9' && day === '*' && month === '*' && weekday === '1') {
    return 'Semanalmente (Segunda-feira às 9:00)';
  } else if (minute === '0' && hour === '9' && day === '1' && month === '*' && weekday === '*') {
    return 'Mensalmente (Dia 1 às 9:00)';
  }
  
  return schedule;
}

// Sanitize HTML to prevent XSS
export function sanitizeHtml(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

// Copy text to clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showNotification('Copiado para a área de transferência!', 'success');
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    showNotification('Falha ao copiar texto', 'error');
    return false;
  }
}

// Download data as JSON file
export function downloadJson(data, filename = 'data.json') {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(link.href);
}

// Get Firebase timestamp
export function getTimestamp() {
  return serverTimestamp();
}

// Convert Firebase timestamp to Date
export function timestampToDate(timestamp) {
  if (!timestamp) return null;
  
  if (timestamp.toDate) {
    return timestamp.toDate();
  }
  
  return new Date(timestamp);
}

// Check if element is in viewport
export function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Smooth scroll to element
export function scrollToElement(element, offset = 0) {
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth"
  });
}

// Local storage utilities
export const storage = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// Session storage utilities
export const sessionStorage = {
  set(key, value) {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
    }
  },
  
  get(key, defaultValue = null) {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return defaultValue;
    }
  },
  
  remove(key) {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
    }
  },
  
  clear() {
    try {
      window.sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
    }
  }
};

// URL utilities
export const url = {
  getParams() {
    return new URLSearchParams(window.location.search);
  },
  
  getParam(name, defaultValue = null) {
    return this.getParams().get(name) || defaultValue;
  },
  
  setParam(name, value) {
    const params = this.getParams();
    params.set(name, value);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  },
  
  removeParam(name) {
    const params = this.getParams();
    params.delete(name);
    const newUrl = params.toString() ? 
      `${window.location.pathname}?${params.toString()}` : 
      window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }
};

// Keyboard shortcuts
export function registerKeyboardShortcut(key, callback, ctrlKey = false, altKey = false, shiftKey = false) {
  document.addEventListener('keydown', (event) => {
    if (
      event.key.toLowerCase() === key.toLowerCase() &&
      event.ctrlKey === ctrlKey &&
      event.altKey === altKey &&
      event.shiftKey === shiftKey
    ) {
      event.preventDefault();
      callback(event);
    }
  });
}

export default {
  showNotification,
  formatDate,
  formatRelativeTime,
  validateEmail,
  validatePassword,
  generateId,
  deepClone,
  debounce,
  throttle,
  formatFileSize,
  getStatusColor,
  getStatusIcon,
  parseSchedule,
  sanitizeHtml,
  copyToClipboard,
  downloadJson,
  getTimestamp,
  timestampToDate,
  isInViewport,
  scrollToElement,
  storage,
  sessionStorage,
  url,
  registerKeyboardShortcut
};