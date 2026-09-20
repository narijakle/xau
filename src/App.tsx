/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  SupportedSymbol,
  CandleData,
  Trade,
  StrategyParams,
  AccountSummary,
} from './types';
import { fetchHistoricalKlines, connectRealtimeStream } from './utils/marketData';
import { evaluateScalpingStrategy } from './utils/indicators';
import { sounds } from './utils/sounds';
import { ControlBar } from './components/ControlBar';
import { StatsHeader } from './components/StatsHeader';
import { ChartContainer } from './components/ChartContainer';
import { TradingHistoryTable } from './components/TradingHistoryTable';
import { SettingsModal } from './components/SettingsModal';
import { PhpSourceModal } from './components/PhpSourceModal';
import { Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';

export default function App() {
  const [symbol, setSymbol] = useState<SupportedSymbol>('XAUUSD');
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [activeTrade, setActiveTrade] = useState<Trade | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [candleLimit, setCandleLimit] = useState<number>(120);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPhpModalOpen, setIsPhpModalOpen] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [brokerProvider, setBrokerProvider] = useState<'OANDA:XAUUSD' | 'FX:XAUUSD'>('OANDA:XAUUSD');

  // Default parameters specifically for $28 micro capital with high-winrate SMC institutional engine
  const [strategyParams, setStrategyParams] = useState<StrategyParams>({
    strategyMode: 'SMC_INSTITUTIONAL',
    initialBalance: 28.0,
    riskPerTradePercent: 4.0,
    riskToReward: 1.3,
    atrMultiplierSL: 1.0,
    atrMultiplierTP: 1.3,
    lotSize: 0.01,
    emaFastPeriod: 9,
    emaSlowPeriod: 21,
    emaTrendPeriod: 50,
    rsiPeriod: 14,
    useBreakeven: true,
    breakevenRatio: 0.55,
    smcLookback: 6,
  });

  const activeTradeWatchedIdRef = useRef<string | null>(null);
  const lastConfettiTimeRef = useRef<number>(0);

  // Load and evaluate market data
  const loadMarketData = useCallback(
    async (targetSymbol: SupportedSymbol, provider = brokerProvider, limit = candleLimit) => {
      setIsRefreshing(true);
      try {
        const fetchedCandles = await fetchHistoricalKlines(targetSymbol, limit, provider);
        if (fetchedCandles.length > 0) {
          setCandles(fetchedCandles);
          setLastUpdated(new Date());

          // Evaluate strategy on candles
          const { trades: evaluatedTrades } = evaluateScalpingStrategy(
            fetchedCandles,
            strategyParams,
            targetSymbol
          );

          setTrades(evaluatedTrades);
          const currentActive = evaluatedTrades.find((t) => t.status === 'OPEN') || null;
          setActiveTrade(currentActive);
          activeTradeWatchedIdRef.current = currentActive ? currentActive.id : null;
        }
      } catch (err) {
        console.error('Error fetching market data:', err);
      } finally {
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [strategyParams, brokerProvider, candleLimit]
  );

  // Initial fetch and symbol change
  useEffect(() => {
    loadMarketData(symbol, brokerProvider, candleLimit);
  }, [symbol, brokerProvider, candleLimit, loadMarketData]);

  const handleCandleLimitChange = (newLimit: number) => {
    setCandleLimit(newLimit);
    loadMarketData(symbol, brokerProvider, newLimit);
  };

  const handleLoadMoreCandles = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    const nextLimit = Math.min(candleLimit + 200, 1500);
    setCandleLimit(nextLimit);
    await loadMarketData(symbol, brokerProvider, nextLimit);
  };

  // WebSocket Live Stream Connection
  useEffect(() => {
    setIsLiveConnected(false);

    const disconnect = connectRealtimeStream(
      symbol,
      (newCandle) => {
        setIsLiveConnected(true);
        setCandles((prevCandles) => {
          if (prevCandles.length === 0) return [newCandle];

          const lastCandle = prevCandles[prevCandles.length - 1];
          let updated: CandleData[];

          // If same minute timestamp, update current candle
          if (lastCandle.time === newCandle.time) {
            updated = [...prevCandles.slice(0, -1), newCandle];
          } else if (newCandle.time > lastCandle.time) {
            // New 1-minute candle began - preserve all loaded historical candles!
            const maxKeep = Math.max(candleLimit + 50, prevCandles.length + 1);
            updated = [...prevCandles.slice(-maxKeep), newCandle];
          } else {
            return prevCandles;
          }

          // Evaluate strategy on updated candles
          const { trades: evaluatedTrades } = evaluateScalpingStrategy(
            updated,
            strategyParams,
            symbol
          );

          setTrades(evaluatedTrades);
          const currentActive = evaluatedTrades.find((t) => t.status === 'OPEN') || null;
          setActiveTrade(currentActive);

          // Check if the previously watched active trade just closed on this live tick
          if (activeTradeWatchedIdRef.current) {
            const watchedTrade = evaluatedTrades.find(
              (t) => t.id === activeTradeWatchedIdRef.current
            );
            if (watchedTrade && watchedTrade.status !== 'OPEN') {
              if (watchedTrade.status === 'TP_HIT') {
                const now = Date.now();
                // Cooldown: prevent any repetitive confetti within 10 seconds
                if (now - lastConfettiTimeRef.current > 10000) {
                  lastConfettiTimeRef.current = now;
                  sounds.playTakeProfit();
                  try {
                    confetti({
                      particleCount: 50,
                      spread: 60,
                      origin: { y: 0.8 },
                      colors: ['#a855f7', '#c084fc', '#9333ea', '#fbbf24'],
                    });
                  } catch {}
                }
              } else if (watchedTrade.status === 'SL_HIT') {
                sounds.playStopLoss();
              }
              // Reset watched active trade once resolved
              activeTradeWatchedIdRef.current = null;
            }
          } else if (currentActive) {
            // Watch new active trade
            activeTradeWatchedIdRef.current = currentActive.id;
          }

          return updated;
        });
      },
      () => {
        setIsLiveConnected(false);
      },
      brokerProvider
    );

    return () => {
      disconnect();
    };
  }, [symbol, brokerProvider, strategyParams, candleLimit]);

  // Compute Account Summary
  const accountSummary: AccountSummary = React.useMemo(() => {
    const closedTrades = trades.filter((t) => t.status !== 'OPEN');
    const winningTrades = closedTrades.filter((t) => t.status === 'TP_HIT').length;
    const losingTrades = closedTrades.filter((t) => t.status === 'SL_HIT').length;
    const totalClosed = closedTrades.length;

    const totalPnl = closedTrades.reduce((acc, t) => acc + t.pnl, 0);
    const currentBalance = Number((strategyParams.initialBalance + totalPnl).toFixed(2));
    const totalPnlPercent = (totalPnl / strategyParams.initialBalance) * 100;
    const winRate = totalClosed > 0 ? (winningTrades / totalClosed) * 100 : 0;

    const grossProfit = closedTrades
      .filter((t) => t.pnl > 0)
      .reduce((acc, t) => acc + t.pnl, 0);
    const grossLoss = Math.abs(
      closedTrades
        .filter((t) => t.pnl < 0)
        .reduce((acc, t) => acc + t.pnl, 0)
    );
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 1.0;

    let peak = strategyParams.initialBalance;
    let maxDd = 0;
    let running = strategyParams.initialBalance;

    closedTrades.forEach((t) => {
      running += t.pnl;
      if (running > peak) peak = running;
      const dd = ((peak - running) / peak) * 100;
      if (dd > maxDd) maxDd = dd;
    });

    const bestTrade = closedTrades.reduce((max, t) => (t.pnl > max ? t.pnl : max), 0);
    const worstTrade = closedTrades.reduce((min, t) => (t.pnl < min ? t.pnl : min), 0);

    const expectancy = totalClosed > 0 ? Number((totalPnl / totalClosed).toFixed(2)) : 0;

    return {
      initialBalance: strategyParams.initialBalance,
      currentBalance,
      totalPnl: Number(totalPnl.toFixed(2)),
      totalPnlPercent: Number(totalPnlPercent.toFixed(1)),
      winRate: Number(winRate.toFixed(1)),
      totalTrades: totalClosed,
      winningTrades,
      losingTrades,
      profitFactor: Number(profitFactor.toFixed(2)),
      maxDrawdown: Number(maxDd.toFixed(1)),
      bestTrade: Number(bestTrade.toFixed(2)),
      worstTrade: Number(worstTrade.toFixed(2)),
      expectancy,
      strategyMode: strategyParams.strategyMode,
    };
  }, [trades, strategyParams.initialBalance, strategyParams.strategyMode]);

  const handleToggleSound = () => {
    sounds.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-200">
      {/* Top Header & Symbol Switcher */}
      <ControlBar
        selectedSymbol={symbol}
        onSelectSymbol={(newSym) => setSymbol(newSym)}
        isLiveConnected={isLiveConnected}
        onRefresh={() => loadMarketData(symbol)}
        isRefreshing={isRefreshing}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPhpModal={() => setIsPhpModalOpen(true)}
        strategyParams={strategyParams}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 space-y-3 sm:space-y-4">
        {/* Strategy Context Banner */}
        <div
          id="strategy-info-banner"
          className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-950/40 via-slate-900/90 to-amber-950/30 border border-slate-800 rounded-xl text-xs"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="font-semibold text-slate-200">
              Indikator Scalper 1-Menit:
            </span>
            <span className="text-slate-400 hidden sm:inline">
              EMA 9/21 Trend Cross + Pullback Rebound + ATR Dynamic
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <div className="flex items-center gap-1.5 text-purple-300 font-bold bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/70">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
              Take Profit = UNGU (1:1.5)
            </div>
            <div className="flex items-center gap-1.5 text-orange-300 font-bold bg-orange-950/60 px-2 py-0.5 rounded border border-orange-800/70">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              Stop Loss = ORANYE (1.2 ATR)
            </div>
          </div>
        </div>

        {/* Account & Capital Metrics ($28 initial) */}
        <StatsHeader
          summary={accountSummary}
          initialCapital={strategyParams.initialBalance}
          onUpdateCapital={(cap) =>
            setStrategyParams((prev) => ({ ...prev, initialBalance: cap }))
          }
        />

        {/* Live Candlestick Chart */}
        <ChartContainer
          candles={candles}
          symbol={symbol}
          trades={trades}
          activeTrade={activeTrade}
          lastUpdated={lastUpdated}
          onRefresh={() => loadMarketData(symbol, brokerProvider, candleLimit)}
          brokerProvider={brokerProvider}
          onBrokerProviderChange={(prov) => {
            setBrokerProvider(prov);
            loadMarketData(symbol, prov, candleLimit);
          }}
          candleLimit={candleLimit}
          onCandleLimitChange={handleCandleLimitChange}
          onLoadMoreCandles={handleLoadMoreCandles}
          isLoadingMore={isLoadingMore}
        />

        {/* Trading History Table */}
        <TradingHistoryTable
          trades={trades}
          initialBalance={strategyParams.initialBalance}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-3 text-center text-xs text-slate-500 font-mono">
        <p>
          XAU/USD & BTC/USD 1M Scalper • Data Rill Spot Gold OANDA & FXCM (100% Feed Asli TradingView) • Modal Awal $28.00
        </p>
      </footer>

      {/* Strategy Tuning Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        params={strategyParams}
        onSave={(newParams) => {
          setStrategyParams(newParams);
          // Re-evaluate
          if (candles.length > 0) {
            const { trades: evaluatedTrades } = evaluateScalpingStrategy(
              candles,
              newParams,
              symbol
            );
            setTrades(evaluatedTrades);
          }
        }}
      />

      {/* Standalone 1-File PHP Modal */}
      <PhpSourceModal
        isOpen={isPhpModalOpen}
        onClose={() => setIsPhpModalOpen(false)}
      />
    </div>
  );
}
