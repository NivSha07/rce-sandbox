import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

window.lg = async () => { 
    try { 
        await signInWithPopup(au, pr); 
    } catch(e) {
        console.error("FIREBASE ERROR:", e);
        alert("Login failed: " + e.message);
    } 
};

window.lo = () => { signOut(au).then(()=>window.location.reload()); };

onAuthStateChanged(au, (u) => {
    let ub = document.getElementById('uBx');
    if(u) {
        ub.innerHTML = `<img src="${u.photoURL}" style="width:30px;height:30px;border-radius:50%;vertical-align:middle;"><span style="font-size:0.9rem;font-weight:bold;color:#e2e8f0;margin:0 10px;">${u.displayName || u.email}</span><button onclick="lo()" style="padding:6px 12px;font-size:0.8rem;background:#ef4444;border:none;border-radius:4px;color:white;cursor:pointer;">Logout</button>`;
    } else {
        if(ub) ub.innerHTML = `<button onclick="lg()" style="padding:8px 15px;font-size:0.9rem;background:#24292e;color:white;border:none;border-radius:4px;cursor:pointer;">Google Login</button>`;
    }
});

let showProblem = false;
let userBoilerplates = JSON.parse(localStorage.getItem('rce_bp')) || {};
const defaultTheme = { bg: "#1a1a1a", panel: "#282828" };
let userTheme = JSON.parse(localStorage.getItem('rce_theme')) || defaultTheme;

document.documentElement.style.setProperty('--bg-color', userTheme.bg);
document.documentElement.style.setProperty('--panel-bg', userTheme.panel);

const defaultCode = {
    cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello World!\\n\";\n    return 0;\n}",
    python: "print(\"Hello World!\")",
    java: "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello World!\");\n    }\n}"
};

const prb = [
    {
        desc: "<h3>A. Array Prefix Sums</h3><p>Output an array of size <code>n</code> where the <code>i-th</code> element is the sum of integers from 1 to i.</p>",
        code: {
            cpp: "#include<bits/stdc++.h>\nusing namespace std;\n#define ll long long\n#define pb push_back\n#define fast_io ios_base::sync_with_stdio(false);cin.tie(NULL);\nint main(){\n    fast_io;\n    int n; cin>>n;\n    ll s=0;\n    for(int i=1;i<=n;i++){\n        s+=i; cout<<s<<\" \";\n    }\n    return 0;\n}",
            python: "n = int(input())\ns = 0\nfor i in range(1, n+1):\n    s += i\n    print(s, end=\" \")",
            java: "import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        long s = 0;\n        for(int i=1; i<=n; i++) {\n            s += i;\n            System.out.print(s + \" \");\n        }\n    }\n}"
        },
        tests: [ { i: "5", e: "1 3 6 10 15" }, { i: "3", e: "1 3 6" }, { i: "1", e: "1" } ]
    },
    {
        desc: "<h3>B. Indicator Variables</h3><p>Calculate the total number of times a '1' is immediately followed by another '1'.</p>",
        code: {
            cpp: "#include<bits/stdc++.h>\nusing namespace std;\n#define ll long long\n#define pb push_back\n#define fast_io ios_base::sync_with_stdio(false);cin.tie(NULL);\nint main(){\n    fast_io;\n    int n; cin>>n;\n    vector<int> a(n);\n    for(int i=0;i<n;i++) cin>>a[i];\n    int c=0;\n    for(int i=0;i<n-1;i++){\n        if(a[i]==1 && a[i+1]==1) c++;\n    }\n    cout<<c<<\"\\n\";\n    return 0;\n}",
            python: "n = int(input())\narr = list(map(int, input().split()))\nc = 0\nfor i in range(n-1):\n    if arr[i] == 1 and arr[i+1] == 1:\n        c += 1\nprint(c)",
            java: "import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] a = new int[n];\n        for(int i=0; i<n; i++) a[i] = sc.nextInt();\n        int c = 0;\n        for(int i=0; i<n-1; i++) {\n            if(a[i]==1 && a[i+1]==1) c++;\n        }\n        System.out.println(c);\n    }\n}"
        },
        tests: [ { i: "5\n1 1 0 1 1", e: "2" }, { i: "4\n0 0 0 0", e: "0" }, { i: "3\n1 1 1", e: "2" } ]
    }
];

window.saveState = function() {
    if (!window.editor) return;
    let state = {
        p: document.getElementById('pSel').value,
        l: document.getElementById('lSel').value,
        t: document.getElementById('tSel').value,
        f: document.getElementById('fInp').value,
        c: window.editor.getValue(),
        m: showProblem
    };
    localStorage.setItem('rce_data', JSON.stringify(state));
};

