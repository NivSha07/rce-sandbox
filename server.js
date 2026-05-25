const express = require('express');
const fs = require('fs');
const exec = require('child_process').exec;
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/run', (req, res) => {
    let sourceCode = req.body.code;
    let standardInput = req.body.input || "";
    
    let baseFilename = `temp_${Date.now()}`;
    let cppFilePath = `${baseFilename}.cpp`;
    let inputFilePath = `${baseFilename}.txt`;
    
    let outFilePath = `${baseFilename}.out`; 

    const cleanup = () => {
        if (fs.existsSync(cppFilePath)) fs.unlinkSync(cppFilePath);
        if (fs.existsSync(inputFilePath)) fs.unlinkSync(inputFilePath);
        if (fs.existsSync(outFilePath)) fs.unlinkSync(outFilePath);
    };

    fs.writeFileSync(cppFilePath, sourceCode);
    fs.writeFileSync(inputFilePath, standardInput);

    // The Docker Command: Mounts the current folder, compiles, and runs with a 5s timeout
    const dockerCommand = `docker run --rm -v "${__dirname}:/usr/src/app" -w /usr/src/app gcc:latest bash -c "g++ ${cppFilePath} -o ${outFilePath} && timeout 5s ./${outFilePath} < ${inputFilePath}"`;

    exec(dockerCommand, (error, stdout, stderr) => {
        cleanup(); 
        
        if (error) {
            let errorMsg = stderr || error.message;
            
            // Detect if Docker killed the process due to the infinite loop timeout
            if (errorMsg.includes('timeout') || error.killed) {
                return res.status(400).send({ error: "Execution Timed Out: Possible infinite loop detected." });
            }
            
            return res.status(400).send({ error: errorMsg });
        }
        
        res.send({ output: stdout });
    });
});

app.listen(3000);