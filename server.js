const http=require('http');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {URL}=require('url');

const ROOT=__dirname;
const PORT=Number(process.env.PORT||3000);
const DATA_DIR=path.join(ROOT,'data');
const DB_FILE=process.env.DB_PATH||path.join(DATA_DIR,'atelier-v6.json');
const PUBLIC_DIR=path.join(ROOT,'public');
const UPLOAD_DIR=path.join(PUBLIC_DIR,'uploads','media');
const MAX_UPLOAD=Number(process.env.MAX_UPLOAD_BYTES||50*1024*1024);
fs.mkdirSync(DATA_DIR,{recursive:true});fs.mkdirSync(UPLOAD_DIR,{recursive:true});

const DEFAULT_DB={
 settings:{atelierName:'Atelier Natália Huebra',tagline:'Noivas • Festa • Alta-Costura • Sob Encomenda',description:'Um atelier de moda para momentos especiais, com curadoria, atendimento próximo e criações sob encomenda.',phone:'(28) 99983-5920',email:'natytuany@hotmail.com',address:'R. Salomão Fadlalah, 86 — Ibatiba-ES, 29395-000',whatsapp_number:'5528999835920',instagram:'https://www.instagram.com/nataliahuebra',facebook:'https://www.facebook.com/share/1Emdx3eSRE/?mibextid=wwXIfr',youtube:'',primary_color:'#b58a55',light_bg:'#f8f5ef',dark_bg:'#211b17',hero_desktop:'/assets/images/banner-natalia-huebra.webp',hero_mobile:'/assets/images/banner-mobile.webp'},
 users:[],categories:[{id:1,name:'Noivas',active:true},{id:2,name:'Festa',active:true},{id:3,name:'Madrinhas',active:true},{id:4,name:'Debutantes',active:true},{id:5,name:'Formandas',active:true}],
 collections:[{id:1,name:'Noivas',active:true},{id:2,name:'Festa',active:true},{id:3,name:'Exclusivos',active:true}],
 dresses:[
  {id:1,code:'NH-001',name:'Vestido de Noiva Clássico',slug:'vestido-de-noiva-classico',category:'Noivas',collection:'Noivas',mode:'rental',salePrice:0,rentalPrice:1200,size:'38-42',color:'Off-white',fabric:'Renda',status:'published',featured:true,description:'Silhueta elegante com acabamento delicado.',style:'Clássico',length:'Longo',colors:'Off-white',sizes:'38-42',availability:'Disponível para aluguel',alt_text:'Vestido de noiva clássico'},
  {id:2,code:'NH-002',name:'Vestido Princesa Aurora',slug:'vestido-princesa-aurora',category:'Noivas',collection:'Noivas',mode:'sale',salePrice:8900,rentalPrice:0,size:'40',color:'Off-white',fabric:'Tule e renda',status:'published',featured:true,description:'Modelo princesa com presença marcante.',style:'Princesa',length:'Longo',colors:'Off-white',sizes:'40',availability:'Disponível para venda',alt_text:'Vestido princesa Aurora'},
  {id:3,code:'NH-003',name:'Vestido Festa Bella',slug:'vestido-festa-bella',category:'Festa',collection:'Festa',mode:'rental',salePrice:0,rentalPrice:850,size:'38-44',color:'Azul',fabric:'Crepe',status:'published',featured:false,description:'Elegância para eventos especiais.',style:'Elegante',length:'Longo',colors:'Azul',sizes:'38-44',availability:'Disponível para aluguel',alt_text:'Vestido de festa Bella'},
  {id:4,code:'NH-004',name:'Vestido Festa Exclusivo',slug:'vestido-festa-exclusivo',category:'Festa',collection:'Exclusivos',mode:'both',salePrice:4200,rentalPrice:950,size:'40-42',color:'Vinho',fabric:'Zibeline',status:'published',featured:true,description:'Peça exclusiva com acabamento premium.',style:'Exclusivo',length:'Longo',colors:'Vinho',sizes:'40-42',availability:'Venda e aluguel',alt_text:'Vestido festa exclusivo'}
 ],
 media:[],videos:[{id:1,title:'Conheça o Ateliê',description:'Um pouco do universo Natália Huebra.',provider:'local',url:'/assets/videos/690a9253-5940-416f-b3e0-d7b5493af1ee.mp4',status:'published',sort_order:1}],
 clients:[],leads:[],appointments:[],quotes:[],orders:[],measurements:[],payments:[],audit:[]
};

