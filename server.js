require('dotenv').config();
const path = require('path');
const fs = require('fs');
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
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
fs.mkdirSync(MEDIA_ROOT, { recursive: true });

const db = new sqlite3.Database(DB_PATH);
const run = (sql, params=[]) => new Promise((resolve,reject)=>db.run(sql,params,function(err){err?reject(err):resolve(this)}));
const all = (sql, params=[]) => new Promise((resolve,reject)=>db.all(sql,params,(err,rows)=>err?reject(err):resolve(rows)));
const get = (sql, params=[]) => new Promise((resolve,reject)=>db.get(sql,params,(err,row)=>err?reject(err):resolve(row)));

async function initDb(){
  await run(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'admin',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  await run(`CREATE TABLE IF NOT EXISTS dresses(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,slug TEXT UNIQUE NOT NULL,description TEXT,category TEXT,collection TEXT,style TEXT,length TEXT,colors TEXT,sizes TEXT,availability TEXT,price TEXT,photo TEXT,video TEXT,featured INTEGER DEFAULT 0,status TEXT DEFAULT 'published',sort_order INTEGER DEFAULT 0,seo_title TEXT,seo_description TEXT,alt_text TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  await run(`CREATE TABLE IF NOT EXISTS leads(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,whatsapp TEXT NOT NULL,email TEXT,occasion TEXT,event_date TEXT,size TEXT,color TEXT,dress_interest TEXT,notes TEXT,status TEXT DEFAULT 'NOVO',consent INTEGER DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  await run(`CREATE TABLE IF NOT EXISTS testimonials(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,text TEXT NOT NULL,status TEXT DEFAULT 'draft',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  const count=await get('SELECT COUNT(*) c FROM dresses');
  if(!count.c){
    const seed=[
      ['Vestido Noiva Atelier','vestido-noiva-atelier','Uma seleção de vestidos para viver o seu grande momento com personalidade e delicadeza.','Noivas','Atelier','Romântico','Longo','Off-white,Champagne','Sob medida','Consultar disponibilidade','vestidos-1.webp','',1],
      ['Silhueta Clássica','silhueta-classica','Elegância atemporal para celebrações especiais.','Festa','Essenciais','Clássico','Longo','Preto,Champagne','Consulte tamanhos','Consultar disponibilidade','vestidos-2.webp','',1],
      ['Madrinha Editorial','madrinha-editorial','Modelagem sofisticada para uma presença inesquecível.','Madrinhas','Editorial','Elegante','Longo','Tons terrosos,Verde','Consulte tamanhos','Sob encomenda','vestidos-3.webp','',1],
      ['Noiva Delicada','noiva-delicada','Detalhes delicados e acabamento pensado para cada mulher.','Noivas','Atelier','Romântico','Longo','Off-white','Sob medida','Sob encomenda','noivas-1.webp','',0],
      ['Festa Contemporânea','festa-contemporanea','Uma leitura contemporânea do vestido de festa.','Festa','Editorial','Moderno','Longo','Vinho,Preto','Consulte tamanhos','Consultar disponibilidade','vestidos-4.webp','',0],
      ['Debutante Signature','debutante-signature','Uma criação para marcar uma nova fase.','Debutantes','Signature','Glamour','Longo','Champagne,Rosa','Sob medida','Sob encomenda','vestidos-5.webp','',0]
    ];
    for(const x of seed) await run(`INSERT INTO dresses(name,slug,description,category,collection,style,length,colors,sizes,availability,photo,video,featured) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,x);
  }
}

app.disable('x-powered-by');
app.use(helmet({contentSecurityPolicy:false,crossOriginEmbedderPolicy:false}));
app.use(express.json({limit:'200kb'}));
app.use(express.urlencoded({extended:true,limit:'200kb'}));
app.use(rateLimit({windowMs:15*60*1000,limit:300,standardHeaders:true,legacyHeaders:false}));
app.use(express.static(PUBLIC,{extensions:['html']}));

const loginLimiter=rateLimit({windowMs:15*60*1000,limit:8,message:{error:'Muitas tentativas. Aguarde alguns minutos.'}});
function auth(req,res,next){
  const token=req.cookies?.atelier_admin || req.headers.authorization?.replace(/^Bearer\s+/i,'');
  if(!token) return res.status(401).json({error:'Não autorizado'});
  try { req.user=jwt.verify(token,process.env.JWT_SECRET || 'development-only-change-me'); next(); }
  catch { return res.status(401).json({error:'Sessão inválida'}); }
}

const cookieParser = (req,res,next)=>{const raw=req.headers.cookie||''; req.cookies=Object.fromEntries(raw.split(';').filter(Boolean).map(v=>{const i=v.indexOf('=');return [decodeURIComponent(v.slice(0,i).trim()),decodeURIComponent(v.slice(i+1).trim())]}));next()};
app.use(cookieParser);

app.get('/api/health',(req,res)=>res.json({ok:true,service:'atelier-natalia-huebra',time:new Date().toISOString()}));
app.get('/api/dresses',async(req,res)=>{try{const {category,style,length,availability,search,featured}=req.query;let sql='SELECT * FROM dresses WHERE status="published"';const p=[];for(const [key,val] of Object.entries({category,style,length,availability})){if(val){sql+=` AND ${key} LIKE ?`;p.push(`%${val}%`)}}if(search){sql+=' AND (name LIKE ? OR description LIKE ?)';p.push(`%${search}%`,`%${search}%`)}if(featured==='1')sql+=' AND featured=1';sql+=' ORDER BY featured DESC, sort_order ASC, id DESC';res.json(await all(sql,p));}catch(e){res.status(500).json({error:'Erro ao consultar catálogo'})}});
app.get('/api/dresses/:slug',async(req,res)=>{const row=await get('SELECT * FROM dresses WHERE slug=? AND status="published"',[req.params.slug]);if(!row)return res.status(404).json({error:'Vestido não encontrado'});res.json(row)});
app.post('/api/leads',async(req,res)=>{try{const {name,whatsapp,email='',occasion='',event_date='',size='',color='',dress_interest='',notes='',consent=false}=req.body;if(!name||!whatsapp)return res.status(422).json({error:'Nome e WhatsApp são obrigatórios'});if(String(name).length>100||String(whatsapp).length>30)return res.status(422).json({error:'Dados inválidos'});const r=await run(`INSERT INTO leads(name,whatsapp,email,occasion,event_date,size,color,dress_interest,notes,consent) VALUES(?,?,?,?,?,?,?,?,?,?)`,[name,whatsapp,email,occasion,event_date,size,color,dress_interest,notes,consent?1:0]);res.status(201).json({ok:true,id:r.lastID});}catch(e){res.status(500).json({error:'Não foi possível enviar sua solicitação'})}});
app.post('/api/admin/login',loginLimiter,async(req,res)=>{const {email,password}=req.body||{};const adminEmail=process.env.ADMIN_EMAIL;const adminPassword=process.env.ADMIN_PASSWORD;if(!email||!password||!adminEmail||!adminPassword)return res.status(503).json({error:'Administração ainda não configurada'});if(email!==adminEmail||password!==adminPassword)return res.status(401).json({error:'Credenciais inválidas'});const payload={email,role:'admin'};const token=jwt.sign(payload,process.env.JWT_SECRET||'development-only-change-me',{expiresIn:'8h'});res.setHeader('Set-Cookie',`atelier_admin=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax${process.env.NODE_ENV==='production'?'; Secure':''}`);res.json({ok:true,user:payload})});
app.post('/api/admin/logout',(req,res)=>{res.setHeader('Set-Cookie','atelier_admin=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');res.json({ok:true})});
app.get('/api/admin/leads',auth,async(req,res)=>res.json(await all('SELECT * FROM leads ORDER BY id DESC')));
app.get('/api/admin/dresses',auth,async(req,res)=>res.json(await all('SELECT * FROM dresses ORDER BY id DESC')));
app.post('/api/admin/dresses',auth,async(req,res)=>{try{const d=req.body; if(!d.name||!d.slug)return res.status(422).json({error:'Nome e slug são obrigatórios'});const r=await run(`INSERT INTO dresses(name,slug,description,category,collection,style,length,colors,sizes,availability,price,photo,video,featured,status,sort_order,seo_title,seo_description,alt_text) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[d.name,d.slug,d.description||'',d.category||'',d.collection||'',d.style||'',d.length||'',d.colors||'',d.sizes||'',d.availability||'Consultar disponibilidade',d.price||'',d.photo||'',d.video||'',d.featured?1:0,d.status||'published',Number(d.sort_order||0),d.seo_title||'',d.seo_description||'',d.alt_text||'']);res.status(201).json({id:r.lastID});}catch(e){res.status(409).json({error:'Não foi possível criar o item'})}});
app.put('/api/admin/dresses/:id',auth,async(req,res)=>{try{const d=req.body;await run(`UPDATE dresses SET name=?,slug=?,description=?,category=?,collection=?,style=?,length=?,colors=?,sizes=?,availability=?,price=?,photo=?,video=?,featured=?,status=?,sort_order=?,seo_title=?,seo_description=?,alt_text=? WHERE id=?`,[d.name,d.slug,d.description||'',d.category||'',d.collection||'',d.style||'',d.length||'',d.colors||'',d.sizes||'',d.availability||'',d.price||'',d.photo||'',d.video||'',d.featured?1:0,d.status||'published',Number(d.sort_order||0),d.seo_title||'',d.seo_description||'',d.alt_text||'',req.params.id]);res.json({ok:true});}catch(e){res.status(400).json({error:'Não foi possível atualizar'})}});
app.delete('/api/admin/dresses/:id',auth,async(req,res)=>{await run('DELETE FROM dresses WHERE id=?',[req.params.id]);res.json({ok:true})});

const storage=multer.diskStorage({destination:(req,file,cb)=>cb(null,MEDIA_ROOT),filename:(req,file,cb)=>{const ext=path.extname(file.originalname).toLowerCase();cb(null,`${Date.now()}-${Math.random().toString(36).slice(2,9)}${ext}`)}});
const upload=multer({storage,limits:{fileSize:15*1024*1024,files:1},fileFilter:(req,file,cb)=>{const ok=['image/jpeg','image/png','image/webp','image/avif','video/mp4'].includes(file.mimetype);cb(ok?null:new Error('Tipo de arquivo não permitido'),ok)}});
app.post('/api/admin/upload',auth,(req,res)=>upload.single('file')(req,res,err=>{if(err)return res.status(400).json({error:err.message});if(!req.file)return res.status(422).json({error:'Arquivo não enviado'});res.status(201).json({ok:true,file:`/assets/uploads/${req.file.filename}`})}));

const routeMap=['/atelier','/vestidos','/vestidos/noivas','/vestidos/madrinhas','/vestidos/formandas','/vestidos/debutantes','/vestidos/festa','/vestidos/plus-size','/vestidos/sob-encomenda','/vestido/:slug','/catalogo','/colecoes','/galeria','/videos','/sob-encomenda','/experiencia','/depoimentos','/contato','/privacidade','/termos','/admin'];
app.get(routeMap,(req,res)=>res.sendFile(path.join(PUBLIC,'index.html')));
app.use((req,res)=>req.path.startsWith('/api/')?res.status(404).json({error:'Endpoint não encontrado'}):res.status(404).sendFile(path.join(PUBLIC,'404.html')));

initDb().then(()=>app.listen(PORT,()=>console.log(`Atelier Natália Huebra: http://localhost:${PORT}`))).catch(err=>{console.error(err);process.exit(1)});
