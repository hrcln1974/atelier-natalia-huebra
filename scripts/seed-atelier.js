require("dotenv").config();
const fs=require("fs");
const path=require("path");
const mysql=require("mysql2/promise");

const SOURCE=path.resolve(process.env.ATELIER_SEED||"./data/atelier-seed.json");
const TABLES=["site_settings","categories","collections","dresses","media","videos","testimonials"];
const columns={
 site_settings:["key","value","updated_at"],
 categories:["id","name","slug","description","sort_order","active"],
 collections:["id","name","slug","description","sort_order","active"],
 dresses:["id","name","slug","description","category","collection","style","length","colors","sizes","availability","price","photo","video","featured","status","sort_order","seo_title","seo_description","alt_text","created_at","updated_at"],
 media:["id","dress_id","type","url","alt_text","title","sort_order","is_primary","created_at"],
 videos:["id","dress_id","title","description","url","provider","thumbnail","sort_order","featured","status","created_at","updated_at"],
 testimonials:["id","name","text","status","created_at"]
};
(async()=>{
 if(!fs.existsSync(SOURCE)) throw new Error(`Seed não encontrado: ${SOURCE}`);
 const data=JSON.parse(fs.readFileSync(SOURCE,"utf8"));
 const db=await mysql.createConnection({
  host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),database:process.env.DB_NAME,
  user:process.env.DB_USER,password:process.env.DB_PASSWORD,charset:"utf8mb4"
 });
 await db.beginTransaction();
 try{
  for(const table of TABLES){
   const rows=Array.isArray(data[table])?data[table]:[];
   const cols=columns[table];
   for(const row of rows){
    const vals=cols.map(c=>row[c] ?? null);
    const sql=`INSERT IGNORE INTO \`${table}\` (${cols.map(c=>`\`${c}\``).join(",")}) VALUES (${cols.map(()=>"?").join(",")})`;
    await db.execute(sql,vals);
   }
   console.log(`- ${table}: ${rows.length} registros processados`);
  }
  await db.commit();
  console.log("SEED DO ATELIER APLICADO COM SUCESSO.");
 }catch(e){await db.rollback();throw e}
 finally{await db.end()}
})().catch(e=>{console.error("SEED FALHOU:",e.message);process.exit(1)});
