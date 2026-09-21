// ==========================================
// FIREBASE — Configuración e inicialización
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBhfhusKZVL-CkRfUSOLh4W2vjQ_nENmLI",
  authDomain: "cuentas-cop.firebaseapp.com",
  projectId: "cuentas-cop",
  storageBucket: "cuentas-cop.firebasestorage.app",
  messagingSenderId: "1011727605611",
  appId: "1:1011727605611:web:1ad9eafe3807627907762e",
  measurementId: "G-N8NYK2CNZH"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);