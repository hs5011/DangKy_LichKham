// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

// Thay thế các giá trị bên dưới bằng config của bạn từ Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyAw0mfgwDP1WSsgf_dzZR2XpUt0zGWIU4I",
    authDomain: "ql-lichkham.firebaseapp.com",
    projectId: "ql-lichkham",
    storageBucket: "ql-lichkham.firebasestorage.app",
    messagingSenderId: "367560609699",
    appId: "1:367560609699:web:b4fbbb97918ec0ad4b9416",
    measurementId: "G-J10N16S6V0"
  };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app); 