
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBNgp4ZKBq_sHjVC0OGwSidhzCOtoGYR4k",
  authDomain: "smart-health-dce40.firebaseapp.com",
  databaseURL: "https://smart-health-dce40-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-health-dce40",
  storageBucket: "smart-health-dce40.firebasestorage.app",
  messagingSenderId: "81529782106",
  appId: "1:81529782106:web:286029a5dc050cd0423d63",
  measurementId: "G-CSK81WMJEQ"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
