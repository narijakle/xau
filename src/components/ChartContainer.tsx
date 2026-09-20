import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  LineSeries,
  LineStyle,
  IChartApi,
  ISeriesApi,
  Time,
  createSeriesMarkers,
} from 'lightweight-charts';
import { CandleData, SupportedSymbol, Trade } from '../types';
import { calculateEMA } from '../utils/indicators';
import { SYMBOL_CONFIG } from '../utils/marketData';
import { Maximize2, Minimize2, Eye, EyeOff, ChevronLeft, RotateCcw } from 'lucide-react';

interface ChartContainerProps {
  candles: CandleData[];
  symbol: SupportedSymbol;
  trades: Trade[];
  activeTrade?: Trade | null;
  lastUpdated?: Date;
  onRefresh?: () => void;
  brokerProvider?: 'OANDA:XAUUSD' | 'FX:XAUUSD';
  onBrokerProviderChange?: (provider: 'OANDA:XAUUSD' | 'FX:XAUUSD') => void;
  candleLimit?: number;
  onCandleLimitChange?: (limit: number) => void;
  onLoadMoreCandles?: () => void;
  isLoadingMore?: boolean;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  candles,
  symbol,
  trades,
  activeTrade,
  lastUpdated,
  onRefresh,
  brokerProvider = 'OANDA:XAUUSD',
  onBrokerProviderChange,
  candleLimit = 120,
  onCandleLimitChange,
  onLoadMoreCandles,
  isLoadingMore = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const emaFastSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const emaSlowSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const emaTrendSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const markersPluginRef = useRef<any>(null);
  const activeTpLineRef = useRef<any>(null);
  const activeSlLineRef = useRef<any>(null);
  const activeEntryLineRef = useRef<any>(null);

  const onLoadMoreCandlesRef = useRef(onLoadMoreCandles);
  onLoadMoreCandlesRef.current = onLoadMoreCandles;
  const isLoadingMoreRef = useRef(isLoadingMore);
  isLoadingMoreRef.current = isLoadingMore;
  const candleLimitRef = useRef(candleLimit);
  candleLimitRef.current = candleLimit;

