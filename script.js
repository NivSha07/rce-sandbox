let ch = null;
let nmd = false;

const prb = [
    {
        d: "<h3>A. Array Prefix Sums</h3><p>You are given an integer <code>n</code>. Output an array of size <code>n</code> where the <code>i-th</code> element is the sum of all integers from <code>1</code> to <code>i</code>.</p><p><strong>Input:</strong><br>A single integer <code>n</code>.</p><p><strong>Example Output:</strong><br><code>1 3 6 10 15</code></p>",
        cpp: "#include<bits/stdc++.h>\nusing namespace std;\nint main(){\n    int n;\n    cin >> n;\n    long long s = 0;\n    for(int i=1; i<=n; i++){\n        s += i;\n        cout << s << \" \";\n    }\n    return 0;\n}",
        python: "n = int(input())\ns = 0\nfor i in range(1, n+1):\n    s += i\n    print(s, end=\" \")",
        java: "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        long s = 0;\n        for(int i=1; i<=n; i++) {\n            s += i;\n            System.out.print(s + \" \");\n        }\n    }\n}",
        i: "5",
        e: "1 3 6 10 15"
    },
    {
        d: "<h3>B. Indicator Variables</h3><p>You are given <code>n</code> logical coin flips. Calculate the total number of times a '1' is immediately followed by another '1'.</p><p><strong>Example Input:</strong><br><code>5\n1 1 0 1 1</code></p><p><strong>Example Output:</strong><br><code>2</code></p>",
        cpp: "#include<bits/stdc++.h>\nusing namespace std;\nint main(){\n    int n; cin >> n;\n    vector<int> a(n);\n    for(int i=0; i<n; i++) cin >> a[i];\n    int c = 0;\n    for(int i=0; i<n-1; i++){\n        if(a[i]==1 && a[i+1]==1) c++;\n    }\n    cout << c << \"\\n\";\n    return 0;\n}",
        python: "n = int(input())\narr = list(map(int, input().split()))\nc = 0\nfor i in range(n-1):\n    if arr[i] == 1 and arr[i+1] == 1:\n        c += 1\nprint(c)",
        java: "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] a = new int[n];\n        for(int i=0; i<n; i++) a[i] = sc.nextInt();\n        int c = 0;\n        for(int i=0; i<n-1; i++) {\n            if(a[i]==1 && a[i+1]==1) c++;\n        }\n        System.out.println(c);\n    }\n}",
        i: "5\n1 1 0 1 1",
        e: "2"
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
        m: nmd 
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
        document.getElementById('pDsc').innerHTML = p.d;
        document.getElementById('stdInput').value = p.i;
        document.getElementById('expectedOutput').value = p.e;
        
        window.editor.setValue(s.c);
        monaco.editor.setModelLanguage(window.editor.getModel(), s.l);
        
        if (s.m) {
            nmd = false; 
            tgMd(); 
        }
    } else {
        ldP(); 
    }
}

function tgMd() {
    nmd = !nmd;
    let b = document.getElementById('mBtn');
    if (nmd) { document.body.classList.add('nmd'); b.innerText = "CP Mode"; } 
    else { document.body.classList.remove('nmd'); b.innerText = "Normal Mode"; }
    saveState(); 
}

function ldP() {
    let x = document.getElementById('pSel').value;
    let l = document.getElementById('lSel').value;
    let p = prb[x];
    
    document.getElementById('pDsc').innerHTML = p.d;
    document.getElementById('stdInput').value = p.i;
    document.getElementById('expectedOutput').value = p.e;
    
    if (window.editor) {
        window.editor.setValue(p[l]);
        monaco.editor.setModelLanguage(window.editor.getModel(), l);
    }
    
    document.getElementById('consoleOutput').innerText = "Awaiting execution...";
    document.getElementById('statusBadge').innerText = "";
    document.getElementById('chartBox').style.display = "none";
    if (ch) ch.destroy();
    
    saveState(); 
}

// NEW: Reset Function
function rstC() {
    if (confirm("Reset to default boilerplate? This will erase your current code.")) {
        let x = document.getElementById('pSel').value;
        let l = document.getElementById('lSel').value;
        window.editor.setValue(prb[x][l]);
        saveState();
    }
}

function chL() { ldP(); }

function chT() { 
    monaco.editor.setTheme(document.getElementById('tSel').value); 
    saveState(); 
}

function chF() { 
    window.editor.updateOptions({ fontSize: parseInt(document.getElementById('fInp').value) }); 
    saveState(); 
}

async function rnC() {
    let s = window.editor.getValue();
    let i = document.getElementById('stdInput').value;
    let e = document.getElementById('expectedOutput').value.trim();
    let l = document.getElementById('lSel').value; 
    
    let o = document.getElementById('consoleOutput');
    let b = document.getElementById('statusBadge');
    let c = document.getElementById('chartBox');
    
    o.innerText = "Running...";
    b.innerText = ""; 
    c.style.display = "none";
    if (ch) ch.destroy(); 
    
    try {
        let r = await fetch('http://localhost:3000/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: s, input: i, language: l }) 
        });
        let d = await r.json();
        
        if (d.error) {
            o.innerText = d.error;
            b.innerText = "⚠️ Error";
            b.style.color = "#ef4444"; 
        } else {
            o.innerText = d.output;
            if (!nmd && e !== "") {
                let a = d.output.trim();
                if (a === e) {
                    b.innerText = "✅ Passed"; b.style.color = "#22c55e"; 
                } else {
                    b.innerText = "❌ Failed"; b.style.color = "#ef4444"; 
                }
            }
            if (!nmd) drG(d.output);
        }
    } catch (err) {
        o.innerText = "Server offline.";
    }
}

function drG(t) {
    let a = t.trim().split(/\s+/).filter(x => x !== "");
    if (a.length < 2) return; 
    let n = a.map(Number);
    if (n.some(isNaN)) return; 
    
    document.getElementById('chartBox').style.display = "block";
    let cx = document.getElementById('outputChart').getContext('2d');
    
    ch = new Chart(cx, {
        type: 'bar',
        data: { labels: n.map((_, idx) => idx), datasets: [{ data: n, backgroundColor: '#3b82f6', borderRadius: 4 }] },
        options: { responsive: true, scales: { y: { grid: { color: '#2e344e' }, ticks: { color: '#a6accd' } }, x: { grid: { color: '#2e344e' }, ticks: { color: '#a6accd' } } }, plugins: { legend: { display: false } } }
    });
}