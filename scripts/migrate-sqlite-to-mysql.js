require('dotenv').config();
const fs=require('fs');
const path=require('path');
const initSqlJs=require('sql.js');
const mysql=require('mysql2/promise');
const SOURCE=path.resolve(process.env.SQLITE_SOURCE||'./data/atelier.db');
const TABLES=['users','dresses','media','videos','categories','collections','leads','testimonials','site_settings'];
const schema={
 users:['id','email','password_hash','role','created_at'],
 dresses:['id','name','slug','description','category','collection','style','length','colors','sizes','availability','price','photo','video','featured','status','sort_order','seo_title','seo_description','alt_text','created_at','updated_at'],
 media:['id','dress_id','type','url','alt_text','title','sort_order','is_primary','created_at'],
 videos:['id','dress_id','title','description','url','provider','thumbnail','sort_order','featured','status','created_at','updated_at'],
 categories:['id','name','slug','description','sort_order','active'],
 collections:['id','name','slug','description','sort_order','active'],
 leads:['id','name','whatsapp','email','occasion','event_date','size','color','dress_interest','notes','status','consent','created_at'],
 testimonials:['id','name','text','status','created_at'],
 site_settings:['key','value','updated_at']
};
(async()=>{
 if(!fs.existsSync(SOURCE)) throw new Error(`SQLite de origem não encontrado: ${SOURCE}`);
 const SQL=await initSqlJs();
 const sqlite=new SQL.Database(fs.readFileSync(SOURCE));
 const db=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD,charset:'utf8mb4'});
 console.log('Iniciando migração controlada:',SOURCE);
 await db.beginTransaction();
 try{
  for(const table of TABLES){
   const cols=schema[table];
   const q=sqlite.exec(`SELECT ${cols.map(c=>'"'+c+'"').join(',')} FROM "${table}"`);
   const rows=q[0]?.values||[];
   if(!rows.length){console.log(`- ${table}: 0 registros`);continue}
   const placeholders=cols.map(()=>'?').join(',');
   for(const row of rows) await db.execute(`INSERT IGNORE INTO \`${table}\` (${cols.map(c=>'`'+c+'`').join(',')}) VALUES (${placeholders})`,row);
   console.log(`- ${table}: ${rows.length} registros`);
  }
  await db.commit();
  console.log('MIGRAÇÃO PASSOU. Nenhum dado foi apagado da origem.');
 }catch(e){await db.rollback();throw e}finally{sqlite.close();await db.end()}
})().catch(e=>{console.error('MIGRAÇÃO FALHOU:',e.message);process.exit(1)});
