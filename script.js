async function runCode() {
    let sourceCode = window.editor.getValue();
    let stdInput = document.getElementById('stdInput').value;
    let expectedOutput = document.getElementById('expectedOutput').value.trim();
    
    let consoleOutput = document.getElementById('consoleOutput');
    let statusBadge = document.getElementById('statusBadge');
    
    consoleOutput.innerText = "Running...";
    statusBadge.innerText = ""; // Clear previous status
    
    try {
        let response = await fetch('http://localhost:3000/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: sourceCode, input: stdInput })
        });
        
        let data = await response.json();
        
        if (data.error) {
            consoleOutput.innerText = data.error;
            statusBadge.innerText = "⚠️ Error";
            statusBadge.style.color = "#ef4444"; // Red
        } else {
            consoleOutput.innerText = data.output;
            
            // Validation Logic
            if (expectedOutput !== "") {
                let actualOutput = data.output.trim();
                
                if (actualOutput === expectedOutput) {
                    statusBadge.innerText = "✅ Passed";
                    statusBadge.style.color = "#22c55e"; // Green
                } else {
                    statusBadge.innerText = "❌ Failed";
                    statusBadge.style.color = "#ef4444"; // Red
                }
            }
        }
    } catch (err) {
        consoleOutput.innerText = "Server offline. Make sure node server.js is running.";
    }
}

function changeTheme() {
    let selectedTheme = document.getElementById('themeSelect').value;
    monaco.editor.setTheme(selectedTheme);
}

function changeFontSize() {
    let newSize = parseInt(document.getElementById('fontSizeInput').value);
    window.editor.updateOptions({ fontSize: newSize });
}