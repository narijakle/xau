import React from 'react';
import { SupportedSymbol, StrategyParams } from '../types';
import { SYMBOL_CONFIG } from '../utils/marketData';
import { sounds } from '../utils/sounds';
import {
  Volume2,
  VolumeX,
  SlidersHorizontal,
  FileCode2,
  RefreshCw,
  Coins,
  ShieldAlert,
} from 'lucide-react';

interface ControlBarProps {
  selectedSymbol: SupportedSymbol;
  onSelectSymbol: (symbol: SupportedSymbol) => void;
  isLiveConnected: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  onOpenPhpModal: () => void;
  strategyParams: StrategyParams;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  selectedSymbol,
  onSelectSymbol,
  isLiveConnected,
  onRefresh,
  isRefreshing,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
  onOpenPhpModal,
  strategyParams,
}) => {
  return (
    <header
      id="main-app-header"
      className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 sm:p-4 bg-slate-900/90 border-b border-slate-800 backdrop-blur sticky top-0 z-30 shadow-lg"
    >
      {/* App Branding & Symbol Switcher */}
      <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/20 text-slate-950 font-black text-lg">
            Au
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                XAU/USD Pro Scalper
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                1M High Winrate
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Modal $28 • TP (Ungu) & SL (Oranye)
            </p>
          </div>
        </div>

        {/* Symbol Selector Pills */}
        <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            id="btn-symbol-xauusd"
            type="button"
            onClick={() => onSelectSymbol('XAUUSD')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedSymbol === 'XAUUSD'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>XAU/USD (Gold)</span>
          </button>

          <button
            id="btn-symbol-btcusd"
            type="button"
            onClick={() => onSelectSymbol('BTCUSD')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              selectedSymbol === 'BTCUSD'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>₿ BTC/USD</span>
          </button>
        </div>
      </div>

      {/* Action Buttons & Status */}
      <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
        {/* Live Streaming Badge */}
        <div
          id="status-live-indicator"
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isLiveConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isLiveConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="text-slate-300 text-[11px]">
            {isLiveConnected ? 'Live Data Rill' : 'Menghubungkan...'}
          </span>
        </div>

        {/* Refresh button */}
        <button
          id="btn-refresh-candles"
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg border border-slate-700/80 transition-colors"
          title="Segarkan Data Real-Time"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        {/* Audio Alert Toggle */}
        <button
          id="btn-toggle-sound"
          type="button"
          onClick={onToggleSound}
          className={`p-2 rounded-lg border transition-colors ${
            soundEnabled
              ? 'bg-purple-950/70 text-purple-300 border-purple-800/80'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title={soundEnabled ? 'Suara TP/SL Aktif' : 'Suara Dimatikan'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Strategy Settings Button */}
        <button
          id="btn-open-settings"
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Setelan Scalper</span>
        </button>

        {/* 1 File PHP+HTML+JS Viewer & Download Button */}
        <button
          id="btn-open-php-file"
          type="button"
          onClick={onOpenPhpModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-md shadow-amber-500/20 transition-all cursor-pointer"
        >
          <FileCode2 className="w-4 h-4" />
          <span>Source 1 File PHP</span>
        </button>
      </div>
    </header>
  );
};
