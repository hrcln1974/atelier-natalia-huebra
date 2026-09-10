require('dotenv').config();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DB_PATH = path.resolve(ROOT, process.env.DB_PATH || './data/atelier.db');
const MEDIA_ROOT = path.resolve(ROOT, process.env.MEDIA_ROOT || './public/assets/uploads');
const SITE_URL = String(process.env.SITE_URL || 'http://localhost:' + PORT).replace(/\/$/, '');
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'development-only-change-me');
if (!JWT_SECRET) throw new Error('JWT_SECRET é obrigatório em produção.');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
fs.mkdirSync(MEDIA_ROOT, { recursive: true });

const db = new sqlite3.Database(DB_PATH);
const run = (sql, params=[]) => new Promise((resolve,reject)=>db.run(sql,params,function(err){err?reject(err):resolve(this)}));
const all = (sql, params=[]) => new Promise((resolve,reject)=>db.all(sql,params,(err,rows)=>err?reject(err):resolve(rows)));
const get = (sql, params=[]) => new Promise((resolve,reject)=>db.get(sql,params,(err,row)=>err?reject(err):resolve(row)));
const slugify = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,100);
const json = (v, fallback=[]) => { try{return v?JSON.parse(v):fallback}catch{return fallback} };
const clean = (v,max=5000) => String(v??'').trim().slice(0,max);

