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

// --- DATABASE SEEDER FOR PUBLIC PROBLEMS ---
const seedDatabase = async () => {
    try {
        const seedProblems = [
            {
                id: "A_Array_Prefix_Sums",
                difficulty: "Easy",
                desc: "<h3>A. Array Prefix Sums</h3><p>Output an array of size <code>n</code> where the <code>i-th</code> element is the sum of integers from 1 to i.</p>",
                code: {
                    cpp: "#include<bits/stdc++.h>\nusing namespace std;\nint main(){\n    int n; cin>>n;\n    long long s=0;\n    for(int i=1;i<=n;i++){ s+=i; cout<<s<<\" \"; }\n    return 0;\n}",
                    python: "n = int(input())\ns = 0\nfor i in range(1, n+1):\n    s += i\n    print(s, end=\" \")",
                    java: "import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        long s = 0;\n        for(int i=1; i<=n; i++) {\n            s += i;\n            System.out.print(s + \" \");\n        }\n    }\n}"
                },
                tests: [ { i: "5", e: "1 3 6 10 15" }, { i: "3", e: "1 3 6" }, { i: "1", e: "1" } ],
                hiddenTests: [ { i: "7", e: "1 3 6 10 15 21 28" }, { i: "10", e: "1 3 6 10 15 21 28 36 45 55" } ]
            },
            {
                id: "B_Max_Subarray_Sum",
                difficulty: "Medium",
                desc: "<h3>B. Max Subarray Sum</h3><p>Given an array of integers, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.</p><p><strong>Input Format:</strong><br>First line contains integer <code>n</code> (1 &le; <code>n</code> &le; 10<sup>5</sup>).<br>Second line contains <code>n</code> space-separated integers.</p><p><strong>Output Format:</strong><br>Output a single integer representing the maximum subarray sum.</p>",
                code: {
                    cpp: "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<long long> a(n);\n    for (int i = 0; i < n; i++) cin >> a[i];\n    long long max_so_far = a[0];\n    long long curr_max = a[0];\n    for (int i = 1; i < n; i++) {\n        curr_max = max(a[i], curr_max + a[i]);\n        max_so_far = max(max_so_far, curr_max);\n    }\n    cout << max_so_far << endl;\n    return 0;\n}",
                    python: "import sys\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    n = int(lines[0])\n    a = [int(x) for x in lines[1:]]\n    max_so_far = a[0]\n    curr_max = a[0]\n    for i in range(1, n):\n        curr_max = max(a[i], curr_max + a[i])\n        max_so_far = max(max_so_far, curr_max)\n    print(max_so_far)\nif __name__ == '__main__':\n    solve()",
                    java: "import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        long[] a = new long[n];\n        for (int i = 0; i < n; i++) {\n            a[i] = sc.nextLong();\n        }\n        long maxSoFar = a[0];\n        long currMax = a[0];\n        for (int i = 1; i < n; i++) {\n            currMax = Math.max(a[i], currMax + a[i]);\n            maxSoFar = Math.max(maxSoFar, currMax);\n        }\n        System.out.println(maxSoFar);\n    }\n}"
                },
                tests: [ { i: "8\n-2 -3 4 -1 -2 1 5 -3", e: "7" }, { i: "5\n1 2 3 4 5", e: "15" }, { i: "3\n-1 -2 -3", e: "-1" } ],
                hiddenTests: [ { i: "9\n-2 1 -3 4 -1 2 1 -5 4", e: "6" }, { i: "1\n42", e: "42" } ]
            },
            {
                id: "C_Edit_Distance",
                difficulty: "Hard",
                desc: "<h3>C. Edit Distance</h3><p>Given two strings <code>word1</code> and <code>word2</code>, return the minimum number of operations required to convert <code>word1</code> to <code>word2</code>.</p><p>You have the following three operations permitted on a word:<br>1. Insert a character<br>2. Delete a character<br>3. Replace a character</p><p><strong>Input Format:</strong><br>First line contains string <code>word1</code>.<br>Second line contains string <code>word2</code>.</p><p><strong>Output Format:</strong><br>Output a single integer representing the minimum edit distance.</p>",
                code: {
                    cpp: "#include <iostream>\n#include <string>\n#include <vector>\n#include <algorithm>\nusing namespace std;\nint main() {\n    string s1, s2;\n    if (!(cin >> s1 >> s2)) {\n        if (s1.empty() && s2.empty()) {\n            cout << 0 << endl;\n            return 0;\n        }\n    }\n    int m = s1.length();\n    int n = s2.length();\n    vector<vector<int>> dp(m + 1, vector<int>(n + 1));\n    for (int i = 0; i <= m; i++) dp[i][0] = i;\n    for (int j = 0; j <= n; j++) dp[0][j] = j;\n    for (int i = 1; i <= m; i++) {\n        for (int j = 1; j <= n; j++) {\n            if (s1[i-1] == s2[j-1]) {\n                dp[i][j] = dp[i-1][j-1];\n            } else {\n                dp[i][j] = 1 + min({dp[i-1][j], dp[i][j-1], dp[i-1][j-1]});\n            }\n        }\n    }\n    cout << dp[m][n] << endl;\n    return 0;\n}",
                    python: "import sys\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines:\n        print(0)\n        return\n    s1 = lines[0] if len(lines) > 0 else \"\"\n    s2 = lines[1] if len(lines) > 1 else \"\"\n    m, n = len(s1), len(s2)\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n    for i in range(m + 1):\n        dp[i][0] = i\n    for j in range(n + 1):\n        dp[0][j] = j\n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            if s1[i-1] == s2[j-1]:\n                dp[i][j] = dp[i-1][j-1]\n            else:\n                dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])\n    print(dp[m][n])\nif __name__ == '__main__':\n    solve()",
                    java: "import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s1 = sc.hasNext() ? sc.next() : \"\";\n        String s2 = sc.hasNext() ? sc.next() : \"\";\n        int m = s1.length();\n        int n = s2.length();\n        int[][] dp = new int[m + 1][n + 1];\n        for (int i = 0; i <= m; i++) dp[i][0] = i;\n        for (int j = 0; j <= n; j++) dp[0][j] = j;\n        for (int i = 1; i <= m; i++) {\n            for (int j = 1; j <= n; j++) {\n                if (s1.charAt(i-1) == s2.charAt(j-1)) {\n                    dp[i][j] = dp[i-1][j-1];\n                } else {\n                    dp[i][j] = 1 + Math.min(dp[i-1][j], Math.min(dp[i][j-1], dp[i-1][j-1]));\n                } \n            }\n        }\n        System.out.println(dp[m][n]);\n    }\n}"
                },
                tests: [ { i: "horse\nros", e: "3" }, { i: "intention\nexecution", e: "5" }, { i: "a\nb", e: "1" } ],
                hiddenTests: [ { i: "abracadabra\ncadabra", e: "4" }, { i: "dynamic\nprogramming", e: "9" } ]
            }
        ];

        for (const prob of seedProblems) {
            const docRef = db.collection('problems').doc(prob.id);
            const docSnap = await docRef.get();
            if (!docSnap.exists) {
                await docRef.set(prob);
                console.log(`[Database Seeder]: Seeded problem ${prob.id} successfully.`);
            } else {
                // Ensure difficulty and other fields match in case they were created incorrectly earlier
                await docRef.set(prob, { merge: true });
                console.log(`[Database Seeder]: Synced problem ${prob.id}.`);
            }
        }
    } catch(e) {
        console.error("[Database Seeder Error]:", e);
    }
};
seedDatabase();
// -------------------------------------------

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

        let { problem, problemId, language, time, status, isAccepted, code } = req.body;

        // 1. Log the submission
        await db.collection('submissions').add({
            uid: uid, 
            problem: problem, 
            problemId: problemId || "",
            language: language, 
            status: status, 
            time: time, 
            timestamp: Date.now(),
            code: code || ""
        });

        // 2. Safely increment user profile stats and leaderboard points
        let userRef = db.collection('users').doc(uid);
        let userDoc = await userRef.get();
        
        let userData = userDoc.exists ? userDoc.data() : {};
        let stats = userData.stats || { totalSubmissions: 0, totalAccepted: 0, points: 0, completedProblems: [] };
        
        let completedProblems = stats.completedProblems || [];
        let earnedPoints = 0;
        let newlyCompleted = false;

        if (isAccepted && problemId) {
            if (!completedProblems.includes(problemId)) {
                // Verify if this is a public problem in the public 'problems' collection
                let problemDoc = await db.collection('problems').doc(problemId).get();
                if (problemDoc.exists) {
                    newlyCompleted = true;
                    completedProblems.push(problemId);
                    
                    let difficulty = problemDoc.data().difficulty || "Easy";
                    if (difficulty === "Easy") earnedPoints = 1;
                    else if (difficulty === "Medium") earnedPoints = 3;
                    else if (difficulty === "Hard") earnedPoints = 5;
                    
                    console.log(`[Points Engine]: User ${uid} successfully solved public problem ${problemId} (${difficulty}). Awarding ${earnedPoints} points.`);
                }
            }
        }

        if (!userDoc.exists) {
            await userRef.set({
                stats: {
                    totalSubmissions: 1,
                    totalAccepted: isAccepted ? 1 : 0,
                    points: earnedPoints,
                    completedProblems: completedProblems
                }
            }, { merge: true });
        } else {
            let updates = {
                "stats.totalSubmissions": admin.firestore.FieldValue.increment(1)
            };
            if (isAccepted) {
                updates["stats.totalAccepted"] = admin.firestore.FieldValue.increment(1);
            }
            if (newlyCompleted) {
                updates["stats.points"] = admin.firestore.FieldValue.increment(earnedPoints);
                updates["stats.completedProblems"] = completedProblems;
            }
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

// --- GET GLOBAL LEADERBOARD API ---
app.get('/leaderboard', async (req, res) => {
    try {
        let usersSnap = await db.collection('users').get();
        let leaderboard = [];
        usersSnap.forEach(docSnap => {
            let data = docSnap.data();
            // Only list users that have some displayName or stats
            if (data.displayName || data.stats) {
                leaderboard.push({
                    uid: docSnap.id,
                    displayName: data.displayName || "Anonymous Developer",
                    photoURL: data.photoURL || "",
                    points: data.stats?.points || 0,
                    totalAccepted: data.stats?.totalAccepted || 0,
                    totalSubmissions: data.stats?.totalSubmissions || 0
                });
            }
        });
        
        // Sort descending by points, then by totalAccepted, then alphabetically
        leaderboard.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.totalAccepted !== a.totalAccepted) return b.totalAccepted - a.totalAccepted;
            return a.displayName.localeCompare(b.displayName);
        });
        
        res.json(leaderboard);
    } catch(e) {
        console.error("Error fetching leaderboard:", e);
        res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
});
// ----------------------------------

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