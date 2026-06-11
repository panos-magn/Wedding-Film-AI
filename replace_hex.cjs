const fs = require('fs');
const glob = require('glob'); // You can just use a simple walk if glob is not present, but let's assume standard node features
const files = fs.readdirSync('./pages').map(f => './pages/' + f).concat(['./App.tsx']);

files.forEach(file => {
  if (!file.endsWith('.tsx')) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/bg-\[\#020617\]/g, 'bg-slate-950');
  content = content.replace(/border-\[\#020617\]/g, 'border-slate-950');
  content = content.replace(/from-\[\#020617\]/g, 'from-slate-950');
  fs.writeFileSync(file, content);
});
console.log('Done replacing #020617');