  const [showIndicators, setShowIndicators] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartViewMode, setChartViewMode] = useState<'SCALPER' | 'TRADINGVIEW'>('SCALPER');
  const [tvGoldProvider, setTvGoldProvider] = useState<'OANDA:XAUUSD' | 'FX:XAUUSD' | 'FOREXCOM:XAUUSD' | 'TVC:GOLD'>(
    brokerProvider || 'OANDA:XAUUSD'
  );
  const [hoveredData, setHoveredData] = useState<{
    open: number;
    high: number;
    low: number;
    close: number;
    time: number;
  } | null>(null);

  const handleSelectBroker = (prov: 'OANDA:XAUUSD' | 'FX:XAUUSD') => {
    setTvGoldProvider(prov);
    if (onBrokerProviderChange) {
      onBrokerProviderChange(prov);
    }
  };

  useEffect(() => {
    if (chartViewMode === 'SCALPER' && chartRef.current && containerRef.current) {
      setTimeout(() => {
        chartRef.current?.applyOptions({
          width: containerRef.current?.clientWidth || 800,
          height: containerRef.current?.clientHeight || 450,
        });
        chartRef.current?.timeScale().fitContent();
      }, 50);
    }
  }, [chartViewMode]);
  const latestCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  const priceChange = latestCandle && prevCandle 
    ? latestCandle.close - prevCandle.close 
    : 0;
  const priceChangePercent = prevCandle && prevCandle.close 
    ? (priceChange / prevCandle.close) * 100 
    : 0;

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous instance
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#090d16' },
        textColor: '#94a3b8',
        fontSize: 12,
        fontFamily: 'JetBrains Mono, monospace',
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.4)', style: LineStyle.SparseDotted },
        horzLines: { color: 'rgba(30, 41, 59, 0.4)', style: LineStyle.SparseDotted },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#64748b',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1e293b',
        },
        horzLine: {
          color: '#64748b',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1e293b',
        },
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: {
          top: 0.15,
          bottom: 0.15,
        },
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 8,
        minBarSpacing: 1,
        rightOffset: 12,
        fixLeftEdge: false,
        fixRightEdge: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
      priceFormat: {
        type: 'price',
        precision: SYMBOL_CONFIG[symbol].pipDecimals,
        minMove: SYMBOL_CONFIG[symbol].minTick,
      },
    });

    const emaFastSeries = chart.addSeries(LineSeries, {
      color: '#38bdf8',
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      title: 'EMA 9',
    });

    const emaSlowSeries = chart.addSeries(LineSeries, {
      color: '#fbbf24',
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      title: 'EMA 21',
    });

    const emaTrendSeries = chart.addSeries(LineSeries, {
      color: '#818cf8',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      title: 'EMA 50 (Trend)',
    });

    // Crosshair move handler
    chart.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > containerRef.current!.clientWidth ||
        param.point.y < 0 ||
        param.point.y > containerRef.current!.clientHeight
      ) {
        setHoveredData(null);
      } else {
        const seriesData = param.seriesData.get(candleSeries) as any;
        if (seriesData) {
          setHoveredData({
            open: seriesData.open,
            high: seriesData.high,
            low: seriesData.low,
            close: seriesData.close,
            time: Number(param.time),
          });
        }
      }
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    emaFastSeriesRef.current = emaFastSeries;
    emaSlowSeriesRef.current = emaSlowSeries;
    emaTrendSeriesRef.current = emaTrendSeries;

    // Initialize markers plugin
    try {
      markersPluginRef.current = createSeriesMarkers(candleSeries, []);
    } catch (e) {
      console.warn('Markers init error:', e);
    }

    // Auto load more when user drags/pans left towards the beginning of history
    chart.timeScale().subscribeVisibleLogicalRangeChange((logicalRange) => {
      if (!logicalRange) return;
      if (
        logicalRange.from <= 2 &&
        !isLoadingMoreRef.current &&
        onLoadMoreCandlesRef.current &&
        candleLimitRef.current < 1500
      ) {
        onLoadMoreCandlesRef.current();
      }
    });

    // Resize Observer with requestAnimationFrame to prevent ResizeObserver loop limit errors
    let resizeRafId: number | null = null;
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      const { width, height } = entries[0].contentRect;

      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }

      resizeRafId = requestAnimationFrame(() => {
        if (chartRef.current && width > 0 && height > 0) {
          chartRef.current.applyOptions({
            width: Math.floor(width),
            height: Math.floor(height),
          });
        }
      });
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [symbol]);

  // Update data & indicators
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current || candles.length === 0) return;

    // Format candle data
    const chartCandles = candles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeriesRef.current.setData(chartCandles);

    // Compute EMAs
    const closes = candles.map((c) => c.close);
    const ema9 = calculateEMA(closes, 9);
    const ema21 = calculateEMA(closes, 21);
    const ema50 = calculateEMA(closes, 50);

    if (showIndicators) {
      if (emaFastSeriesRef.current) {
        const emaFastData = candles
          .map((c, i) => ({ time: c.time as Time, value: ema9[i] }))
          .filter((d) => d.value > 0);
        emaFastSeriesRef.current.setData(emaFastData);
        emaFastSeriesRef.current.applyOptions({ visible: true });
      }

      if (emaSlowSeriesRef.current) {
        const emaSlowData = candles
          .map((c, i) => ({ time: c.time as Time, value: ema21[i] }))
          .filter((d) => d.value > 0);
        emaSlowSeriesRef.current.setData(emaSlowData);
        emaSlowSeriesRef.current.applyOptions({ visible: true });
      }

      if (emaTrendSeriesRef.current) {
        const emaTrendData = candles
          .map((c, i) => ({ time: c.time as Time, value: ema50[i] }))
          .filter((d) => d.value > 0);
        emaTrendSeriesRef.current.setData(emaTrendData);
        emaTrendSeriesRef.current.applyOptions({ visible: true });
      }
    } else {
      emaFastSeriesRef.current?.applyOptions({ visible: false });
      emaSlowSeriesRef.current?.applyOptions({ visible: false });
      emaTrendSeriesRef.current?.applyOptions({ visible: false });
    }

    // Build Markers based on user requirements:
    // Take Profit = UNGU (Purple: #a855f7)
    // Stop Loss = ORANYE (Orange: #f97316)
    // BUY = Green arrowUp
    // SELL = Red arrowDown
    const markers: any[] = [];

    trades.forEach((trade) => {
      // 1. Entry Signal Marker
      if (trade.type === 'BUY') {
        markers.push({
          time: trade.entryTime as Time,
          position: 'belowBar',
          color: '#10b981',
          shape: 'arrowUp',
          text: `BUY @ ${trade.entryPrice}`,
          id: `entry-${trade.id}`,
        });
      } else {
        markers.push({
          time: trade.entryTime as Time,
          position: 'aboveBar',
          color: '#f43f5e',
          shape: 'arrowDown',
          text: `SELL @ ${trade.entryPrice}`,
          id: `entry-${trade.id}`,
        });
      }

      // 2. Exit Resolution Marker
      if (trade.status === 'TP_HIT' && trade.exitTime) {
        // Strict user requirement: TAKE PROFIT = UNGU (PURPLE)
        const isBe = trade.exitReason === 'BE (Proteksi)';
        markers.push({
          time: trade.exitTime as Time,
          position: trade.type === 'BUY' ? 'aboveBar' : 'belowBar',
          color: '#a855f7', // UNGU (Purple)
          shape: 'circle',
          text: isBe
            ? `🛡️ BE PROTEKSI +$${trade.pnl.toFixed(2)} (UNGU)`
            : `🟣 TP HIT +$${trade.pnl.toFixed(2)} (UNGU)`,
          id: `tp-${trade.id}`,
        });
      } else if (trade.status === 'SL_HIT' && trade.exitTime) {
        // Strict user requirement: STOP LOSS = ORANYE (ORANGE)
        markers.push({
          time: trade.exitTime as Time,
          position: trade.type === 'BUY' ? 'belowBar' : 'aboveBar',
          color: '#f97316', // ORANYE (Orange)
          shape: 'circle',
          text: `🟠 SL HIT -$${Math.abs(trade.pnl).toFixed(2)} (ORANYE)`,
          id: `sl-${trade.id}`,
        });
      }
    });

    // Sort markers by time ascending
    markers.sort((a, b) => (a.time as number) - (b.time as number));

    if (markersPluginRef.current) {
      try {
        markersPluginRef.current.setMarkers(markers);
      } catch (err) {
        console.warn('Failed to update markers:', err);
      }
    }

    // Manage active trade price lines
    const candleSeries = candleSeriesRef.current;
    if (candleSeries) {
      // Clear old price lines
      if (activeEntryLineRef.current) {
        candleSeries.removePriceLine(activeEntryLineRef.current);
        activeEntryLineRef.current = null;
      }
      if (activeTpLineRef.current) {
        candleSeries.removePriceLine(activeTpLineRef.current);
        activeTpLineRef.current = null;
      }
      if (activeSlLineRef.current) {
        candleSeries.removePriceLine(activeSlLineRef.current);
        activeSlLineRef.current = null;
      }

      if (activeTrade && activeTrade.status === 'OPEN') {
        // Entry line
        activeEntryLineRef.current = candleSeries.createPriceLine({
          price: activeTrade.entryPrice,
          color: '#38bdf8',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `ENTRY ${activeTrade.type}`,
        });

        // Take Profit Line: UNGU (PURPLE)
        activeTpLineRef.current = candleSeries.createPriceLine({
          price: activeTrade.takeProfitPrice,
          color: '#a855f7', // UNGU (Purple)
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `TP TARGET (UNGU) +$${activeTrade.rewardAmount.toFixed(2)}`,
        });

        // Stop Loss Line: ORANYE (ORANGE)
        activeSlLineRef.current = candleSeries.createPriceLine({
          price: activeTrade.stopLossPrice,
          color: '#f97316', // ORANYE (Orange)
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `SL TARGET (ORANYE) -$${activeTrade.riskAmount.toFixed(2)}`,
        });
      }
    }
  }, [candles, trades, activeTrade, showIndicators]);

  const toggleFullscreen = () => {
    if (!containerRef.current?.parentElement) return;
    if (!isFullscreen) {
      containerRef.current.parentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const displayPrice = hoveredData ? hoveredData.close : latestCandle ? latestCandle.close : 0;
  const config = SYMBOL_CONFIG[symbol];

  return (
    <div
      id="chart-wrapper"
      className="relative flex flex-col w-full h-full min-h-[460px] md:min-h-[540px] bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden shadow-2xl"
    >
      {/* Chart Top Header / Legend Bar */}
      <div
        id="chart-header-bar"
        className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 backdrop-blur z-10"
      >
        {/* Symbol & Price Summary */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm sm:text-base text-slate-100 tracking-tight">
              {config.name}
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              1M Real Time
            </span>
          </div>

          {latestCandle && (
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-base sm:text-lg font-bold text-white">
                {config.priceFormat(displayPrice)}
              </span>
              <span
                className={`text-xs font-semibold flex items-center ${
                  priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {priceChange >= 0 ? '+' : ''}
                {priceChange.toFixed(config.pipDecimals)} (
                {priceChangePercent >= 0 ? '+' : ''}
                {priceChangePercent.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>

        {/* Action Controls & Legend Indicators */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Legend Pills with strict colors requested */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono px-2 py-1 rounded bg-slate-950/80 border border-slate-800 text-slate-300">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> BUY
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> SELL
            </span>
            <span className="flex items-center gap-1 font-semibold text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50"></span>
              TP (Ungu)
            </span>
            <span className="flex items-center gap-1 font-semibold text-orange-400">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50"></span>
              SL (Oranye)
            </span>
          </div>

          {/* View Mode & Broker Selector */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle: TradingView Asli vs Scalper Simulation */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <button
                id="btn-mode-tradingview"
                type="button"
                onClick={() => setChartViewMode('TRADINGVIEW')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                  chartViewMode === 'TRADINGVIEW'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                TradingView Asli (Ori)
              </button>
              <button
                id="btn-mode-scalper"
                type="button"
                onClick={() => setChartViewMode('SCALPER')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  chartViewMode === 'SCALPER'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Simulasi Scalper ($28 TP/SL)
              </button>
            </div>

            {/* Direct Broker Selectors for Authentic Gold (OANDA vs FXCM) - Available in Both Modes */}
            {symbol === 'XAUUSD' && (
              <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <button
                  id="btn-broker-oanda"
                  type="button"
                  onClick={() => handleSelectBroker('OANDA:XAUUSD')}
                  className={`px-2.5 py-1 rounded font-bold transition-all ${
                    tvGoldProvider === 'OANDA:XAUUSD'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-amber-300'
                  }`}
                  title="Chart Asli Resmi OANDA Spot Gold"
                >
                  🏛️ OANDA (Ori)
                </button>
                <button
                  id="btn-broker-fxcm"
                  type="button"
                  onClick={() => handleSelectBroker('FX:XAUUSD')}
                  className={`px-2.5 py-1 rounded font-bold transition-all ${
                    tvGoldProvider === 'FX:XAUUSD'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-amber-300'
                  }`}
                  title="Chart Asli Resmi FXCM Spot Gold"
                >
                  🌐 FX (FXCM Ori)
                </button>
              </div>
            )}

            {/* Direct TradingView external link */}
            <a
              id="link-tv-external"
              href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(
                symbol === 'XAUUSD' ? tvGoldProvider : 'BINANCE:BTCUSDT'
              )}`}
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center gap-1 px-2.5 py-1 text-xs text-sky-400 hover:text-sky-300 bg-sky-950/40 border border-sky-800/60 rounded-md transition-colors"
              title="Buka chart asli langsung di TradingView.com"
            >
              Buka di TV ↗
            </a>
          </div>

          {/* Indicators Toggle */}
          {chartViewMode === 'SCALPER' && (
            <button
              id="btn-toggle-indicators"
              type="button"
              onClick={() => setShowIndicators(!showIndicators)}
              className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1.5 transition-colors ${
                showIndicators
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              title="Toggle EMA 9, 21, 50 Indicators"
            >
              {showIndicators ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">EMA 9/21/50</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            id="btn-fullscreen"
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
            title="Fullscreen Chart"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Verified Data Banner for Authentic TradingView */}
      {chartViewMode === 'TRADINGVIEW' && (
        <div
          id="tv-verified-banner"
          className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-1.5 bg-sky-950/40 border-b border-sky-800/40 text-[11px]"
        >
          <div className="flex items-center gap-2 text-sky-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">
              CHART RESMI ORI TRADINGVIEW: {symbol === 'XAUUSD' ? tvGoldProvider : 'BINANCE:BTCUSDT'}
            </span>
            <span className="text-slate-400 hidden sm:inline">• Spot Gold Asli 100% Real-Time &amp; History</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
            <span className="text-sky-400">• EMA 9</span>
            <span className="text-amber-400">• EMA 21</span>
            <span className="text-indigo-400">• EMA 50 (Trend)</span>
          </div>
        </div>
      )}

      {/* Verified Real Feed Banner for Scalper Mode */}
      {chartViewMode === 'SCALPER' && (
        <div
          id="scalper-real-feed-banner"
          className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-1.5 bg-gradient-to-r from-purple-950/40 via-slate-900/90 to-emerald-950/30 border-b border-purple-800/40 text-[11px]"
        >
          <div className="flex items-center gap-2 text-purple-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">
              FEED CANDLE ASLI TRADINGVIEW: {symbol === 'XAUUSD' ? tvGoldProvider : 'BINANCE:BTCUSDT'}
            </span>
            <span className="text-emerald-400 font-semibold hidden sm:inline">
              • {candles.length} Candle Terload ({trades.length} Total Eksekusi Sinyal)
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-300 font-mono">
            <span className="text-purple-400 font-bold">🟣 TP (Ungu)</span>
            <span className="text-orange-400 font-bold">🟠 SL (Oranye)</span>
            <span className="text-sky-400 font-medium">• EMA 9</span>
            <span className="text-amber-400 font-medium">• EMA 21</span>
            <span className="text-indigo-400 font-medium">• EMA 50</span>
          </div>
        </div>
      )}

      {/* Candle Depth / Geser Kiri Controls */}
      {chartViewMode === 'SCALPER' && (
        <div
          id="chart-depth-controls"
          className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-1.5 bg-slate-950/90 border-b border-slate-800/80 text-xs font-mono"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1">
              <span>📊 Jumlah Candle:</span>
            </span>
            <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800">
              {[120, 300, 500, 1000].map((num) => (
                <button
                  key={num}
                  id={`btn-candle-limit-${num}`}
                  type="button"
                  onClick={() => onCandleLimitChange?.(num)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    candleLimit === num
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={`Lihat ${num} candle ke belakang. Total eksekusi dan histori otomatis bertambah.`}
                >
                  {num} Bar
                </button>
              ))}
            </div>

            <button
              id="btn-load-more-candles"
              type="button"
              onClick={onLoadMoreCandles}
              disabled={isLoadingMore}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-amber-300 bg-amber-950/40 border border-amber-600/50 hover:bg-amber-900/60 hover:text-white transition-all disabled:opacity-50"
              title="Geser ke kiri / muat 200 candle lebih banyak ke masa lalu agar total eksekusi bertambah"
            >
              <ChevronLeft className={`w-3.5 h-3.5 ${isLoadingMore ? 'animate-spin' : ''}`} />
              <span>{isLoadingMore ? 'Memuat...' : '⏪ Muat +200 Bar (Geser Kiri)'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="hidden md:inline text-slate-500 text-[10px]">
              💡 Geser/drag chart ke kiri untuk melihat riwayat candle sebelumnya
            </span>
            <button
              id="btn-scroll-to-live"
              type="button"
              onClick={() => {
                chartRef.current?.timeScale().scrollToRealTime();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Kembali ke candle saat ini / real-time"
            >
              <RotateCcw className="w-3 h-3 text-emerald-400" />
              <span>Ke Candle Terkini</span>
            </button>
          </div>
        </div>
      )}

      {/* OHLC Bar for Scalper Mode */}
      {chartViewMode === 'SCALPER' && (
        <div
          id="chart-ohlc-bar"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 sm:px-4 py-1 text-[11px] font-mono text-slate-400 bg-slate-900/60 border-b border-slate-800/60"
        >
          {latestCandle && (
            <>
              <span>
                O: <span className="text-slate-200">{config.priceFormat(hoveredData?.open ?? latestCandle.open)}</span>
              </span>
              <span>
                H: <span className="text-slate-200">{config.priceFormat(hoveredData?.high ?? latestCandle.high)}</span>
              </span>
              <span>
                L: <span className="text-slate-200">{config.priceFormat(hoveredData?.low ?? latestCandle.low)}</span>
              </span>
              <span>
                C: <span className="text-slate-200">{config.priceFormat(hoveredData?.close ?? latestCandle.close)}</span>
              </span>
              {showIndicators && (
                <span className="hidden md:inline-flex items-center gap-2 ml-auto text-[10px]">
                  <span className="text-sky-400 font-semibold">• EMA 9</span>
                  <span className="text-amber-400 font-semibold">• EMA 21</span>
                  <span className="text-indigo-400 font-semibold">• EMA 50 (Trend)</span>
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Main Chart Canvas Container (Scalper Algo) */}
      <div
        id="tv-lightweight-chart-container"
        ref={containerRef}
        className={`relative flex-1 w-full h-full min-h-[440px] ${
          chartViewMode === 'SCALPER' ? 'block' : 'hidden'
        }`}
      />

      {/* Official TradingView Embedded Widget (Authentic OANDA / FX) */}
      {chartViewMode === 'TRADINGVIEW' && (
        <div id="tv-official-widget-container" className="relative flex-1 w-full h-full min-h-[500px] sm:min-h-[580px]">
          <iframe
            key={`${symbol}-${tvGoldProvider}`}
            src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${encodeURIComponent(
              symbol === 'XAUUSD' ? tvGoldProvider : 'BINANCE:BTCUSDT'
            )}&interval=1&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=090d16&studies=${encodeURIComponent(
              JSON.stringify([
                { id: 'EMA@tv-basicstudies', inputs: { length: 9 } },
                { id: 'EMA@tv-basicstudies', inputs: { length: 21 } },
                { id: 'EMA@tv-basicstudies', inputs: { length: 50 } },
              ])
            )}&theme=dark&style=1&timezone=Asia%2FJakarta&locale=id`}
            className="w-full h-full min-h-[500px] sm:min-h-[580px] border-0"
            title={`TradingView ${symbol === 'XAUUSD' ? tvGoldProvider : 'BTCUSDT'} Real-time Chart`}
          />
        </div>
      )}

      {/* Floating Active Trade Alert Pill */}
      {activeTrade && activeTrade.status === 'OPEN' && (
        <div
          id="floating-active-trade-pill"
          className="absolute bottom-3 left-3 right-3 sm:right-auto z-20 flex items-center justify-between sm:justify-start gap-3 px-3 py-2 bg-slate-900/95 border border-slate-700 rounded-lg shadow-xl backdrop-blur text-xs font-mono"
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full animate-ping ${
                activeTrade.type === 'BUY' ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span
              className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                activeTrade.type === 'BUY'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              POSISI AKTIF: {activeTrade.type}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Entry:</span>
            <span className="text-white font-semibold">{activeTrade.entryPrice}</span>
          </div>

          <div className="flex items-center gap-1 text-purple-400 font-semibold">
            <span>TP (Ungu):</span>
            <span>{activeTrade.takeProfitPrice}</span>
          </div>

          <div className="flex items-center gap-1 text-orange-400 font-semibold">
            <span>SL (Oranye):</span>
            <span>{activeTrade.stopLossPrice}</span>
          </div>
        </div>
      )}
    </div>
  );
};
