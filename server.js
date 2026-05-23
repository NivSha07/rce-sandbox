const ex = require('express');
const fs = require('fs');
const cx = require('child_process').exec;
const cs = require('cors');

const ap = ex();
ap.use(cs());
ap.use(ex.json());

ap.post('/rn', (rq, rs) => {
    let cd = rq.body.cd;
    let ip = rq.body.ip || "";
    let fn = `t_${Date.now()}`;
    let cp = `${fn}.cpp`;
    let tx = `${fn}.txt`;
    let ot = `${fn}.exe`; // Changed to .exe for Windows

    fs.writeFileSync(cp, cd);
    fs.writeFileSync(tx, ip);

    cx(`g++ ${cp} -o ${ot}`, (e1, s1, er1) => {
        if(e1) return rs.status(400).send({er: er1});
        
        // Removed the ./ so Windows cmd can run it
        cx(`${ot} < ${tx}`, (e2, s2, er2) => {
            if(e2) return rs.status(400).send({er: er2});
            rs.send({ou: s2});
        });
    });
});

ap.listen(3000);