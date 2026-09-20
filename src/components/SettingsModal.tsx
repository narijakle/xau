import React, { useState } from 'react';
import { StrategyParams, StrategyPresetMode } from '../types';
import { X, Check, RotateCcw, Sparkles, Shield, Zap, Lock } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: StrategyParams;
  onSave: (newParams: StrategyParams) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  params,
  onSave,
}) => {
  const [formData, setFormData] = useState<StrategyParams>({ ...params });

  if (!isOpen) return null;

  const handleReset = () => {
    const defaultParams: StrategyParams = {
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
    };
    setFormData(defaultParams);
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div
      id="modal-settings-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="modal-settings-content"
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-amber-500 flex items-center justify-center text-slate-950 font-black">
              💎
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Ultra-Premium Scalper Engine ($28 Capital)
              </h3>
              <p className="text-xs text-slate-400">
                Mode Institusional SMC, Confluence & Trailing Breakeven
              </p>
            </div>
          </div>
          <button
            id="btn-close-settings"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm font-sans">
          {/* 1. Strategy Preset Selection */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Pilihan Mode Strategi (Engine Preset)</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, strategyMode: 'SMC_INSTITUTIONAL', riskToReward: 1.3, riskPerTradePercent: 4.0 })}
                className={`flex flex-col p-2.5 rounded-lg border text-left transition-all ${
                  formData.strategyMode === 'SMC_INSTITUTIONAL'
                    ? 'bg-purple-950/40 border-purple-500 text-white shadow-sm ring-1 ring-purple-500/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  💎 SMC Liquidity
                </span>
                <span className="text-[11px] text-slate-300 mt-0.5">Winrate ~70%</span>
                <span className="text-[10px] text-purple-400 mt-1">Sweep + Stop-Run Reclaim</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, strategyMode: 'MOMENTUM_TREND', riskToReward: 1.4, riskPerTradePercent: 5.0 })}
                className={`flex flex-col p-2.5 rounded-lg border text-left transition-all ${
                  formData.strategyMode === 'MOMENTUM_TREND'
                    ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                  ⚡ Trend Scalper
                </span>
                <span className="text-[11px] text-slate-300 mt-0.5">Agresif Trend</span>
                <span className="text-[10px] text-indigo-400 mt-1">EMA Ribbon Pullback</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, strategyMode: 'CAPITAL_PRESERVER', riskToReward: 1.3, riskPerTradePercent: 3.5 })}
                className={`flex flex-col p-2.5 rounded-lg border text-left transition-all ${
                  formData.strategyMode === 'CAPITAL_PRESERVER'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                  🛡️ Preserver
                </span>
                <span className="text-[11px] text-slate-300 mt-0.5">Konservatif</span>
                <span className="text-[10px] text-emerald-400 mt-1">200 EMA + SMC</span>
              </button>
            </div>
          </div>

          {/* 2. Trailing Breakeven Protection */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Smart Trailing Breakeven (Kunci Profit +0.2R)</span>
              </label>
              <input
                type="checkbox"
                checked={formData.useBreakeven}
                onChange={(e) => setFormData({ ...formData, useBreakeven: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Saat harga mencapai 55% menuju Take Profit, Stop Loss otomatis digeser ke titik aman (+0.2R).
              Mencegah trade yang sudah floating profit berbalik menjadi floating minus, mengamankan winrate jangka panjang.
            </p>
          </div>

          {/* 3. Capital & Risk Section */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Manajemen Modal & Risiko</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Modal Awal (USD $)
                </label>
                <input
                  type="number"
                  step="1"
                  min="5"
                  value={formData.initialBalance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initialBalance: parseFloat(e.target.value) || 28,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-slate-500">
                  Target modal kecil $28
                </span>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Risiko Per Posisi (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="15"
                  value={formData.riskPerTradePercent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      riskPerTradePercent: parseFloat(e.target.value) || 4.0,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-slate-500">
                  ~${((formData.initialBalance * formData.riskPerTradePercent) / 100).toFixed(2)} per posisi
                </span>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Risk-to-Reward (RR)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="1.0"
                  max="2.5"
                  value={formData.riskToReward}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      riskToReward: parseFloat(e.target.value) || 1.3,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-slate-500">
                  1 : {formData.riskToReward} (Rasio Terbaik untuk 1M Gold)
                </span>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  SMC Lookback Candles
                </label>
                <input
                  type="number"
                  step="1"
                  min="3"
                  max="15"
                  value={formData.smcLookback}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      smcLookback: parseInt(e.target.value) || 6,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
                <span className="text-[11px] text-slate-500">
                  Pencarian liquidity sweep (Default: 6)
                </span>
              </div>
            </div>
          </div>

          {/* Color Confirmation Info */}
          <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl text-xs space-y-1">
            <div className="font-bold text-purple-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              Sistem Visual Sesuai Permintaan:
            </div>
            <p className="text-slate-300 text-[11px]">
              • <strong className="text-purple-400">Take Profit (TP) = UNGU</strong> (Garis & marker di chart)<br />
              • <strong className="text-orange-400">Stop Loss (SL) = ORANYE</strong> (Garis & marker di chart)<br />
              • <strong className="text-emerald-400">BE Proteksi (+0.2R)</strong> = Otomatis mengamankan profit
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/95">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Default $28</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-md transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Simpan & Terapkan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
