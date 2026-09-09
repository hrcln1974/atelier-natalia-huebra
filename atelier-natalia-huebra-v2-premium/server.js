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
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.warn('AVISO: JWT_SECRET ausente ou curto. Defina um segredo forte de pelo menos 32 caracteres.');
}

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
fs.mkdirSync(MEDIA_ROOT, { recursive: true });

const db = new sqlite3.Database(DB_PATH);
const run = (sql, params = []) => new Promise((resolve, reject) => db.run(sql, params, function (err) { err ? reject(err) : resolve(this); }));
const all = (sql, params = []) => new Promise((resolve, reject) => db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));
const get = (sql, params = []) => new Promise((resolve, reject) => db.get(sql, params, (err, row) => err ? reject(err) : resolve(row)));

async function initDb() {
  await run('PRAGMA foreign_keys = ON');
  await run(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'admin',active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,last_login_at TEXT)`);
  await run(`CREATE TABLE IF NOT EXISTS dresses(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,slug TEXT UNIQUE NOT NULL,description TEXT,category TEXT,collection TEXT,style TEXT,length TEXT,colors TEXT,sizes TEXT,availability TEXT,price TEXT,photo TEXT,video TEXT,featured INTEGER DEFAULT 0,status TEXT DEFAULT 'published',sort_order INTEGER DEFAULT 0,seo_title TEXT,seo_description TEXT,alt_text TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT)`);
  await run(`CREATE TABLE IF NOT EXISTS leads(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,whatsapp TEXT NOT NULL,email TEXT,occasion TEXT,event_date TEXT,size TEXT,color TEXT,dress_interest TEXT,notes TEXT,status TEXT DEFAULT 'NOVO',consent INTEGER DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT)`);
  await run(`CREATE TABLE IF NOT EXISTS testimonials(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,text TEXT NOT NULL,status TEXT DEFAULT 'draft',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT)`);
  await run(`CREATE TABLE IF NOT EXISTS site_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL DEFAULT '',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  await run(`CREATE TABLE IF NOT EXISTS audit_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,user_email TEXT NOT NULL,action TEXT NOT NULL,entity TEXT NOT NULL,entity_id TEXT,details TEXT,ip TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  const addColumn = async (table, column, definition) => { const cols = await all(`PRAGMA table_info(${table})`); if (!cols.some(c => c.name === column)) await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`); };
  await addColumn('users','active','INTEGER NOT NULL DEFAULT 1');
  await addColumn('users','last_login_at','TEXT');
  await addColumn('dresses','updated_at','TEXT');
  await addColumn('leads','updated_at','TEXT');
  await addColumn('testimonials','updated_at','TEXT');
  await run(`CREATE INDEX IF NOT EXISTS idx_dresses_status ON dresses(status)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at)`);

  const settings = {
    site_title: 'Atelier Natália Huebra',
    site_description: 'Vestidos que transformam momentos em memórias.',
    whatsapp: '5528999835920',
    phone: '+55 28 99983-5920',
    email: 'natytuany@hotmail.com',
    address: 'R. Salomão Fadlalah, 86 — Ibatiba, Espírito Santo',
    instagram: 'https://www.instagram.com/nataliahuebra/',
    facebook: 'https://www.facebook.com/share/1Emdx3eSRE/'
  };
  for (const [key, value] of Object.entries(settings)) await run('INSERT OR IGNORE INTO site_settings(key,value) VALUES(?,?)', [key, value]);

  const count = await get('SELECT COUNT(*) c FROM dresses');
  if (!count.c) {
    const seed = [
      ['Vestido Noiva Atelier','vestido-noiva-atelier','Uma seleção de vestidos para viver o seu grande momento com personalidade e delicadeza.','Noivas','Atelier','Romântico','Longo','Off-white,Champagne','Sob medida','Consultar disponibilidade','', 'vestidos-1.webp','',1],
      ['Silhueta Clássica','silhueta-classica','Elegância atemporal para celebrações especiais.','Festa','Essenciais','Clássico','Longo','Preto,Champagne','Consulte tamanhos','Consultar disponibilidade','', 'vestidos-2.webp','',1],
      ['Madrinha Editorial','madrinha-editorial','Modelagem sofisticada para uma presença inesquecível.','Madrinhas','Editorial','Elegante','Longo','Tons terrosos,Verde','Consulte tamanhos','Sob encomenda','', 'vestidos-3.webp','',1],
      ['Noiva Delicada','noiva-delicada','Detalhes delicados e acabamento pensado para cada mulher.','Noivas','Atelier','Romântico','Longo','Off-white','Sob medida','Sob encomenda','', 'noivas-1.webp','',0],
      ['Festa Contemporânea','festa-contemporanea','Uma leitura contemporânea do vestido de festa.','Festa','Editorial','Moderno','Longo','Vinho,Preto','Consulte tamanhos','Consultar disponibilidade','', 'vestidos-4.webp','',0],
      ['Debutante Signature','debutante-signature','Uma criação para marcar uma nova fase.','Debutantes','Signature','Glamour','Longo','Champagne,Rosa','Sob medida','Sob encomenda','', 'vestidos-5.webp','',0]
    ];
    for (const x of seed) await run(`INSERT INTO dresses(name,slug,description,category,collection,style,length,colors,sizes,availability,price,photo,video,featured) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, x);
  }
}

function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('='); if (i < 0) continue;
    const k = part.slice(0, i).trim(); const v = part.slice(i + 1).trim();
    try { out[decodeURIComponent(k)] = decodeURIComponent(v); } catch { out[k] = v; }
  }
  return out;
}

function auth(req, res, next) {
  const token = req.cookies.atelier_admin || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token || !JWT_SECRET) return res.status(401).json({ error: 'Não autorizado' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'admin') throw new Error('role');
    req.user = payload; next();
  } catch { return res.status(401).json({ error: 'Sessão inválida ou expirada' }); }
}

function sameOrigin(req, res, next) {
  const origin = req.headers.origin;
  if (!origin) return next();
  const host = req.get('host');
  try { if (new URL(origin).host !== host) return res.status(403).json({ error: 'Origem não permitida' }); } catch { return res.status(403).json({ error: 'Origem inválida' }); }
  next();
}

function clean(v, max = 5000) { return String(v ?? '').trim().slice(0, max); }
function slugify(v) { return clean(v, 140).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100); }
function bool(v) { return v === true || v === 1 || v === '1' || v === 'true' || v === 'on'; }
async function audit(req, action, entity, entityId = '', details = {}) {
  if (!req.user) return;
  await run('INSERT INTO audit_logs(user_id,user_email,action,entity,entity_id,details,ip) VALUES(?,?,?,?,?,?,?)', [req.user.id || null, req.user.email, action, entity, String(entityId || ''), JSON.stringify(details), req.ip]);
}
function publicSettings(rows) { return Object.fromEntries(rows.map(r => [r.key, r.value])); }

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: true, limit: '200kb' }));
app.use((req, res, next) => { req.cookies = parseCookies(req); next(); });
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.use(express.static(PUBLIC, { extensions: ['html'], maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0 }));

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false, message: { error: 'Muitas tentativas. Aguarde alguns minutos.' } });
const storage = multer.diskStorage({ destination: (_, __, cb) => cb(null, MEDIA_ROOT), filename: (_, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname).toLowerCase()}`) });
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024, files: 1 }, fileFilter: (_, file, cb) => cb(null, /^(image\/(jpeg|png|webp)|video\/mp4)$/.test(file.mimetype)) });

