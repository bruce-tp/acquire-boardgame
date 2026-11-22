import {build} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'node:path';
import {writeFile, mkdir} from 'node:fs/promises';

const output=resolve('outputs/cloudflare-pages');
await build({
  configFile:false,
  root:resolve('deploy/cloudflare'),
  publicDir:resolve('public'),
  plugins:[react()],
  build:{outDir:output, emptyOutDir:true, target:'es2022'},
});
await build({
  configFile:false,
  publicDir:false,
  build:{
    outDir:output, emptyOutDir:false, target:'es2022', copyPublicDir:false,
    lib:{entry:resolve('deploy/cloudflare/worker.ts'), formats:['es'], fileName:()=> '_worker.js'},
    rollupOptions:{external:['cloudflare:workers']},
  },
});
await writeFile(resolve(output,'_routes.json'),JSON.stringify({version:1,include:['/api/*'],exclude:[]},null,2)+'\n');
await mkdir(resolve('work/cloudflare-check'),{recursive:true});
await writeFile(resolve('work/cloudflare-check/wrangler.json'),JSON.stringify({
  name:'acquire-migration-check', main:resolve(output,'_worker.js'),
  compatibility_date:'2026-05-15',
  d1_databases:[{binding:'DB',database_name:'acquire-rooms',database_id:'00000000-0000-4000-8000-000000000000'}],
  assets:{directory:output,binding:'ASSETS'},
},null,2)+'\n');
console.log('Cloudflare Pages upload directory: '+output);
