// public/api.js
import { au } from './firebase.js';

// 1. Send code to your local judge.exe
export const executeCode = async (code, inputs, language) => {
    try {
        let r = await fetch('http://localhost:3000/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, inputs, language })
        });
        return await r.json();
    } catch (e) {
        return { error: "Server offline." };
    }
};

// 2. Securely save stats to your backend
export const sendStats = async (problemId, problemName, lang, timeMs, statusStr, isAccepted, code) => {
    if (!au.currentUser) return; 
    try {
        let tk = await au.currentUser.getIdToken();
        await fetch('http://localhost:3000/save-stat', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tk}` 
            },
            body: JSON.stringify({ problemId, problem: problemName, language: lang, time: timeMs, status: statusStr, isAccepted, code })
        });
    } catch (e) {
        console.error("Failed to send stats:", e);
    }
};

// --- NEW: Fetch problem statistics and personal submissions ---
export const fetchProblemStats = async (problemName) => {
    let headers = {};
    if (au.currentUser) {
        try {
            let tk = await au.currentUser.getIdToken();
            headers['Authorization'] = `Bearer ${tk}`;
        } catch (e) {
            console.error("Failed to get ID Token for stats request:", e);
        }
    }
    
    try {
        let r = await fetch(`http://localhost:3000/problem-stats/${encodeURIComponent(problemName)}`, {
            headers: headers
        });
        return await r.json();
    } catch (e) {
        console.error("Failed to fetch problem stats:", e);
        return null;
    }
};

// --- Fetch global leaderboard data ---
export const fetchLeaderboard = async () => {
    try {
        let r = await fetch('http://localhost:3000/leaderboard');
        return await r.json();
    } catch (e) {
        console.error("Failed to fetch leaderboard:", e);
        return null;
    }
};

// 3. Check for new Codeforces problems
export const pollCompanion = async () => {
    try {
        let r = await fetch('http://localhost:3000/poll-problem');
        return await r.json();
    } catch (e) {
        return null;
    }
};