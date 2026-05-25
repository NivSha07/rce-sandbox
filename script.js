let ch = null;
let nmd = false;

const prb = [
    {
        d: "<h3>A. Array Prefix Sums</h3><p>You are given an integer <code>n</code>. Output an array of size <code>n</code> where the <code>i-th</code> element is the sum of all integers from <code>1</code> to <code>i</code>.</p><p><strong>Input:</strong><br>A single integer <code>n</code> (1 ≤ n ≤ 50).</p><p><strong>Output:</strong><br>Print <code>n</code> space-separated integers.</p><p><strong>Example Input:</strong><br><code>5</code></p><p><strong>Example Output:</strong><br><code>1 3 6 10 15</code></p>",
        c: "#include<bits/stdc++.h>\nusing namespace std;\n#define ll long long\n#define pb push_back\n#define fast_io ios_base::sync_with_stdio(false);cin.tie(NULL);\n\nint main(){\n    fast_io;\n    int n;\n    cin >> n;\n    ll s = 0;\n    for(int i=1; i<=n; i++){\n        s += i;\n        cout << s << \" \";\n    }\n    return 0;\n}",
        i: "5",
        e: "1 3 6 10 15"
    },
    {
        d: "<h3>B. Indicator Variables</h3><p>You are given <code>n</code> logical coin flips (1 for heads, 0 for tails). Calculate the total number of times a '1' is immediately followed by another '1' in the sequence.</p><p><strong>Input:</strong><br>An integer <code>n</code>, followed by <code>n</code> space-separated bits.</p><p><strong>Output:</strong><br>A single integer representing the count.</p><p><strong>Example Input:</strong><br><code>5\n1 1 0 1 1</code></p><p><strong>Example Output:</strong><br><code>2</code></p>",
        c: "#include<bits/stdc++.h>\nusing namespace std;\n#define ll long long\n#define pb push_back\n#define fast_io ios_base::sync_with_stdio(false);cin.tie(NULL);\n\nint main(){\n    fast_io;\n    int n;\n    cin >> n;\n    vector<int> a(n);\n    for(int i=0; i<n; i++) cin >> a[i];\n    int c = 0;\n    for(int i=0; i<n-1; i++){\n        if(a[i]==1 && a[i+1]==1) c++;\n    }\n    cout << c << \"\\n\";\n    return 0;\n}",
        i: "5\n1 1 0 1 1",
        e: "2"
    }
];

function tgMd() {
    nmd = !nmd;
    let b = document.getElementById('mBtn');
    if (nmd) {
        document.body.classList.add('nmd');
        b.innerText = "CP Mode";
    } else {
        document.body.classList.remove('nmd');
        b.innerText = "Normal Mode";
    }
}

function ldP() {
    let x = document.getElementById('pSel').value;
    let p = prb[x];
    document.getElementById('pDsc').innerHTML = p.d;
    document.getElementById('stdInput').value = p.i;
    document.getElementById('expectedOutput').value = p.e;
    if (window.editor) window.editor.setValue(p.c);
    document.getElementById('consoleOutput').innerText = "Awaiting execution...";
    document.getElementById('statusBadge').innerText = "";
    document.getElementById('chartBox').style.display = "none";
    if (ch) ch.destroy();
}

async function rnC() {
    let s = window.editor.getValue();
    let i = document.getElementById('stdInput').value;
    let e = document.getElementById('expectedOutput').value.trim();
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
            body: JSON.stringify({ code: s, input: i })
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
                    b.innerText = "✅ Passed";
                    b.style.color = "#22c55e"; 
                } else {
                    b.innerText = "❌ Failed";
                    b.style.color = "#ef4444"; 
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
        data: {
            labels: n.map((_, idx) => idx),
            datasets: [{
                data: n,
                backgroundColor: '#3b82f6',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { grid: { color: '#2e344e' }, ticks: { color: '#a6accd' } },
                x: { grid: { color: '#2e344e' }, ticks: { color: '#a6accd' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function chT() {
    let t = document.getElementById('tSel').value;
    monaco.editor.setTheme(t);
}

function chF() {
    let z = parseInt(document.getElementById('fInp').value);
    window.editor.updateOptions({ fontSize: z });
}