const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.join(__dirname, '..');
function run(cmd,args){const r=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit',env:{...process.env,NODE_ENV:'production'}});return r.status===0;}
let ok=true;
console.log('=== PRODUCTION GATE V13.2 ===');
ok = run('node',['scripts/check.js']) && ok;
ok = run('node',['scripts/build.js']) && ok;
if(!fs.existsSync(path.join(root,'node_modules'))) {
  console.error('✗ node_modules ausente: execute npm ci antes do gate runtime.');
  process.exit(1);
}
console.log('✓ dependências instaladas; executando smoke test HTTP...');
const port = String(process.env.GATE_PORT || 3313);
const child = require('child_process').spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,NODE_ENV:'test',PORT:port,DB_PATH:path.join(root,'.tmp','gate.db'),MEDIA_ROOT:path.join(root,'.tmp','media'),SITE_URL:`http://127.0.0.1:${port}`,JWT_SECRET:'v13-gate-secret-change-me-32-chars-minimum',ADMIN_EMAIL:'gate@example.com',ADMIN_PASSWORD:'GatePassword!123'},stdio:['ignore','pipe','pipe']});
let output=''; child.stdout.on('data',d=>output+=d); child.stderr.on('data',d=>output+=d);
const http=require('http');
const request=(p)=>new Promise((resolve,reject)=>{const req=http.get(`http://127.0.0.1:${port}${p}`,res=>{let b='';res.on('data',c=>b+=c);res.on('end',()=>resolve({status:res.statusCode,body:b}));});req.on('error',reject);});
(async()=>{try{let ready=false;for(let i=0;i<40;i++){try{const r=await request('/api/health');if(r.status===200){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,250));}if(!ready)throw new Error('Servidor não respondeu /api/health\n'+output);for(const p of ['/api/health','/api/settings','/api/categories','/api/collections','/api/dresses']){const r=await request(p);if(r.status!==200)throw new Error(`${p} retornou ${r.status}`);console.log(`✓ HTTP ${p}`)}console.log('✓ runtime smoke básico passou');child.kill('SIGTERM');fs.rmSync(path.join(root,'.tmp'),{recursive:true,force:true});console.log('=== PRODUCTION GATE PASS ===');process.exit(0)}catch(e){console.error('✗',e.message);console.error(output);child.kill('SIGTERM');process.exit(1)}})();
