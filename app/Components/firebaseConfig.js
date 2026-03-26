import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBkKqLU5RMlj4RXCynBjI5w1U2Gz8I6m3Q",
  authDomain: "insighthire-1d957.firebaseapp.com",
  databaseURL: "https://insighthire-1d957-default-rtdb.firebaseio.com",
  projectId: "insighthire-1d957",
  storageBucket: "insighthire-1d957.firebasestorage.app",
  messagingSenderId: "1005597748452",
  appId: "1:1005597748452:web:7d1c2739df8ebdf71e10f1",
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
