const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = process.env.DB_PATH || path.join(DATA_DIR, 'atelier-v4.json');
const UPLOAD_DIR = path.join(ROOT, 'storage', 'uploads');
const PUBLIC = ROOT;

fs.mkdirSync(DATA_DIR, {recursive:true});
fs.mkdirSync(UPLOAD_DIR, {recursive:true});

const DEFAULT_DB = {
  settings: {
    atelierName: 'Atelier Natália Huebra',
    slogan: 'Realizando sonhos, criando momentos inesquecíveis.',
    phone: '(28) 99983-5920',
    email: 'natytuany@hotmail.com',
    address: 'R. Salomão Fadlalah, 86, Ibatiba - ES, 29395-000',
    instagram: 'https://www.instagram.com/nataliahuebra',
    facebook: 'https://www.facebook.com/share/1Emdx3eSRE/?mibextid=wwXIfr',
    whatsapp: '5528999835920'
  },
  users: [],
  dresses: [
    {id:1, code:'NH-001', name:'Vestido de Noiva Clássico', category:'Noiva', collection:'Noivas', mode:'aluguel', salePrice:0, rentalPrice:1200, size:'38-42', color:'Off-white', fabric:'Renda', status:'available', featured:true, description:'Silhueta elegante com acabamento delicado.', image:'assets/noiva-renda.webp'},
    {id:2, code:'NH-002', name:'Vestido Princesa Aurora', category:'Noiva', collection:'Noivas', mode:'venda', salePrice:8900, rentalPrice:0, size:'40', color:'Off-white', fabric:'Tule e renda', status:'available', featured:true, description:'Modelo princesa com presença marcante.', image:'assets/catalogo-vestido-1.webp'},
    {id:3, code:'NH-003', name:'Vestido Festa Bella', category:'Festa', collection:'Festa', mode:'aluguel', salePrice:0, rentalPrice:850, size:'38-44', color:'Azul', fabric:'Crepe', status:'available', featured:false, description:'Elegância para eventos especiais.', image:'assets/catalogo-vestido-2.webp'},
    {id:4, code:'NH-004', name:'Vestido Festa Exclusivo', category:'Festa', collection:'Festa', mode:'venda_aluguel', salePrice:4200, rentalPrice:950, size:'40-42', color:'Vinho', fabric:'Zibeline', status:'available', featured:true, description:'Peça exclusiva com acabamento premium.', image:'assets/catalogo-vestido-3.webp'}
  ],
  categories: [
    {id:1,name:'Noiva',active:true},{id:2,name:'Festa',active:true},{id:3,name:'Debutante',active:true},{id:4,name:'Madrinhas',active:true},{id:5,name:'Damas',active:true}
  ],
  collections: [{id:1,name:'Noivas',active:true},{id:2,name:'Festa',active:true},{id:3,name:'Exclusivos',active:true}],
  reservations: [],
  clients: [],
  leads: [],
  appointments: [],
  media: [],
  audit: []
};