window.initApp = function() {
    let saved = localStorage.getItem('rce_data');
    if (saved) {
        let s = JSON.parse(saved);
        document.getElementById('pSel').value = s.p;
        let langVal = s.l;
        if (langVal === 'javascript' || langVal === 'rust') langVal = 'cpp';
        document.getElementById('lSel').value = langVal;
        document.getElementById('tSel').value = s.t;
        document.getElementById('fInp').value = s.f;
        monaco.editor.setTheme(s.t);
        window.editor.updateOptions({ fontSize: parseInt(s.f) });
        let p = prb[s.p];
        document.getElementById('pDsc').innerHTML = p.desc;
        document.getElementById('stdInput').value = p.tests[0].i;
        document.getElementById('expectedOutput').value = p.tests[0].e;
        window.editor.setValue(s.c);
        monaco.editor.setModelLanguage(window.editor.getModel(), langVal);
    } else {
        let l = document.getElementById('lSel').value;
        window.editor.setValue(userBoilerplates[l] ? userBoilerplates[l] : defaultCode[l]);
        monaco.editor.setModelLanguage(window.editor.getModel(), l);
    }
};

window.toggleMode = function() {
    showProblem = !showProblem;
    let b = document.getElementById('mBtn');
    if (showProblem) { 
        document.body.classList.add('show-prob'); 
        b.innerText = "Mode: Problem Viewer"; 
        b.style.background = "#8b5cf6"; 
    } else { 
        document.body.classList.remove('show-prob'); 
        b.innerText = "Mode: Normal"; 
        b.style.background = "#2e344e"; 
    }
    window.saveState();
};

window.loadProblem = function() {
    let x = document.getElementById('pSel').value;
    let l = document.getElementById('lSel').value;
    let p = prb[x];
    document.getElementById('pDsc').innerHTML = p.desc;
    document.getElementById('stdInput').value = p.tests[0].i;
    document.getElementById('expectedOutput').value = p.tests[0].e;
    if (window.editor) {
        window.editor.setValue(p.code[l]);
        monaco.editor.setModelLanguage(window.editor.getModel(), l);
    }
    document.getElementById('consoleOutput').innerText = "Awaiting execution...";
    document.getElementById('statusBadge').innerText = "";
    window.saveState();
};

window.resetCode = function() {
    if (confirm("Wipe editor and reset code?")) {
        let l = document.getElementById('lSel').value;
        if (showProblem) {
            let x = document.getElementById('pSel').value;
            window.editor.setValue(userBoilerplates[l] ? userBoilerplates[l] : prb[x].code[l]);
        } else {
            window.editor.setValue(userBoilerplates[l] ? userBoilerplates[l] : defaultCode[l]);
        }
        window.saveState();
    }
};

window.changeLanguage = function() { 
    let l = document.getElementById('lSel').value;
    monaco.editor.setModelLanguage(window.editor.getModel(), l);
    if (showProblem) {
        window.loadProblem(); 
    } else {
        window.editor.setValue(userBoilerplates[l] ? userBoilerplates[l] : defaultCode[l]);
    }
    window.saveState();
};

window.changeTheme = function() { monaco.editor.setTheme(document.getElementById('tSel').value); window.saveState(); };
window.changeFont = function() { window.editor.updateOptions({ fontSize: parseInt(document.getElementById('fInp').value) }); window.saveState(); };
window.openSettings = function() { let l = document.getElementById('lSel').value; document.getElementById('bpText').value = userBoilerplates[l] || prb[0].code[l]; document.getElementById('setMod').style.display = "flex"; };
window.closeSettings = function() { document.getElementById('setMod').style.display = "none"; };
window.saveSettings = function() { let l = document.getElementById('lSel').value; userBoilerplates[l] = document.getElementById('bpText').value; localStorage.setItem('rce_bp', JSON.stringify(userBoilerplates)); window.closeSettings(); };

