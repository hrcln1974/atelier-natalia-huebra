#!/usr/bin/env node
const fs=require('fs');const path=require('path');const {VERTICALS}=require('../factory/verticals');
const ROOT=path.resolve(__dirname,'..');
function arg(name, fallback=''){const i=process.argv.indexOf(`--${name}`);return i>=0?String(process.argv[i+1]||'').trim():fallback}
function slugify(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70)||'site'}
function help(){console.log(`\nHRCLNDEV BUSINESS CORE V4 — SITE FACTORY\n\nUso:\n  npm run create:site -- --nicho atelier --cliente "Atelier Exemplo"\n  npm run create:site -- --nicho imobiliario --cliente "Imobiliária Exemplo" --slug imobiliaria-exemplo\n\nOpções:\n  --nicho      atelier | imobiliario | servicos | restaurante | clinica | profissional | comercio\n  --cliente    nome comercial do cliente\n  --slug       slug/pasta do projeto (opcional)\n  --domain     domínio público (opcional)\n  --tagline    slogan (opcional)\n  --whatsapp   WhatsApp (opcional)\n  --phone      telefone (opcional)\n  --email      e-mail (opcional)\n  --address    endereço (opcional)\n  --output     diretório raiz de saída (opcional; padrão: ./sites)\n  --force      permite substituir a pasta de destino\n`)}
if(process.argv.includes('--help')||process.argv.includes('-h')){help();process.exit(0)}
const niche=arg('nicho','').toLowerCase();const client=arg('cliente','').trim();
if(!VERTICALS[niche]){console.error('Nicho inválido. Use: '+Object.keys(VERTICALS).join(', '));process.exit(1)}
if(!client){console.error('Informe --cliente "Nome do cliente".');process.exit(1)}
const v=VERTICALS[niche];const slug=slugify(arg('slug',client));const outRoot=path.resolve(ROOT,arg('output','sites'));const dest=path.join(outRoot,slug);
if(fs.existsSync(dest)&&!process.argv.includes('--force')){console.error(`Destino já existe: ${dest}\nUse --force somente se quiser substituir.`);process.exit(1)}
function rm(p){if(fs.existsSync(p))fs.rmSync(p,{recursive:true,force:true})}
function cp(src,dst){fs.cpSync(src,dst,{recursive:true,force:true})}
rm(dest);fs.mkdirSync(dest,{recursive:true});
const source=v.template==='atelier'?ROOT:path.join(ROOT,'factory','templates','generic');
const excluded=new Set(['node_modules','.git','.env','data','backups','sites','factory','HRCLNDEV-ATELIER-NATALIA-HUEBRA-V4-FUNCIONAL.zip']);
for(const name of fs.readdirSync(source)){if(excluded.has(name))continue;cp(path.join(source,name),path.join(dest,name))}
fs.mkdirSync(path.join(dest,'config'),{recursive:true});
const site={business:{name:client,slug,tagline:arg('tagline',`Presença digital profissional para ${client}.`),domain:arg('domain','')},vertical:{id:v.id,label:v.label,catalogEntity:v.catalogEntity,module:v.module},contact:{whatsapp:arg('whatsapp',''),phone:arg('phone',''),email:arg('email',''),address:arg('address','')},features:Object.fromEntries(v.features.map(x=>[x,true])),generatedBy:'HRCLNDEV BUSINESS CORE V4 Site Factory',generatedAt:new Date().toISOString(),factoryVersion:'4.1.0'};
fs.writeFileSync(path.join(dest,'config','site.factory.json'),JSON.stringify(site,null,2)+'\n');
const verticalConfig={id:v.id,name:client,segment:v.label,catalog:{entity:v.catalogEntity},features:site.features};fs.mkdirSync(path.join(dest,'config','verticals'),{recursive:true});fs.writeFileSync(path.join(dest,'config','verticals',`${v.id}.json`),JSON.stringify(verticalConfig,null,2)+'\n');
const env=`NODE_ENV=development\nPORT=3000\nSITE_URL=${site.business.domain||'http://localhost:3000'}\nCORE_VERTICAL=${v.id}\nJWT_SECRET=change-this-secret-to-at-least-32-characters\nWHATSAPP_NUMBER=${site.contact.whatsapp}\n`;
fs.writeFileSync(path.join(dest,'.env.example'),env);
const manifest={project:slug,client,vertical:v.id,template:v.template,source:v.template==='atelier'?'Atelier Natália Huebra V14/V4':'Generic Core V4',generatedAt:site.generatedAt,notes:v.template==='atelier'?'Backend e painel do Atelier preservados como base funcional; personalize identidade, dados e ambiente.':'Bootstrap funcional do Core para posterior especialização do módulo.'};
fs.writeFileSync(path.join(dest,'FACTORY-MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
if(v.template==='atelier'){
  const generatedFactoryScript=path.join(dest,'scripts','create-site.js'); if(fs.existsSync(generatedFactoryScript)) fs.rmSync(generatedFactoryScript,{force:true});
  const generatedPkg=path.join(dest,'package.json'); if(fs.existsSync(generatedPkg)){const gp=JSON.parse(fs.readFileSync(generatedPkg,'utf8')); delete gp.scripts?.['create:site']; delete gp.scripts?.['factory:list']; fs.writeFileSync(generatedPkg,JSON.stringify(gp,null,2)+'\n')}
  const files=['package.json','README.md','public/index.html','public/admin/index.html','config/verticals/atelier.json','modules/atelier/manifest.json'];
  const replacements=[[/Atelier Natália Huebra/g,client],[/ATELIER NATÁLIA HUEBRA/g,client.toUpperCase()],[/Natália Huebra/g,client],[/atelier-natalia-huebra/g,slug]];
  for(const rel of files){const p=path.join(dest,rel);if(!fs.existsSync(p))continue;let s=fs.readFileSync(p,'utf8');for(const [re,val] of replacements)s=s.replace(re,val);fs.writeFileSync(p,s)}
}
console.log(`\n✓ SITE FACTORY: projeto criado\n  Nicho:   ${v.id}\n  Cliente: ${client}\n  Pasta:   ${dest}\n  Tipo:    ${v.template}\n`);
console.log('Próximos passos:');console.log(`  cd "${dest}"`);console.log('  npm install');console.log('  copie .env.example para .env e configure o ambiente');console.log('  npm run check');
if(v.template==='atelier')console.log('  Para MySQL/Hostinger, configure DB_HOST/DB_NAME/DB_USER/DB_PASSWORD/MEDIA_ROOT e crie o administrador.');
