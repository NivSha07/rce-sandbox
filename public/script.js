import { au, db, pr, signInWithPopup, onAuthStateChanged, signOut, doc, getDoc, getDocs, setDoc, collection } from './firebase.js';
import { executeCode, sendStats, pollCompanion, fetchProblemStats, fetchLeaderboard } from './api.js';
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

onAuthStateChanged(au, async (u) => {
    let ub = document.getElementById('uBx');
    if(u) {
        ub.innerHTML = `<img src="${u.photoURL}" style="width:30px;height:30px;border-radius:50%;vertical-align:middle;"><span style="font-size:0.9rem;font-weight:bold;color:#e2e8f0;margin:0 10px;">${u.displayName || u.email}</span><button onclick="lo()" style="padding:6px 12px;font-size:0.8rem;background:#ef4444;border:none;border-radius:4px;color:white;cursor:pointer;">Logout</button>`;
        
        // Fetch user document from Firestore to verify admin permissions and sync profile
        try {
            let userRef = doc(db, "users", u.uid);
            let uDoc = await getDoc(userRef);
            
            let displayNameVal = u.displayName || u.email.split('@')[0];
            let photoURLVal = u.photoURL || '';
            
            if (uDoc.exists()) {
                let data = uDoc.data();
                window.isAdmin = data.isAdmin === true || data.stats?.isAdmin === true;
                
                // Merge-update displayName and photoURL in Firestore
                await setDoc(userRef, {
                    displayName: displayNameVal,
                    photoURL: photoURLVal,
                    email: u.email
                }, { merge: true });
            } else {
                window.isAdmin = false;
                
                // Initialize default profile and stats
                await setDoc(userRef, {
                    displayName: displayNameVal,
                    photoURL: photoURLVal,
                    email: u.email,
                    stats: {
                        totalSubmissions: 0,
                        totalAccepted: 0,
                        points: 0,
                        completedProblems: []
                    }
                }, { merge: true });
            }
        } catch(err) {
            console.warn("[Admin/Profile Sync Warning]: Could not fetch/sync status.", err);
            window.isAdmin = false;
        }
    } else {
        if(ub) ub.innerHTML = `<button onclick="lg()" style="padding:8px 15px;font-size:0.9rem;background:#24292e;color:white;border:none;border-radius:4px;cursor:pointer;">Google Login</button>`;
        window.isAdmin = false;
    }
    
    // Toggle visibility of the Add Public Problem button based on admin status
    let admBtn = document.getElementById('admAddBtn');
    if (admBtn) admBtn.style.display = window.isAdmin ? "inline-flex" : "none";

    // Reload database problems when auth state changes to fetch correct private list
    window.loadDatabaseProblems(u);
    // Reload problem-specific statistics when auth state changes
    window.updateProblemStats();
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
    },
    {
        id: "B_Max_Subarray_Sum",
        difficulty: "Medium",
        desc: "<h3>B. Max Subarray Sum</h3><p>Given an array of integers, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.</p><p><strong>Input Format:</strong><br>First line contains integer <code>n</code> (1 &le; <code>n</code> &le; 10<sup>5</sup>).<br>Second line contains <code>n</code> space-separated integers.</p><p><strong>Output Format:</strong><br>Output a single integer representing the maximum subarray sum.</p>",
        code: {
            cpp: "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<long long> a(n);\n    for (int i = 0; i < n; i++) cin >> a[i];\n    long long max_so_far = a[0];\n    long long curr_max = a[0];\n    for (int i = 1; i < n; i++) {\n        curr_max = max(a[i], curr_max + a[i]);\n        max_so_far = max(max_so_far, curr_max);\n    }\n    cout << max_so_far << endl;\n    return 0;\n}",
            python: "import sys\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    n = int(lines[0])\n    a = [int(x) for x in lines[1:]]\n    max_so_far = a[0]\n    curr_max = a[0]\n    for i in range(1, n):\n        curr_max = max(a[i], curr_max + a[i])\n        max_so_far = max(max_so_far, curr_max)\n    print(max_so_far)\nif __name__ == '__main__':\n    solve()",
            java: "import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) {\n            a[i] = sc.nextLong();\n        }\n        long maxSoFar = a[0];\n        long currMax = a[0];\n        for (int i = 1; i < n; i++) {\n            currMax = Math.max(a[i], currMax + a[i]);\n            maxSoFar = Math.max(maxSoFar, currMax);\n        }\n        System.out.println(maxSoFar);\n    }\n}"
        },
        tests: [ { i: "8\n-2 -3 4 -1 -2 1 5 -3", e: "7" }, { i: "5\n1 2 3 4 5", e: "15" }, { i: "3\n-1 -2 -3", e: "-1" } ],
        hiddenTests: [ { i: "9\n-2 1 -3 4 -1 2 1 -5 4", e: "6" }, { i: "1\n42", e: "42" } ]
    },
    {
        id: "C_Edit_Distance",
        difficulty: "Hard",
        desc: "<h3>C. Edit Distance</h3><p>Given two strings <code>word1</code> and <code>word2</code>, return the minimum number of operations required to convert <code>word1</code> to <code>word2</code>.</p><p>You have the following three operations permitted on a word:<br>1. Insert a character<br>2. Delete a character<br>3. Replace a character</p><p><strong>Input Format:</strong><br>First line contains string <code>word1</code>.<br>Second line contains string <code>word2</code>.</p><p><strong>Output Format:</strong><br>Output a single integer representing the minimum edit distance.</p>",
        code: {
            cpp: "#include <iostream>\n#include <string>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    string s1, s2;\n    if (!(cin >> s1 >> s2)) {\n        if (s1.empty() && s2.empty()) {\n            cout << 0 << endl;\n            return 0;\n        }\n    }\n    int m = s1.length();\n    int n = s2.length();\n    vector<vector<int>> dp(m + 1, vector<int>(n + 1));\n    for (int i = 0; i <= m; i++) dp[i][0] = i;\n    for (int j = 0; j <= n; j++) dp[0][j] = j;\n    for (int i = 1; i <= m; i++) {\n        for (int j = 1; j <= n; j++) {\n            if (s1[i-1] == s2[j-1]) {\n                dp[i][j] = dp[i-1][j-1];\n            } else {\n                dp[i][j] = 1 + min({dp[i-1][j], dp[i][j-1], dp[i-1][j-1]});\n            }\n        }\n    }\n    cout << dp[m][n] << endl;\n    return 0;\n}",
            python: "import sys\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines:\n        print(0)\n        return\n    s1 = lines[0] if len(lines) > 0 else \"\"\n    s2 = lines[1] if len(lines) > 1 else \"\"\n    m, n = len(s1), len(s2)\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n    for i in range(m + 1):\n        dp[i][0] = i\n    for j in range(n + 1):\n        dp[0][j] = j\n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            if s1[i-1] == s2[j-1]:\n                dp[i][j] = dp[i-1][j-1]\n            else:\n                dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])\n    print(dp[m][n])\nif __name__ == '__main__':\n    solve()",
            java: "import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s1 = sc.hasNext() ? sc.next() : \"\";\n        String s2 = sc.hasNext() ? sc.next() : \"\";\n        int m = s1.length();\n        int n = s2.length();\n        int[][] dp = new int[m + 1][n + 1];\n        for (int i = 0; i <= m; i++) dp[i][0] = i;\n        for (int j = 0; j <= n; j++) dp[0][j] = j;\n        for (int i = 1; i <= m; i++) {\n            for (int j = 1; j <= n; j++) {\n                if (s1.charAt(i-1) == s2.charAt(j-1)) {\n                    dp[i][j] = dp[i-1][j-1];\n                } else {\n                    dp[i][j] = 1 + Math.min(dp[i-1][j], Math.min(dp[i][j-1], dp[i-1][j-1]));\n                } \n            }\n        }\n        System.out.println(dp[m][n]);\n    }\n}"
        },
        tests: [ { i: "horse\nros", e: "3" }, { i: "intention\nexecution", e: "5" }, { i: "a\nb", e: "1" } ],
        hiddenTests: [ { i: "abracadabra\ncadabra", e: "4" }, { i: "dynamic\nprogramming", e: "9" } ]
    }
];

