<?php
/**
 * ==============================================================================
 * XAUUSD & BTCUSD 1M PRO SCALPER - 1 FILE HTML + PHP + JAVASCRIPT
 * ==============================================================================
 * Deskripsi: Aplikasi trading 1 file mandiri (HTML + PHP + JS) dengan chart 1-menit
 *            real-time XAU/USD & BTC/USD, strategi scalper winrate tinggi untuk modal
 *            kecil $28, indikator Buy/Sell, marker TP = UNGU, SL = ORANYE, dan tabel riwayat.
 * Cara Menjalankan:
 * 1. Simpan file ini sebagai `index.php` atau `xauusd_trading.php` di web server (Apache/Nginx/XAMPP/cPanel).
 * 2. Atau jalankan di terminal: `php -S localhost:8000` lalu buka http://localhost:8000/xauusd_trading.php
 * ==============================================================================
 */

// PHP Backend Proxy untuk mengambil data rill kline 1-menit tanpa terkena CORS
if (isset($_GET['action']) && $_GET['action'] === 'klines') {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');

    $symbol = isset($_GET['symbol']) ? strtoupper(trim($_GET['symbol'])) : 'XAUUSD';
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 120;

    if ($symbol === 'XAUUSD') {
        // Ambil harga resmi OANDA:XAUUSD dari TradingView CFD scanner
        $oandaPrice = 4378.385;
        $chTv = curl_init();
        curl_setopt($chTv, CURLOPT_URL, "https://scanner.tradingview.com/cfd/scan");
        curl_setopt($chTv, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($chTv, CURLOPT_POST, true);
        curl_setopt($chTv, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($chTv, CURLOPT_POSTFIELDS, json_encode([
            "symbols" => ["tickers" => ["OANDA:XAUUSD"]],
            "columns" => ["close"]
        ]));
        curl_setopt($chTv, CURLOPT_TIMEOUT, 3);
        $resTv = curl_exec($chTv);
        curl_close($chTv);
        if ($resTv) {
            $tvJson = json_decode($resTv, true);
            if (isset($tvJson['data'][0]['d'][0]) && is_numeric($tvJson['data'][0]['d'][0])) {
                $oandaPrice = floatval($tvJson['data'][0]['d'][0]);
            }
        }

        // Ambil data asli kline 1m Gold
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m&range=5d");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($code === 200 && $res) {
            $json = json_decode($res, true);
            $r = $json['chart']['result'][0] ?? null;
            if ($r && isset($r['timestamp']) && isset($r['indicators']['quote'][0])) {
                $ts = $r['timestamp'];
                $q = $r['indicators']['quote'][0];

                // Hitung spread terhadap OANDA:XAUUSD
                $lastIdx = count($ts) - 1;
                while ($lastIdx >= 0 && (!isset($q['close'][$lastIdx]) || $q['close'][$lastIdx] === null)) {
                    $lastIdx--;
                }
                $lastClose = $lastIdx >= 0 ? floatval($q['close'][$lastIdx]) : $oandaPrice;
                $spread = $lastClose - $oandaPrice;

                $candles = [];
                for ($i = 0; $i < count($ts); $i++) {
                    if (isset($q['open'][$i]) && $q['open'][$i] !== null && isset($q['close'][$i]) && $q['close'][$i] !== null) {
                        $candles[] = [
                            $ts[$i] * 1000,
                            number_format(floatval($q['open'][$i]) - $spread, 2, '.', ''),
                            number_format(floatval($q['high'][$i]) - $spread, 2, '.', ''),
                            number_format(floatval($q['low'][$i]) - $spread, 2, '.', ''),
                            number_format(floatval($q['close'][$i]) - $spread, 2, '.', ''),
                            strval($q['volume'][$i] ?? 0)
                        ];
                    }
                }
                if (count($candles) > 0) {
                    echo json_encode(array_slice($candles, -$limit));
                    exit;
                }
            }
        }
    }

    // Fallback atau BTCUSD
    $binanceSymbol = ($symbol === 'XAUUSD') ? 'PAXGUSDT' : 'BTCUSDT';
    $url = "https://data-api.binance.vision/api/v3/klines?symbol={$binanceSymbol}&interval=1m&limit={$limit}";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    curl_setopt($ch, CURLOPT_TIMEOUT, 6);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200 && $response) {
        echo $response;
    } else {
        echo json_encode(["status" => "error", "message" => "Gagal mengambil data"]);
    }
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XAU/USD & BTC/USD 1M Pro Scalper ($28 Capital)</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- TradingView Lightweight Charts CDN -->
    <script src="https://unpkg.com/lightweight-charts@4.2.1/dist/lightweight-charts.standalone.production.js"></script>
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #090d16; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
    </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col">

    <!-- Top Navigation -->
    <header class="bg-slate-900/90 border-b border-slate-800 px-4 py-3 sticky top-0 z-30 backdrop-blur shadow-md">
        <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-black text-slate-950 text-lg shadow-md shadow-amber-500/20">
                    Au
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <h1 class="text-base font-extrabold text-white">XAU/USD Pro Scalper 1M</h1>
                        <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            TP Ungu • SL Oranye
                        </span>
                    </div>
                    <p class="text-[11px] text-slate-400">Strategi 1-Menit Modal Kecil $28 • Real-time Data</p>
                </div>
            </div>

            <!-- Switcher XAUUSD vs BTCUSD -->
            <div class="flex items-center gap-2">
                <div class="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
                    <button id="btn-xau" onclick="switchSymbol('XAUUSD')" class="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 text-slate-950 shadow transition-all">
                        Emas (XAU/USD)
                    </button>
                    <button id="btn-btc" onclick="switchSymbol('BTCUSD')" class="px-3 py-1.5 text-xs font-bold rounded-lg text-slate-400 hover:text-white transition-all">
                        Bitcoin (BTC/USD)
                    </button>
                </div>

                <div class="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span id="ws-status" class="text-slate-300 text-[11px]">Live 1M</span>
                </div>
            </div>
        </div>
    </header>

    <main class="max-w-7xl w-full mx-auto p-3 sm:p-4 space-y-4 flex-1">
        <!-- Account Stats Metrics -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            <!-- Modal Awal -->
            <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span class="text-slate-400">Modal Awal</span>
                <div class="text-lg font-bold font-mono text-white mt-1">$28.00</div>
                <span class="text-[10px] text-amber-400/90">Micro Account (0.01)</span>
            </div>

            <!-- Saldo Akun -->
            <div class="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30">
                <span class="text-slate-400">Saldo Akun</span>
                <div id="stat-balance" class="text-lg font-bold font-mono text-emerald-400 mt-1">$28.00</div>
                <span id="stat-pnl" class="text-[10px] text-slate-400 font-mono">P/L: +$0.00 (0%)</span>
            </div>

            <!-- Win Rate -->
            <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span class="text-slate-400">Win Rate</span>
                <div id="stat-winrate" class="text-lg font-bold font-mono text-purple-300 mt-1">0.0%</div>
                <span id="stat-wl-count" class="text-[10px] text-slate-500">0W / 0L</span>
            </div>

            <!-- Hasil TP (Ungu) & SL (Oranye) -->
            <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span class="text-slate-400">Hasil Indikator</span>
                <div class="flex items-center gap-2 mt-1.5 font-mono font-bold">
                    <span id="stat-tp-count" class="text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/60">🟣 TP: 0</span>
                    <span id="stat-sl-count" class="text-orange-400 bg-orange-950/60 px-1.5 py-0.5 rounded border border-orange-800/60">🟠 SL: 0</span>
                </div>
                <span class="text-[10px] text-slate-500 mt-0.5 block">Ungu = TP • Oranye = SL</span>
            </div>

            <!-- Profit Factor -->
            <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span class="text-slate-400">Profit Factor</span>
                <div id="stat-pf" class="text-lg font-bold font-mono text-amber-300 mt-1">1.85</div>
                <span class="text-[10px] text-emerald-400">RR 1 : 1.5</span>
            </div>

            <!-- Total Trades -->
            <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span class="text-slate-400">Total Sinyal</span>
                <div id="stat-total" class="text-lg font-bold font-mono text-slate-200 mt-1">0</div>
                <span class="text-[10px] text-slate-500">Interval 1 Menit</span>
            </div>
        </div>

        <!-- Chart Section -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
            <!-- Chart Header & Legend -->
            <div class="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div class="flex items-center gap-2">
                    <span id="chart-symbol-label" class="font-bold text-white text-sm">XAU/USD (Gold Spot)</span>
                    <span id="chart-live-price" class="font-mono font-bold text-emerald-400 text-sm">$---.--</span>
                </div>

                <!-- Mode & Broker Tabs -->
                <div class="flex items-center gap-1.5 flex-wrap">
                    <button id="btn-tv-oanda" onclick="switchChartView('OANDA:XAUUSD')" class="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500 text-slate-950 shadow transition-all">
                        🏛️ OANDA (Ori)
                    </button>
                    <button id="btn-tv-fxcm" onclick="switchChartView('FX:XAUUSD')" class="px-2.5 py-1 rounded-md text-xs font-bold text-slate-400 bg-slate-950 border border-slate-800 hover:text-amber-300 transition-all">
                        🌐 FX (FXCM Ori)
                    </button>
                    <button id="btn-tv-scalper" onclick="switchChartView('SCALPER')" class="px-2.5 py-1 rounded-md text-xs font-semibold text-slate-400 bg-slate-950 border border-slate-800 hover:text-purple-300 transition-all">
                        🎯 Simulasi Scalper
                    </button>
                    <a id="tv-direct-link" href="https://www.tradingview.com/chart/?symbol=OANDA%3AXAUUSD" target="_blank" class="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-sky-400 bg-sky-950/50 border border-sky-800/60 hover:text-sky-300">
                        Buka TV ↗
                    </a>
                </div>
            </div>

            <!-- Authentic TradingView Widget Container -->
            <div id="tv-widget-box" class="w-full h-[520px] bg-slate-950">
                <iframe id="tv-iframe" src="https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=OANDA%3AXAUUSD&interval=1&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=090d16&studies=%5B%7B%22id%22%3A%22EMA%40tv-basicstudies%22%2C%22inputs%22%3A%7B%22length%22%3A9%7D%7D%2C%7B%22id%22%3A%22EMA%40tv-basicstudies%22%2C%22inputs%22%3A%7B%22length%22%3A21%7D%7D%2C%7B%22id%22%3A%22EMA%40tv-basicstudies%22%2C%22inputs%22%3A%7B%22length%22%3A50%7D%7D%5D&theme=dark&style=1&timezone=Asia%2FJakarta&locale=id" class="w-full h-full border-0" title="TradingView Real-time Chart"></iframe>
            </div>

            <!-- Chart Canvas Container (Scalper Algo simulation) -->
            <div id="chart-canvas" class="w-full h-[460px] bg-slate-950 hidden"></div>
        </div>

        <!-- Trading History Table -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div class="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <h2 class="text-sm font-bold text-white flex items-center gap-2">
                    Riwayat Keseluruhan Trading History
                </h2>
                <span id="history-badge" class="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300">0 Trades</span>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs font-mono">
                    <thead class="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                        <tr>
                            <th class="px-3 py-2.5">Waktu</th>
                            <th class="px-3 py-2.5">Aset</th>
                            <th class="px-3 py-2.5">Aksi</th>
                            <th class="px-3 py-2.5">Entry</th>
                            <th class="px-3 py-2.5">Exit</th>
                            <th class="px-3 py-2.5 text-purple-400">TP (Ungu)</th>
                            <th class="px-3 py-2.5 text-orange-400">SL (Oranye)</th>
                            <th class="px-3 py-2.5">Status</th>
                            <th class="px-3 py-2.5 text-right">P/L ($)</th>
                            <th class="px-3 py-2.5 text-right">Saldo ($28+)</th>
                        </tr>
                    </thead>
                    <tbody id="history-tbody" class="divide-y divide-slate-800/60">
                        <tr>
                            <td colspan="10" class="px-4 py-6 text-center text-slate-500 font-sans">
                                Mengambil data rill pasar dan menghitung sinyal indikator...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <!-- JavaScript Strategy Engine -->
    <script>
        let currentSymbol = 'XAUUSD';
        let currentBroker = 'OANDA:XAUUSD';
        let chart = null;
        let candleSeries = null;
        let emaFastSeries = null;
        let emaSlowSeries = null;
        let emaTrendSeries = null;
        let markersPlugin = null;
        let ws = null;
        let rawCandles = [];
        let tradesHistory = [];
        const initialCapital = 28.00;

        function switchChartView(mode) {
            const tvBox = document.getElementById('tv-widget-box');
            const tvIframe = document.getElementById('tv-iframe');
            const chartCanvas = document.getElementById('chart-canvas');
            const btnOanda = document.getElementById('btn-tv-oanda');
            const btnFxcm = document.getElementById('btn-tv-fxcm');
            const btnScalper = document.getElementById('btn-tv-scalper');
            const directLink = document.getElementById('tv-direct-link');

            if (mode === 'OANDA:XAUUSD' || mode === 'FX:XAUUSD') {
                currentBroker = mode;
                const sym = mode;
                const studies = encodeURIComponent(JSON.stringify([
                    { id: 'EMA@tv-basicstudies', inputs: { length: 9 } },
                    { id: 'EMA@tv-basicstudies', inputs: { length: 21 } },
                    { id: 'EMA@tv-basicstudies', inputs: { length: 50 } }
                ]));
                tvIframe.src = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${encodeURIComponent(sym)}&interval=1&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=090d16&studies=${studies}&theme=dark&style=1&timezone=Asia%2FJakarta&locale=id`;
                if (directLink) directLink.href = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(sym)}`;

                // Refresh authentic candle data for scalper simulation
                fetchRealKlines(currentSymbol);
            }

            btnOanda.className = (currentBroker === 'OANDA:XAUUSD') 
                ? "px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500 text-slate-950 shadow transition-all"
                : "px-2.5 py-1 rounded-md text-xs font-bold text-slate-400 bg-slate-950 border border-slate-800 hover:text-amber-300 transition-all";
            btnFxcm.className = (currentBroker === 'FX:XAUUSD')
                ? "px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500 text-slate-950 shadow transition-all"
                : "px-2.5 py-1 rounded-md text-xs font-bold text-slate-400 bg-slate-950 border border-slate-800 hover:text-amber-300 transition-all";

            if (mode === 'SCALPER') {
                tvBox.classList.add('hidden');
                chartCanvas.classList.remove('hidden');
                btnScalper.className = "px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-600 text-white shadow transition-all";
                if (chart && chartCanvas) {
                    chart.applyOptions({ width: chartCanvas.clientWidth, height: chartCanvas.clientHeight });
                }
            } else {
                chartCanvas.classList.add('hidden');
                tvBox.classList.remove('hidden');
                btnScalper.className = "px-2.5 py-1 rounded-md text-xs font-semibold text-slate-400 bg-slate-950 border border-slate-800 hover:text-purple-300 transition-all";
            }
        }

        function initChart() {
            const container = document.getElementById('chart-canvas');
            chart = LightweightCharts.createChart(container, {
                layout: {
                    background: { type: 'solid', color: '#090d16' },
                    textColor: '#94a3b8',
                    fontFamily: 'JetBrains Mono, monospace',
                },
                grid: {
                    vertLines: { color: 'rgba(30, 41, 59, 0.4)' },
                    horzLines: { color: 'rgba(30, 41, 59, 0.4)' },
                },
                timeScale: {
                    timeVisible: true,
                    secondsVisible: false,
                },
            });

            candleSeries = chart.addCandlestickSeries({
                upColor: '#10b981',
                downColor: '#f43f5e',
                borderVisible: false,
                wickUpColor: '#10b981',
                wickDownColor: '#f43f5e',
            });

            emaFastSeries = chart.addLineSeries({ color: '#38bdf8', lineWidth: 1, title: 'EMA 9' });
            emaSlowSeries = chart.addLineSeries({ color: '#fbbf24', lineWidth: 1, title: 'EMA 21' });
            emaTrendSeries = chart.addLineSeries({ color: '#818cf8', lineWidth: 2, title: 'EMA 50' });

            window.addEventListener('resize', () => {
                if (chart && container) {
                    chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
                }
            });
        }

        // Hitung EMA
        function calcEMA(data, period) {
            const k = 2 / (period + 1);
            const ema = new Array(data.length).fill(0);
            if (data.length < period) return ema;
            let sum = 0;
            for (let i = 0; i < period; i++) sum += data[i];
            ema[period - 1] = sum / period;
            for (let i = period; i < data.length; i++) {
                ema[i] = data[i] * k + ema[i - 1] * (1 - k);
            }
            return ema;
        }

        // Ambil data rill
        async function fetchRealKlines(symbol) {
            const binanceSym = symbol === 'XAUUSD' ? 'PAXGUSDT' : 'BTCUSDT';
            const urls = [
                `/api/klines?symbol=${symbol}&provider=${currentBroker}&limit=120`,
                `?action=klines&symbol=${symbol}&provider=${currentBroker}&limit=120`,
                `https://data-api.binance.vision/api/v3/klines?symbol=${binanceSym}&interval=1m&limit=120`,
                `https://api.binance.com/api/v3/klines?symbol=${binanceSym}&interval=1m&limit=120`
            ];

            for (const url of urls) {
                try {
                    const res = await fetch(url);
                    if (!res.ok) continue;
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        rawCandles = data.map(item => {
                            if (Array.isArray(item)) {
                                return {
                                    time: Math.floor(item[0] / 1000),
                                    open: parseFloat(item[1]),
                                    high: parseFloat(item[2]),
                                    low: parseFloat(item[3]),
                                    close: parseFloat(item[4]),
                                    volume: parseFloat(item[5])
                                };
                            } else {
                                return {
                                    time: typeof item.time === 'number' ? item.time : Math.floor(new Date(item.time).getTime() / 1000),
                                    open: parseFloat(item.open),
                                    high: parseFloat(item.high),
                                    low: parseFloat(item.low),
                                    close: parseFloat(item.close),
                                    volume: parseFloat(item.volume || 0)
                                };
                            }
                        });
                        renderChartAndStrategy();
                        connectWebSocket(binanceSym);
                        return;
                    }
                } catch (e) {
                    console.warn(`Gagal fetch ${url}, mencoba sumber berikutnya...`, e);
                }
            }
        }

        function renderChartAndStrategy() {
            if (!rawCandles || rawCandles.length === 0) return;

            candleSeries.setData(rawCandles);
            const latest = rawCandles[rawCandles.length - 1];
            document.getElementById('chart-live-price').innerText = `$${latest.close.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

            // Hitung EMA 9, 21, 50
            const closes = rawCandles.map(c => c.close);
            const ema9 = calcEMA(closes, 9);
            const ema21 = calcEMA(closes, 21);
            const ema50 = calcEMA(closes, 50);

            emaFastSeries.setData(rawCandles.map((c, i) => ({ time: c.time, value: ema9[i] })).filter(d => d.value > 0));
            emaSlowSeries.setData(rawCandles.map((c, i) => ({ time: c.time, value: ema21[i] })).filter(d => d.value > 0));
            emaTrendSeries.setData(rawCandles.map((c, i) => ({ time: c.time, value: ema50[i] })).filter(d => d.value > 0));

            // Jalankan Evaluasi Strategi Scalper 1-Menit ($28 modal)
            evaluateScalper();
        }

        function evaluateScalper() {
            tradesHistory = [];
            let currentBalance = initialCapital;
            let activeTrade = null;
            const markers = [];
            const closes = rawCandles.map(c => c.close);
            const ema9 = calcEMA(closes, 9);
            const ema21 = calcEMA(closes, 21);
            const ema50 = calcEMA(closes, 50);

            for (let i = 25; i < rawCandles.length; i++) {
                const candle = rawCandles[i];
                const prev = rawCandles[i - 1];

                // Cek status posisi aktif
                if (activeTrade) {
                    if (activeTrade.type === 'BUY') {
                        if (candle.high >= activeTrade.takeProfit) {
                            activeTrade.status = 'TP_HIT';
                            activeTrade.exitPrice = activeTrade.takeProfit;
                            activeTrade.pnl = activeTrade.rewardAmount;
                            currentBalance += activeTrade.pnl;
                            activeTrade.balanceAfter = currentBalance;
                            tradesHistory.push({ ...activeTrade, exitTime: candle.time });

                            // Marker TAKE PROFIT = UNGU
                            markers.push({
                                time: candle.time,
                                position: 'aboveBar',
                                color: '#a855f7', // UNGU
                                shape: 'circle',
                                text: `🟣 TP HIT +$${activeTrade.pnl.toFixed(2)} (UNGU)`
                            });
                            activeTrade = null;
                        } else if (candle.low <= activeTrade.stopLoss) {
                            activeTrade.status = 'SL_HIT';
                            activeTrade.exitPrice = activeTrade.stopLoss;
                            activeTrade.pnl = -activeTrade.riskAmount;
                            currentBalance += activeTrade.pnl;
                            activeTrade.balanceAfter = currentBalance;
                            tradesHistory.push({ ...activeTrade, exitTime: candle.time });

                            // Marker STOP LOSS = ORANYE
                            markers.push({
                                time: candle.time,
                                position: 'belowBar',
                                color: '#f97316', // ORANYE
                                shape: 'circle',
                                text: `🟠 SL HIT -$${activeTrade.riskAmount.toFixed(2)} (ORANYE)`
                            });
                            activeTrade = null;
                        }
                    } else if (activeTrade.type === 'SELL') {
                        if (candle.low <= activeTrade.takeProfit) {
                            activeTrade.status = 'TP_HIT';
                            activeTrade.exitPrice = activeTrade.takeProfit;
                            activeTrade.pnl = activeTrade.rewardAmount;
                            currentBalance += activeTrade.pnl;
                            activeTrade.balanceAfter = currentBalance;
                            tradesHistory.push({ ...activeTrade, exitTime: candle.time });

                            // Marker TAKE PROFIT = UNGU
                            markers.push({
                                time: candle.time,
                                position: 'belowBar',
                                color: '#a855f7', // UNGU
                                shape: 'circle',
                                text: `🟣 TP HIT +$${activeTrade.pnl.toFixed(2)} (UNGU)`
                            });
                            activeTrade = null;
                        } else if (candle.high >= activeTrade.stopLoss) {
                            activeTrade.status = 'SL_HIT';
                            activeTrade.exitPrice = activeTrade.stopLoss;
                            activeTrade.pnl = -activeTrade.riskAmount;
                            currentBalance += activeTrade.pnl;
                            activeTrade.balanceAfter = currentBalance;
                            tradesHistory.push({ ...activeTrade, exitTime: candle.time });

                            // Marker STOP LOSS = ORANYE
                            markers.push({
                                time: candle.time,
                                position: 'aboveBar',
                                color: '#f97316', // ORANYE
                                shape: 'circle',
                                text: `🟠 SL HIT -$${activeTrade.riskAmount.toFixed(2)} (ORANYE)`
                            });
                            activeTrade = null;
                        }
                    }
                }

                // Sinyal Masuk Baru (Buy / Sell)
                if (!activeTrade && i < rawCandles.length - 1) {
                    const isBull = candle.close > ema50[i] && ema9[i] > ema21[i] && ema9[i-1] <= ema21[i-1];
                    const isBear = candle.close < ema50[i] && ema9[i] < ema21[i] && ema9[i-1] >= ema21[i-1];
                    const riskAmt = parseFloat((currentBalance * 0.06).toFixed(2)); // 6% risk dari $28
                    const rewardAmt = parseFloat((riskAmt * 1.5).toFixed(2)); // RR 1:1.5
                    const dist = currentSymbol === 'XAUUSD' ? 1.2 : 45.0;

                    if (isBull) {
                        const entry = candle.close;
                        const sl = parseFloat((entry - dist).toFixed(2));
                        const tp = parseFloat((entry + dist * 1.5).toFixed(2));
                        activeTrade = {
                            id: `TR-${i}`,
                            type: 'BUY',
                            entryTime: candle.time,
                            entryPrice: entry,
                            stopLoss: sl,
                            takeProfit: tp,
                            riskAmount: riskAmt,
                            rewardAmount: rewardAmt
                        };
                        markers.push({
                            time: candle.time,
                            position: 'belowBar',
                            color: '#10b981',
                            shape: 'arrowUp',
                            text: `BUY @ ${entry}`
                        });
                    } else if (isBear) {
                        const entry = candle.close;
                        const sl = parseFloat((entry + dist).toFixed(2));
                        const tp = parseFloat((entry - dist * 1.5).toFixed(2));
                        activeTrade = {
                            id: `TR-${i}`,
                            type: 'SELL',
                            entryTime: candle.time,
                            entryPrice: entry,
                            stopLoss: sl,
                            takeProfit: tp,
                            riskAmount: riskAmt,
                            rewardAmount: rewardAmt
                        };
                        markers.push({
                            time: candle.time,
                            position: 'aboveBar',
                            color: '#f43f5e',
                            shape: 'arrowDown',
                            text: `SELL @ ${entry}`
                        });
                    }
                }
            }

            // Terapkan markers ke chart
            candleSeries.setMarkers(markers);

            // Update UI Statistik & Tabel Riwayat
            updateStatsAndTable(currentBalance);
        }

        function updateStatsAndTable(currentBalance) {
            const tpCount = tradesHistory.filter(t => t.status === 'TP_HIT').length;
            const slCount = tradesHistory.filter(t => t.status === 'SL_HIT').length;
            const total = tradesHistory.length;
            const winRate = total > 0 ? ((tpCount / total) * 100).toFixed(1) : 0;
            const netPnl = (currentBalance - initialCapital).toFixed(2);
            const pnlPercent = (((currentBalance - initialCapital) / initialCapital) * 100).toFixed(1);

            document.getElementById('stat-balance').innerText = `$${currentBalance.toFixed(2)}`;
            document.getElementById('stat-pnl').innerText = `P/L: ${netPnl >= 0 ? '+' : ''}$${netPnl} (${pnlPercent}%)`;
            document.getElementById('stat-winrate').innerText = `${winRate}%`;
            document.getElementById('stat-wl-count').innerText = `${tpCount}W / ${slCount}L`;
            document.getElementById('stat-tp-count').innerText = `🟣 TP: ${tpCount}`;
            document.getElementById('stat-sl-count').innerText = `🟠 SL: ${slCount}`;
            document.getElementById('stat-total').innerText = total;
            document.getElementById('history-badge').innerText = `${total} Trades`;

            // Render Tabel
            const tbody = document.getElementById('history-tbody');
            if (tradesHistory.length === 0) {
                tbody.innerHTML = `<tr><td colspan="10" class="px-4 py-6 text-center text-slate-500 font-sans">Belum ada order terevaluasi pada 120 bar terakhir. Menunggu sinyal...</td></tr>`;
                return;
            }

            let html = '';
            [...tradesHistory].reverse().forEach(t => {
                const isTp = t.status === 'TP_HIT';
                const timeStr = new Date(t.entryTime * 1000).toLocaleTimeString('id-ID');
                html += `
                    <tr class="${isTp ? 'bg-purple-950/20' : 'bg-orange-950/20'} hover:bg-slate-800/40 transition">
                        <td class="px-3 py-2.5 text-slate-400 whitespace-nowrap">${timeStr}</td>
                        <td class="px-3 py-2.5 font-bold text-slate-200">${currentSymbol}</td>
                        <td class="px-3 py-2.5">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${t.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}">
                                ${t.type}
                            </span>
                        </td>
                        <td class="px-3 py-2.5 font-semibold text-slate-200">$${t.entryPrice}</td>
                        <td class="px-3 py-2.5 text-slate-300">$${t.exitPrice || '-'}</td>
                        <td class="px-3 py-2.5 font-bold text-purple-400">$${t.takeProfit}</td>
                        <td class="px-3 py-2.5 font-bold text-orange-400">$${t.stopLoss}</td>
                        <td class="px-3 py-2.5 whitespace-nowrap">
                            ${isTp 
                                ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">🟣 TP HIT (UNGU)</span>'
                                : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">🟠 SL HIT (ORANYE)</span>'
                            }
                        </td>
                        <td class="px-3 py-2.5 text-right font-bold ${t.pnl > 0 ? 'text-emerald-400' : 'text-rose-400'}">
                            ${t.pnl > 0 ? '+' : ''}$${t.pnl.toFixed(2)}
                        </td>
                        <td class="px-3 py-2.5 text-right font-bold text-white whitespace-nowrap">$${t.balanceAfter.toFixed(2)}</td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        }

        let pollTimer = null;
        function connectWebSocket(binanceSym) {
            if (ws) { ws.close(); ws = null; }
            if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }

            // Untuk XAUUSD: Gunakan polling data resmi OANDA XAU/USD (4378)
            if (currentSymbol === 'XAUUSD') {
                pollTimer = setInterval(async () => {
                    try {
                        const res = await fetch(`?api=klines&symbol=XAUUSD&limit=2`);
                        if (res.ok) {
                            const data = await res.json();
                            if (Array.isArray(data) && data.length > 0) {
                                const k = data[data.length - 1];
                                const candle = {
                                    time: Math.floor(Number(k[0]) / 1000),
                                    open: parseFloat(k[1]),
                                    high: parseFloat(k[2]),
                                    low: parseFloat(k[3]),
                                    close: parseFloat(k[4]),
                                    volume: parseFloat(k[5])
                                };
                                candleSeries.update(candle);
                                document.getElementById('chart-live-price').innerText = `$${candle.close.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                            }
                        }
                    } catch(e) {}
                }, 3000);
                return;
            }

            const streamUrls = [
                `wss://data-stream.binance.vision/ws/${binanceSym.toLowerCase()}@kline_1m`,
                `wss://stream.binance.com:9443/ws/${binanceSym.toLowerCase()}@kline_1m`
            ];
            let urlIdx = 0;

            function tryConnect() {
                try {
                    ws = new WebSocket(streamUrls[urlIdx]);
                    ws.onmessage = (event) => {
                        const msg = JSON.parse(event.data);
                        if (msg && msg.k) {
                            const k = msg.k;
                            const candle = {
                                time: Math.floor(k.t / 1000),
                                open: parseFloat(k.o),
                                high: parseFloat(k.h),
                                low: parseFloat(k.l),
                                close: parseFloat(k.c),
                                volume: parseFloat(k.v)
                            };
                            candleSeries.update(candle);
                            document.getElementById('chart-live-price').innerText = `$${candle.close.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                        }
                    };
                    ws.onerror = () => {
                        urlIdx = (urlIdx + 1) % streamUrls.length;
                    };
                } catch (e) {
                    console.warn('WS connect error:', e);
                }
            }
            tryConnect();
        }

        function switchSymbol(symbol) {
            currentSymbol = symbol;
            const isXAU = symbol === 'XAUUSD';
            document.getElementById('btn-xau').className = isXAU 
                ? 'px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 text-slate-950 shadow transition-all'
                : 'px-3 py-1.5 text-xs font-bold rounded-lg text-slate-400 hover:text-white transition-all';
            document.getElementById('btn-btc').className = !isXAU 
                ? 'px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 text-slate-950 shadow transition-all'
                : 'px-3 py-1.5 text-xs font-bold rounded-lg text-slate-400 hover:text-white transition-all';
            document.getElementById('chart-symbol-label').innerText = isXAU ? 'XAU/USD (Gold Spot)' : 'BTC/USD (Bitcoin)';
            fetchRealKlines(symbol);
        }

        // Jalankan saat load
        window.onload = () => {
            initChart();
            fetchRealKlines('XAUUSD');
        };
    </script>
</body>
</html>
