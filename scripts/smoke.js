'use strict';
const fs=require('fs'),http=require('http'),{spawn}=require('child_process');
const path=require('path');
const port=37892, db=path.join(__dirname,'..','data','smoke-db.json');
try{fs.unlinkSync(db)}catch{}
const email='smoke@atelier.local',password='Smoke@123456';
const s=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:String(port),NODE_ENV:'test',DB_PATH:db,ADMIN_EMAIL:email,ADMIN_PASSWORD:password},stdio:['ignore','pipe','pipe']});
let output=''; s.stdout.on('data',d=>output+=d); s.stderr.on('data',d=>output+=d);
function req(method,p,body,cookie=''){return new Promise((resolve,reject)=>{let data=body===undefined?null:Buffer.from(JSON.stringify(body));const r=http.request({hostname:'127.0.0.1',port,path:p,method,headers:{...(data?{'Content-Type':'application/json','Content-Length':data.length}:{}),...(cookie?{'Cookie':cookie}:{})}},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>resolve({status:x.statusCode,headers:x.headers,body:d}))});r.on('error',reject);if(data)r.write(data);r.end()})}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{try{
 await wait(600);
 for(const p of ['/health','/','/admin','/assets/banner-natalia-huebra.webp','/assets/banner-natalia-huebra-mobile.webp','/videos/video1.mp4']){const r=await req('GET',p);if(r.status!==200)throw Error(`${p} HTTP ${r.status}`);console.log('OK',p,r.status)}
 let r=await req('GET','/api/public'); if(r.status!==200)throw Error('/api/public'); let pub=JSON.parse(r.body); if(pub.products.length<3||pub.gallery.length<5||pub.videos.length<4)throw Error('seed público incompleto'); console.log(`OK API pública ${pub.products.length} produtos, ${pub.gallery.length} fotos, ${pub.videos.length} vídeos`);
 r=await req('POST','/api/auth/login',{email,password}); if(r.status!==200)throw Error('login'); const cookie=r.headers['set-cookie']?.[0]?.split(';')[0]; if(!cookie)throw Error('cookie ausente'); console.log('OK login');
 r=await req('GET','/api/auth/me',undefined,cookie);if(r.status!==200)throw Error('me');console.log('OK sessão');
 r=await req('POST','/api/products',{name:'Smoke Produto',category:'Teste',status:'disponivel',image:'assets/catalogo-vestido-1.webp'},cookie);if(r.status!==201)throw Error('produto create');const pid=JSON.parse(r.body).id; console.log('OK painel → banco produto');
 r=await req('PUT','/api/products/'+pid,{name:'Smoke Produto Editado',status:'inativo'},cookie);if(r.status!==200)throw Error('produto edit');
 r=await req('DELETE','/api/products/'+pid,undefined,cookie);if(r.status!==200)throw Error('produto delete'); console.log('OK CRUD produto');
 r=await req('POST','/api/gallery',{title:'Smoke Galeria',category:'teste',url:'assets/modelo-1.webp',caption:'teste',status:'publicado',order:99},cookie);if(r.status!==201)throw Error('gallery create');const gid=JSON.parse(r.body).id;pub=JSON.parse((await req('GET','/api/public')).body);if(!pub.gallery.some(x=>x.id===gid))throw Error('gallery não chegou ao público');await req('DELETE','/api/gallery/'+gid,undefined,cookie);console.log('OK integração galeria');
 r=await req('POST','/api/videos',{title:'Smoke Vídeo',category:'teste',url:'videos/video1.mp4',caption:'teste',type:'local',status:'publicado',order:99},cookie);if(r.status!==201)throw Error('video create');const vid=JSON.parse(r.body).id;pub=JSON.parse((await req('GET','/api/public')).body);if(!pub.videos.some(x=>x.id===vid))throw Error('video não chegou ao público');await req('DELETE','/api/videos/'+vid,undefined,cookie);console.log('OK integração vídeos');
 r=await req('PUT','/api/settings',{phone:'(28) 99983-5920',email:'natytuany@hotmail.com'},cookie);if(r.status!==200)throw Error('settings');console.log('OK configurações');
 console.log('SMOKE TEST PASS — V3.2.0 unificada: site + painel + API + banco + conteúdo público');
 s.kill();try{fs.unlinkSync(db)}catch{}process.exit(0)
}catch(e){console.error('SMOKE FAIL',e.message);console.error(output);s.kill();try{fs.unlinkSync(db)}catch{}process.exit(1)}})();
