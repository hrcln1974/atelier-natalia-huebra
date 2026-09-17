const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const root=path.join(__dirname,'..');let ok=true;
function node(args,env={}){const r=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit',env:{...process.env,...env}});return r.status===0}
console.log('=== PRODUCTION GATE V14 ===');
ok=node(['scripts/check.js'])&&ok;
ok=node(['scripts/build.js'])&&ok;
if(!fs.existsSync(path.join(root,'node_modules'))){console.error('✗ node_modules ausente: execute npm ci.');process.exit(1)}
const required=['DB_HOST','DB_NAME','DB_USER','DB_PASSWORD','GATE_DB_NAME','E2E_ADMIN_EMAIL','E2E_ADMIN_PASSWORD'];const missing=required.filter(k=>!process.env[k]);
if(missing.length){console.error('✗ Runtime MySQL não validado. Variáveis ausentes:',missing.join(', '));console.error('  O gate não mascara ausência de banco de produção/teste.');process.exit(1)}
const port=String(process.env.GATE_PORT||3314);
if(process.env.GATE_DB_NAME===process.env.DB_NAME){console.error('✗ GATE_DB_NAME não pode ser igual ao banco de produção.');process.exit(1)}const tmp=path.join(root,'.tmp');fs.mkdirSync(tmp,{recursive:true});
const child=require('child_process').spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,NODE_ENV:'test',PORT:port,DB_NAME:process.env.GATE_DB_NAME,SITE_URL:`http://127.0.0.1:${port}`,JWT_SECRET:'v14-gate-secret-change-me-32-chars-minimum',ADMIN_EMAIL:process.env.E2E_ADMIN_EMAIL,ADMIN_PASSWORD:process.env.E2E_ADMIN_PASSWORD},stdio:['ignore','pipe','pipe']});
let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
const req=p=>new Promise((resolve,reject)=>{const q=require('http').get(`http://127.0.0.1:${port}${p}`,r=>{let b='';r.on('data',c=>b+=c);r.on('end',()=>resolve({status:r.statusCode,body:b}))});q.on('error',reject)});
(async()=>{try{let ready=false;for(let i=0;i<50;i++){try{const r=await req('/api/health');if(r.status===200){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,250))}if(!ready)throw new Error('Servidor não respondeu /api/health\n'+output);for(const p of ['/api/health','/api/settings','/api/categories','/api/collections','/api/dresses','/api/videos']){const r=await req(p);if(r.status!==200)throw new Error(`${p} ${r.status}`);console.log('✓ HTTP',p)}child.kill('SIGTERM');console.log('✓ runtime MySQL smoke passou');console.log('=== PRODUCTION GATE PASS ===')}catch(e){console.error('✗',e.message);console.error(output);child.kill('SIGTERM');process.exit(1)}})();
