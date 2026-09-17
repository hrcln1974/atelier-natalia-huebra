const http=require('http');
const base=`http://127.0.0.1:${process.env.GATE_PORT||3314}`;
function request(path,options={}){return new Promise((resolve,reject)=>{const req=http.request(base+path,{...options},res=>{let body='';res.on('data',c=>body+=c);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}));});req.on('error',reject);if(options.body)req.write(options.body);req.end()})}
(async()=>{
 let r=await request('/api/health'); if(r.status!==200)throw new Error(`/api/health ${r.status}`); let h=JSON.parse(r.body); if(h.status!=='ok'||h.database!==true)throw new Error('health sem banco');
 for(const p of ['/api/settings','/api/categories','/api/collections','/api/dresses','/api/videos']){r=await request(p);if(r.status!==200)throw new Error(`${p} ${r.status}`)}
 const bad=await request('/api/admin/stats');if(bad.status!==401)throw new Error(`auth negativa retornou ${bad.status}`);
 const payload=JSON.stringify({email:process.env.E2E_ADMIN_EMAIL||process.env.ADMIN_EMAIL,password:process.env.E2E_ADMIN_PASSWORD||process.env.ADMIN_PASSWORD});
 r=await request('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(payload)},body:payload});
 if(r.status!==200)throw new Error(`login ${r.status}`);
 const cookie=(r.headers['set-cookie']||[])[0];if(!cookie)throw new Error('cookie ausente');
 r=await request('/api/admin/me',{headers:{Cookie:cookie.split(';')[0]}});if(r.status!==200)throw new Error(`/api/admin/me ${r.status}`);
 console.log('E2E V14 PASS: health, APIs públicas, 401, login, sessão e /me');
})().catch(e=>{console.error('E2E V14 FAIL:',e.message);process.exit(1)});
