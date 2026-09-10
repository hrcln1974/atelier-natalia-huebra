const fs=require('fs');
const path=require('path');
const {spawn}=require('child_process');
const {execFileSync}=require('child_process');
const http=require('http');
const root=path.join(__dirname,'..');
const tmp=path.join(root,'.tmp-e2e');
const dbPath=path.join(tmp,'atelier.db');
const mediaRoot=path.join(tmp,'media');
const port=Number(process.env.E2E_PORT||3322);
const email='e2e-admin@example.com';
const password='E2eStrongPassword!123';
fs.rmSync(tmp,{recursive:true,force:true});fs.mkdirSync(mediaRoot,{recursive:true});
const env={...process.env,NODE_ENV:'test',PORT:String(port),DB_PATH:dbPath,MEDIA_ROOT:mediaRoot,SITE_URL:`http://127.0.0.1:${port}`,JWT_SECRET:'v13.2-e2e-secret-32-characters-minimum',MAX_UPLOAD_MB:'1'};
execFileSync(process.execPath,['scripts/create-admin.js',email,password],{cwd:root,env,stdio:'inherit'});
const child=spawn(process.execPath,['server.js'],{cwd:root,env,stdio:['ignore','pipe','pipe']});
let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
let cookie='';
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
async function request(method,p,body,headers={}){
  const h={...headers}; if(cookie)h.cookie=cookie;
  let payload=body;
  if(body && typeof body==='object' && !(body instanceof FormData) && !(body instanceof Uint8Array)) {h['content-type']='application/json';payload=JSON.stringify(body)}
  const r=await fetch(`http://127.0.0.1:${port}${p}`,{method,headers:h,body:payload,redirect:'manual'});
  const set=r.headers.get('set-cookie'); if(set) cookie=set.split(';')[0];
  let data={};try{data=await r.json()}catch{}
  return {status:r.status,data,headers:r.headers};
}
function ok(cond,msg){if(!cond)throw new Error(msg);console.log('✓ '+msg)}
(async()=>{
 try{
  let health;for(let i=0;i<40;i++){try{health=await request('GET','/api/health');if(health.status===200)break}catch{}await wait(150)}
  ok(health?.status===200,'/api/health responde 200');
  ok((await request('GET','/api/admin/me')).status===401,'rotas admin sem cookie retornam 401');
  let r=await request('POST','/api/admin/login',{email,password});ok(r.status===200&&r.data.ok,'login administrativo funciona');
  r=await request('GET','/api/admin/me');ok(r.status===200&&r.data.user.email===email,'sessão administrativa autenticada');
  r=await request('GET','/api/admin/dresses');ok(r.status===200&&Array.isArray(r.data)&&r.data.length===6,'banco preserva os 6 vestidos de origem');
  const dress={name:'Teste V13.2',slug:'teste-v13-2',description:'Descrição de teste',category:'Festa',collection:'Atelier',style:'Clássico',length:'Longo',colors:'Champagne',sizes:'M',availability:'Disponível',price:'R$ 1.234',featured:true,status:'published',sort_order:99,seo_title:'Teste SEO',seo_description:'Descrição SEO',alt_text:'Vestido teste'};
  r=await request('POST','/api/admin/dresses',dress);ok(r.status===201,'criar vestido com campos de catálogo e SEO');const id=r.data.id;
  dress.name='Teste V13.2 Editado';dress.slug='teste-v13-2-editado';dress.seo_title='SEO editado';r=await request('PUT','/api/admin/dresses/'+id,dress);ok(r.status===200,'editar vestido funciona');
  r=await request('POST','/api/admin/categories',{name:'Categoria E2E',description:'Teste',sort_order:99});ok(r.status===201,'criar categoria funciona');const cat=r.data.id;r=await request('PUT','/api/admin/categories/'+cat,{name:'Categoria E2E Editada',description:'Teste 2',sort_order:100,active:true});ok(r.status===200,'editar categoria funciona');
  r=await request('POST','/api/admin/collections',{name:'Coleção E2E',description:'Teste',sort_order:99});ok(r.status===201,'criar coleção funciona');const col=r.data.id;r=await request('PUT','/api/admin/collections/'+col,{name:'Coleção E2E Editada',description:'Teste 2',sort_order:100,active:true});ok(r.status===200,'editar coleção funciona');
  r=await request('POST','/api/admin/media',{dress_id:id,url:'https://example.com/teste.jpg',type:'image',is_primary:true,sort_order:5,alt_text:'Imagem teste'});ok(r.status===201,'adicionar mídia por URL https funciona');const mediaId=r.data.id;
  r=await request('PUT','/api/admin/media/'+mediaId,{sort_order:1,is_primary:true,alt_text:'Imagem reordenada'});ok(r.status===200,'definir principal e reordenar galeria funciona');
  r=await request('POST','/api/admin/media',{dress_id:id,url:'javascript:alert(1)',type:'image'});ok(r.status===422,'URL externa inválida é rejeitada');
  r=await request('POST','/api/admin/videos',{dress_id:id,title:'Vídeo E2E',url:'https://www.youtube.com/watch?v=test123',description:'Teste'});ok(r.status===201&&r.data.id,'cadastrar vídeo YouTube funciona');const vid=r.data.id;
  r=await request('POST','/api/leads',{name:'Lead E2E',whatsapp:'+55 28 99999-9999',email:'lead@example.com',occasion:'Festa',dress_interest:'Teste',consent:true});ok(r.status===201,'cadastro público de lead funciona');const lead=r.data.id;
  r=await request('PATCH','/api/admin/leads/'+lead,{status:'CONTATO'});ok(r.status===200,'alterar status de lead funciona');
  r=await request('PUT','/api/admin/settings',{brand_name:'ATELIER V13.2 E2E',whatsapp_number:'5528999999999',hero_desktop:'/assets/images/banner-natalia-huebra.webp',hero_mobile:'/assets/images/banner-mobile.webp',logo:'/assets/images/icon.png',primary_color:'#123456',light_bg:'#eeeeee',dark_bg:'#111111'});ok(r.status===200,'alterar configurações funciona');
  r=await request('GET','/api/settings');ok(r.status===200&&r.data.brand_name==='ATELIER V13.2 E2E'&&r.data.primary_color==='#123456','configurações refletem na API pública');
  const form=new FormData();form.append('dress_id',String(id));form.append('file',new Blob([fs.readFileSync(path.join(root,'public/assets/images/vestidos-1.webp'))],{type:'image/webp'}),'teste.webp');
  r=await request('POST','/api/admin/upload',form);ok(r.status===201,'upload de imagem válido funciona');
  const bad=new FormData();bad.append('dress_id',String(id));bad.append('file',new Blob(['not-an-image'],{type:'application/pdf'}),'teste.pdf');r=await request('POST','/api/admin/upload',bad);ok(r.status===400,'upload com tipo inválido é rejeitado sem travar');
  const big=new FormData();big.append('dress_id',String(id));big.append('file',new Blob([Buffer.alloc(1024*1024+10)],{type:'image/jpeg'}),'grande.jpg');r=await request('POST','/api/admin/upload',big);ok(r.status===400,'upload acima do limite é rejeitado');
  r=await request('DELETE','/api/admin/videos/'+vid);ok(r.status===200,'excluir vídeo funciona');
  r=await request('DELETE','/api/admin/categories/'+cat);ok(r.status===200,'excluir categoria funciona');
  r=await request('DELETE','/api/admin/collections/'+col);ok(r.status===200,'excluir coleção funciona');
  r=await request('DELETE','/api/admin/dresses/'+id);ok(r.status===200,'excluir vestido funciona');
  await request('POST','/api/admin/logout');r=await request('GET','/api/admin/me');ok(r.status===401,'logout invalida a sessão administrativa');
  const adminJs=fs.readFileSync(path.join(root,'public/admin/admin.js'),'utf8');const adminCss=fs.readFileSync(path.join(root,'public/admin/admin.css'),'utf8');ok(/@media\(max-width:560px\)/.test(adminCss)&&/grid-template-columns:1fr/.test(adminCss),'painel possui regras responsivas para mobile');ok(adminJs.includes('function simpleModal')&&adminJs.includes('dark_bg'),'painel possui edição de categorias/coleções e fundo escuro');
  console.log('=== E2E V13.2 PASS ===');
 }catch(e){console.error('✗ E2E V13.2 FAIL:',e.message);console.error(output);process.exitCode=1}
 finally{child.kill('SIGTERM');setTimeout(()=>{fs.rmSync(tmp,{recursive:true,force:true})},200);}
})();
