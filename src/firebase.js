import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBtp5jEX-9j8aC2dZRPJVa4ueVvn0P_fGU",
  authDomain: "koda-task-bd-01.firebaseapp.com",
  projectId: "koda-task-bd-01",
  storageBucket: "koda-task-bd-01.firebasestorage.app",
  messagingSenderId: "766685440787",
  appId: "1:766685440787:web:aeca0818fe5e6ad2ad08e6",
  measurementId: "G-5H55HPKRF1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
