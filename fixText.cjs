const fs = require('fs');

const files = [
  'pages/ProjectDetail.tsx',
  'pages/AdminDashboard.tsx',
  'App.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/text-slate-50 shadow-lg/g, 'text-white shadow-lg');
  content = content.replace(/bg-indigo-[0-9]+ flex items-center justify-center text-slate-50/g, 'bg-indigo-500 flex items-center justify-center text-white');
  content = content.replace(/to-purple-600 hover:opacity-[0-9]+ font-bold text-xs text-slate-50/g, 'to-purple-600 hover:opacity-90 font-bold text-xs text-white');
  content = content.replace(/to-purple-600 flex items-center justify-center text-slate-50/g, 'to-purple-600 flex items-center justify-center text-white');
  content = content.replace(/bg-indigo-600 text-slate-50/g, 'bg-indigo-600 text-white');
  fs.writeFileSync(file, content);
});
console.log('Fixed text colors on dark backgrounds');
