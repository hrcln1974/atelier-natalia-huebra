const http=require('http'),fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const root=path.join(__dirname,'..'),port=38179,db=path.join(root,'data','smoke-v5.json');
const child=spawn(process.execPath,[path.join(root,'server.js')],{env:{...process.env,PORT:String(port),DB_PATH:db,ADMIN_EMAIL:'admin@teste.local',ADMIN_PASSWORD:'SmokePass-2026!'}});
function req(p,method='GET',body=null,cookie=''){return new Promise((resolve,reject)=>{const r=http.request({hostname:'127.0.0.1',port,path:p,method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})}},res=>{let s='';res.on('data',c=>s+=c);res.on('end',()=>resolve({status:res.statusCode,body:s,headers:res.headers}))});r.on('error',reject);if(body)r.write(JSON.stringify(body));r.end()})}
(async()=>{await new Promise(r=>setTimeout(r,500));
 let a=await req('/health');if(a.status!==200)throw Error('health');
 a=await req('/');if(a.status!==200)throw Error('site');
 a=await req('/admin');if(a.status!==200)throw Error('admin');
 a=await req('/api/dresses?mode=sale');if(a.status!==200||!JSON.parse(a.body).length)throw Error('sale catalog');
 a=await req('/api/dresses?mode=rental');if(a.status!==200||!JSON.parse(a.body).length)throw Error('rental catalog');
 a=await req('/api/auth/me');if(a.status!==401)throw Error('unauthenticated access allowed');
 a=await req('/api/clients');if(a.status!==401)throw Error('api unauthenticated');
 a=await req('/api/auth/login','POST',{email:'admin@teste.local',password:'wrong'});if(a.status!==401)throw Error('wrong password accepted');
 a=await req('/api/auth/login','POST',{email:'admin@teste.local',password:'SmokePass-2026!'});if(a.status!==200)throw Error('login');
 const cookie=(a.headers['set-cookie']||[])[0].split(';')[0];
 a=await req('/api/auth/me','GET',null,cookie);if(a.status!==200)throw Error('session');
 a=await req('/api/clients','POST',{name:'Smoke Cliente',phone:'28999999999'},cookie);if(a.status!==201)throw Error('client create');
 const c=JSON.parse(a.body);
 a=await req('/api/clients/'+c.id,'PUT',{notes:'ok'},cookie);if(a.status!==200)throw Error('client update');
 a=await req('/api/products','POST',{name:'Smoke Venda',mode:'sale',salePrice:1000,status:'published'},cookie);if(a.status!==201)throw Error('product create');
 a=await req('/api/audit','GET',null,cookie);if(a.status!==200||JSON.parse(a.body).length<2)throw Error('audit');
 a=await req('/api/auth/logout','POST',null,cookie);if(a.status!==200)throw Error('logout');
 a=await req('/api/auth/me','GET',null,cookie);if(a.status!==401)throw Error('logout failed');
 child.kill();fs.rmSync(db,{force:true});console.log('SMOKE V5 PASS — site + admin + login + session + CRUD + sale/rental + audit');
})().catch(e=>{console.error('SMOKE V5 FAIL',e);child.kill();fs.rmSync(db,{force:true});process.exit(1)})
