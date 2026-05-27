// public/ui.js
import { au, db, doc, getDoc } from './firebase.js';

// --- THEME INITIALIZATION ---
const defaultTheme = { bg: "#0a0b10", panel: "#121628" };
let userTheme = JSON.parse(localStorage.getItem('rce_theme')) || defaultTheme;

document.documentElement.style.setProperty('--bg-color', userTheme.bg);
document.documentElement.style.setProperty('--panel-bg', userTheme.panel);

// --- COLOR SETTINGS MODAL ---
window.openColorSettings = function() {
    document.getElementById('bgColorInp').value = userTheme.bg;
    document.getElementById('panelBgColorInp').value = userTheme.panel;
    document.getElementById('colorMod').style.display = "flex";
};

window.closeColorSettings = function() {
    document.getElementById('colorMod').style.display = "none";
};

window.applyColorSettings = function() {
    let bg = document.getElementById('bgColorInp').value;
    let panel = document.getElementById('panelBgColorInp').value;
    userTheme = { bg: bg, panel: panel };
    localStorage.setItem('rce_theme', JSON.stringify(userTheme));
    
    document.documentElement.style.setProperty('--bg-color', bg);
    document.documentElement.style.setProperty('--panel-bg', panel);
    window.closeColorSettings();
};

window.resetColorSettings = function() {
    localStorage.removeItem('rce_theme');
    userTheme = { ...defaultTheme };
    document.documentElement.style.setProperty('--bg-color', userTheme.bg);
    document.documentElement.style.setProperty('--panel-bg', userTheme.panel);
    window.closeColorSettings();
};

// --- DROPDOWN MENU ---
window.toggleDrop = function(e) {
    if (e) e.stopPropagation(); 
    let d = document.getElementById('setDrop');
    d.style.display = (d.style.display === 'block') ? 'none' : 'block';
};

window.addEventListener('click', function() {
    let d = document.getElementById('setDrop');
    if (d && d.style.display === 'block') d.style.display = 'none';
});

// --- PROFILE MODAL ---
window.openProfile = async function() {
    document.getElementById('profileMod').style.display = "flex";
    if (au.currentUser) {
        document.getElementById('profName').innerText = au.currentUser.displayName || au.currentUser.email;
        document.getElementById('profImg').innerHTML = `<img src="${au.currentUser.photoURL}" style="width:36px; height:36px; border-radius:50%; vertical-align:middle;">`;
        
        try {
            let userDoc = await getDoc(doc(db, "users", au.currentUser.uid));
            if (userDoc.exists()) {
                let data = userDoc.data();
                let t = data.stats?.totalSubmissions || 0;
                let a = data.stats?.totalAccepted || 0;
                
                document.getElementById('statTotal').innerText = t;
                document.getElementById('statAcc').innerText = a;
                
                let rate = t === 0 ? 0 : Math.round((a / t) * 100);
                
                // Animate SVG circular progress ring
                let circle = document.getElementById('statCircle');
                if (circle) {
                    let circumference = 314.16;
                    let offset = circumference - (rate / 100) * circumference;
                    // Reset to empty first to ensure animation triggers on reopening
                    circle.style.strokeDashoffset = circumference;
                    setTimeout(() => {
                        circle.style.strokeDashoffset = offset;
                    }, 50);
                }

                // Micro-animation for text percentage counter climbing from 0%
                let text = document.getElementById('statRate');
                if (text) {
                    text.innerText = "0%";
                    if (rate > 0) {
                        let current = 0;
                        let duration = 1000; // 1 second total animation
                        let stepTime = Math.max(Math.floor(duration / rate), 12);
                        let timer = setInterval(() => {
                            current += 1;
                            text.innerText = current + "%";
                            if (current >= rate) {
                                text.innerText = rate + "%";
                                clearInterval(timer);
                            }
                        }, stepTime);
                    }
                }
            }
        } catch(e) { console.error("Error loading profile:", e); }
    } else {
        document.getElementById('profName').innerText = "Please log in first";
        document.getElementById('profImg').innerHTML = "🔒 ";
        
        // Reset progress bar on anonymous states
        let circle = document.getElementById('statCircle');
        if (circle) circle.style.strokeDashoffset = 314.16;
        document.getElementById('statRate').innerText = "0%";
    }
};

window.closeProfile = function() {
    document.getElementById('profileMod').style.display = "none";
};