const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const assets=path.join(root,'public','assets');
function files(d){return fs.existsSync(d)?fs.readdirSync(d,{withFileTypes:true}).reduce((n,x)=>n+(x.isDirectory()?files(path.join(d,x.name)):1),0):0}
console.log('Build estático validado.');console.log('Arquivos de imagem/vídeo:',files(assets));
if(!fs.existsSync(path.join(root,'public','index.html')))process.exit(1);
