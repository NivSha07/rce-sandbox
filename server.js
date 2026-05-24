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
    let exeFilePath = `${baseFilename}.exe`;

    // Helper function to delete files if they exist
    const cleanup = () => {
        if (fs.existsSync(cppFilePath)) fs.unlinkSync(cppFilePath);
        if (fs.existsSync(inputFilePath)) fs.unlinkSync(inputFilePath);
        if (fs.existsSync(exeFilePath)) fs.unlinkSync(exeFilePath);
    };

    fs.writeFileSync(cppFilePath, sourceCode);
    fs.writeFileSync(inputFilePath, standardInput);

    exec(`g++ ${cppFilePath} -o ${exeFilePath}`, (compileError, stdout1, stderr1) => {
        if (compileError) {
            cleanup(); // Clean up even if compilation fails
            return res.status(400).send({ error: stderr1 });
        }
        
        exec(`${exeFilePath} < ${inputFilePath}`, (runError, stdout2, stderr2) => {
            cleanup(); // Clean up after running
            if (runError) return res.status(400).send({ error: stderr2 });
            res.send({ output: stdout2 });
        });
    });
});

app.listen(3000);