const express = require('express');
const fs = require('fs');
const net = require('net');
const cors = require('cors');

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

const cln = (b) => {
    try {
        let jd = `${__dirname}/${b}`;
        if (fs.existsSync(jd)) fs.rmSync(jd, { recursive: true, force: true });
        let files = fs.readdirSync(__dirname);
        files.forEach(f => {
            if (f.startsWith(b)) {
                try { fs.unlinkSync(`${__dirname}/${f}`); } catch(e) {}
            }
        });
    } catch(e) {}
};

app.post('/run', (req, res) => {
    let { code, inputs, language } = req.body;
    let b = `temp_${Date.now()}`;
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
        cln(b); 

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
        cln(b); 
        res.status(500).send({ error: "Judge Daemon Offline. Start judge.exe." });
    });

    setTimeout(() => cln(b), 10000); 
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

        let { problem, language, time, status, isAccepted } = req.body;

        // 1. Log the submission
        await db.collection('submissions').add({
            uid: uid, problem: problem, language: language, status: status, time: time, timestamp: Date.now()
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