app.get('/api/health', async (_, res) => {
  try { await get('SELECT 1 AS ok'); res.json({ ok: true, service: 'atelier-natalia-huebra', version: '2.0.0', time: new Date().toISOString() }); }
  catch { res.status(503).json({ ok: false }); }
});
app.get('/api/settings', async (_, res) => res.json(publicSettings(await all('SELECT key,value FROM site_settings'))));
app.get('/api/dresses', async (req, res) => {
  try {
    const { category, style, length, availability, search, featured } = req.query;
    let sql = 'SELECT * FROM dresses WHERE status="published"'; const p = [];
    for (const [key, val] of Object.entries({ category, style, length, availability })) if (val) { sql += ` AND ${key} LIKE ?`; p.push(`%${clean(val, 100)}%`); }
    if (search) { sql += ' AND (name LIKE ? OR description LIKE ?)'; p.push(`%${clean(search, 100)}%`, `%${clean(search, 100)}%`); }
    if (featured === '1') sql += ' AND featured=1';
    sql += ' ORDER BY featured DESC, sort_order ASC, id DESC';
    res.json(await all(sql, p));
  } catch { res.status(500).json({ error: 'Erro ao consultar catálogo' }); }
});
app.get('/api/dresses/:slug', async (req, res) => { const row = await get('SELECT * FROM dresses WHERE slug=? AND status="published"', [req.params.slug]); if (!row) return res.status(404).json({ error: 'Vestido não encontrado' }); res.json(row); });

app.post('/api/leads', async (req, res) => {
  try {
    const d = req.body || {}; const name = clean(d.name, 100); const whatsapp = clean(d.whatsapp, 30);
    if (!name || !whatsapp) return res.status(422).json({ error: 'Nome e WhatsApp são obrigatórios' });
    const values = [name, whatsapp, clean(d.email, 160), clean(d.occasion, 80), clean(d.event_date, 20), clean(d.size, 40), clean(d.color, 80), clean(d.dress_interest, 140), clean(d.notes, 1500), bool(d.consent) ? 1 : 0];
    const r = await run('INSERT INTO leads(name,whatsapp,email,occasion,event_date,size,color,dress_interest,notes,consent) VALUES(?,?,?,?,?,?,?,?,?,?)', values);
    res.status(201).json({ ok: true, id: r.lastID });
  } catch { res.status(500).json({ error: 'Não foi possível enviar sua solicitação' }); }
});

