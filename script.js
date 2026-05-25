let ch = null; // Holds the chart instance

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
    if (ch) ch.destroy(); // Clear old graph
    
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
            
            // Trigger visualizer
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