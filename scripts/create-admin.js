const fs=require('fs'),path=require('path'),crypto=require('crypto');
const email=process.argv[2]||process.env.ADMIN_EMAIL;
const password=process.argv[3]||process.env.ADMIN_PASSWORD;
if(!email||!password){console.error('Uso: node scripts/create-admin.js email senha-forte');process.exit(1)}
if(password.length<12){console.error('A senha deve ter pelo menos 12 caracteres.');process.exit(1)}
const file=process.env.DB_PATH||path.join(__dirname,'..','data','atelier-v6.json');
fs.mkdirSync(path.dirname(file),{recursive:true});let db={users:[],audit:[]};if(fs.existsSync(file))try{db=JSON.parse(fs.readFileSync(file,'utf8'))}catch{}
db.users=db.users||[];const salt=crypto.randomBytes(16);const hash=crypto.scryptSync(password,salt,64);const passwordHash=`scrypt:${salt.toString('hex')}:${hash.toString('hex')}`;const i=db.users.findIndex(u=>u.email?.toLowerCase()===email.toLowerCase());const user={id:i>=0?db.users[i].id:(db.users.length?Math.max(...db.users.map(u=>Number(u.id)||0))+1:1),email,passwordHash,role:'admin',active:true};if(i>=0)db.users[i]=user;else db.users.push(user);fs.writeFileSync(file,JSON.stringify(db,null,2));console.log('Administrador criado/atualizado com sucesso:',email)