app.post('/api/admin/login', loginLimiter, sameOrigin, async (req, res) => {
  try {
    const email = clean(req.body?.email, 160).toLowerCase(); const password = String(req.body?.password || '');
    if (!email || !password) return res.status(422).json({ error: 'E-mail e senha são obrigatórios' });
    const user = await get('SELECT * FROM users WHERE lower(email)=lower(?) AND active=1', [email]);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Credenciais inválidas' });
    if (!JWT_SECRET || JWT_SECRET.length < 32) return res.status(503).json({ error: 'JWT_SECRET não configurado com segurança' });
    await run('UPDATE users SET last_login_at=CURRENT_TIMESTAMP WHERE id=?', [user.id]);
    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h', issuer: 'atelier-natalia-huebra' });
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `atelier_admin=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800${secure}`);
    res.json({ ok: true, user: payload });
  } catch { res.status(500).json({ error: 'Falha ao autenticar' }); }
});
app.post('/api/admin/logout', sameOrigin, (req, res) => { res.setHeader('Set-Cookie', 'atelier_admin=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'); res.json({ ok: true }); });
app.get('/api/admin/me', auth, (req, res) => res.json({ user: req.user }));
app.get('/api/admin/dashboard', auth, async (_, res) => {
  const [leads, dresses, published, testimonials, recent, byStatus] = await Promise.all([
    get('SELECT COUNT(*) c FROM leads'), get('SELECT COUNT(*) c FROM dresses'), get('SELECT COUNT(*) c FROM dresses WHERE status="published"'), get('SELECT COUNT(*) c FROM testimonials WHERE status="published"'),
    all('SELECT id,name,whatsapp,occasion,status,created_at FROM leads ORDER BY id DESC LIMIT 8'), all('SELECT status,COUNT(*) c FROM leads GROUP BY status ORDER BY c DESC')
  ]);
  res.json({ kpis: { leads: leads.c, dresses: dresses.c, published: published.c, testimonials: testimonials.c }, recentLeads: recent, leadsByStatus: byStatus });
});
app.get('/api/admin/leads', auth, async (_, res) => res.json(await all('SELECT * FROM leads ORDER BY id DESC')));
app.put('/api/admin/leads/:id', auth, sameOrigin, async (req, res) => { const status = clean(req.body?.status, 30).toUpperCase(); if (!['NOVO','CONTATO','AGENDADO','CONVERTIDO','ARQUIVADO'].includes(status)) return res.status(422).json({ error: 'Status inválido' }); await run('UPDATE leads SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?', [status, req.params.id]); await audit(req,'UPDATE','lead',req.params.id,{status}); res.json({ ok:true }); });
app.delete('/api/admin/leads/:id', auth, sameOrigin, async (req, res) => { await run('DELETE FROM leads WHERE id=?',[req.params.id]); await audit(req,'DELETE','lead',req.params.id); res.json({ok:true}); });

app.get('/api/admin/dresses', auth, async (_, res) => res.json(await all('SELECT * FROM dresses ORDER BY id DESC')));
app.post('/api/admin/dresses', auth, sameOrigin, async (req, res) => {
  try {
    const d=req.body||{}, name=clean(d.name,140), slug=slugify(d.slug||d.name); if(!name||!slug)return res.status(422).json({error:'Nome e slug são obrigatórios'});
    const vals=[name,slug,clean(d.description),clean(d.category,80),clean(d.collection,100),clean(d.style,80),clean(d.length,50),clean(d.colors,160),clean(d.sizes,100),clean(d.availability,100)||'Consultar disponibilidade',clean(d.price,100),clean(d.photo,255),clean(d.video,255),bool(d.featured)?1:0,['published','draft','archived'].includes(d.status)?d.status:'draft',Number(d.sort_order)||0,clean(d.seo_title,160),clean(d.seo_description,300),clean(d.alt_text,180)];
    const r=await run('INSERT INTO dresses(name,slug,description,category,collection,style,length,colors,sizes,availability,price,photo,video,featured,status,sort_order,seo_title,seo_description,alt_text) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',vals); await audit(req,'CREATE','dress',r.lastID,{name,slug}); res.status(201).json({ok:true,id:r.lastID});
  } catch { res.status(409).json({error:'Não foi possível criar o item. Verifique o slug.'}); }
});
app.put('/api/admin/dresses/:id', auth, sameOrigin, async (req, res) => {
  try {
    const d=req.body||{}, name=clean(d.name,140), slug=slugify(d.slug||d.name); if(!name||!slug)return res.status(422).json({error:'Nome e slug são obrigatórios'});
    const vals=[name,slug,clean(d.description),clean(d.category,80),clean(d.collection,100),clean(d.style,80),clean(d.length,50),clean(d.colors,160),clean(d.sizes,100),clean(d.availability,100),clean(d.price,100),clean(d.photo,255),clean(d.video,255),bool(d.featured)?1:0,['published','draft','archived'].includes(d.status)?d.status:'draft',Number(d.sort_order)||0,clean(d.seo_title,160),clean(d.seo_description,300),clean(d.alt_text,180),req.params.id];
    await run('UPDATE dresses SET name=?,slug=?,description=?,category=?,collection=?,style=?,length=?,colors=?,sizes=?,availability=?,price=?,photo=?,video=?,featured=?,status=?,sort_order=?,seo_title=?,seo_description=?,alt_text=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',vals); await audit(req,'UPDATE','dress',req.params.id,{name,slug,status:d.status}); res.json({ok:true});
  } catch { res.status(409).json({error:'Não foi possível atualizar o item'}); }
});
app.delete('/api/admin/dresses/:id', auth, sameOrigin, async (req,res)=>{await run('DELETE FROM dresses WHERE id=?',[req.params.id]);await audit(req,'DELETE','dress',req.params.id);res.json({ok:true});});

