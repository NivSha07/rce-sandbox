const express = require('express');
const fs = require('fs');
const exec = require('child_process').exec;
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/run', (req, res) => {
    let { code, input, language } = req.body;
    let baseFilename = `temp_${Date.now()}`;
    
    let command = "";
    let filesToClean = [];

    // ROUTE 1: C++
    if (language === 'cpp') {
        fs.writeFileSync(`${baseFilename}.cpp`, code);
        fs.writeFileSync(`${baseFilename}.txt`, input || "");
        filesToClean.push(`${baseFilename}.cpp`, `${baseFilename}.txt`, `${baseFilename}.out`);
        
        command = `docker run --rm -v "${__dirname}:/usr/src/app" -w /usr/src/app gcc:latest bash -c "g++ ${baseFilename}.cpp -o ${baseFilename}.out && timeout 5s ./${baseFilename}.out < ${baseFilename}.txt"`;
    } 
    // ROUTE 2: Python
    else if (language === 'python') {
        fs.writeFileSync(`${baseFilename}.py`, code);
        fs.writeFileSync(`${baseFilename}.txt`, input || "");
        filesToClean.push(`${baseFilename}.py`, `${baseFilename}.txt`);
        
        command = `docker run --rm -v "${__dirname}:/usr/src/app" -w /usr/src/app python:latest bash -c "timeout 5s python ${baseFilename}.py < ${baseFilename}.txt"`;
    }
    // ROUTE 3: Java
    else if (language === 'java') {
        let javaDir = `${__dirname}/${baseFilename}`;
        fs.mkdirSync(javaDir); // Java needs an isolated directory to compile safely
        fs.writeFileSync(`${javaDir}/Main.java`, code);
        fs.writeFileSync(`${javaDir}/input.txt`, input || "");
        filesToClean.push(javaDir);
        
        command = `docker run --rm -v "${javaDir}:/usr/src/app" -w /usr/src/app eclipse-temurin:latest bash -c "javac Main.java && timeout 5s java Main < input.txt"`;
    }

    exec(command, (error, stdout, stderr) => {
        // Cleanup Phase
        if (language === 'java') {
            fs.rmSync(`${__dirname}/${baseFilename}`, { recursive: true, force: true });
        } else {
            filesToClean.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
        }
        
        // Error Handling
        if (error) {
            let errorMsg = stderr || error.message;
            if (errorMsg.includes('timeout') || error.killed) {
                return res.status(400).send({ error: "Execution Timed Out: Possible infinite loop detected." });
            }
            return res.status(400).send({ error: errorMsg });
        }
        
        res.send({ output: stdout });
    });
});

app.listen(3000);