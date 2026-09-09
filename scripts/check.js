const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const required=['server.js','package.json','.env.example','README.md','public/index.html','public/style.css','public/app.js','public/robots.txt','public/sitemap.xml','docs/DEPLOY-HOSTINGER.md'];
let fail=0;for(const f of required){if(fs.existsSync(path.join(root,f)))console.log('✓',f);else{console.log('✗',f);fail++}}
for(const dir of ['public/assets/images','public/assets/videos','scripts','docs']){if(fs.existsSync(path.join(root,dir)))console.log('✓',dir);else{console.log('✗',dir);fail++}}
console.log(fail?'PREFLIGHT FAIL':'PREFLIGHT OK — PROJETO PRONTO PARA INSTALAÇÃO');process.exit(fail?1:0);
