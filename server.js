const express = require('express');
const fs = require('fs');
const net = require('net');
const cors = require('cors');
const crypto = require('crypto');

// Ensure local temporary sandbox directory exists
if (!fs.existsSync(`${__dirname}/temp`)) {
    fs.mkdirSync(`${__dirname}/temp`);
}

// --- FIREBASE ADMIN SETUP ---
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
// ----------------------------

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + '/public'));

// --- COMPETITIVE COMPANION INTERCEPTOR ---
let pendingProblem = null;
const ccApp = express();
ccApp.use(cors());
ccApp.use(express.json({ limit: '10mb' }));

ccApp.post('/', (req, res) => {
    let d = req.body;
    pendingProblem = {
        name: d.name,
        url: d.url,
        timeLimit: d.timeLimit,
        tests: d.tests.map(t => ({ i: t.input, e: t.output }))
    };
    console.log(`[Companion] Intercepted: ${d.name} (${d.tests.length} tests)`);
    res.sendStatus(200);
});
ccApp.listen(10043, () => console.log("Companion Listener Active on Port 10043"));

app.get('/poll-problem', (req, res) => {
    res.json(pendingProblem);
    pendingProblem = null;
});
// -----------------------------------------

const cln = (b, language, inputsCount) => {
    try {
        let fullPath = `${__dirname}/${b}`;
        
        // Delete shell runner script
        fs.rmSync(`${fullPath}.sh`, { force: true });
        
        // Delete specific source and output executable files
        if (language === 'cpp') {
            fs.rmSync(`${fullPath}.cpp`, { force: true });
            fs.rmSync(`${fullPath}.out`, { force: true });
        } else if (language === 'python') {
            fs.rmSync(`${fullPath}.py`, { force: true });
        }
        
        // Delete targeted case input files
        if (inputsCount) {
            for (let i = 0; i < inputsCount; i++) {
                fs.rmSync(`${fullPath}_in_${i}.txt`, { force: true });
            }
        }
        
        // Delete the subdirectory (e.g. for Java workspace directories)
        if (fs.existsSync(fullPath)) {
            fs.rmSync(fullPath, { recursive: true, force: true });
        }
    } catch(e) {
        console.error("[Cleanup Error]:", e);
    }
};

app.post('/run', (req, res) => {
    let { code, inputs, language } = req.body;
    let b = `temp/temp_${crypto.randomUUID()}`;
    let sc = "";

    if (language === 'cpp') sc += `g++ ${b}.cpp -o ${b}.out\n`;
    else if (language === 'java') sc += `javac Main.java\n`;

    inputs.forEach((inp, i) => {
        sc += `echo '---CASE${i}---'\n`;
        sc += `T1=$(date +%s%3N)\n`;
        let inpf = (language === 'java') ? `in_${i}.txt` : `${b}_in_${i}.txt`;
        
        if (language === 'cpp') sc += `timeout 5s ./${b}.out < ${inpf}\n`;
        else if (language === 'python') sc += `timeout 5s python ${b}.py < ${inpf}\n`;
        else if (language === 'java') sc += `timeout 5s java Main < ${inpf}\n`;
        
        sc += `T2=$(date +%s%3N)\n`;
        sc += `echo '---TIME' $(($T2-$T1)) '---'\n`;
    });

    if (language === 'java') {
        let jd = `${__dirname}/${b}`;
        fs.mkdirSync(jd);
        fs.writeFileSync(`${jd}/Main.java`, code);
        fs.writeFileSync(`${jd}/runner.sh`, sc);
        inputs.forEach((inp, i) => fs.writeFileSync(`${jd}/in_${i}.txt`, inp));
    } else {
        let ext = language === 'python' ? 'py' : 'cpp';
        fs.writeFileSync(`${b}.${ext}`, code);
        fs.writeFileSync(`${b}.sh`, sc);
        inputs.forEach((inp, i) => fs.writeFileSync(`${b}_in_${i}.txt`, inp));
    }

    let cl = new net.Socket();
    cl.connect(8080, '127.0.0.1', () => {
        cl.write(`${language}|${b}`);
    });

    cl.on('data', (d) => {
        let r = d.toString();
        cln(b, language, inputs.length); 

        let resArr = [];
        for (let i = 0; i < inputs.length; i++) {
            let si = r.indexOf(`---CASE${i}---`);
            if (si === -1) {
                resArr.push({ error: true, output: "Compilation/Execution Failed:\n" + r.substring(0, 200), time: "-" });
                continue;
            }
            si += (`---CASE${i}---`).length;

            let ei = r.indexOf(`---TIME`, si);
            if (ei === -1) {
                resArr.push({ error: true, output: "Execution Timeout or Crash", time: "-" });
                continue;
            }
            
            let o = r.substring(si, ei).trim();
            let ts = ei + (`---TIME`).length;
            let te = r.indexOf('---', ts);
            let t = r.substring(ts, te).trim();

            resArr.push({ output: o, time: t });
        }

        res.send({ results: resArr });
        cl.destroy();
    });

    cl.on('error', (err) => {
        cln(b, language, inputs.length); 
        res.status(500).send({ error: "Judge Daemon Offline. Start judge.exe." });
    });

    setTimeout(() => cln(b, language, inputs.length), 10000); 
});

