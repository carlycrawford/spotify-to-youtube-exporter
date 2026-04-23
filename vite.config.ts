import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import YTMusic from 'ytmusic-api';

const ytmusicPlugin = () => {
  let ytmusic: YTMusic | null = null;

  const getYTMusic = async () => {
    if (!ytmusic) {
      ytmusic = new YTMusic();
      await ytmusic.initialize();
    }
    return ytmusic;
  };

  return {
    name: 'ytmusic-api-middleware',
    configureServer(server: any) {
      server.middlewares.use('/api/ytmusic/search', async (req: any, res: any) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const url = new URL(req.url, 'http://127.0.0.1');
          const query = url.searchParams.get('q')?.trim();

          if (!query) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Missing query parameter "q"' }));
            return;
          }

          const client = await getYTMusic();
          const results = await client.searchSongs(query);
          const videoId = results?.[0]?.videoId ?? null;

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ videoId }));
        } catch (error) {
          console.error('YTMusic middleware search error:', error);
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'YTMusic search failed' }));
        }
      });
    },
  };
};

export default defineConfig({
  plugins: [react(), ytmusicPlugin()],
  server: {
    host: '127.0.0.1',
  },
  preview: {
    host: '127.0.0.1',
  },
  build: {
    outDir: 'build',
  },
});
