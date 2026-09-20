import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import WebSocket from 'ws';

// In-memory cache for TradingView authentic candles
const tvBarCache: Record<string, { timestamp: number; candles: any[] }> = {};

function fetchTradingViewBars(tvSymbol: string, limit: number = 120): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('wss://data.tradingview.com/socket.io/websocket', {
      headers: { Origin: 'https://s.tradingview.com', 'User-Agent': 'Mozilla/5.0' },
    });

    const timeout = setTimeout(() => {
      ws.terminate();
      reject(new Error('TV WS timeout'));
    }, 8000);

    function sendMsg(func: string, args: any[]) {
      const payload = JSON.stringify({ m: func, p: args });
      ws.send('~m~' + payload.length + '~m~' + payload);
    }

    const sessionId = 'cs_' + Math.random().toString(36).substring(2, 10);

    ws.on('open', () => {
      sendMsg('set_auth_token', ['unauthorized_user_token']);
      sendMsg('chart_create_session', [sessionId, '']);
      sendMsg('resolve_symbol', [sessionId, 'sds_sym_1', `={"symbol":"${tvSymbol}","adjustment":"splits"}`]);
      sendMsg('create_series', [sessionId, 'sds_series_1', 's1', 'sds_sym_1', '1', limit, '']);
    });

    ws.on('message', (data) => {
      const str = data.toString();
      if (str.includes('timescale_update')) {
        clearTimeout(timeout);
        const parts = str.split(/~m~\d+~m~/);
        for (const p of parts) {
          try {
            const json = JSON.parse(p);
            if (json.m === 'timescale_update') {
              const seriesData = json.p?.[1]?.sds_series_1?.s;
              if (Array.isArray(seriesData) && seriesData.length > 0) {
                const candles = seriesData.map((item: any) => {
                  const [timeSec, open, high, low, close, vol] = item.v;
                  return [
                    timeSec * 1000,
                    Number(open).toFixed(2),
                    Number(high).toFixed(2),
                    Number(low).toFixed(2),
                    Number(close).toFixed(2),
                    (vol || 0).toString(),
                  ];
                });
                ws.close();
                return resolve(candles);
              }
            }
          } catch (e) {}
        }
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function getAuthenticTradingViewBars(tvSymbol: string, limit: number = 120): Promise<any[]> {
  const cacheKey = `${tvSymbol}_${limit}`;
  const now = Date.now();
  if (tvBarCache[cacheKey] && now - tvBarCache[cacheKey].timestamp < 3500) {
    return tvBarCache[cacheKey].candles;
  }

  try {
    const bars = await fetchTradingViewBars(tvSymbol, limit);
    if (bars && bars.length > 0) {
      tvBarCache[cacheKey] = { timestamp: now, candles: bars };
      tvBarCache[tvSymbol] = { timestamp: now, candles: bars };
      return bars;
    }
  } catch (err) {
    console.warn(`TradingView WS fetch for ${tvSymbol} failed, checking cache...`, err);
  }

  if (tvBarCache[cacheKey] && tvBarCache[cacheKey].candles.length > 0) {
    return tvBarCache[cacheKey].candles;
  }
  if (tvBarCache[tvSymbol] && tvBarCache[tvSymbol].candles.length > 0) {
    return tvBarCache[tvSymbol].candles.slice(-limit);
  }

  return [];
}

function apiMiddlewarePlugin(): Plugin {
  return {
    name: 'api-middleware-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '', 'http://localhost:3000');

        if (url.pathname === '/api/klines') {
          const symbol = url.searchParams.get('symbol') || 'XAUUSD';
          const provider = url.searchParams.get('provider') || (symbol === 'XAUUSD' ? 'OANDA:XAUUSD' : 'BINANCE:BTCUSDT');
          const limit = parseInt(url.searchParams.get('limit') || '120', 10);

          if (symbol === 'XAUUSD') {
            try {
              // Fetch genuine, authentic candles directly from TradingView for the selected provider (OANDA or FXCM)
              const tvSymbol = provider.includes(':') ? provider : 'OANDA:XAUUSD';
              const tvCandles = await getAuthenticTradingViewBars(tvSymbol, limit);

              if (tvCandles && tvCandles.length > 0) {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify(tvCandles.slice(-limit)));
                return;
              }
            } catch (err) {
              console.error('Failed to fetch authentic TradingView candles:', err);
            }
          }

          // Fallback or BTCUSD
          const binanceSymbol = symbol === 'XAUUSD' ? 'PAXGUSDT' : 'BTCUSDT';
          try {
            const resp = await fetch(
              `https://data-api.binance.vision/api/v3/klines?symbol=${binanceSymbol}&interval=1m&limit=${limit}`
            );
            if (resp.ok) {
              const data = await resp.json();
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify(data));
              return;
            }
          } catch (err) {
            console.error('Failed to proxy klines:', err);
          }
        }

        if (url.pathname === '/api/price') {
          try {
            const resp = await fetch('https://api.gold-api.com/price/XAU');
            if (resp.ok) {
              const data = await resp.json();
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify(data));
              return;
            }
          } catch (err) {
            console.error('Failed to fetch gold price:', err);
          }
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiMiddlewarePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
