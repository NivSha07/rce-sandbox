import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, getDocs, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const fc = {
    apiKey: "AIzaSyAbiBmoaLi-HsR78nQ8eatU6kEJI5n6rDk",
    authDomain: "rce-sandbox.firebaseapp.com",
    projectId: "rce-sandbox",
    storageBucket: "rce-sandbox.firebasestorage.app",
    messagingSenderId: "277533836136",
    appId: "1:277533836136:web:430da87e166b3ec83d4cdd"
};

const app = initializeApp(fc);
const au = getAuth(app);
const db = getFirestore(app);
const pr = new GoogleAuthProvider();

export { au, db, pr, signInWithPopup, onAuthStateChanged, signOut, doc, getDoc, getDocs, setDoc, collection };