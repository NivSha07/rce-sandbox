let ch = null;
let nmd = false;
let visOn = true; // NEW: Visualizer State Tracker
let userBoilerplates = JSON.parse(localStorage.getItem('rce_bp')) || {};

const prb = [
    {
        desc: "<h3>A. Array Prefix Sums</h3><p>Output an array of size <code>n</code> where the <code>i-th</code> element is the sum of integers from 1 to i.</p>",
        code: {
            cpp: "#include<bits/stdc++.h>\nusing namespace std;\n#define ll long long\n#define pb push_back\n#define fast_io ios_base::sync_with_stdio(false);cin.tie(NULL);\nint main(){\n    fast_io;\n    int n; cin>>n;\n    ll s=0;\n    for(int i=1;i<=n;i++){\n        s+=i; cout<<s<<\" \";\n    }\n    return 0;\n}",
            python: "n = int(input())\ns = 0\nfor i in range(1, n+1):\n    s += i\n    print(s, end=\" \")",
            java: "import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        long s = 0;\n        for(int i=1; i<=n; i++) {\n            s += i;\n            System.out.print(s + \" \");\n        }\n    }\n}",
            javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim();\nlet n = parseInt(input);\nlet s = 0;\nlet res = [];\nfor(let i=1; i<=n; i++) { s+=i; res.push(s); }\nconsole.log(res.join(' '));",
            rust: "use std::io;\nfn main() {\n    let mut input = String::new();\n    io::stdin().read_line(&mut input).unwrap();\n    let n: i32 = input.trim().parse().unwrap();\n    let mut s: i64 = 0;\n    for i in 1..=n {\n        s += i as i64;\n        print!(\"{} \", s);\n    }\n}"
        },
        tests: [ { i: "5", e: "1 3 6 10 15" }, { i: "3", e: "1 3 6" }, { i: "1", e: "1" } ]
    },
    {
        desc: "<h3>B. Indicator Variables</h3><p>Calculate the total number of times a '1' is immediately followed by another '1'.</p>",
        code: {
            cpp: "#include<bits/stdc++.h>\nusing namespace std;\n#define ll long long\n#define pb push_back\n#define fast_io ios_base::sync_with_stdio(false);cin.tie(NULL);\nint main(){\n    fast_io;\n    int n; cin>>n;\n    vector<int> a(n);\n    for(int i=0;i<n;i++) cin>>a[i];\n    int c=0;\n    for(int i=0;i<n-1;i++){\n        if(a[i]==1 && a[i+1]==1) c++;\n    }\n    cout<<c<<\"\\n\";\n    return 0;\n}",
            python: "n = int(input())\narr = list(map(int, input().split()))\nc = 0\nfor i in range(n-1):\n    if arr[i] == 1 and arr[i+1] == 1:\n        c += 1\nprint(c)",
            java: "import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] a = new int[n];\n        for(int i=0; i<n; i++) a[i] = sc.nextInt();\n        int c = 0;\n        for(int i=0; i<n-1; i++) {\n            if(a[i]==1 && a[i+1]==1) c++;\n        }\n        System.out.println(c);\n    }\n}",
            javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);\nlet n = input[0];\nlet c = 0;\nfor(let i=1; i<n; i++) {\n    if(input[i]===1 && input[i+1]===1) c++;\n}\nconsole.log(c);",
            rust: "use std::io::{self, Read};\nfn main() {\n    let mut input = String::new();\n    io::stdin().read_to_string(&mut input).unwrap();\n    let mut iter = input.split_whitespace().flat_map(str::parse::<i32>);\n    let n = iter.next().unwrap();\n    let a: Vec<i32> = iter.collect();\n    let mut c = 0;\n    for i in 0..(n-1) as usize {\n        if a[i] == 1 && a[i+1] == 1 { c += 1; }\n    }\n    println!(\"{}\", c);\n}"
        },
        tests: [ { i: "5\n1 1 0 1 1", e: "2" }, { i: "4\n0 0 0 0", e: "0" }, { i: "3\n1 1 1", e: "2" } ]
    }
];

function saveState() {
    if (!window.editor) return;
    let state = {
        p: document.getElementById('pSel').value,
        l: document.getElementById('lSel').value,
        t: document.getElementById('tSel').value,
        f: document.getElementById('fInp').value,
        c: window.editor.getValue(),
        m: nmd,
        v: visOn // NEW: Save visualizer state
    };
    localStorage.setItem('rce_data', JSON.stringify(state));
}

function initApp() {
    let saved = localStorage.getItem('rce_data');
    if (saved) {
        let s = JSON.parse(saved);
        document.getElementById('pSel').value = s.p;
        document.getElementById('lSel').value = s.l;
        document.getElementById('tSel').value = s.t;
        document.getElementById('fInp').value = s.f;
        
        monaco.editor.setTheme(s.t);
        window.editor.updateOptions({ fontSize: parseInt(s.f) });
        
        let p = prb[s.p];
        document.getElementById('pDsc').innerHTML = p.desc;
        document.getElementById('stdInput').value = p.tests[0].i;
        document.getElementById('expectedOutput').value = p.tests[0].e;
        
        window.editor.setValue(s.c);
        monaco.editor.setModelLanguage(window.editor.getModel(), s.l);
        
        if (s.m) { nmd = false; toggleMode(); }
        
        // NEW: Restore visualizer state
        if (s.v !== undefined) {
            visOn = !s.v; // Invert so toggle visually flips it correct
            toggleVis();
        }
    } else {
        loadProblem();
    }
}

