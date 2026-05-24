async function runCode() {
    let sourceCode = document.getElementById('sourceCode').value;
    let stdInput = document.getElementById('stdInput').value;
    let consoleOutput = document.getElementById('consoleOutput');
    
    consoleOutput.innerText = "Running...";
    
    try {
        let response = await fetch('http://localhost:3000/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: sourceCode, input: stdInput })
        });
        
        let data = await response.json();
        
        if (data.error) {
            consoleOutput.innerText = data.error;
        } else {
            consoleOutput.innerText = data.output;
        }
    } catch (err) {
        consoleOutput.innerText = "Server offline. Make sure node server.js is running.";
    }
}