window.loadDatabaseProblems = async (user) => {
    try {
        let currentUser = user !== undefined ? user : au.currentUser;

        // 1. Fetch common/public problems with guest/unauthenticated fallback
        let commonSnap = null;
        try {
            commonSnap = await getDocs(collection(db, "problems"));
        } catch(err) {
            console.warn("Firestore common read failed (probably unauthenticated). Using defaults.", err);
        }
        
        prb = [];
        
        if (commonSnap && !commonSnap.empty) {
            // Add common problems
            commonSnap.forEach(docSnap => {
                let pData = docSnap.data();
                prb.push(pData);
            });
        } else {
            // Fallback to default pre-seeded problems
            for (let p of defaultPrb) {
                prb.push(p);
            }
        }

        // 2. Fetch private user-specific problems if logged in
        if (currentUser) {
            try {
                let privateSnap = await getDocs(collection(db, "users", currentUser.uid, "problems"));
                privateSnap.forEach(docSnap => {
                    let pData = docSnap.data();
                    prb.push(pData);
                });
            } catch(err) {
                console.error("Error loading user private problems:", err);
            }
        } else {
            // Load from localStorage private problems if not logged in
            let privateProbs = JSON.parse(localStorage.getItem('rce_private_problems')) || [];
            for (let p of privateProbs) {
                prb.push(p);
            }
        }

        let sel = document.getElementById('pSel');
        sel.innerHTML = ""; // Clear existing dropdown

        // 3. Build dropdown dynamically
        prb.forEach((pData, idx) => {
            let opt = document.createElement('option');
            opt.value = idx;
            let titleMatch = pData.desc.match(/<h3>(.*?)<\/h3>/);
            let displayTitle = titleMatch ? titleMatch[1] : `Problem ${idx + 1}`;
            opt.text = (pData.isCF ? "⚡ " : "") + displayTitle;
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
    if (!p) return;

    // Dynamically insert the difficulty badge next to the <h3> title
    let diff = p.difficulty || "Unknown";
    let diffClass = diff.toLowerCase();
    let badgeHtml = ` <span class="diff-badge ${diffClass}" style="margin-left: 8px; font-size: 0.7rem; padding: 2px 8px; vertical-align: middle; height: auto;">${diff}</span>`;
    
    let updatedDesc = p.desc.replace("</h3>", `${badgeHtml}</h3>`);
    document.getElementById('pDsc').innerHTML = updatedDesc;
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
            if (au.currentUser) {
                subBtn.disabled = false;
                subBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                    </svg> Submit`;
                subBtn.style.opacity = "1";
                subBtn.style.cursor = "pointer";
            } else {
                subBtn.disabled = true;
                subBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:16px;height:16px;opacity:0.6;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg> Login to Submit`;
                subBtn.style.opacity = "0.55";
                subBtn.style.cursor = "not-allowed";
            }
        } else {
            subBtn.style.display = "none";
        }
    }
    
    if (window.updateProblemStats) window.updateProblemStats();
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

            window.saveSubmission(p.id, p.desc.split("</h3>")[0].replace("<h3>", ""), l, maxTime, statusMsg, allPassed);
        } else {
            b.innerText = allPassed ? "🏆 All Tests Passed" : "❌ Tests Failed";
            b.style.color = allPassed ? "#22c55e" : "#ef4444";
        }
    }
};