// NEW: Toggle function for visualizer
function toggleVis() {
    visOn = !visOn;
    let b = document.getElementById('vBtn');
    if (visOn) {
        b.innerText = "📊 Visualizer: ON";
        b.style.background = "#3b82f6";
    } else {
        b.innerText = "📊 Visualizer: OFF";
        b.style.background = "#2e344e";
        document.getElementById('chartBox').style.display = "none";
        if (ch) ch.destroy();
    }
    saveState();
}

function toggleMode() {
    nmd = !nmd;
    let b = document.getElementById('mBtn');
    if (nmd) { document.body.classList.add('nmd'); b.innerText = "CP Mode"; } 
    else { document.body.classList.remove('nmd'); b.innerText = "Normal Mode"; }
    saveState();
}

function loadProblem() {
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
    document.getElementById('chartBox').style.display = "none";
    if (ch) ch.destroy();
    
    saveState();
}

function resetCode() {
    if (confirm("Wipe editor and reset to problem code?")) {
        let x = document.getElementById('pSel').value;
        let l = document.getElementById('lSel').value;
        window.editor.setValue(userBoilerplates[l] ? userBoilerplates[l] : prb[x].code[l]);
        saveState();
    }
}

function changeLanguage() { loadProblem(); }
function changeTheme() { monaco.editor.setTheme(document.getElementById('tSel').value); saveState(); }
function changeFont() { window.editor.updateOptions({ fontSize: parseInt(document.getElementById('fInp').value) }); saveState(); }
function openSettings() { let l = document.getElementById('lSel').value; document.getElementById('bpText').value = userBoilerplates[l] || prb[0].code[l]; document.getElementById('setMod').style.display = "flex"; }
function closeSettings() { document.getElementById('setMod').style.display = "none"; }
function saveSettings() { let l = document.getElementById('lSel').value; userBoilerplates[l] = document.getElementById('bpText').value; localStorage.setItem('rce_bp', JSON.stringify(userBoilerplates)); closeSettings(); }

async function runCode() {
    let s = window.editor.getValue();
    let l = document.getElementById('lSel').value;
    let o = document.getElementById('consoleOutput');
    let b = document.getElementById('statusBadge');
    let c = document.getElementById('chartBox');
    
    o.innerText = "Running...";
    b.innerText = "";
    c.style.display = "none";
    if (ch) ch.destroy();
    
    if (nmd) {
        let i = document.getElementById('stdInput').value;
        try {
            let r = await fetch('http://localhost:3000/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: s, input: i, language: l })
            });
            let d = await r.json();
            if (d.error) {
                o.innerText = d.error;
                b.innerText = `⚠️ Error (${d.time}ms)`;
                b.style.color = "#ef4444";
            } else {
                o.innerText = d.output;
                b.innerText = `⚡ ${d.time}ms`;
                b.style.color = "#a6accd";
                if (visOn) drawGraph(d.output); // Gate render behind toggle
            }
        } catch (e) {
            o.innerText = "Server offline.";
        }
    } else {
        let p = prb[document.getElementById('pSel').value];
        let h = "<table style='width:100%; text-align:left; border-collapse:collapse;'><tr><th style='border-bottom:1px solid #2e344e; padding:5px;'>Test</th><th style='border-bottom:1px solid #2e344e; padding:5px;'>Status</th><th style='border-bottom:1px solid #2e344e; padding:5px;'>Time</th></tr>";
        let allPassed = true;
        
        for (let j = 0; j < p.tests.length; j++) {
            let tc = p.tests[j];
            try {
                let r = await fetch('http://localhost:3000/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: s, input: tc.i, language: l })
                });
                let d = await r.json();
                let pass = (!d.error && d.output.trim() === tc.e);
                if (!pass) allPassed = false;
                let st = pass ? "<span style='color:#22c55e;'>✅ Passed</span>" : "<span style='color:#ef4444;'>❌ Failed</span>";
                h += `<tr><td style='padding:5px;'>Case ${j+1}</td><td style='padding:5px;'>${st}</td><td style='padding:5px;'>${d.time}ms</td></tr>`;
                
                // Gate render behind toggle AND only render the first test case
                if (j === 0 && !d.error && visOn) drawGraph(d.output);
                
            } catch (e) {
                allPassed = false;
                h += `<tr><td style='padding:5px;'>Case ${j+1}</td><td style='padding:5px;'><span style='color:#ef4444;'>⚠️ Error</span></td><td style='padding:5px;'>-</td></tr>`;
            }
        }
        h += "</table>";
        o.innerHTML = h;
        b.innerText = allPassed ? "🏆 All Tests Passed" : "❌ Tests Failed";
        b.style.color = allPassed ? "#22c55e" : "#ef4444";
    }
}

function drawGraph(t) {
    let a = t.trim().split(/\s+/).filter(x => x !== "");
    if (a.length < 2) return;
    let n = a.map(Number);
    if (n.some(isNaN)) return;
    document.getElementById('chartBox').style.display = "block";
    let cx = document.getElementById('outputChart').getContext('2d');
    ch = new Chart(cx, {
        type: 'bar',
        data: { labels: n.map((_, i) => i), datasets: [{ data: n, backgroundColor: '#3b82f6', borderRadius: 4 }] },
        options: { responsive: true, scales: { y: { grid: { color: '#2e344e' }, ticks: { color: '#a6accd' } }, x: { grid: { color: '#2e344e' }, ticks: { color: '#a6accd' } } }, plugins: { legend: { display: false } } }
    });
}