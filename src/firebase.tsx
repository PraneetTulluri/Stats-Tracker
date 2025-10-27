// firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAgLu4qkgzo4WoAOkNDemlWWznEJGHz-wg",
  authDomain: "baseballstats-2897b.firebaseapp.com",
  databaseURL: "https://baseballstats-2897b-default-rtdb.firebaseio.com",
  projectId: "baseballstats-2897b",
  storageBucket: "baseballstats-2897b.firebasestorage.app",
  messagingSenderId: "256883657825",
  appId: "1:256883657825:web:c8dad986b69acc28786e20",
  measurementId: "G-90KW3VJ14B"
};

// 👇 Only initialize once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app); // analytics only works in the browser
}

const database = getDatabase(app);
export const auth = getAuth(app);

export default database;
export { app, analytics };
