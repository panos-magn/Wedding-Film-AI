const fs = require('fs');

const file = 'pages/Settings.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/border-indigo-500 text-slate-50 bg-indigo-500\/5/g, 'border-indigo-500 text-white bg-indigo-500/5');
content = content.replace(/bg-indigo-600 hover:bg-indigo-500 text-slate-50/g, 'bg-indigo-600 hover:bg-indigo-500 text-white');
content = content.replace(/bg-emerald-500 hover:bg-emerald-400 text-slate-50/g, 'bg-emerald-500 hover:bg-emerald-400 text-white');
content = content.replace(/bg-rose-500 hover:bg-rose-400 text-slate-50/g, 'bg-rose-500 hover:bg-rose-400 text-white');
content = content.replace(/bg-slate-900 hover:bg-slate-850 text-slate-50/g, 'bg-slate-900 hover:bg-slate-850 text-white');

fs.writeFileSync(file, content);
console.log('Fixed settings text colors');
