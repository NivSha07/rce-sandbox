const express = require('express');
const fs = require('fs');
const net = require('net');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/run', (req, res) => {
    let { code, input, language } = req.body;
    let baseFilename = `temp_${Date.now()}`;
    let filesToClean = [];

    if (language === 'java') {
        let javaDir = `${__dirname}/${baseFilename}`;
        fs.mkdirSync(javaDir); 
        fs.writeFileSync(`${javaDir}/Main.java`, code);
        fs.writeFileSync(`${javaDir}/input.txt`, input || "");
        filesToClean.push(javaDir);
    } else {
        let ext = language === 'javascript' ? 'js' : language === 'python' ? 'py' : language === 'rust' ? 'rs' : 'cpp';
        fs.writeFileSync(`${baseFilename}.${ext}`, code);
        fs.writeFileSync(`${baseFilename}.txt`, input || "");
        filesToClean.push(`${baseFilename}.${ext}`, `${baseFilename}.txt`, `${baseFilename}.out`, `${baseFilename}.exe`, baseFilename);
    }

    // Connect to C++ TCP Daemon
    let client = new net.Socket();
    client.connect(8080, '127.0.0.1', () => {
        client.write(`${language}|${baseFilename}`);
    });

    client.on('data', (data) => {
        let response = data.toString();
        let delim = response.indexOf('|');
        let timeTaken = response.substring(0, delim);
        let output = response.substring(delim + 1).trim();

        // Cleanup
        if (language === 'java') {
            if (fs.existsSync(`${__dirname}/${baseFilename}`)) fs.rmSync(`${__dirname}/${baseFilename}`, { recursive: true, force: true });
        } else {
            filesToClean.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
        }

        if (output.includes('timeout') || output.includes('Killed')) {
            return res.status(400).send({ error: "Execution Timed Out.", time: timeTaken });
        }
        if (output.includes('error:') || output.includes('Exception')) {
            return res.status(400).send({ error: output, time: timeTaken });
        }

        res.send({ output: output, time: timeTaken });
        client.destroy();
    });

    client.on('error', (err) => {
        res.status(500).send({ error: "Judge Daemon Offline. Start judge.exe." });
    });
});

app.listen(3000, () => console.log("Node Gateway on Port 3000"));