// --- NEW: SECURE STAT SAVING ROUTE ---
app.post('/save-stat', async (req, res) => {
    // Extract the Firebase Auth Token from the header
    let token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) return res.status(401).send({ error: "Unauthorized" });

    try {
        // Verify the token securely with Google
        let decodedToken = await admin.auth().verifyIdToken(token);
        let uid = decodedToken.uid;

        let { problem, language, time, status, isAccepted, code } = req.body;

        // 1. Log the submission
        await db.collection('submissions').add({
            uid: uid, 
            problem: problem, 
            language: language, 
            status: status, 
            time: time, 
            timestamp: Date.now(),
            code: code || ""
        });

        // 2. Safely increment user profile stats
        let userRef = db.collection('users').doc(uid);
        let userDoc = await userRef.get();

        if (!userDoc.exists) {
            await userRef.set({ stats: { totalSubmissions: 1, totalAccepted: isAccepted ? 1 : 0 } });
        } else {
            let updates = { "stats.totalSubmissions": admin.firestore.FieldValue.increment(1) };
            if (isAccepted) updates["stats.totalAccepted"] = admin.firestore.FieldValue.increment(1);
            await userRef.update(updates);
        }

        res.send({ success: true });
    } catch (e) {
        console.error("Stat Save Error:", e);
        res.status(500).send({ error: "Database error" });
    }
});

// --- NEW: GET STATS AND SUBMISSIONS HISTORY FOR A SPECIFIC PROBLEM ---
app.get('/problem-stats/:problemName', async (req, res) => {
    let token = req.headers.authorization?.split('Bearer ')[1];
    let problemName = req.params.problemName;

    try {
        let uid = null;
        if (token) {
            try {
                let decodedToken = await admin.auth().verifyIdToken(token);
                uid = decodedToken.uid;
            } catch(e) {
                console.warn("[Stats auth warning]: Invalid token passed", e.message);
            }
        }

        // 1. Fetch ALL submissions for this problem to calculate global stats
        let allSubsSnap = await db.collection('submissions')
            .where('problem', '==', problemName)
            .get();

        let totalSubmissions = allSubsSnap.size;
        let totalAccepted = 0;

        allSubsSnap.forEach(docSnap => {
            let data = docSnap.data();
            if (data.status === 'Accepted' || data.isAccepted === true) {
                totalAccepted++;
            }
        });

        // 2. Fetch specific user's submissions for this problem if uid is present
        let userSubs = [];
        if (uid) {
            let userSubsSnap = await db.collection('submissions')
                .where('uid', '==', uid)
                .where('problem', '==', problemName)
                .get();

            userSubsSnap.forEach(docSnap => {
                let data = docSnap.data();
                userSubs.push({
                    id: docSnap.id,
                    language: data.language,
                    status: data.status,
                    time: data.time,
                    timestamp: data.timestamp,
                    code: data.code || ""
                });
            });

            // Sort in memory by timestamp desc for maximum index safety
            userSubs.sort((a, b) => b.timestamp - a.timestamp);
        }

        res.json({
            totalSubmissions,
            totalAccepted,
            userSubmissions: userSubs
        });

    } catch(e) {
        console.error("Error fetching problem stats:", e);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});
// -------------------------------------

const { spawn } = require('child_process');
const judgeDaemon = spawn('./judge/judge.exe');

judgeDaemon.stdout.on('data', (data) => {
    console.log(`${data}`.trim());
});

judgeDaemon.stderr.on('data', (data) => {
    console.error(`[JUDGE ERROR]: ${data}`);
});

process.on('SIGINT', () => {
    judgeDaemon.kill();
    process.exit();
});

app.listen(3000, () => console.log("Server Running on Port 3000"));