import { au, db, pr, signInWithPopup, onAuthStateChanged, signOut, doc, getDoc, getDocs, setDoc, collection } from './firebase.js';
import { executeCode, sendStats, pollCompanion } from './api.js';
import './ui.js';
import { defaultCode, userBoilerplates } from './editor.js';

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

// This array starts empty and fills up from the database
let prb = [];

// Hardcoded defaults to seed the database the very first time
const defaultPrb = [
    {
        id: "A_Array_Prefix_Sums",
        difficulty: "Easy",
        desc: "<h3>A. Array Prefix Sums</h3><p>Output an array of size <code>n</code> where the <code>i-th</code> element is the sum of integers from 1 to i.</p>",
        code: {
            cpp: "#include<bits/stdc++.h>\nusing namespace std;\nint main(){\n    int n; cin>>n;\n    long long s=0;\n    for(int i=1;i<=n;i++){ s+=i; cout<<s<<\" \"; }\n    return 0;\n}",
            python: "n = int(input())\ns = 0\nfor i in range(1, n+1):\n    s += i\n    print(s, end=\" \")",
            java: "import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        long s = 0;\n        for(int i=1; i<=n; i++) {\n            s += i;\n            System.out.print(s + \" \");\n        }\n    }\n}"
        },
        tests: [ { i: "5", e: "1 3 6 10 15" }, { i: "3", e: "1 3 6" }, { i: "1", e: "1" } ],
        hiddenTests: [ { i: "7", e: "1 3 6 10 15 21 28" }, { i: "10", e: "1 3 6 10 15 21 28 36 45 55" } ]
    }
];