window.saveSubmission = async (problemId, problemName, lang, timeMs, statusStr, isAccepted) => {
    let code = window.editor ? window.editor.getValue() : "";
    await sendStats(problemId, problemName, lang, timeMs, statusStr, isAccepted, code);
    // Refresh stats and submission history instantly
    setTimeout(window.updateProblemStats, 800);
};

window.currentLibraryTab = 'rce';

window.switchLibraryTab = function(tab) {
    window.currentLibraryTab = tab;
    let rceBtn = document.getElementById('toggleRCE');
    let yourBtn = document.getElementById('toggleYour');
    
    if (tab === 'rce') {
        rceBtn.classList.add('active');
        yourBtn.classList.remove('active');
    } else {
        rceBtn.classList.remove('active');
        yourBtn.classList.add('active');
    }
    window.openLibrary();
};

window.openLibrary = function() {
    let tbody = document.getElementById('libBody');
    let html = "";
    
    for (let i = 0; i < prb.length; i++) {
        let p = prb[i];
        
        // Filter based on selected tab
        if (window.currentLibraryTab === 'rce' && p.isCF) continue;
        if (window.currentLibraryTab === 'your' && !p.isCF) continue;
        
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

    // Beautiful premium empty state fallback
    if (html === "") {
        html = `
            <tr>
                <td colspan="4" style="text-align:center; padding:60px 20px; color:var(--text-muted);">
                    <div style="font-size:1.1rem; font-weight:600; margin-bottom:8px; color:var(--text-main);">No problems found</div>
                    <div style="font-size:0.85rem; max-width: 450px; margin: 0 auto; line-height: 1.5;">
                        ${window.currentLibraryTab === 'rce' 
                            ? 'The RCE problems database is currently empty.' 
                            : 'Fetch external problems from Codeforces using Competitive Companion to build your private synced library!'}
                    </div>
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

// --- ADMIN CREATOR PANEL FUNCTIONS ---
window.openAdminPanel = function() {
    // Reset form fields
    document.getElementById('admId').value = "";
    document.getElementById('admTitle').value = "";
    document.getElementById('admDiff').value = "Easy";
    document.getElementById('admDesc').value = "";
    
    // Clear test cases containers
    document.getElementById('admVisibleTests').innerHTML = "";
    document.getElementById('admHiddenTests').innerHTML = "";
    
    // Add one template test row for each container to start
    window.addAdmTest('visible');
    window.addAdmTest('hidden');
    
    // Open the Modal
    document.getElementById('adminMod').style.display = "flex";
};

window.closeAdminPanel = function() {
    document.getElementById('adminMod').style.display = "none";
};

window.addAdmTest = function(type, inputVal = "", outputVal = "") {
    let container = document.getElementById(type === 'visible' ? 'admVisibleTests' : 'admHiddenTests');
    let row = document.createElement('div');
    row.className = 'adm-test-row';
    row.style.display = 'flex';
    row.style.gap = '10px';
    row.style.alignItems = 'center';
    row.style.marginTop = '6px';
    
    row.innerHTML = `
        <textarea placeholder="Input..." class="t-inp" style="flex:1; height:48px; font-size:0.78rem; padding:6px 10px; font-family:var(--font-mono); border-radius:6px; border:1px solid var(--panel-border); background:rgba(8,10,18,0.4); color:var(--text-main); margin-top:0;"></textarea>
        <textarea placeholder="Expected Output..." class="t-out" style="flex:1; height:48px; font-size:0.78rem; padding:6px 10px; font-family:var(--font-mono); border-radius:6px; border:1px solid var(--panel-border); background:rgba(8,10,18,0.4); color:var(--text-main); margin-top:0;"></textarea>
        <button onclick="this.parentElement.remove()" class="danger" style="padding:6px 10px; font-size:0.75rem; border-radius:6px; height:34px; line-height:1; display:inline-flex; align-items:center; justify-content:center;">✖</button>
    `;
    container.appendChild(row);
};

window.saveAdminProblem = async function() {
    let id = document.getElementById('admId').value.trim();
    let title = document.getElementById('admTitle').value.trim();
    let difficulty = document.getElementById('admDiff').value;
    let descBody = document.getElementById('admDesc').value.trim();
    
    if (!id || !title || !descBody) {
        alert("Validation Failed: Please fill in unique ID, Title, and Description!");
        return;
    }
    
    // Format a unique safe ID
    let safeId = id.replace(/[^a-zA-Z0-9]/g, "_");
    
    // Format description text to preserve newlines as paragraphs/breaks
    let descHTML = `<h3>${title}</h3><p>${descBody.split("\n").join("<br>")}</p>`;
    
    // Extract visible test cases
    let visibleTests = [];
    let visibleRows = document.getElementById('admVisibleTests').querySelectorAll('.adm-test-row');
    visibleRows.forEach(row => {
        let inp = row.querySelector('.t-inp').value.trim();
        let out = row.querySelector('.t-out').value.trim();
        if (inp || out) {
            visibleTests.push({ i: inp, e: out });
        }
    });
    
    // Extract hidden test cases
    let hiddenTests = [];
    let hiddenRows = document.getElementById('admHiddenTests').querySelectorAll('.adm-test-row');
    hiddenRows.forEach(row => {
        let inp = row.querySelector('.t-inp').value.trim();
        let out = row.querySelector('.t-out').value.trim();
        if (inp || out) {
            hiddenTests.push({ i: inp, e: out });
        }
    });
    
    if (visibleTests.length === 0) {
        alert("Validation Failed: Please add at least one visible test case!");
        return;
    }
    
    // Construct final problem payload with automatic templates
    let newProb = {
        id: safeId,
        difficulty: difficulty,
        desc: descHTML,
        code: {
            cpp: defaultCode.cpp,
            python: defaultCode.python,
            java: defaultCode.java
        },
        tests: visibleTests,
        hiddenTests: hiddenTests
    };
    
    try {
        // Save the new problem directly to the public 'problems' collection
        await setDoc(doc(db, "problems", safeId), newProb);
        
        alert("Success! Problem added to public database successfully.");
        closeAdminPanel();
        
        // Reload common problems and refresh UI immediately
        window.loadDatabaseProblems();
    } catch(err) {
        console.error("[Admin Save Error]:", err);
        alert("Failed to write to public database: " + err.message);
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

                // 1. Save it to user's private collection if logged in, or localStorage if logged out
                if (au.currentUser) {
                    try {
                        await setDoc(doc(db, "users", au.currentUser.uid, "problems", safeId), newProb);
                        console.log(`Saved ${formattedName} to user's private database.`);
                    } catch(err) {
                        console.error("Failed to save private problem to Firestore:", err);
                    }
                } else {
                    let privateProbs = JSON.parse(localStorage.getItem('rce_private_problems')) || [];
                    privateProbs.push(newProb);
                    localStorage.setItem('rce_private_problems', JSON.stringify(privateProbs));
                    console.log(`Saved ${formattedName} to local storage (unauthenticated fallback).`);
                }
                
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

// --- PREMIUM LEETCODE-STYLE PROBLEM STATS AND SUBMISSIONS ACTIONS ---
window.updateProblemStats = async () => {
    let x = document.getElementById('pSel').value;
    let p = prb[x];
    if (!p) return;

    let titleMatch = p.desc.match(/<h3>(.*?)<\/h3>/);
    let problemName = titleMatch ? titleMatch[1] : `Problem`;

    let stats = await fetchProblemStats(problemName);

    let pSubmissionsEl = document.getElementById('pSubmissions');
    let pAcceptedEl = document.getElementById('pAccepted');
    let pRateEl = document.getElementById('pRate');
    let pSubListEl = document.getElementById('pSubList');

    if (!pSubmissionsEl || !pAcceptedEl || !pRateEl || !pSubListEl) return;

    if (!stats) {
        pSubmissionsEl.innerText = "—";
        pAcceptedEl.innerText = "—";
        pRateEl.innerText = "—";
        pSubListEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.78rem; padding: 24px 0;">Failed to load stats.</div>`;
        return;
    }

    pSubmissionsEl.innerText = stats.totalSubmissions;
    pAcceptedEl.innerText = stats.totalAccepted;
    let rate = stats.totalSubmissions === 0 ? 0 : Math.round((stats.totalAccepted / stats.totalSubmissions) * 100);
    pRateEl.innerText = rate + "%";

    let html = "";
    if (stats.userSubmissions && stats.userSubmissions.length > 0) {
        stats.userSubmissions.forEach(sub => {
            let statusVal = sub.status || "Accepted";
            let statusColor = "var(--danger)";
            let statusIcon = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:2px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            `;
            if (statusVal === "Accepted") {
                statusColor = "var(--success)";
                statusIcon = `
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:2px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                `;
            } else if (statusVal.includes("Pending") || statusVal.includes("Running")) {
                statusColor = "var(--text-muted)";
                statusIcon = `
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:2px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                `;
            }

            let dateStr = "Unknown Date";
            if (sub.timestamp) {
                try {
                    dateStr = new Date(sub.timestamp).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                } catch(e) {
                    console.error("Invalid timestamp:", sub.timestamp, e);
                }
            }

            // Modern glassmorphic row card with code action elements
            html += `
                <div class="bx" style="padding: 12px; background: rgba(255,255,255,0.01); display: flex; flex-direction: column; gap: 8px; border-color: rgba(255,255,255,0.03); margin-bottom: 2px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color:${statusColor}; font-weight: 800; font-size: 0.8rem; display: inline-flex; align-items: center;">
                            ${statusIcon} ${statusVal}
                        </span>
                        <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">${sub.time}ms | ${sub.language.toUpperCase()}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed rgba(255,255,255,0.03); padding-top: 6px;">
                        <span style="font-size: 0.7rem; color: var(--text-dark); font-weight: 500;">${dateStr}</span>
                        <div style="display: flex; gap: 6px;">
                            <button onclick="window.viewSubmittedCode('${sub.id}')" class="secondary" style="padding: 3px 8px; font-size: 0.68rem; border-radius: 4px; line-height: 1; height: auto; box-shadow: none; font-weight: 600;">Code</button>
                            <button onclick="window.restoreSubmittedCode('${sub.id}')" class="success" style="padding: 3px 8px; font-size: 0.68rem; border-radius: 4px; line-height: 1; height: auto; box-shadow: none; font-weight: 600;">Load</button>
                        </div>
                    </div>
                </div>
            `;
        });

        window.loadedSubmissions = stats.userSubmissions;
    } else {
        html = `<div style="text-align: center; color: var(--text-muted); font-size: 0.78rem; padding: 24px 0;">No submissions yet.</div>`;
    }

    pSubListEl.innerHTML = html;
};

window.viewSubmittedCode = (subId) => {
    let sub = window.loadedSubmissions?.find(s => s.id === subId);
    if (!sub) return;

    let codeViewModal = document.getElementById('codeViewMod');
    if (!codeViewModal) {
        codeViewModal = document.createElement('div');
        codeViewModal.id = 'codeViewMod';
        codeViewModal.className = 'modal';
        codeViewModal.innerHTML = `
            <div class="modal-content" style="width: 650px; max-width: 95%;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--panel-border); padding-bottom:15px; margin-bottom:20px;">
                    <h3 style="margin:0; color:var(--text-main); font-family:var(--font-heading); font-weight:800;" id="codeViewTitle">Submitted Code</h3>
                    <button onclick="document.getElementById('codeViewMod').style.display = 'none'" class="secondary" style="border:none; padding:4px; font-size:1.1rem; line-height:1;">✖</button>
                </div>
                <pre id="codeViewContent" style="background: rgba(8, 10, 18, 0.6); padding: 15px; border-radius: 8px; border: 1px solid var(--panel-border); max-height: 350px; overflow-y: auto; color: #e2e8f0; font-family: var(--font-mono); font-size: 0.8rem; text-align: left;"></pre>
                <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:20px; border-top:1px solid var(--panel-border); padding-top:15px;">
                    <button onclick="document.getElementById('codeViewMod').style.display = 'none'" class="secondary" style="padding:8px 16px; font-size:0.85rem;">Close</button>
                    <button id="codeViewLoadBtn" class="success" style="padding:8px 16px; font-size:0.85rem;">Load Into Editor</button>
                </div>
            </div>
        `;
        document.body.appendChild(codeViewModal);
    }

    document.getElementById('codeViewContent').innerText = sub.code;
    document.getElementById('codeViewTitle').innerText = `Submitted Code (${sub.language.toUpperCase()} | ${sub.status})`;

    document.getElementById('codeViewLoadBtn').onclick = () => {
        window.restoreSubmittedCode(subId);
        codeViewModal.style.display = 'none';
    };

    codeViewModal.style.display = 'flex';
};

window.restoreSubmittedCode = (subId) => {
    let sub = window.loadedSubmissions?.find(s => s.id === subId);
    if (!sub) return;

    if (confirm(`Load this ${sub.language.toUpperCase()} submission into your editor? It will overwrite your current code.`)) {
        let lSel = document.getElementById('lSel');
        lSel.value = sub.language;
        monaco.editor.setModelLanguage(window.editor.getModel(), sub.language);

        window.editor.setValue(sub.code);
        window.saveState();
        alert("Submission code loaded successfully into editor!");
    }
};

// --- PREMIUM LEADERBOARD ACTIONS ---
window.openLeaderboard = async function() {
    document.getElementById('leaderboardMod').style.display = "flex";
    await window.updateLeaderboardUI();
};

window.closeLeaderboard = function() {
    document.getElementById('leaderboardMod').style.display = "none";
};

window.updateLeaderboardUI = async function() {
    let leaderboardBody = document.getElementById('leaderboardBody');
    if (!leaderboardBody) return;

    leaderboardBody.innerHTML = `
        <tr>
            <td colspan="4" style="text-align: center; padding: 40px 0; color: var(--text-muted);">
                <div class="loader" style="border: 3px solid rgba(255,255,255,0.05); border-radius: 50%; border-top: 3px solid var(--accent); width: 24px; height: 24px; animation: spin 1s linear infinite; margin: 0 auto 10px auto;"></div>
                Fetching leaderboard rankings...
            </td>
        </tr>
    `;

    let data = await fetchLeaderboard();
    if (!data || data.length === 0) {
        leaderboardBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 40px 0; color: var(--text-muted);">
                    No developers on the leaderboard yet. Be the first to solve a problem!
                </td>
            </tr>
        `;
        return;
    }

    let html = "";
    data.forEach((user, index) => {
        let rank = index + 1;
        let rankClass = "rank-other";
        let rankContent = rank;

        if (rank === 1) {
            rankClass = "rank-1";
            rankContent = "🏆";
        } else if (rank === 2) {
            rankClass = "rank-2";
            rankContent = "🥈";
        } else if (rank === 3) {
            rankClass = "rank-3";
            rankContent = "🥉";
        }

        let isCurrentUser = au.currentUser && au.currentUser.uid === user.uid;
        let rowClass = isCurrentUser ? "curr-user-row" : "";
        let avatarHtml = user.photoURL 
            ? `<img src="${user.photoURL}" style="width:28px; height:28px; border-radius:50%; margin-right:10px; vertical-align:middle; border: 1px solid rgba(255,255,255,0.1);">` 
            : `<div style="width:28px; height:28px; border-radius:50%; background:var(--accent-bg); color:var(--accent); display:inline-flex; align-items:center; justify-content:center; font-weight:800; font-size:0.75rem; margin-right:10px; vertical-align:middle;">${user.displayName.charAt(0).toUpperCase()}</div>`;

        html += `
            <tr class="${rowClass}">
                <td style="padding: 14px 8px;"><span class="rank-badge ${rankClass}">${rankContent}</span></td>
                <td style="padding: 14px 8px; font-weight: 700; color: var(--text-main);">
                    ${avatarHtml}
                    <span style="${isCurrentUser ? 'color: var(--accent);' : ''}">${user.displayName}</span>
                    ${isCurrentUser ? ' <span style="font-size:0.68rem; padding:2px 6px; background:var(--accent-bg); color:var(--accent); border-radius:4px; font-weight:bold; margin-left:4px;">You</span>' : ''}
                </td>
                <td style="padding: 14px 8px; text-align: center; color: var(--text-muted); font-weight: 600;">
                    <span style="color: var(--success);">${user.totalAccepted}</span> / <span style="font-size:0.8rem;">${user.totalSubmissions}</span>
                </td>
                <td style="padding: 14px 8px; text-align: right; font-weight: 800; font-family: var(--font-heading); font-size: 1.05rem; color: var(--warning);">
                    ${user.points} <span style="font-size:0.72rem; color:var(--text-dark); font-weight:600;">pts</span>
                </td>
            </tr>
        `;
    });

    leaderboardBody.innerHTML = html;
};