function clone(x){return JSON.parse(JSON.stringify(x));}
function load(){if(!fs.existsSync(DB_FILE)){const legacy=path.join(DATA_DIR,'atelier-v5.json');if(fs.existsSync(legacy)){try{const d=normalize(JSON.parse(fs.readFileSync(legacy,'utf8')));save(d);return d}catch{}}const d=clone(DEFAULT_DB);save(d);return d}try{const d=JSON.parse(fs.readFileSync(DB_FILE,'utf8'));return normalize(d)}catch{return clone(DEFAULT_DB)}}
function normalize(d){const base=clone(DEFAULT_DB);for(const k of Object.keys(base))if(d[k]===undefined)d[k]=base[k];for(const k of ['dresses','clients','leads','appointments','quotes','orders','measurements','payments','media','videos','categories','collections','users','audit'])if(!Array.isArray(d[k]))d[k]=[];return d}
let db=load();
function save(d=db){fs.writeFileSync(DB_FILE,JSON.stringify(d,null,2));}
function next(arr){return arr.length?Math.max(...arr.map(x=>Number(x.id)||0))+1:1}
function hashPassword(password){const salt=crypto.randomBytes(16);const hash=crypto.scryptSync(String(password),salt,64);return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`}
function verifyPassword(password,stored){try{const [,s,h]=String(stored).split(':');const salt=Buffer.from(s,'hex');const expected=crypto.scryptSync(String(password),salt,64);return crypto.timingSafeEqual(expected,Buffer.from(h,'hex'))}catch{return false}}
function ensureAdmin(){if(db.users.length)return; if(process.env.ADMIN_EMAIL&&process.env.ADMIN_PASSWORD){db.users.push({id:1,email:process.env.ADMIN_EMAIL,passwordHash:hashPassword(process.env.ADMIN_PASSWORD),role:'admin',active:true});save()}}
ensureAdmin();
const sessions=new Map();const attempts=new Map();
function parseCookies(req){const out={};for(const part of String(req.headers.cookie||'').split(';')){const i=part.indexOf('=');if(i>0)out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim())}return out}
function currentUser(req){const sid=parseCookies(req).atelier_v6_session;if(!sid)return null;const s=sessions.get(sid);if(!s||s.expires<Date.now()){sessions.delete(sid);return null}return db.users.find(u=>u.id===s.userId&&u.active!==false)||null}
function requireAuth(req,res){const u=currentUser(req);if(!u){json(res,401,{ok:false,error:'Não autenticado'});return null}return u}
function audit(user,action,entity,id,meta={}){db.audit.unshift({id:next(db.audit),created_at:new Date().toISOString(),user_id:user?.id||null,email:user?.email||'system',action,entity,entity_id:id||null,meta});db.audit=db.audit.slice(0,2000)}
function json(res,status,obj){const b=JSON.stringify(obj);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(b)}
function text(res,status,body,content='text/html; charset=utf-8'){res.writeHead(status,{'Content-Type':content,'Cache-Control':'no-store'});res.end(body)}
function readBody(req){return new Promise((resolve,reject)=>{let b=[];let n=0;req.on('data',c=>{n+=c.length;if(n>MAX_UPLOAD+2*1024*1024){reject(new Error('Arquivo ou requisição muito grande'));req.destroy();return}b.push(c)});req.on('end',()=>resolve(Buffer.concat(b)));req.on('error',reject)})}
async function bodyJson(req){const b=await readBody(req);return b.length?JSON.parse(b.toString('utf8')):{}}
function safeName(name){return path.basename(String(name||'arquivo')).replace(/[^a-zA-Z0-9._-]/g,'-').slice(0,120)}
function parseMultipart(buf,contentType){const m=String(contentType).match(/boundary=(?:"([^"]+)"|([^;]+))/i);if(!m)throw new Error('Multipart inválido');const boundary=Buffer.from('--'+(m[1]||m[2]));const parts=[];let pos=0;while((pos=buf.indexOf(boundary,pos))!==-1){pos+=boundary.length;if(buf[pos]===45&&buf[pos+1]===45)break;if(buf[pos]===13&&buf[pos+1]===10)pos+=2;const next=buf.indexOf(boundary,pos);if(next<0)break;let part=buf.slice(pos,next);if(part.slice(-2).toString()==='\r\n')part=part.slice(0,-2);const sep=part.indexOf('\r\n\r\n');if(sep<0)continue;const hs=part.slice(0,sep).toString();const content=part.slice(sep+4);const name=(hs.match(/name="([^"]+)"/i)||[])[1];const filename=(hs.match(/filename="([^"]*)"/i)||[])[1];const type=(hs.match(/Content-Type:\s*([^\r\n]+)/i)||[])[1]||'text/plain';if(name)parts.push({name,filename,type,data:content});pos=next}return parts}
function publicDresses(query){let rows=db.dresses.filter(d=>d.status==='published');if(query.get('category'))rows=rows.filter(d=>String(d.category).toLowerCase()===query.get('category').toLowerCase());if(query.get('mode')){const m=query.get('mode');rows=rows.filter(d=>d.mode===m||d.mode==='both')}return rows.map(enrichDress)}
function enrichDress(d){const media=db.media.filter(m=>m.dress_id===d.id&&m.status!=='hidden').sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));const vids=db.videos.filter(v=>v.dress_id===d.id&&v.status==='published').sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));return {...d,media,videos:vids,photo:media.find(m=>m.is_primary)?.url||media[0]?.url||''}}
function dashboard(){const today=new Date().toISOString().slice(0,10);return {clients:db.clients.length,leads:db.leads.length,appointments:db.appointments.filter(a=>String(a.starts_at||'').slice(0,10)===today).length,products:db.dresses.length,gallery:db.media.length,videos:db.videos.length,orders:db.orders.length,pending:db.payments.filter(p=>p.status!=='paid').reduce((s,p)=>s+Number(p.amount||0),0),sale:db.dresses.filter(d=>d.mode==='sale'||d.mode==='both').length,rental:db.dresses.filter(d=>d.mode==='rental'||d.mode==='both').length}}
function isWrite(req){return ['POST','PUT','PATCH','DELETE'].includes(req.method)}
function originOK(req){const origin=req.headers.origin;if(!origin)return true;try{const u=new URL(origin);return u.host===req.headers.host}catch{return false}}
function serveFile(res,file){if(!fs.existsSync(file)||!fs.statSync(file).isFile())return false;const ext=path.extname(file).toLowerCase();const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp4':'video/mp4','.webm':'video/webm','.mov':'video/quicktime','.txt':'text/plain'}[ext]||'application/octet-stream';res.writeHead(200,{'Content-Type':mime,'Cache-Control':ext==='.html'?'no-cache':'public, max-age=31536000, immutable'});fs.createReadStream(file).pipe(res);return true}

async function route(req,res){
 const u=new URL(req.url,`http://${req.headers.host||'localhost'}`);const p=u.pathname;
 if(p==='/health')return json(res,200,{ok:true,service:'atelier-natalia-huebra',version:'6.0.0',database:fs.existsSync(DB_FILE),storage:fs.existsSync(UPLOAD_DIR)});
 if(p==='/')return serveFile(res,path.join(PUBLIC_DIR,'index.html'))?undefined:json(res,404,{error:'Site indisponível'});
 if(p==='/admin')return serveFile(res,path.join(PUBLIC_DIR,'admin','index.html'))?undefined:json(res,404,{error:'Painel indisponível'});
 if(p==='/api/settings'&&req.method==='GET')return json(res,200,db.settings);
 if(p==='/api/categories'&&req.method==='GET')return json(res,200,db.categories.filter(x=>x.active));
 if(p==='/api/dresses'&&req.method==='GET')return json(res,200,publicDresses(u.searchParams));
 if(p.startsWith('/api/dresses/')&&req.method==='GET'){const slug=decodeURIComponent(p.slice('/api/dresses/'.length));const d=db.dresses.find(x=>x.slug===slug&&x.status==='published');return d?json(res,200,enrichDress(d)):json(res,404,{error:'Vestido não encontrado'})}
 if(p==='/api/videos'&&req.method==='GET')return json(res,200,db.videos.filter(v=>v.status==='published').sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)));
 if(p==='/api/leads'&&req.method==='POST'){const b=await bodyJson(req);if(!b.consent)return json(res,400,{error:'É necessário consentir com o uso dos dados para retorno.'});const x={id:next(db.leads),...b,created_at:new Date().toISOString(),status:'novo'};delete x.password;db.leads.push(x);audit(null,'create','lead',x.id);save();return json(res,201,{ok:true,id:x.id})}
 if((p==='/api/auth/login'||p==='/api/admin/login')&&req.method==='POST'){if(!originOK(req))return json(res,403,{error:'Origem não autorizada'});const b=await bodyJson(req);const email=String(b.email||'').trim().toLowerCase();const key=email||req.socket.remoteAddress||'unknown';const a=attempts.get(key)||{count:0,until:0};if(a.until>Date.now())return json(res,429,{error:'Muitas tentativas. Aguarde alguns minutos.'});const user=db.users.find(x=>x.email.toLowerCase()===email&&x.active!==false);if(!user||!verifyPassword(b.password,user.passwordHash)){a.count++;if(a.count>=5){a.until=Date.now()+5*60*1000;a.count=0}attempts.set(key,a);audit(null,'login_failed','user',user?.id||null,{email});save();return json(res,401,{error:'E-mail ou senha inválidos.'})}attempts.delete(key);const sid=crypto.randomBytes(32).toString('hex');sessions.set(sid,{userId:user.id,expires:Date.now()+8*60*60*1000});audit(user,'login','user',user.id);save();res.setHeader('Set-Cookie',`atelier_v6_session=${encodeURIComponent(sid)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${process.env.NODE_ENV==='production'?'; Secure':''}`);return json(res,200,{ok:true,user:{id:user.id,email:user.email,role:user.role}})}
 if(p==='/api/auth/me'&&req.method==='GET'){const user=currentUser(req);return user?json(res,200,{ok:true,user:{id:user.id,email:user.email,role:user.role}}):json(res,401,{error:'Não autenticado'})}
 if((p==='/api/auth/logout'||p==='/api/admin/logout')&&req.method==='POST'){const sid=parseCookies(req).atelier_v6_session;const user=currentUser(req);if(sid)sessions.delete(sid);res.setHeader('Set-Cookie','atelier_v6_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');if(user){audit(user,'logout','user',user.id);save()}return json(res,200,{ok:true})}
 if(/^\/api\/(clients|leads|appointments|products|gallery|videos|quotes|orders|measurements|payments)(?:\/\d+)?$/.test(p)){
   if(isWrite(req)&&!originOK(req))return json(res,403,{error:'Origem não autorizada'});
   const user=requireAuth(req,res);if(!user)return;
   const m=p.match(/^\/api\/([^/]+)(?:\/(\d+))?$/);const alias={products:'dresses',gallery:'media'};const key=alias[m[1]]||m[1];const id=m[2]?Number(m[2]):null;
   if(req.method==='GET'){let rows=db[key]||[];if(key==='dresses')rows=rows.map(enrichDress);return json(res,200,rows)}
   if(req.method==='POST'){const b=await bodyJson(req);const x={id:next(db[key]),...b,created_at:new Date().toISOString()};if(key==='dresses'){x.slug=x.slug||String(x.name||'vestido').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+x.id;x.mode=x.mode||'rental';x.status=x.status||'published'}db[key].push(x);audit(user,'create',key,x.id);save();return json(res,201,x)}
   if(id&&(req.method==='PUT'||req.method==='PATCH')){const i=(db[key]||[]).findIndex(x=>x.id===id);if(i<0)return json(res,404,{error:'Registro não encontrado'});const b=await bodyJson(req);db[key][i]={...db[key][i],...b,id};if(key==='media'&&b.is_primary){for(const m of db.media)if(m.dress_id===db[key][i].dress_id&&m.id!==id)m.is_primary=false}audit(user,'update',key,id);save();return json(res,200,db[key][i])}
   if(id&&req.method==='DELETE'){const i=(db[key]||[]).findIndex(x=>x.id===id);if(i<0)return json(res,404,{error:'Registro não encontrado'});db[key].splice(i,1);audit(user,'delete',key,id);save();return json(res,200,{ok:true})}
 }
 if(p.startsWith('/api/admin')||p==='/api/dashboard'||p==='/api/audit'||p==='/api/settings'){
   if(isWrite(req)&&!originOK(req))return json(res,403,{error:'Origem não autorizada'});
   const user=requireAuth(req,res);if(!user)return;
   if(p==='/api/dashboard')return json(res,200,dashboard());
   if(p==='/api/audit')return json(res,200,db.audit);
   if((p==='/api/settings'||p==='/api/admin/settings')&&req.method==='GET')return json(res,200,db.settings);
   if((p==='/api/settings'||p==='/api/admin/settings')&&req.method==='PUT'){const b=await bodyJson(req);db.settings={...db.settings,...b};audit(user,'update','settings',null);save();return json(res,200,db.settings)}
   if(p==='/api/admin/me')return json(res,200,{ok:true,user:{id:user.id,email:user.email,role:user.role}});
   if(p==='/api/admin/stats'&&req.method==='GET')return json(res,200,dashboard());
   if(p==='/api/admin/state')return json(res,200,{dashboard:dashboard(),settings:db.settings,dresses:db.dresses,reservations:[],clients:db.clients,leads:db.leads,appointments:db.appointments,categories:db.categories,collections:db.collections});
   if(p==='/api/admin/upload'&&req.method==='POST'){const ct=req.headers['content-type']||'';const parts=parseMultipart(await readBody(req),ct);const f=parts.find(x=>x.name==='file'&&x.filename);const dressId=Number(parts.find(x=>x.name==='dress_id')?.data.toString()||0);if(!f||!dressId)return json(res,400,{error:'Arquivo e vestido são obrigatórios'});if(f.data.length>MAX_UPLOAD)return json(res,413,{error:'Arquivo muito grande'});const ext=path.extname(safeName(f.filename)).toLowerCase();const allowed={'.jpg':'image','.jpeg':'image','.png':'image','.webp':'image','.gif':'image','.mp4':'video','.webm':'video','.mov':'video'};if(!allowed[ext])return json(res,400,{error:'Tipo de arquivo não permitido'});const name=`${Date.now()}-${crypto.randomBytes(5).toString('hex')}${ext}`;fs.writeFileSync(path.join(UPLOAD_DIR,name),f.data);const x={id:next(db.media),dress_id:dressId,url:`/uploads/media/${name}`,type:allowed[ext],alt_text:'',sort_order:0,is_primary:false,status:'published'};db.media.push(x);audit(user,'upload','media',x.id);save();return json(res,201,x)}
   const map={dresses:'dresses',products:'dresses',media:'media',videos:'videos',categories:'categories',collections:'collections',leads:'leads',clients:'clients',appointments:'appointments',quotes:'quotes',orders:'orders',measurements:'measurements',payments:'payments'};
   const match=p.match(/^\/api\/admin\/([^/]+)(?:\/(\d+))?$/);if(match){const key=map[match[1]];if(!key)return json(res,404,{error:'Recurso não encontrado'});const id=match[2]?Number(match[2]):null;
     if(req.method==='GET'){let rows=db[key];if(key==='media'&&u.searchParams.get('dress_id'))rows=rows.filter(x=>x.dress_id===Number(u.searchParams.get('dress_id')));if(key==='dresses')rows=rows.map(enrichDress);return json(res,200,rows)}
     if(req.method==='POST'){const b=await bodyJson(req);const x={id:next(db[key]),...b,created_at:new Date().toISOString()};if(key==='dresses'){x.slug=x.slug||String(x.name||'vestido').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+x.id;x.status=x.status||'published';x.mode=x.mode||'rental';x.featured=!!x.featured}db[key].push(x);audit(user,'create',key,x.id);save();return json(res,201,x)}
     if(id&&(req.method==='PUT'||req.method==='PATCH')){const i=db[key].findIndex(x=>x.id===id);if(i<0)return json(res,404,{error:'Registro não encontrado'});const b=await bodyJson(req);db[key][i]={...db[key][i],...b,id};if(key==='media'&&b.is_primary){for(const m of db.media)if(m.dress_id===db[key][i].dress_id&&m.id!==id)m.is_primary=false}audit(user,'update',key,id);save();return json(res,200,db[key][i])}
     if(id&&req.method==='DELETE'){const i=db[key].findIndex(x=>x.id===id);if(i<0)return json(res,404,{error:'Registro não encontrado'});const old=db[key][i];db[key].splice(i,1);if(key==='dresses')db.media=db.media.filter(m=>m.dress_id!==id);audit(user,'delete',key,id);save();return json(res,200,{ok:true})}
   }
 }
 const rel=p.replace(/^\//,'');const candidates=[path.join(PUBLIC_DIR,rel),path.join(PUBLIC_DIR,'assets',rel.replace(/^assets\//,''))];for(const f of candidates)if(serveFile(res,f))return;
 if(req.method==='GET' && (req.headers.accept||'').includes('text/html')) return serveFile(res,path.join(PUBLIC_DIR,'index.html'))?undefined:json(res,404,{ok:false,error:'Not found'});
 return json(res,404,{ok:false,error:'Not found'});
}
http.createServer((req,res)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','SAMEORIGIN');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('Permissions-Policy','camera=(),microphone=(),geolocation=()');res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data: https:; media-src 'self' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self' 'unsafe-inline'; frame-src https://www.youtube-nocookie.com https://player.vimeo.com");route(req,res).catch(e=>{console.error(e);json(res,500,{ok:false,error:'Erro interno do servidor'})})}).listen(PORT,()=>console.log(`Atelier V6 listening on ${PORT}`));