app.get('/api/admin/testimonials', auth, async (_,res)=>res.json(await all('SELECT * FROM testimonials ORDER BY id DESC')));
app.post('/api/admin/testimonials', auth, sameOrigin, async (req,res)=>{const name=clean(req.body?.name,100),text=clean(req.body?.text,1200),status=['published','draft'].includes(req.body?.status)?req.body.status:'draft';if(!name||!text)return res.status(422).json({error:'Nome e depoimento são obrigatórios'});const r=await run('INSERT INTO testimonials(name,text,status) VALUES(?,?,?)',[name,text,status]);await audit(req,'CREATE','testimonial',r.lastID,{name,status});res.status(201).json({ok:true,id:r.lastID});});
app.put('/api/admin/testimonials/:id', auth, sameOrigin, async (req,res)=>{const name=clean(req.body?.name,100),text=clean(req.body?.text,1200),status=['published','draft'].includes(req.body?.status)?req.body.status:'draft';await run('UPDATE testimonials SET name=?,text=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',[name,text,status,req.params.id]);await audit(req,'UPDATE','testimonial',req.params.id,{status});res.json({ok:true});});
app.delete('/api/admin/testimonials/:id', auth, sameOrigin, async (req,res)=>{await run('DELETE FROM testimonials WHERE id=?',[req.params.id]);await audit(req,'DELETE','testimonial',req.params.id);res.json({ok:true});});
app.get('/api/testimonials', async (_,res)=>res.json(await all('SELECT id,name,text FROM testimonials WHERE status="published" ORDER BY id DESC')));

app.put('/api/admin/settings', auth, sameOrigin, async (req,res)=>{const allowed=['site_title','site_description','whatsapp','phone','email','address','instagram','facebook'];for(const key of allowed){if(req.body[key]!==undefined)await run('INSERT INTO site_settings(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP',[key,clean(req.body[key],500)]);}await audit(req,'UPDATE','settings','site',{keys:allowed.filter(k=>req.body[k]!==undefined)});res.json({ok:true});});
app.post('/api/admin/upload', auth, sameOrigin, upload.single('file'), async (req,res)=>{if(!req.file)return res.status(422).json({error:'Arquivo inválido. Use JPG, PNG, WEBP ou MP4 até 8 MB.'});const url='/assets/uploads/'+req.file.filename;await audit(req,'UPLOAD','media',url,{mimetype:req.file.mimetype,size:req.file.size});res.status(201).json({ok:true,url,filename:req.file.filename});});
app.get('/api/admin/audit', auth, async (_,res)=>res.json(await all('SELECT id,user_email,action,entity,entity_id,details,ip,created_at FROM audit_logs ORDER BY id DESC LIMIT 200')));

app.use((err, req, res, next) => { if (err instanceof multer.MulterError || err?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({error:'Arquivo excede o limite de 8 MB'}); console.error(err); res.status(500).json({error:'Erro interno'}); });
app.get('*', (req,res) => { if (req.path.startsWith('/api/')) return res.status(404).json({error:'Endpoint não encontrado'}); res.sendFile(path.join(PUBLIC,'index.html')); });

initDb().then(()=>app.listen(PORT,()=>console.log(`Atelier Natália Huebra V2 rodando em http://localhost:${PORT}`))).catch(err=>{console.error('Falha ao iniciar banco:',err);process.exit(1)});