window.runCode = async function() {
    let s = window.editor.getValue();
    let l = document.getElementById('lSel').value;
    let o = document.getElementById('consoleOutput');
    let b = document.getElementById('statusBadge');
    
    o.innerText = "Running...";
    b.innerText = "";
    
    if (!showProblem) {
        let i = document.getElementById('stdInput').value;
        try {
            let r = await fetch('http://localhost:3000/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: s, inputs: [i], language: l })
            });
            let d = await r.json();
            if (d.error) { o.innerText = d.error; b.innerText = "Server Error"; b.style.color = "#ef4444"; return; }
            let res = d.results[0];
            if (res.error) {
                o.innerText = res.output; b.innerText = `⚠️ Error`; b.style.color = "#ef4444";
            } else {
                o.innerText = res.output; b.innerText = `⚡ ${res.time}ms`; b.style.color = "#a6accd";
            }
        } catch (e) { o.innerText = "Server offline."; }
    } else {
        let p = prb[document.getElementById('pSel').value];
        let ins = p.tests.map(tc => tc.i);
        try {
            let r = await fetch('http://localhost:3000/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: s, inputs: ins, language: l })
            });
            let d = await r.json();
            let h = "<table style='width:100%; text-align:left; border-collapse:collapse;'><tr><th style='border-bottom:1px solid #2e344e; padding:5px;'>Test</th><th style='border-bottom:1px solid #2e344e; padding:5px;'>Status</th><th style='border-bottom:1px solid #2e344e; padding:5px;'>Time</th></tr>";
            let allPassed = true;
            for (let j = 0; j < p.tests.length; j++) {
                let tc = p.tests[j];
                let res = d.results[j];
                if (!res || res.error) {
                    allPassed = false;
                    h += `<tr><td style='padding:5px;'>Case ${j+1}</td><td style='padding:5px;'><span style='color:#ef4444;'>⚠️ Error</span></td><td style='padding:5px;'>-</td></tr>`;
                } else {
                    let normalize = (str) => (str || "").trim().split(/\s+/).join(" ");
                    let pass = (normalize(res.output) === normalize(tc.e));
                    if (!pass) allPassed = false;
                    let st = pass ? "<span style='color:#22c55e;'>✅ Passed</span>" : "<span style='color:#ef4444;'>❌ Failed</span>";
                    h += `<tr><td style='padding:5px;'>Case ${j+1}</td><td style='padding:5px;'>${st}</td><td style='padding:5px;'>${res.time}ms</td></tr>`;
                }
            }
            h += "</table>";
            if (d.results[0] && d.results[0].error) {
                h += `<div style="margin-top:15px; color:#ef4444; font-family:monospace; white-space:pre-wrap;">${d.results[0].output}</div>`;
            }
            o.innerHTML = h;
            b.innerText = allPassed ? "🏆 All Tests Passed" : "❌ Tests Failed";
            b.style.color = allPassed ? "#22c55e" : "#ef4444";
            
            if (allPassed) {
                let maxTime = Math.max(...d.results.map(r => parseInt(r.time) || 0));
                window.saveRun(p.desc.split("</h3>")[0].replace("<h3>", ""), s, l, maxTime);
            }
        } catch (e) { o.innerText = "Server offline."; }
    }
};

window.saveRun = async (problemName, code, lang, timeMs) => {
    if (!au.currentUser) return; 
    
    try {
        await addDoc(collection(db, "submissions"), {
            uid: au.currentUser.uid,
            username: au.currentUser.displayName || au.currentUser.email,
            problem: problemName,
            language: lang,
            code: code,
            time: timeMs,
            timestamp: Date.now()
        });
        console.log("✅ Success logged to Firestore!");
    } catch (e) {
        console.error("Database save failed:", e);
    }
};

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
    // Delete the saved custom colors from memory
    localStorage.removeItem('rce_theme');
    
    // Snap back to the LeetCode defaults
    userTheme = { ...defaultTheme };
    document.documentElement.style.setProperty('--bg-color', userTheme.bg);
    document.documentElement.style.setProperty('--panel-bg', userTheme.panel);
    
    window.closeColorSettings();
};
// Toggle the dropdown visibility
window.toggleDrop = function(e) {
    if (e) e.stopPropagation(); // Prevent the click from instantly closing it
    let d = document.getElementById('setDrop');
    d.style.display = (d.style.display === 'block') ? 'none' : 'block';
};

// Close dropdown if the user clicks anywhere else on the screen
window.addEventListener('click', function() {
    let d = document.getElementById('setDrop');
    if (d && d.style.display === 'block') {
        d.style.display = 'none';
    }
});

setInterval(async () => {
    try {
        let r = await fetch('http://localhost:3000/poll-problem');
        let d = await r.json();
        if (d) {
            prb.push({
                desc: `<h3>${d.name}</h3><p><a href="${d.url}" target="_blank" style="color:var(--accent); text-decoration:none;">View Original Problem ↗</a><br><br>Time Limit: ${d.timeLimit}ms</p>`,
                code: prb[0].code, 
                tests: d.tests
            });
            let sel = document.getElementById('pSel');
            let opt = document.createElement('option');
            opt.value = prb.length - 1;
            opt.text = `⚡ ${d.name}`;
            sel.appendChild(opt);
            sel.value = prb.length - 1;
            if (!showProblem) window.toggleMode();
            window.loadProblem();
        }
    } catch (e) {} 
}, 1000);