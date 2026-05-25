let ch = null; 

// NEW: Problem Database
const problems = [
    {
        desc: "<h3>A. Array Prefix Sums</h3><p>You are given an integer <code>n</code>. Output an array of size <code>n</code> where the <code>i-th</code> element is the sum of all integers from <code>1</code> to <code>i</code>.</p><p><strong>Input:</strong><br>A single integer <code>n</code> (1 ≤ n ≤ 50).</p><p><strong>Output:</strong><br>Print <code>n</code> space-separated integers.</p><p><strong>Example Input:</strong><br><code>5</code></p><p><strong>Example Output:</strong><br><code>1 3 6 10 15</code></p>",
        code: "#include<bits/stdc++.h>\nusing namespace std;\n#define ll long long\n#define pb push_back\n#define fast_io ios_base::sync_with_stdio(false);cin.tie(NULL);\n\nint main(){\n    fast_io;\n    int n;\n    cin >> n;\n    ll s = 0;\n    for(int i=1; i<=n; i++){\n        s += i;\n        cout << s << \" \";\n    }\n    return 0;\n}",
        input: "5",
        expected: "1 3 6 10 15"
    },
    {
        desc: "<h3>B. Indicator Variables</h3><p>You are given <code>n</code> logical coin flips (1 for heads, 0 for tails). Calculate the total number of times a '1' is immediately followed by another '1' in the sequence.</p><p><strong>Input:</strong><br>An integer <code>n</code>, followed by <code>n</code> space-separated bits.</p><p><strong>Output:</strong><br>A single integer representing the count.</p><p><strong>Example Input:</strong><br><code>5\n1 1 0 1 1</code></p><p><strong>Example Output:</strong><br><code>2</code></p>",
        code: "#include<bits/stdc++.h>\nusing namespace std;\n#define ll long long\n#define pb push_back\n#define fast_io ios_base::sync_with_stdio(false);cin.tie(NULL);\n\nint main(){\n    fast_io;\n    int n;\n    cin >> n;\n    vector<int> a(n);\n    for(int i=0; i<n; i++) cin >> a[i];\n    int c = 0;\n    for(int i=0; i<n-1; i++){\n        if(a[i]==1 && a[i+1]==1) c++;\n    }\n    cout << c << \"\\n\";\n    return 0;\n}",
        input: "5\n1 1 0 1 1",
        expected: "2"
    }
];

// NEW: Function to inject problem data into the UI
function loadProblem() {
    let idx = document.getElementById('problemSelect').value;
    let p = problems[idx];
    
    document.getElementById('problemDesc').innerHTML = p.desc;
    document.getElementById('stdInput').value = p.input;
    document.getElementById('expectedOutput').value = p.expected;
    
    if (window.editor) {
        window.editor.setValue(p.code);
    }
    
    // Reset outputs when loading a new problem
    document.getElementById('consoleOutput').innerText = "Awaiting execution...";
    document.getElementById('statusBadge').innerText = "";
    document.getElementById('chartBox').style.display = "none";
    if (ch) ch.destroy();
}

async function runCode() {
    let src = window.editor.getValue();
    let inp = document.getElementById('stdInput').value;
    let exp = document.getElementById('expectedOutput').value.trim();
    
    let out = document.getElementById('consoleOutput');
    let bge = document.getElementById('statusBadge');
    let cBox = document.getElementById('chartBox');
    
    out.innerText = "Running...";
    bge.innerText = ""; 
    cBox.style.display = "none";
    if (ch) ch.destroy(); 
    
    try {
        let res = await fetch('http://localhost:3000/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: src, input: inp })
        });
        
        let d = await res.json();
        
        if (d.error) {
            out.innerText = d.error;
            bge.innerText = "⚠️ Error";
            bge.style.color = "#ef4444"; 
        } else {
            out.innerText = d.output;
            
            if (exp !== "") {
                let act = d.output.trim();
                if (act === exp) {
                    bge.innerText = "✅ Passed";
                    bge.style.color = "#22c55e"; 
                } else {
                    bge.innerText = "❌ Failed";
                    bge.style.color = "#ef4444"; 
                }
            }
            
            drawGraph(d.output);
        }
    } catch (err) {
        out.innerText = "Server offline. Make sure node server.js is running.";
    }
}

function drawGraph(txt) {
    let arr = txt.trim().split(/\s+/).filter(x => x !== "");
    if (arr.length < 2) return; 
    
    let nums = arr.map(Number);
    if (nums.some(isNaN)) return; 
    
    document.getElementById('chartBox').style.display = "block";
    let ctx = document.getElementById('outputChart').getContext('2d');
    
    ch = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: nums.map((_, i) => i),
            datasets: [{
                label: 'Data Output',
                data: nums,
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

function changeTheme() {
    let t = document.getElementById('themeSelect').value;
    monaco.editor.setTheme(t);
}

function changeFontSize() {
    let sz = parseInt(document.getElementById('fontSizeInput').value);
    window.editor.updateOptions({ fontSize: sz });
}