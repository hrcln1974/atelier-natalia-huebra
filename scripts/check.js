'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const required=['index.html','style.css','script.js','server.js','package.json','.env.example','robots.txt','sitemap.xml','public/admin/index.html','assets/banner-natalia-huebra.webp','assets/banner-natalia-huebra-mobile.webp','assets/catalogo-vestido-1.webp','assets/catalogo-vestido-2.webp','assets/catalogo-vestido-3.webp','assets/modelo-1.webp','assets/noiva-renda.webp','assets/noiva-2.webp','assets/atelie-1.webp','assets/atelie-2.webp','videos/video1.mp4','videos/video2.mp4','videos/video3.mp4'];
let ok=true;
for(const f of required){if(fs.existsSync(path.join(root,f))) console.log('OK',f); else {console.error('MISSING',f);ok=false}}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const refs=[...html.matchAll(/(?:src|href|srcset|data-full)=["']([^"']+)["']/g)].map(m=>m[1]).filter(x=>/^(assets|videos)\//.test(x));
for(const ref of refs){if(!fs.existsSync(path.join(root,ref))) {console.error('BROKEN REF',ref);ok=false}}
if(!html.includes('href="/admin"')||!html.includes('Painel')){console.error('MISSING admin link');ok=false}
if(ok) console.log('PREFLIGHT V3.2.0 OK — site principal + painel unificados'); else process.exit(1);