function load(){
  if(!fs.existsSync(DB_FILE)){
    const db=JSON.parse(JSON.stringify(DEFAULT_DB));
    const adminPass=process.env.ADMIN_PASSWORD;
    if(adminPass){
      db.users.push({id:1,email:process.env.ADMIN_EMAIL||'admin@atelier-nataliahuebra.com',passwordHash:sha(adminPass),role:'admin'});
    }
    save(db);
    return db;
  }
  try{return JSON.parse(fs.readFileSync(DB_FILE,'utf8'))}catch(e){return JSON.parse(JSON.stringify(DEFAULT_DB))}
}
let db=load();
function save(d){fs.writeFileSync(DB_FILE,JSON.stringify(d,null,2));}
function sha(s){return crypto.createHash('sha256').update(String(s)).digest('hex')}
function next(arr){return arr.length?Math.max(...arr.map(x=>Number(x.id)||0))+1:1}
function json(res,status,obj){const b=JSON.stringify(obj);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(b)}
function body(req){return new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c});req.on('end',()=>{try{resolve(s?JSON.parse(s):{})}catch(e){reject(e)}});req.on('error',reject)})}
function safe(s){return String(s||'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]))}
function publicData(){
  return {settings:db.settings,dresses:db.dresses,categories:db.categories.filter(x=>x.active),collections:db.collections.filter(x=>x.active),media:db.media};
}
function dashboard(){
  const sale=db.dresses.filter(d=>d.mode==='venda'||d.mode==='venda_aluguel').length;
  const rental=db.dresses.filter(d=>d.mode==='aluguel'||d.mode==='venda_aluguel').length;
  const available=db.dresses.filter(d=>d.status==='available').length;
  const reserved=db.reservations.filter(r=>r.status==='reserved').length;
  return {dresses:db.dresses.length,sale,rental,available,reserved,clients:db.clients.length,leads:db.leads.length,appointments:db.appointments.length,
    salesRevenue:db.reservations.filter(r=>r.type==='sale').reduce((a,r)=>a+Number(r.value||0),0),
    rentalRevenue:db.reservations.filter(r=>r.type==='rental').reduce((a,r)=>a+Number(r.value||0),0)};
}
function auth(req){return req.headers['x-admin-token']==='atelier-v4-local-session'}
const sessions=new Set();

const ADMIN_HTML = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Painel | Atelier Natália Huebra</title><style>
*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;background:#f6f3ef;color:#211d1a}button,input,select,textarea{font:inherit}.app{display:flex;min-height:100vh}.side{width:255px;background:#201b18;color:#fff;padding:22px 16px;position:sticky;top:0;height:100vh}.brand{font-family:Georgia,serif;font-size:22px;margin:4px 8px 24px}.nav button{display:block;width:100%;border:0;background:transparent;color:#ddd;text-align:left;padding:12px 14px;border-radius:10px;margin:4px 0;cursor:pointer}.nav button.active,.nav button:hover{background:#3a302a;color:#fff}.main{flex:1;padding:28px;max-width:1400px;margin:auto}.top{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:24px}.top h1{font-family:Georgia,serif;font-weight:500;margin:0}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}.card{background:#fff;border:1px solid #e7dfd7;border-radius:16px;padding:18px;box-shadow:0 8px 30px #00000008}.kpi{font-size:28px;font-weight:700;margin-top:8px}.muted{color:#756b63;font-size:13px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}.panel{background:#fff;border:1px solid #e7dfd7;border-radius:16px;padding:18px;margin-top:18px}.toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}input,select,textarea{width:100%;border:1px solid #d9cec4;border-radius:9px;padding:10px;background:#fff}textarea{min-height:90px}.btn{border:0;border-radius:9px;padding:10px 14px;cursor:pointer;background:#241f1b;color:#fff}.btn.alt{background:#eee6df;color:#241f1b}.table{width:100%;border-collapse:collapse}.table th,.table td{padding:11px;border-bottom:1px solid #eee;text-align:left;font-size:14px}.badge{display:inline-block;padding:5px 8px;border-radius:999px;background:#eee6df;font-size:12px}.hide{display:none}.formgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.formgrid .full{grid-column:1/-1}@media(max-width:800px){.side{width:70px;padding:14px 8px}.brand{font-size:0}.brand:first-letter{font-size:22px}.nav button{font-size:0;text-align:center}.nav button:first-letter{font-size:18px}.main{padding:16px}.formgrid{grid-template-columns:1fr}.top{align-items:flex-start;flex-direction:column}.table{display:block;overflow:auto;white-space:nowrap}}</style></head><body><div class="app"><aside class="side"><div class="brand">Atelier Natália Huebra</div><div class="nav"><button data-view="dashboard" class="active">📊 Dashboard</button><button data-view="dresses">👗 Vestidos</button><button data-view="sale">💎 Venda</button><button data-view="rental">🔑 Aluguel</button><button data-view="reservations">📅 Reservas</button><button data-view="clients">👤 Clientes</button><button data-view="leads">💬 Leads</button><button data-view="settings">⚙️ Configurações</button></div></aside><main class="main"><div class="top"><div><h1 id="title">Dashboard</h1><div class="muted">Gestão premium do Atelier</div></div><a class="btn alt" href="/">← Ver site público</a></div><section id="content"></section></main></div><script>
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let data={};
async function api(p,o={}){const r=await fetch(p,{...o,headers:{'Content-Type':'application/json','x-admin-token':'atelier-v4-local-session',...(o.headers||{})}});return r.json()}
async function load(){data=await api('/api/admin/state');render('dashboard')}
function render(v){
  document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
  $('#title').textContent={dashboard:'Dashboard',dresses:'Vestidos',sale:'Catálogo de Venda',rental:'Catálogo de Aluguel',reservations:'Reservas',clients:'Clientes',leads:'Leads',settings:'Configurações'}[v]||v;
  if(v==='dashboard') return dash(); if(v==='dresses'||v==='sale'||v==='rental') return dresses(v); if(v==='reservations') return reservations(); if(v==='clients') return simple('clients','Clientes'); if(v==='leads') return simple('leads','Leads'); if(v==='settings') return settings();
}
function dash(){let d=data.dashboard;$('#content').innerHTML='<div class="cards">'+[['Vestidos',d.dresses],['À venda',d.sale],['Para aluguel',d.rental],['Disponíveis',d.available],['Reservas',d.reserved],['Clientes',d.clients],['Leads',d.leads],['Provas',d.appointments]].map(x=>'<div class="card"><div class="muted">'+x[0]+'</div><div class="kpi">'+x[1]+'</div></div>').join('')+'</div><div class="grid"><div class="panel"><h3>Receita de vendas</h3><strong>R$ '+Number(d.salesRevenue).toLocaleString('pt-BR',{minimumFractionDigits:2})+'</strong></div><div class="panel"><h3>Receita de aluguéis</h3><strong>R$ '+Number(d.rentalRevenue).toLocaleString('pt-BR',{minimumFractionDigits:2})+'</strong></div></div>'}
function dresses(v){let list=data.dresses.filter(x=>v==='sale'?(x.mode==='venda'||x.mode==='venda_aluguel'):v==='rental'?(x.mode==='aluguel'||x.mode==='venda_aluguel'):true);$('#content').innerHTML='<div class="panel"><div class="toolbar"><button class="btn" onclick="newDress()">+ Novo vestido</button></div><table class="table"><thead><tr><th>Código</th><th>Vestido</th><th>Categoria</th><th>Modalidade</th><th>Venda</th><th>Aluguel</th><th>Status</th></tr></thead><tbody>'+list.map(x=>'<tr><td>'+esc(x.code)+'</td><td><b>'+esc(x.name)+'</b><br><span class="muted">'+esc(x.size||'')+'</span></td><td>'+esc(x.category)+'</td><td><span class="badge">'+x.mode+'</span></td><td>R$ '+Number(x.salePrice||0).toLocaleString('pt-BR')+'</td><td>R$ '+Number(x.rentalPrice||0).toLocaleString('pt-BR')+'</td><td>'+esc(x.status)+'</td></tr>').join('')+'</tbody></table></div>'}
function newDress(){let name=prompt('Nome do vestido');if(!name)return;let mode=prompt('Modalidade: venda, aluguel ou venda_aluguel','aluguel');let sale=Number(prompt('Preço de venda','0')||0), rental=Number(prompt('Valor do aluguel','0')||0);api('/api/admin/dresses',{method:'POST',body:JSON.stringify({name,mode,salePrice:sale,rentalPrice:rental,category:'Festa',status:'available'})}).then(load)}
function reservations(){let r=data.reservations;$('#content').innerHTML='<div class="panel"><button class="btn" onclick="newReservation()">+ Nova reserva</button><table class="table"><thead><tr><th>Cliente</th><th>Vestido</th><th>Tipo</th><th>Data</th><th>Valor</th><th>Status</th></tr></thead><tbody>'+r.map(x=>'<tr><td>'+esc(x.clientName)+'</td><td>'+esc(x.dressName)+'</td><td>'+x.type+'</td><td>'+esc(x.date)+'</td><td>R$ '+Number(x.value||0).toLocaleString('pt-BR')+'</td><td>'+esc(x.status)+'</td></tr>').join('')+'</tbody></table></div>'}
function newReservation(){let client=prompt('Nome da cliente');if(!client)return;let dress=prompt('Código do vestido');let type=prompt('Tipo: rental ou sale','rental');let date=prompt('Data (AAAA-MM-DD)');let value=Number(prompt('Valor','0')||0);api('/api/admin/reservations',{method:'POST',body:JSON.stringify({clientName:client,dressCode:dress,type,date,value,status:'reserved'})}).then(load)}
function simple(key,title){let a=data[key]||[];$('#content').innerHTML='<div class="panel"><h3>'+title+'</h3><p class="muted">'+a.length+' registros</p><table class="table"><tbody>'+a.map(x=>'<tr><td>'+esc(x.name||x.email||x.message||'Registro')+'</td><td>'+esc(x.phone||x.status||'')+'</td></tr>').join('')+'</tbody></table></div>'}
function settings(){let s=data.settings;$('#content').innerHTML='<div class="panel"><div class="formgrid">'+['atelierName','slogan','phone','email','address','instagram','facebook','whatsapp'].map(k=>'<label>'+k+'<input id="s_'+k+'" value="'+esc(s[k]||'')+'"></label>').join('')+'</div><br><button class="btn" onclick="saveSettings()">Salvar configurações</button></div>'}
function saveSettings(){let s={};Object.keys(data.settings).forEach(k=>s[k]=$('#s_'+k)?.value??data.settings[k]);api('/api/admin/settings',{method:'PUT',body:JSON.stringify(s)}).then(load)}
document.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>render(b.dataset.view));load();
</script></body></html>`;

const PUBLIC_HTML = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Atelier Natália Huebra | Moda & Elegância</title><meta name="description" content="Atelier Natália Huebra — vestidos de noiva, festa e peças especiais para venda e aluguel."><link rel="icon" href="/assets/icon.png"><style>
*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;color:#29231f;background:#fcfaf8}a{text-decoration:none;color:inherit}.hero{min-height:70vh;display:grid;place-items:center;text-align:center;padding:70px 20px;background:linear-gradient(#0006,#0006),url('/assets/banner-natalia-huebra.webp') center/cover}.hero h1{font:500 clamp(42px,7vw,82px) Georgia,serif;color:#fff;margin:0 0 14px}.hero p{color:#fff;font-size:18px;max-width:700px;margin:auto}.cta{display:inline-block;background:#fff;color:#2a231f;padding:13px 20px;border-radius:999px;margin-top:24px}.nav{position:sticky;top:0;background:#fffdfcf2;backdrop-filter:blur(12px);padding:14px;text-align:center;border-bottom:1px solid #eee;z-index:5}.nav a{margin:0 10px;font-size:14px}.wrap{max-width:1200px;margin:auto;padding:50px 20px}.section-title{text-align:center;font:500 38px Georgia,serif}.filters{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin:25px 0}.filters button{border:1px solid #ddd0c5;background:#fff;padding:9px 14px;border-radius:999px;cursor:pointer}.catalog{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:22px}.dress{background:#fff;border:1px solid #eadfd7;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px #00000008}.dress img{width:100%;aspect-ratio:4/5;object-fit:cover}.dress .body{padding:16px}.tag{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#806b5b}.price{font-size:20px;margin-top:9px}.actions{display:flex;gap:8px;margin-top:14px}.actions a{flex:1;text-align:center;border-radius:9px;padding:10px;background:#28221e;color:#fff;font-size:13px}.actions a.alt{background:#eee6df;color:#28221e}.about{background:#f2ece7}.footer{padding:35px 20px;text-align:center;border-top:1px solid #eadfd7}.panel-link{display:inline-block;margin-top:12px;font-size:12px;color:#77695f}@media(max-width:650px){.nav a{display:inline-block;margin:5px 7px}.hero{min-height:62vh;background-image:linear-gradient(#0006,#0006),url('/assets/banner-natalia-huebra-mobile.webp')}} </style></head><body><nav class="nav"><a href="#inicio">Início</a><a href="#catalogo">Vestidos</a><a href="#sobre">Atelier</a><a href="#contato">Contato</a><a href="/admin">🔒 Painel</a></nav><section id="inicio" class="hero"><div><h1>Atelier Natália Huebra</h1><p>Moda, elegância e atendimento personalizado para momentos inesquecíveis.</p><a class="cta" href="#catalogo">Conhecer vestidos</a></div></section><section id="catalogo" class="wrap"><h2 class="section-title">Catálogo</h2><div class="filters"><button onclick="show('all')">Todos</button><button onclick="show('sale')">À venda</button><button onclick="show('rental')">Para aluguel</button></div><div id="catalog" class="catalog"></div></section><section id="sobre" class="about"><div class="wrap"><h2 class="section-title">O Atelier</h2><p style="max-width:760px;margin:auto;text-align:center;line-height:1.8">Um espaço dedicado a transformar escolhas especiais em experiências inesquecíveis, com curadoria de vestidos, atendimento próximo e peças para venda e aluguel.</p></div></section><section id="contato" class="wrap" style="text-align:center"><h2 class="section-title">Fale conosco</h2><p id="contact"></p><a id="wa" class="cta" href="#">Falar pelo WhatsApp</a></section><footer class="footer">Atelier Natália Huebra · Ibatiba - ES<br><a class="panel-link" href="/admin">Acesso administrativo</a></footer><script>
let all=[];async function init(){let r=await fetch('/api/public');let d=await r.json();all=d.dresses||[];document.getElementById('contact').textContent=d.settings.phone+' · '+d.settings.email+' · '+d.settings.address;document.getElementById('wa').href='https://wa.me/'+String(d.settings.whatsapp).replace(/\\D/g,'');show('all')}
function show(f){let a=all.filter(x=>f==='all'||(f==='sale'?(x.mode==='venda'||x.mode==='venda_aluguel'):(x.mode==='aluguel'||x.mode==='venda_aluguel')));document.getElementById('catalog').innerHTML=a.map(x=>'<article class="dress"><img src="/'+x.image+'" alt="'+x.name+'"><div class="body"><div class="tag">'+x.category+' · '+x.mode.replace('_',' + ')+'</div><h3>'+x.name+'</h3><div class="price">'+(x.mode==='venda'?'R$ '+Number(x.salePrice).toLocaleString('pt-BR'):x.mode==='aluguel'?'Aluguel · R$ '+Number(x.rentalPrice).toLocaleString('pt-BR'):'Venda · R$ '+Number(x.salePrice).toLocaleString('pt-BR')+'<br>Aluguel · R$ '+Number(x.rentalPrice).toLocaleString('pt-BR'))+'</div><div class="actions"><a href="https://wa.me/5528999835920?text='+encodeURIComponent('Olá! Tenho interesse no '+x.name+' ('+x.code+').')+'">Tenho interesse</a></div></div></article>').join('')}
init();
</script></body></html>`;

async function route(req,res){
  const u=url.parse(req.url,true), p=u.pathname;
  if(p==='/health') return json(res,200,{ok:true,service:'atelier-natalia-huebra',version:'4.0.0'});
  if(p==='/api/public') return json(res,200,publicData());
  if(p==='/') {res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(PUBLIC_HTML)}
  if(p==='/admin') {res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(ADMIN_HTML)}
  if(p.startsWith('/api/admin/')){
    if(p==='/api/admin/login' && req.method==='POST'){sessions.add('atelier-v4-local-session');return json(res,200,{ok:true,token:'atelier-v4-local-session'})}
    if(!auth(req)) return json(res,401,{ok:false,error:'Não autenticado'});
    if(p==='/api/admin/state') return json(res,200,{dashboard:dashboard(),settings:db.settings,dresses:db.dresses,reservations:db.reservations,clients:db.clients,leads:db.leads,appointments:db.appointments,categories:db.categories,collections:db.collections});
    if(p==='/api/admin/dresses' && req.method==='POST'){const b=await body(req);const x={id:next(db.dresses),code:b.code||('NH-'+String(next(db.dresses)).padStart(3,'0')),name:b.name||'Novo vestido',category:b.category||'Festa',collection:b.collection||'',mode:b.mode||'aluguel',salePrice:Number(b.salePrice||0),rentalPrice:Number(b.rentalPrice||0),size:b.size||'',color:b.color||'',fabric:b.fabric||'',status:b.status||'available',featured:!!b.featured,description:b.description||'',image:b.image||''};db.dresses.push(x);db.audit.push({at:new Date().toISOString(),action:'create_dress',id:x.id});save(db);return json(res,201,x)}
    if(p==='/api/admin/reservations' && req.method==='POST'){const b=await body(req);const x={id:next(db.reservations),clientName:b.clientName||'',dressCode:b.dressCode||'',dressName:(db.dresses.find(d=>d.code===b.dressCode)||{}).name||'',type:b.type||'rental',date:b.date||'',value:Number(b.value||0),status:b.status||'reserved'};db.reservations.push(x);db.audit.push({at:new Date().toISOString(),action:'create_reservation',id:x.id});save(db);return json(res,201,x)}
    if(p==='/api/admin/settings' && req.method==='PUT'){const b=await body(req);db.settings={...db.settings,...b};save(db);return json(res,200,db.settings)}
  }
  if(p.startsWith('/assets/')||p.startsWith('/videos/')||p.startsWith('/storage/')){const f=path.join(ROOT,p);if(fs.existsSync(f)&&fs.statSync(f).isFile()){return fs.createReadStream(f).pipe(res)}}
  // serve original static files as fallback, preserving media/site assets
  const file=path.join(ROOT,p.replace(/^\/+/,''));
  if(fs.existsSync(file)&&fs.statSync(file).isFile()){res.writeHead(200,{'Content-Type':mime(file)});return fs.createReadStream(file).pipe(res)}
  return json(res,404,{ok:false,error:'Not found'});
}
function mime(f){const e=path.extname(f).toLowerCase();return {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp4':'video/mp4','.webm':'video/webm'}[e]||'application/octet-stream'}
http.createServer((req,res)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','SAMEORIGIN');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');route(req,res).catch(e=>json(res,500,{ok:false,error:e.message}))}).listen(PORT,()=>console.log('Atelier V4 listening on '+PORT));
