// Firebase Configuration and Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";

// Firebase configuration from problem statement
const firebaseConfig = {
  apiKey: "AIzaSyAZmxW3HBCmvXeUR8cmszIWXmUM-2-9ueo",
  authDomain: "contrato-839eb.firebaseapp.com",
  projectId: "contrato-839eb",
  storageBucket: "contrato-839eb.firebasestorage.app",
  messagingSenderId: "257509711471",
  appId: "1:257509711471:web:bcd069639d845fd88db79a",
  measurementId: "G-YGDLSEV3H4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// Export the app instance
export default app;

// Configuration for development/production
export const config = {
  app: {
    name: "ROI-360 Automacao",
    version: "1.0.0",
    environment: window.location.hostname === 'localhost' ? 'development' : 'production'
  },
  features: {
    analytics: true,
    notifications: true,
    realTimeUpdates: true
  }
};

console.log(`Firebase initialized for ${config.app.name} v${config.app.version} (${config.app.environment})`);