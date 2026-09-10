const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const root=path.join(__dirname,'..');
const required=['server.js','package.json','.env.example','README.md','public/index.html','public/style.css','public/app.js','public/admin/index.html','public/admin/admin.js','public/admin/admin.css','public/robots.txt','public/sitemap.xml','docs/DEPLOY-HOSTINGER.md'];
let fail=0;for(const f of required){if(fs.existsSync(path.join(root,f)))console.log('✓',f);else{console.log('✗',f);fail++}}
for(const f of ['server.js','public/app.js','public/admin/admin.js','scripts/smoke.js','scripts/create-admin.js']){const r=spawnSync(process.execPath,['--check',path.join(root,f)],{encoding:'utf8'});if(r.status===0)console.log('✓ syntax',f);else{console.log('✗ syntax',f,r.stderr);fail++}}
for(const dir of ['public/assets/images','public/assets/videos','public/admin','scripts','docs']){if(fs.existsSync(path.join(root,dir)))console.log('✓',dir);else{console.log('✗',dir);fail++}}
console.log(fail?'PRODUCTION PREFLIGHT FAIL':'PRODUCTION PREFLIGHT PASS');process.exit(fail?1:0);