async function initDb(){
  await run(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'admin',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  await run(`CREATE TABLE IF NOT EXISTS dresses(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,slug TEXT UNIQUE NOT NULL,description TEXT,category TEXT,collection TEXT,style TEXT,length TEXT,colors TEXT,sizes TEXT,availability TEXT,price TEXT,photo TEXT,video TEXT,featured INTEGER DEFAULT 0,status TEXT DEFAULT 'published',sort_order INTEGER DEFAULT 0,seo_title TEXT,seo_description TEXT,alt_text TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  await run(`CREATE TABLE IF NOT EXISTS media(id INTEGER PRIMARY KEY AUTOINCREMENT,dress_id INTEGER,type TEXT NOT NULL DEFAULT 'image',url TEXT NOT NULL,alt_text TEXT DEFAULT '',title TEXT DEFAULT '',sort_order INTEGER DEFAULT 0,is_primary INTEGER DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(dress_id) REFERENCES dresses(id) ON DELETE CASCADE)`);
  await run(`CREATE TABLE IF NOT EXISTS videos(id INTEGER PRIMARY KEY AUTOINCREMENT,dress_id INTEGER,title TEXT,description TEXT,url TEXT NOT NULL,provider TEXT NOT NULL DEFAULT 'external',thumbnail TEXT DEFAULT '',sort_order INTEGER DEFAULT 0,featured INTEGER DEFAULT 0,status TEXT DEFAULT 'published',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(dress_id) REFERENCES dresses(id) ON DELETE SET NULL)`);
  await run(`CREATE TABLE IF NOT EXISTS categories(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT UNIQUE NOT NULL,slug TEXT UNIQUE NOT NULL,description TEXT DEFAULT '',sort_order INTEGER DEFAULT 0,active INTEGER DEFAULT 1)`);
  await run(`CREATE TABLE IF NOT EXISTS collections(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT UNIQUE NOT NULL,slug TEXT UNIQUE NOT NULL,description TEXT DEFAULT '',sort_order INTEGER DEFAULT 0,active INTEGER DEFAULT 1)`);
  await run(`CREATE TABLE IF NOT EXISTS leads(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,whatsapp TEXT NOT NULL,email TEXT,occasion TEXT,event_date TEXT,size TEXT,color TEXT,dress_interest TEXT,notes TEXT,status TEXT DEFAULT 'NOVO',consent INTEGER DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  await run(`CREATE TABLE IF NOT EXISTS testimonials(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,text TEXT NOT NULL,status TEXT DEFAULT 'draft',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  await run(`CREATE TABLE IF NOT EXISTS site_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL DEFAULT '',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);

  const defaults={
    brand_name:'ATELIER NATÁLIA HUEBRA',
    tagline:'Noivas • Festa • Alta-Costura • Sob Encomenda',
    description:'Um atelier de moda para momentos especiais, com curadoria, atendimento próximo e criações sob encomenda.',
    whatsapp_number:process.env.WHATSAPP_NUMBER||'5528999835920',
    phone:'+55 (28) 99983-5920',
    email:'natytuany@hotmail.com',
    address:'R. Salomão Fadlalah, 86 — Ibatiba, Espírito Santo',
    instagram:'https://www.instagram.com/nataliahuebra/',
    facebook:'https://www.facebook.com/share/1Emdx3eSRE/',
    youtube:'',
    site_url:SITE_URL,
    hero_desktop:'/assets/images/banner-natalia-huebra.webp',
    hero_mobile:'/assets/images/banner-mobile.webp',
    logo:'/assets/images/icon.png',
    primary_color:'#B68B57',
    light_bg:'#F6F1E9',
    dark_bg:'#211B17'
  };
  for(const [k,v] of Object.entries(defaults)) await run(`INSERT OR IGNORE INTO site_settings(key,value) VALUES(?,?)`,[k,v]);

  const cats=['Noivas','Festa','Madrinhas','Formandas','Debutantes','Civil','Plus Size'];
  for(let i=0;i<cats.length;i++) await run(`INSERT OR IGNORE INTO categories(name,slug,sort_order,active) VALUES(?,?,?,1)`,[cats[i],slugify(cats[i]),i]);
  const cols=['Atelier','Editorial','Signature','Essenciais'];
  for(let i=0;i<cols.length;i++) await run(`INSERT OR IGNORE INTO collections(name,slug,sort_order,active) VALUES(?,?,?,1)`,[cols[i],slugify(cols[i]),i]);

  const count=await get('SELECT COUNT(*) c FROM dresses');
  if(!count.c){
    const seed=[
      ['Vestido Noiva Atelier','vestido-noiva-atelier','Uma seleção de vestidos para viver o seu grande momento com personalidade e delicadeza.','Noivas','Atelier','Romântico','Longo','Off-white,Champagne','Sob medida','Consultar disponibilidade','', 'vestidos-1.webp',1],
      ['Silhueta Clássica','silhueta-classica','Elegância atemporal para celebrações especiais.','Festa','Essenciais','Clássico','Longo','Champagne','Consulte tamanhos','Consultar disponibilidade','', 'vestidos-2.webp',1],
      ['Madrinha Editorial','madrinha-editorial','Modelagem sofisticada para uma presença inesquecível.','Madrinhas','Editorial','Elegante','Longo','Tons terrosos,Verde','Consulte tamanhos','Sob encomenda','', 'vestidos-3.webp',1],
      ['Noiva Delicada','noiva-delicada','Detalhes delicados e acabamento pensado para cada mulher.','Noivas','Atelier','Romântico','Longo','Off-white','Sob medida','Sob encomenda','', 'noivas-1.webp',0],
      ['Festa Contemporânea','festa-contemporanea','Uma leitura contemporânea do vestido de festa.','Festa','Editorial','Moderno','Longo','Vinho,Preto','Consulte tamanhos','Consultar disponibilidade','', 'vestidos-4.webp',0],
      ['Debutante Signature','debutante-signature','Uma criação para marcar uma nova fase.','Debutantes','Signature','Glamour','Longo','Champagne,Rosa','Sob medida','Sob encomenda','', 'vestidos-5.webp',0]
    ];
    for(const x of seed){
      const r=await run(`INSERT INTO dresses(name,slug,description,category,collection,style,length,colors,sizes,availability,price,photo,featured,status,sort_order,seo_title,seo_description,alt_text) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[x[0],x[1],x[2],x[3],x[4],x[5],x[6],x[7],x[8],x[9],x[10],x[11],x[12],'published',0,'',x[0]+' | Atelier Natália Huebra',x[0]]);
      await run(`INSERT INTO media(dress_id,type,url,alt_text,title,sort_order,is_primary) VALUES(?,?,?,?,?,?,1)`,[r.lastID,'image','/assets/images/'+x[11],x[0],x[0],0]);
    }
  }
  const adminCount=await get('SELECT COUNT(*) c FROM users');
  if(!adminCount.c && process.env.ADMIN_EMAIL){
    const password=process.env.ADMIN_PASSWORD || '';
    const hash=process.env.ADMIN_PASSWORD_HASH || (password ? bcrypt.hashSync(password,12) : '');
    if(hash) await run(`INSERT INTO users(email,password_hash,role) VALUES(?,?,?)`,[process.env.ADMIN_EMAIL.toLowerCase().trim(),hash,'admin']);
  }
}

app.disable('x-powered-by');
app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],imgSrc:["'self'","data:","https:"],mediaSrc:["'self'","blob:","https:"],styleSrc:["'self'","'unsafe-inline'","https://fonts.googleapis.com"],fontSrc:["'self'","https://fonts.gstatic.com"],scriptSrc:["'self'"],connectSrc:["'self'"],frameSrc:["'self'","https://www.youtube.com","https://www.youtube-nocookie.com","https://player.vimeo.com"]}},crossOriginEmbedderPolicy:false}));
app.use(express.json({limit:'300kb'}));
app.use(express.urlencoded({extended:true,limit:'300kb'}));
app.use(rateLimit({windowMs:15*60*1000,limit:300,standardHeaders:true,legacyHeaders:false}));
const cookieParser=(req,res,next)=>{const raw=req.headers.cookie||'';req.cookies={};for(const part of raw.split(';')){const i=part.indexOf('=');if(i>0){try{req.cookies[decodeURIComponent(part.slice(0,i).trim())]=decodeURIComponent(part.slice(i+1).trim())}catch{}}}next()};
app.use(cookieParser);
app.use(express.static(PUBLIC,{extensions:['html'],maxAge:process.env.NODE_ENV==='production'?'1h':0}));
app.use('/media', express.static(MEDIA_ROOT, {maxAge: process.env.NODE_ENV==='production' ? '7d' : 0, index:false}));

const loginLimiter=rateLimit({windowMs:15*60*1000,limit:8,standardHeaders:true,legacyHeaders:false,message:{error:'Muitas tentativas. Aguarde alguns minutos.'}});
function auth(req,res,next){
  const token=req.cookies.atelier_admin || req.headers.authorization?.replace(/^Bearer\s+/i,'');
  if(!token)return res.status(401).json({error:'Não autorizado'});
  try{req.user=jwt.verify(token,JWT_SECRET);next()}catch{return res.status(401).json({error:'Sessão inválida'})}
}
function sameOrigin(req,res,next){
  if(req.method==='GET'||req.method==='HEAD'||req.method==='OPTIONS')return next();
  const origin=req.get('origin');
  if(origin && !origin.startsWith(SITE_URL))return res.status(403).json({error:'Origem não permitida'});
  next();
}
app.use('/api/admin',sameOrigin);

const settingsObject=async()=>Object.fromEntries((await all('SELECT key,value FROM site_settings')).map(x=>[x.key,x.value]));
app.get('/api/health',(req,res)=>res.json({ok:true,service:'atelier-natalia-huebra',version:'12.0.0',time:new Date().toISOString()}));
app.get('/api/settings',async(req,res)=>res.json(await settingsObject()));
app.get('/api/categories',async(req,res)=>res.json(await all('SELECT id,name,slug,description,sort_order FROM categories WHERE active=1 ORDER BY sort_order,id')));
app.get('/api/collections',async(req,res)=>res.json(await all('SELECT id,name,slug,description,sort_order FROM collections WHERE active=1 ORDER BY sort_order,id')));

app.get('/api/dresses',async(req,res)=>{try{const {category,collection,style,length,availability,search,featured}=req.query;let sql='SELECT * FROM dresses WHERE status="published"';const p=[];for(const [key,val] of Object.entries({category,collection,style,length,availability})){if(val){sql+=` AND ${key} LIKE ?`;p.push(`%${val}%`)}}if(search){sql+=' AND (name LIKE ? OR description LIKE ?)';p.push(`%${search}%`,`%${search}%`)}if(featured==='1')sql+=' AND featured=1';sql+=' ORDER BY featured DESC, sort_order ASC, id DESC';const rows=await all(sql,p);for(const d of rows)d.media=await all('SELECT id,type,url,alt_text,title,sort_order,is_primary FROM media WHERE dress_id=? ORDER BY is_primary DESC,sort_order,id',[d.id]);res.json(rows)}catch(e){res.status(500).json({error:'Erro ao consultar catálogo'})}});
app.get('/api/dresses/:slug',async(req,res)=>{const row=await get('SELECT * FROM dresses WHERE slug=? AND status="published"',[req.params.slug]);if(!row)return res.status(404).json({error:'Vestido não encontrado'});row.media=await all('SELECT id,type,url,alt_text,title,sort_order,is_primary FROM media WHERE dress_id=? ORDER BY is_primary DESC,sort_order,id',[row.id]);row.videos=await all('SELECT id,title,description,url,provider,thumbnail,sort_order,featured FROM videos WHERE dress_id=? AND status="published" ORDER BY featured DESC,sort_order,id',[row.id]);res.json(row)});
app.get('/api/videos',async(req,res)=>{const rows=await all(`SELECT v.*,d.name dress_name,d.slug dress_slug FROM videos v LEFT JOIN dresses d ON d.id=v.dress_id WHERE v.status='published' ORDER BY v.featured DESC,v.sort_order,v.id DESC`);res.json(rows)});
app.post('/api/leads',async(req,res)=>{try{const d=req.body||{};const name=clean(d.name,100),whatsapp=clean(d.whatsapp,30);if(!name||!whatsapp)return res.status(422).json({error:'Nome e WhatsApp são obrigatórios'});if(!/^.{3,100}$/.test(name)||!/^[0-9+()\s.-]{8,30}$/.test(whatsapp))return res.status(422).json({error:'Dados inválidos'});const r=await run(`INSERT INTO leads(name,whatsapp,email,occasion,event_date,size,color,dress_interest,notes,consent) VALUES(?,?,?,?,?,?,?,?,?,?)`,[name,clean(d.email,150),clean(d.occasion,60),clean(d.event_date,30),clean(d.size,50),clean(d.color,80),clean(d.dress_interest,150),clean(d.notes,1500),d.consent?1:0]);res.status(201).json({ok:true,id:r.lastID})}catch(e){console.error(e);res.status(500).json({error:'Não foi possível enviar sua solicitação'})}});

app.post('/api/admin/login',loginLimiter,async(req,res)=>{const email=clean(req.body?.email,150).toLowerCase();const password=String(req.body?.password||'');if(!email||!password)return res.status(422).json({error:'Informe e-mail e senha'});const user=await get('SELECT * FROM users WHERE email=?',[email]);if(!user || !(await bcrypt.compare(password,user.password_hash)))return res.status(401).json({error:'Credenciais inválidas'});const token=jwt.sign({sub:user.id,email:user.email,role:user.role},JWT_SECRET,{expiresIn:'8h'});const secure=process.env.NODE_ENV==='production'?'; Secure':'';res.setHeader('Set-Cookie',`atelier_admin=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Strict; Max-Age=28800${secure}`);res.json({ok:true,user:{email:user.email,role:user.role}})});
app.post('/api/admin/logout',auth,(req,res)=>{res.setHeader('Set-Cookie','atelier_admin=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict');res.json({ok:true})});
app.get('/api/admin/me',auth,(req,res)=>res.json({ok:true,user:req.user}));
app.get('/api/admin/stats',auth,async(req,res)=>{const [d,l,m,v]=await Promise.all([get('SELECT COUNT(*) c FROM dresses'),get('SELECT COUNT(*) c FROM leads'),get('SELECT COUNT(*) c FROM media'),get('SELECT COUNT(*) c FROM videos')]);res.json({dresses:d.c,leads:l.c,media:m.c,videos:v.c})});
app.get('/api/admin/leads',auth,async(req,res)=>res.json(await all('SELECT * FROM leads ORDER BY id DESC')));
app.patch('/api/admin/leads/:id',auth,async(req,res)=>{await run('UPDATE leads SET status=? WHERE id=?',[clean(req.body?.status,30)||'NOVO',req.params.id]);res.json({ok:true})});
app.delete('/api/admin/leads/:id',auth,async(req,res)=>{await run('DELETE FROM leads WHERE id=?',[req.params.id]);res.json({ok:true})});

function normalizeDress(d){return {name:clean(d.name,150),slug:slugify(d.slug||d.name),description:clean(d.description,5000),category:clean(d.category,80),collection:clean(d.collection,100),style:clean(d.style,100),length:clean(d.length,80),colors:clean(d.colors,300),sizes:clean(d.sizes,200),availability:clean(d.availability,150)||'Consultar disponibilidade',price:clean(d.price,100),photo:clean(d.photo,500),video:clean(d.video,1000),featured:d.featured?1:0,status:['draft','published'].includes(d.status)?d.status:'published',sort_order:Number.isFinite(Number(d.sort_order))?Number(d.sort_order):0,seo_title:clean(d.seo_title,180),seo_description:clean(d.seo_description,320),alt_text:clean(d.alt_text||d.name,180)}}
app.get('/api/admin/dresses',auth,async(req,res)=>{const rows=await all('SELECT * FROM dresses ORDER BY featured DESC,sort_order,id DESC');for(const d of rows){d.media=await all('SELECT * FROM media WHERE dress_id=? ORDER BY is_primary DESC,sort_order,id',[d.id]);d.videos=await all('SELECT * FROM videos WHERE dress_id=? ORDER BY featured DESC,sort_order,id',[d.id])}res.json(rows)});
app.post('/api/admin/dresses',auth,async(req,res)=>{try{const d=normalizeDress(req.body);if(!d.name||!d.slug)return res.status(422).json({error:'Nome é obrigatório'});const r=await run(`INSERT INTO dresses(name,slug,description,category,collection,style,length,colors,sizes,availability,price,photo,video,featured,status,sort_order,seo_title,seo_description,alt_text) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,Object.values(d));res.status(201).json({ok:true,id:r.lastID})}catch(e){res.status(409).json({error:'Não foi possível criar. Verifique se o slug já existe.'})}});
app.put('/api/admin/dresses/:id',auth,async(req,res)=>{try{const d=normalizeDress(req.body);if(!d.name||!d.slug)return res.status(422).json({error:'Nome é obrigatório'});await run(`UPDATE dresses SET name=?,slug=?,description=?,category=?,collection=?,style=?,length=?,colors=?,sizes=?,availability=?,price=?,photo=?,video=?,featured=?,status=?,sort_order=?,seo_title=?,seo_description=?,alt_text=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,[...Object.values(d),req.params.id]);res.json({ok:true})}catch(e){res.status(400).json({error:'Não foi possível atualizar. Verifique os dados.'})}});
app.delete('/api/admin/dresses/:id',auth,async(req,res)=>{const media=await all('SELECT url FROM media WHERE dress_id=? AND url LIKE \'/media/%\'',[req.params.id]);for(const m of media){const p=path.join(MEDIA_ROOT,path.basename(m.url));if(p.startsWith(MEDIA_ROOT) && fs.existsSync(p))fs.unlinkSync(p)}await run('DELETE FROM dresses WHERE id=?',[req.params.id]);res.json({ok:true})});

const allowedImages=new Set(['image/jpeg','image/png','image/webp','image/avif']);
const allowedVideos=new Set(['video/mp4','video/webm','video/quicktime']);
const storage=multer.diskStorage({destination:(req,file,cb)=>cb(null,MEDIA_ROOT),filename:(req,file,cb)=>{const ext=path.extname(file.originalname).toLowerCase();cb(null,Date.now()+'-'+crypto.randomBytes(6).toString('hex')+ext)}});
const upload=multer({storage,limits:{fileSize:process.env.MAX_UPLOAD_MB?Number(process.env.MAX_UPLOAD_MB)*1024*1024:50*1024*1024,files:1},fileFilter:(req,file,cb)=>{if(allowedImages.has(file.mimetype)||allowedVideos.has(file.mimetype))return cb(null,true);cb(new Error('Tipo de arquivo não permitido'))}});
function safePublicUrl(filename){return '/media/'+filename.replace(/[^a-zA-Z0-9._-]/g,'')}
app.post('/api/admin/upload',auth,(req,res)=>upload.single('file')(req,res,async err=>{if(err)return res.status(400).json({error:err.message});if(!req.file)return res.status(422).json({error:'Arquivo não enviado'});const url=safePublicUrl(req.file.filename);const type=allowedVideos.has(req.file.mimetype)?'video':'image';const dressId=req.body?.dress_id?Number(req.body.dress_id):null;const r=await run('INSERT INTO media(dress_id,type,url,alt_text,title,sort_order,is_primary) VALUES(?,?,?,?,?,?,0)',[dressId||null,type,url,clean(req.body?.alt_text||req.file.originalname,180),clean(req.body?.title||'',180),Number(req.body?.sort_order||0)]);res.status(201).json({ok:true,id:r.lastID,file:url,type})}));
app.post('/api/admin/media',auth,async(req,res)=>{const d=req.body||{};const url=clean(d.url,1000);if(!url)return res.status(422).json({error:'URL obrigatória'});const r=await run('INSERT INTO media(dress_id,type,url,alt_text,title,sort_order,is_primary) VALUES(?,?,?,?,?,?,?)',[d.dress_id?Number(d.dress_id):null,d.type==='video'?'video':'image',url,clean(d.alt_text,180),clean(d.title,180),Number(d.sort_order||0),d.is_primary?1:0]);res.status(201).json({ok:true,id:r.lastID})});
app.get('/api/admin/media',auth,async(req,res)=>{const dressId=req.query.dress_id?Number(req.query.dress_id):null;res.json(dressId?await all('SELECT * FROM media WHERE dress_id=? ORDER BY is_primary DESC,sort_order,id',[dressId]):await all('SELECT * FROM media ORDER BY id DESC'))});
app.put('/api/admin/media/:id',auth,async(req,res)=>{const d=req.body||{};if(d.is_primary){const row=await get('SELECT dress_id FROM media WHERE id=?',[req.params.id]);if(row?.dress_id)await run('UPDATE media SET is_primary=0 WHERE dress_id=?',[row.dress_id])}await run('UPDATE media SET alt_text=?,title=?,sort_order=?,is_primary=? WHERE id=?',[clean(d.alt_text,180),clean(d.title,180),Number(d.sort_order||0),d.is_primary?1:0,req.params.id]);const row=await get('SELECT * FROM media WHERE id=?',[req.params.id]);if(row?.is_primary && row.dress_id)await run('UPDATE dresses SET photo=?,alt_text=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',[row.url,row.alt_text,row.dress_id]);res.json({ok:true})});
app.delete('/api/admin/media/:id',auth,async(req,res)=>{const row=await get('SELECT * FROM media WHERE id=?',[req.params.id]);if(!row)return res.status(404).json({error:'Mídia não encontrada'});if(row.url.startsWith('/media/')){const p=path.join(MEDIA_ROOT,path.basename(row.url));if(p.startsWith(MEDIA_ROOT)&&fs.existsSync(p))fs.unlinkSync(p)}await run('DELETE FROM media WHERE id=?',[req.params.id]);res.json({ok:true})});

function videoData(d){const url=clean(d.url,1000);let provider=clean(d.provider,30);if(!provider){provider=/youtu/i.test(url)?'youtube':/vimeo/i.test(url)?'vimeo':/instagram/i.test(url)?'instagram':url.startsWith('/assets/uploads/')?'local':'external'}return {dress_id:d.dress_id?Number(d.dress_id):null,title:clean(d.title,180),description:clean(d.description,1000),url,provider,thumbnail:clean(d.thumbnail,1000),sort_order:Number(d.sort_order||0),featured:d.featured?1:0,status:['draft','published'].includes(d.status)?d.status:'published'}}
app.get('/api/admin/videos',auth,async(req,res)=>res.json(await all('SELECT v.*,d.name dress_name FROM videos v LEFT JOIN dresses d ON d.id=v.dress_id ORDER BY v.featured DESC,v.sort_order,v.id DESC')));
app.post('/api/admin/videos',auth,async(req,res)=>{const d=videoData(req.body||{});if(!d.url)return res.status(422).json({error:'URL ou arquivo obrigatório'});const r=await run(`INSERT INTO videos(dress_id,title,description,url,provider,thumbnail,sort_order,featured,status) VALUES(?,?,?,?,?,?,?,?,?)`,Object.values(d));res.status(201).json({ok:true,id:r.lastID})});
app.put('/api/admin/videos/:id',auth,async(req,res)=>{const d=videoData(req.body||{});if(!d.url)return res.status(422).json({error:'URL obrigatória'});await run(`UPDATE videos SET dress_id=?,title=?,description=?,url=?,provider=?,thumbnail=?,sort_order=?,featured=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,[...Object.values(d),req.params.id]);res.json({ok:true})});
app.delete('/api/admin/videos/:id',auth,async(req,res)=>{await run('DELETE FROM videos WHERE id=?',[req.params.id]);res.json({ok:true})});

app.get('/api/admin/categories',auth,async(req,res)=>res.json(await all('SELECT * FROM categories ORDER BY sort_order,id')));
app.post('/api/admin/categories',auth,async(req,res)=>{const name=clean(req.body?.name,100);if(!name)return res.status(422).json({error:'Nome obrigatório'});try{const r=await run('INSERT INTO categories(name,slug,description,sort_order,active) VALUES(?,?,?,?,1)',[name,slugify(name),clean(req.body?.description,500),Number(req.body?.sort_order||0)]);res.status(201).json({ok:true,id:r.lastID})}catch{res.status(409).json({error:'Categoria já existe'})}});
app.put('/api/admin/categories/:id',auth,async(req,res)=>{const name=clean(req.body?.name,100);await run('UPDATE categories SET name=?,slug=?,description=?,sort_order=?,active=? WHERE id=?',[name,slugify(name),clean(req.body?.description,500),Number(req.body?.sort_order||0),req.body?.active?1:0,req.params.id]);res.json({ok:true})});
app.delete('/api/admin/categories/:id',auth,async(req,res)=>{await run('DELETE FROM categories WHERE id=?',[req.params.id]);res.json({ok:true})});
app.get('/api/admin/collections',auth,async(req,res)=>res.json(await all('SELECT * FROM collections ORDER BY sort_order,id')));
app.post('/api/admin/collections',auth,async(req,res)=>{const name=clean(req.body?.name,100);if(!name)return res.status(422).json({error:'Nome obrigatório'});try{const r=await run('INSERT INTO collections(name,slug,description,sort_order,active) VALUES(?,?,?,?,1)',[name,slugify(name),clean(req.body?.description,500),Number(req.body?.sort_order||0)]);res.status(201).json({ok:true,id:r.lastID})}catch{res.status(409).json({error:'Coleção já existe'})}});
app.put('/api/admin/collections/:id',auth,async(req,res)=>{const name=clean(req.body?.name,100);await run('UPDATE collections SET name=?,slug=?,description=?,sort_order=?,active=? WHERE id=?',[name,slugify(name),clean(req.body?.description,500),Number(req.body?.sort_order||0),req.body?.active?1:0,req.params.id]);res.json({ok:true})});
app.delete('/api/admin/collections/:id',auth,async(req,res)=>{await run('DELETE FROM collections WHERE id=?',[req.params.id]);res.json({ok:true})});
app.get('/api/admin/settings',auth,async(req,res)=>res.json(await settingsObject()));
app.put('/api/admin/settings',auth,async(req,res)=>{const allowed=['brand_name','tagline','description','whatsapp_number','phone','email','address','instagram','facebook','youtube','site_url','hero_desktop','hero_mobile','logo','primary_color','light_bg','dark_bg'];for(const k of allowed)if(Object.prototype.hasOwnProperty.call(req.body||{},k))await run('INSERT INTO site_settings(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP',[k,clean(req.body[k],2000)]);res.json({ok:true})});

const routes=['/','/atelier','/vestidos','/vestidos/noivas','/vestidos/madrinhas','/vestidos/formandas','/vestidos/debutantes','/vestidos/festa','/vestidos/plus-size','/vestidos/sob-encomenda','/vestido/:slug','/catalogo','/colecoes','/galeria','/videos','/sob-encomenda','/experiencia','/depoimentos','/contato','/privacidade','/termos'];
app.get(routes,(req,res)=>res.sendFile(path.join(PUBLIC,'index.html')));
app.get('/admin',(req,res)=>res.sendFile(path.join(PUBLIC,'admin','index.html')));
app.use((req,res)=>req.path.startsWith('/api/')?res.status(404).json({error:'Endpoint não encontrado'}):res.status(404).sendFile(path.join(PUBLIC,'404.html')));

initDb().then(()=>app.listen(PORT,()=>console.log(`Atelier Natália Huebra V12: ${SITE_URL}`))).catch(err=>{console.error(err);process.exit(1)});
