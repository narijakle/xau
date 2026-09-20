import React from 'react';
import { AccountSummary } from '../types';
import { TrendingUp, ShieldCheck, DollarSign, Award, Target, Zap, Sparkles } from 'lucide-react';

interface StatsHeaderProps {
  summary: AccountSummary;
  initialCapital: number;
  onUpdateCapital?: (newCapital: number) => void;
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({
  summary,
  initialCapital,
}) => {
  const isProfitable = summary.totalPnl >= 0;
  const isHighWinRate = summary.winRate >= 65;

  const getStrategyLabel = () => {
    switch (summary.strategyMode) {
      case 'SMC_INSTITUTIONAL':
        return '💎 SMC Institutional';
      case 'MOMENTUM_TREND':
        return '⚡ Momentum Scalper';
      case 'CAPITAL_PRESERVER':
        return '🛡️ Capital Preserver';
      default:
        return '💎 SMC Institutional';
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Institutional Strategy Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-950/60 via-slate-900 to-amber-950/40 border border-purple-800/40 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </span>
          <span className="text-purple-300 font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Mesin Algoritma: <span className="text-white underline decoration-purple-500/50 underline-offset-2">{getStrategyLabel()}</span>
          </span>
          <span className="hidden sm:inline-block text-[11px] text-slate-400">
            • Stop-Run Liquidity Reclaim + Dynamic Trailing Breakeven (+0.2R)
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-slate-400">Ekspektansi Profit:</span>
          <span className={`font-bold ${summary.expectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {summary.expectancy >= 0 ? '+' : ''}${summary.expectancy.toFixed(2)}/trade
          </span>
        </div>
      </div>

      {/* 6 Cards Metric Grid */}
      <div
        id="account-stats-header"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 w-full"
      >
        {/* 1. Modal Awal */}
        <div
          id="card-initial-capital"
          className="flex flex-col justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Modal Awal</span>
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-bold font-mono text-white">
              ${initialCapital.toFixed(2)}
            </span>
            <span className="text-[10px] text-amber-400/90 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              Micro
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5">Lot 0.01 / Scalp</span>
        </div>

        {/* 2. Saldo Terkini */}
        <div
          id="card-current-balance"
          className={`flex flex-col justify-between p-3 rounded-xl border shadow-sm transition-all ${
            isProfitable
              ? 'bg-slate-900/90 border-emerald-500/40 shadow-emerald-950/20'
              : 'bg-slate-900/90 border-rose-500/40 shadow-rose-950/20'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Saldo Akun</span>
            <TrendingUp
              className={`w-3.5 h-3.5 ${
                isProfitable ? 'text-emerald-400' : 'text-rose-400'
              }`}
            />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5 font-mono">
            <span className="text-lg sm:text-xl font-bold text-white">
              ${summary.currentBalance.toFixed(2)}
            </span>
            <span
              className={`text-xs font-semibold ${
                isProfitable ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isProfitable ? '+' : ''}
              {summary.totalPnlPercent.toFixed(1)}%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 font-mono">
            Net: {isProfitable ? '+' : ''}${summary.totalPnl.toFixed(2)}
          </span>
        </div>

        {/* 3. Win Rate */}
        <div
          id="card-win-rate"
          className={`flex flex-col justify-between p-3 rounded-xl border shadow-sm ${
            isHighWinRate
              ? 'bg-purple-950/20 border-purple-500/40 shadow-purple-950/20'
              : 'bg-slate-900/80 border-slate-800/80'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Win Rate</span>
            <Award className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="mt-1 flex items-baseline justify-between font-mono">
            <span className="text-lg sm:text-xl font-bold text-purple-300">
              {summary.winRate.toFixed(1)}%
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                isHighWinRate
                  ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40'
                  : 'text-purple-400 bg-purple-500/10 border-purple-500/20'
              }`}
            >
              {isHighWinRate ? 'High Win' : 'Active'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5">
            {summary.winningTrades}W / {summary.losingTrades}L
          </span>
        </div>

        {/* 4. TP & SL Count (Strict Color Highlights) */}
        <div
          id="card-tp-sl-count"
          className="flex flex-col justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Hasil Eksekusi</span>
            <Target className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="mt-1 flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-1 text-purple-400 font-semibold bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/50">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              TP: {summary.winningTrades}
            </div>
            <div className="flex items-center gap-1 text-orange-400 font-semibold bg-orange-950/40 px-2 py-0.5 rounded border border-orange-800/50">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              SL: {summary.losingTrades}
            </div>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5">
            Ungu = TP • Oranye = SL
          </span>
        </div>

        {/* 5. Profit Factor */}
        <div
          id="card-profit-factor"
          className="flex flex-col justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Profit Factor</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline justify-between font-mono">
            <span className="text-lg sm:text-xl font-bold text-amber-300">
              {summary.profitFactor >= 99 ? '∞' : summary.profitFactor.toFixed(2)}
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              RR 1:1.3
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5">
            Max DD: {summary.maxDrawdown.toFixed(1)}%
          </span>
        </div>

        {/* 6. Total Trades */}
        <div
          id="card-total-trades"
          className="flex flex-col justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Eksekusi</span>
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1 flex items-baseline justify-between font-mono">
            <span className="text-lg sm:text-xl font-bold text-slate-200">
              {summary.totalTrades}
            </span>
            <span className="text-[10px] text-purple-300 bg-purple-900/40 border border-purple-700/50 px-1.5 py-0.5 rounded font-mono">
              1-Menit
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5">
            Best: +${summary.bestTrade.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
