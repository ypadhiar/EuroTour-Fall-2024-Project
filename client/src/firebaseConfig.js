// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "",
    authDomain: "lab4-ypadhiar.firebaseapp.com",
    projectId: "lab4-ypadhiar",
    storageBucket: "lab4-ypadhiar.firebasestorage.app",
    messagingSenderId: "251144962576",
    appId: "1:251144962576:web:3211a1a017a18103b40095",
    measurementId: "G-SMCLX3GGLT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