window.loadDatabaseProblems = async () => {
    try {
        let snap = await getDocs(collection(db, "problems"));
        
        // If the database is completely empty, seed it with our default problem!
        if (snap.empty) {
            console.log("Seeding initial database...");
            for (let p of defaultPrb) {
                await setDoc(doc(db, "problems", p.id), p);
            }
            snap = await getDocs(collection(db, "problems")); // Re-fetch
        }

        prb = [];
        let sel = document.getElementById('pSel');
        sel.innerHTML = ""; // Clear existing dropdown

        // CHANGED: 'document' to 'docSnap' to protect the global HTML object
        snap.forEach(docSnap => {
            let pData = docSnap.data();
            prb.push(pData);
            
            // Build the dropdown dynamically
            let opt = document.createElement('option');
            opt.value = prb.length - 1;
            let titleMatch = pData.desc.match(/<h3>(.*?)<\/h3>/);
            opt.text = titleMatch ? titleMatch[1] : `Problem ${prb.length}`;
            sel.appendChild(opt);
        });

        // Load the first problem onto the screen
        if (window.editor) window.loadProblem();
        
    } catch(e) { console.error("Error loading problems from DB:", e); }
};

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
    
    // Ensure inputs are completely clear on a fresh boot (Normal Mode)
    document.getElementById('stdInput').value = "";
    document.getElementById('expectedOutput').value = "";

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
        window.editor.setValue(s.c);
        monaco.editor.setModelLanguage(window.editor.getModel(), langVal);
    } else {
        let l = document.getElementById('lSel').value;
        window.editor.setValue(userBoilerplates[l] ? userBoilerplates[l] : defaultCode[l]);
        monaco.editor.setModelLanguage(window.editor.getModel(), l);
    }
    window.loadDatabaseProblems();
};
window.toggleMode = function() {
    showProblem = !showProblem;
    let b = document.getElementById('mBtn');
    let subBtn = document.getElementById('submitBtn');
    
    if (showProblem) { 
        document.body.classList.add('show-prob'); 
        b.innerText = "Mode: Problem Viewer"; 
        b.style.background = "#8b5cf6"; 

        window.loadProblem(); 
    } else { 
        document.body.classList.remove('show-prob'); 
        b.innerText = "Mode: Normal"; 
        b.style.background = "#2e344e"; 
        if (subBtn) subBtn.style.display = "none"; 
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
    

    let subBtn = document.getElementById('submitBtn');
    if (subBtn) {
        if (showProblem && !p.isCF) {
            subBtn.style.display = "block";
        } else {
            subBtn.style.display = "none";
        }
    }
    
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

window.runCode = async function(isSubmit = false) {
    let s = window.editor.getValue();
    let l = document.getElementById('lSel').value;
    let o = document.getElementById('consoleOutput');
    let b = document.getElementById('statusBadge');
    
    o.innerText = isSubmit ? "Submitting..." : "Running...";
    b.innerText = "";
    
    if (!showProblem) {
        // --- NORMAL MODE ---
        let i = document.getElementById('stdInput').value;
        let d = await executeCode(s, [i], l); // <--- USING API.JS HERE
        
        if (d.error) { o.innerText = d.error; b.innerText = "Server Error"; b.style.color = "#ef4444"; return; }
        let res = d.results[0];
        if (res.error) {
            o.innerText = res.output; b.innerText = `⚠️ Error`; b.style.color = "#ef4444";
        } else {
            o.innerText = res.output; b.innerText = `⚡ ${res.time}ms`; b.style.color = "#a6accd";
        }
    } else {
        // --- PROBLEM MODE ---
        let p = prb[document.getElementById('pSel').value];
        let activeTests = (isSubmit && p.hiddenTests) ? [...p.tests, ...p.hiddenTests] : [...p.tests];
        let ins = activeTests.map(tc => tc.i);
        
        let d = await executeCode(s, ins, l); // <--- USING API.JS HERE
        
        let h = "<table class='test-table'><tr><th>Test</th><th>Status</th><th>Time</th></tr>";
        
        let allPassed = true;
        let visibleFailed = false;
        let hiddenFailed = false;

        for (let j = 0; j < activeTests.length; j++) {
            let tc = activeTests[j];
            let res = d.results[j];
            let isHidden = j >= p.tests.length; 

            let pass = false;
            if (res && !res.error) {
                let normalize = (str) => (str || "").trim().split(/\s+/).join(" ");
                pass = (normalize(res.output) === normalize(tc.e));
            }

            if (!pass) {
                allPassed = false;
                if (isHidden) hiddenFailed = true;
                else visibleFailed = true;
            }

            if (!isHidden) {
                if (!res || res.error) {
                    h += `<tr><td>Case ${j+1}</td><td><span style='color:var(--danger); font-weight:600; display:inline-flex; align-items:center; gap:4px;'>⚠️ Error</span></td><td>-</td></tr>`;
                } else {
                    let st = pass ? "<span style='color:var(--success); font-weight:600; display:inline-flex; align-items:center; gap:4px;'>✅ Passed</span>" : "<span style='color:var(--danger); font-weight:600; display:inline-flex; align-items:center; gap:4px;'>❌ Failed</span>";
                    h += `<tr><td>Case ${j+1}</td><td>${st}</td><td>${res.time}ms</td></tr>`;
                }
            }
        }
        h += "</table>";
        
        if (d.results[0] && d.results[0].error) {
            h += `<div style="margin-top:15px; color:var(--danger); font-family:var(--font-mono); white-space:pre-wrap;">${d.results[0].output}</div>`;
        }
        o.innerHTML = h;
        
        if (isSubmit) {
            let maxTime = Math.max(...d.results.map(r => parseInt(r.time) || 0));
            let statusMsg = "";

            if (allPassed) {
                b.innerText = "🌟 Accepted"; b.style.color = "#22c55e"; statusMsg = "Accepted";
            } else if (visibleFailed) {
                b.innerText = "❌ Wrong Answer"; b.style.color = "#ef4444"; statusMsg = "Wrong Answer";
            } else if (hiddenFailed) {
                b.innerText = "🔒 Failed Hidden Test"; b.style.color = "#f59e0b"; statusMsg = "Failed Hidden Test";
            }

            window.saveSubmission(p.desc.split("</h3>")[0].replace("<h3>", ""), l, maxTime, statusMsg, allPassed);
        } else {
            b.innerText = allPassed ? "🏆 All Tests Passed" : "❌ Tests Failed";
            b.style.color = allPassed ? "#22c55e" : "#ef4444";
        }
    }
};

window.saveSubmission = async (problemName, lang, timeMs, statusStr, isAccepted) => {
    await sendStats(problemName, lang, timeMs, statusStr, isAccepted);
};

window.openLibrary = function() {
    let tbody = document.getElementById('libBody');
    let html = "";
    
    for (let i = 0; i < prb.length; i++) {
        let p = prb[i];
        
        // Extract the title from the h3 tag in the description
        let titleMatch = p.desc.match(/<h3>(.*?)<\/h3>/);
        let title = titleMatch ? titleMatch[1] : `Problem ${i + 1}`;
        
        // Determine difficulty badge class
        let diff = p.difficulty || "Unknown";
        let diffClass = "easy"; 
        if (diff === "Medium") diffClass = "medium";
        if (diff === "Hard") diffClass = "hard";
        if (diff === "External") diffClass = "external";

        // Premium table row matching our new stylesheet
        html += `
            <tr>
                <td style="color:var(--text-muted);">—</td>
                <td style="font-weight:700; color:var(--text-main);">${title}</td>
                <td><span class="diff-badge ${diffClass}">${diff}</span></td>
                <td style="text-align:right;">
                    <button onclick="selectProblemFromLib(${i})" style="padding:6px 14px; font-size:0.8rem; border-radius:6px;">Solve</button>
                </td>
            </tr>
        `;
    }
    
    tbody.innerHTML = html;
    document.getElementById('probLib').style.display = 'block';
};

window.closeLibrary = function() {
    document.getElementById('probLib').style.display = 'none';
};

window.selectProblemFromLib = function(index) {
    // 1. Close the library overlay
    closeLibrary();
    
    // 2. Update the hidden dropdown menu
    document.getElementById('pSel').value = index;
    
    // 3. Force the app into Problem Viewer Mode if it isn't already
    if (!showProblem) {
        window.toggleMode(); 
    } else {
        // If already in problem mode, just load the new data
        window.loadProblem();
    }
};

setInterval(async () => {
        let d=await pollCompanion();
        if (d) {
            let formattedName = d.name.replace(/^[A-Z]\d*\.\s*/, "Q. ");
            let safeId = formattedName.replace(/[^a-zA-Z0-9]/g, "_");

            // --- THE FIX: Check if we already have this problem loaded ---
            let existingIndex = prb.findIndex(p => p.id === safeId);

            if (existingIndex !== -1) {
                // It exists! Just select it in the dropdown instead of duplicating
                document.getElementById('pSel').value = existingIndex;
            } else {
                // It's a brand new problem
                let newProb = {
                    id: safeId,
                    difficulty: "External",
                    desc: `<h3>${formattedName}</h3><p><a href="${d.url}" target="_blank" style="color:var(--accent); text-decoration:none;">View Original Problem ↗</a><br><br>Time Limit: ${d.timeLimit}ms</p>`,
                    code: prb[0]?.code || defaultPrb[0].code,
                    tests: d.tests,
                    isCF: true
                };

                // 1. Save it permanently to Firestore
                await setDoc(doc(db, "problems", safeId), newProb);
                
                // 2. Add it to our local array instantly
                prb.push(newProb);
                
                // 3. Create the new dropdown option
                let sel = document.getElementById('pSel');
                let opt = document.createElement('option');
                let newIndex = prb.length - 1;
                opt.value = newIndex;
                opt.text = `⚡ ${formattedName}`;
                sel.appendChild(opt);
                
                // Select the newly added problem
                sel.value = newIndex;
            }
            
            // Switch to problem mode and load whichever index was selected
            if (!showProblem) window.toggleMode();
            window.loadProblem();
    }
}, 1000);