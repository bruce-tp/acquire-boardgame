import {env} from 'cloudflare:workers';
import {GET, POST} from '../../app/api/room/route';

export default {
  async fetch(request: Request, bindings: {ASSETS: Fetcher}) {
    const path = new URL(request.url).pathname;
    if (path === '/api/health') {
      try {
        if (!env.DB) throw new Error('missing binding');
        await env.DB.prepare('SELECT 1 FROM rooms LIMIT 1').all();
        return Response.json({ok:true, storage:'D1'}, {headers:{'Cache-Control':'no-store'}});
      } catch {
        return Response.json({ok:false, error:'Room database is not configured · 房間資料庫尚未設定'}, {status:503, headers:{'Cache-Control':'no-store'}});
      }
    }
    if (path === '/api/room') {
      if (request.method === 'GET') return GET(request);
      if (request.method === 'POST') return POST(request);
      return new Response('Method not allowed', {status:405, headers:{Allow:'GET, POST'}});
    }
    if (path.startsWith('/api/')) return new Response('Not found', {status:404});
    return bindings.ASSETS.fetch(request);
  },
};
