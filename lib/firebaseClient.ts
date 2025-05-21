import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCvBB71ndqe2mWnDBOjqyyrjv7vDzrmMUE",
  authDomain: "daplatform786.firebaseapp.com",
  projectId: "daplatform786",
  storageBucket: "daplatform786.firebasestorage.app",
  messagingSenderId: "580716298450",
  appId: "1:580716298450:web:a41b315bc0bf5cb4a2ed0b",
  measurementId: "G-8LG910HE8E"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const firestore = getFirestore(app);