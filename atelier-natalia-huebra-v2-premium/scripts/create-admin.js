require('dotenv').config();
const bcrypt=require('bcryptjs');
const sqlite3=require('sqlite3').verbose();
const path=require('path');
const db=new sqlite3.Database(path.resolve(__dirname,'..',process.env.DB_PATH||'./data/atelier.db'));
const email=(process.argv[2]||process.env.ADMIN_EMAIL||'').trim().toLowerCase();
const password=process.argv[3]||process.env.ADMIN_PASSWORD||'';
if(!email||!password){console.error('Uso: node scripts/create-admin.js email senha');process.exit(1)}
if(password.length<10){console.error('A senha precisa ter pelo menos 10 caracteres.');process.exit(1)}
const hash=bcrypt.hashSync(password,12);
db.serialize(()=>{
 db.run(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'admin',active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,last_login_at TEXT)`);
 db.run('INSERT INTO users(email,password_hash,role,active) VALUES(?,?,?,1) ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash,role=excluded.role,active=1',[email,hash,'admin'],e=>{if(e){console.error(e);process.exitCode=1}else console.log('Administrador V2 gravado com sucesso:',email);db.close()});
});
