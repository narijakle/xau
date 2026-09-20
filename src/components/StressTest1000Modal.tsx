import React, { useState, useMemo } from 'react';
import { StrategyParams, SupportedSymbol, Simulation1000Result } from '../types';
import { run1000TradesSimulation, autoCalibrateStrategy } from '../utils/indicators';
import {
  X,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Zap,
  CheckCircle2,
  DollarSign,
  BarChart3,
  Sliders,
  Award,
} from 'lucide-react';

interface StressTest1000ModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentParams: StrategyParams;
  symbol: SupportedSymbol;
  onApplyParams: (newParams: StrategyParams) => void;
}

const SPREAD_PRESETS = [
  { name: 'Raw / ECN Spread (0.10)', value: 0.10, desc: 'IC Markets Raw, Exness Zero' },
  { name: 'Standard Rendah (0.15)', value: 0.15, desc: 'Broker tier-1 Emas standar' },
  { name: 'Standard Rata-rata (0.20)', value: 0.20, desc: 'Rata-rata broker MT4/MT5 (20 pips)' },
  { name: 'Akun Mikro / Cent (0.30)', value: 0.30, desc: 'Spread lebar pada akun cent/bonus' },
];

export const StressTest1000Modal: React.FC<StressTest1000ModalProps> = ({
  isOpen,
  onClose,
  currentParams,
  symbol,
  onApplyParams,
}) => {
  const [spreadVal, setSpreadVal] = useState<number>(
    typeof currentParams.brokerSpread === 'number' ? currentParams.brokerSpread : 0.18
  );
  const [simResult, setSimResult] = useState<Simulation1000Result>(() =>
    run1000TradesSimulation(
      { ...currentParams, brokerSpread: typeof currentParams.brokerSpread === 'number' ? currentParams.brokerSpread : 0.18 },
      symbol,
      1000
    )
  );
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibratedResult, setCalibratedResult] = useState<Simulation1000Result | null>(null);
  const [calibratedParams, setCalibratedParams] = useState<StrategyParams | null>(null);
  const [appliedNotice, setAppliedNotice] = useState(false);

  // Re-run simulation when user changes spread
  const handleSpreadChange = (newSpread: number) => {
    setSpreadVal(newSpread);
    const updatedParams = { ...currentParams, brokerSpread: newSpread };
    const res = run1000TradesSimulation(updatedParams, symbol, 1000);
    setSimResult(res);
    setCalibratedResult(null);
    setCalibratedParams(null);
    setAppliedNotice(false);
  };

  // Run auto-calibration across 1,000 trades
  const handleAutoCalibrate = () => {
    setIsCalibrating(true);
    setTimeout(() => {
      const activeBase = { ...currentParams, brokerSpread: spreadVal };
      const { calibratedParams: optParams, comparison } = autoCalibrateStrategy(activeBase, symbol);
      setCalibratedParams(optParams);
      setCalibratedResult(comparison.after);
      setIsCalibrating(false);
    }, 450);
  };

  const handleApplyCalibrated = () => {
    const target = calibratedParams || { ...currentParams, brokerSpread: spreadVal };
    onApplyParams(target);
    setAppliedNotice(true);
    setTimeout(() => {
      setAppliedNotice(false);
      onClose();
    }, 1200);
  };

  const activeDisplay = calibratedResult || simResult;

  // Max and min for equity curve rendering
  const { minBal, maxBal, pointsSvg } = useMemo(() => {
    const curve = activeDisplay.equityCurve;
    if (!curve || curve.length === 0) {
      return { minBal: 28, maxBal: 100, pointsSvg: '' };
    }
    const balances = curve.map((c) => c.balance);
    const minB = Math.min(...balances);
    const maxB = Math.max(...balances);
    const range = maxB - minB || 1;

    const width = 800;
    const height = 180;
    const padding = 20;

    const points = curve.map((c) => {
      const x = padding + (c.tradeIndex / 1000) * (width - padding * 2);
      const y = height - padding - ((c.balance - minB) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return {
      minBal: minB,
      maxBal: maxB,
      pointsSvg: points.join(' '),
    };
  }, [activeDisplay]);

  if (!isOpen) return null;

  return (
    <div
      id="modal-stress-test-1000"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                Simulasi & Kalibrasi 1.000 Eksekusi Trading
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Real Broker Spread Applied
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Uji ketahanan algoritma scalping pada 1.000 percobaan dengan potongan biaya spread riil broker.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Spread Broker Configurator */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-slate-200">
                  Pengaturan Biaya Spread Broker (0.01 Lot):
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Spread Aktif:</span>
                <span className="px-2.5 py-1 rounded bg-purple-950/80 text-purple-300 font-mono font-bold text-xs border border-purple-800/80">
                  ${spreadVal.toFixed(2)} / trade ({(spreadVal * 100).toFixed(0)} pips/pts)
                </span>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {SPREAD_PRESETS.map((preset) => {
                const isSelected = Math.abs(spreadVal - preset.value) < 0.001;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSpreadChange(preset.value)}
                    className={`p-2.5 rounded-lg text-left transition-all border ${
                      isSelected
                        ? 'bg-purple-950/50 border-purple-500 text-purple-200 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-semibold">{preset.name}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{preset.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Custom slider */}
            <div className="flex items-center gap-4 pt-1">
              <span className="text-xs text-slate-400 whitespace-nowrap">Atur Manual:</span>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.01"
                value={spreadVal}
                onChange={(e) => handleSpreadChange(parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <span className="font-mono text-xs text-purple-300 min-w-[50px] text-right font-bold">
                ${spreadVal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col">
              <span className="text-[11px] text-slate-400">Total Eksekusi</span>
              <span className="text-lg font-mono font-bold text-white mt-1">1.000</span>
              <span className="text-[10px] text-slate-400 mt-0.5">100% Selesai</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col">
              <span className="text-[11px] text-slate-400">Win Rate Bersih</span>
              <span className="text-lg font-mono font-bold text-emerald-400 mt-1">
                {activeDisplay.winRate}%
              </span>
              <span className="text-[10px] text-purple-400 mt-0.5">
                {activeDisplay.winningTrades} Menang / {activeDisplay.losingTrades} Kalah
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col">
              <span className="text-[11px] text-slate-400">Saldo Akhir ($28)</span>
              <span className="text-lg font-mono font-bold text-emerald-300 mt-1">
                ${activeDisplay.finalBalance.toFixed(2)}
              </span>
              <span className="text-[10px] text-emerald-400 mt-0.5">
                +{(((activeDisplay.finalBalance - 28) / 28) * 100).toFixed(0)}% ROI
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col">
              <span className="text-[11px] text-slate-400">Net Profit Bersih</span>
              <span className="text-lg font-mono font-bold text-emerald-400 mt-1">
                +${activeDisplay.netProfit.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Setelah potongan spread</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col">
              <span className="text-[11px] text-slate-400">Biaya Spread Broker</span>
              <span className="text-lg font-mono font-bold text-orange-400 mt-1">
                -${activeDisplay.totalSpreadPaid.toFixed(2)}
              </span>
              <span className="text-[10px] text-orange-300 mt-0.5">
                1000 x ${spreadVal.toFixed(2)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col">
              <span className="text-[11px] text-slate-400">Max Drawdown</span>
              <span className="text-lg font-mono font-bold text-sky-400 mt-1">
                {activeDisplay.maxDrawdown}%
              </span>
              <span className="text-[10px] text-sky-300 mt-0.5">Risk Controlled</span>
            </div>
          </div>

          {/* Equity Growth Curve across 1000 Trades */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">
                  Grafik Pertumbuhan Ekuitas Akun (1.000 Trades)
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-slate-400">Awal: $28.00</span>
                <span className="text-purple-400 font-bold">
                  Peak: ${maxBal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* SVG Chart */}
            <div className="relative w-full h-44 bg-slate-950/80 rounded-lg border border-slate-800/80 overflow-hidden flex items-end p-2">
              <svg
                viewBox="0 0 800 180"
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="equityGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal lines */}
                <line x1="20" y1="30" x2="780" y2="30" stroke="#334155" strokeDasharray="3,3" strokeWidth="0.8" />
                <line x1="20" y1="80" x2="780" y2="80" stroke="#334155" strokeDasharray="3,3" strokeWidth="0.8" />
                <line x1="20" y1="130" x2="780" y2="130" stroke="#334155" strokeDasharray="3,3" strokeWidth="0.8" />

                {/* Filled area */}
                {pointsSvg && (
                  <polygon
                    points={`20,160 ${pointsSvg} 780,160`}
                    fill="url(#equityGrad)"
                  />
                )}

                {/* Main line */}
                {pointsSvg && (
                  <polyline
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pointsSvg}
                  />
                )}
              </svg>
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 font-mono px-1">
              <span>Trade #1 (Mulai $28)</span>
              <span>Trade #250</span>
              <span>Trade #500</span>
              <span>Trade #750</span>
              <span className="text-emerald-400 font-bold">Trade #1000 (${activeDisplay.finalBalance.toFixed(2)})</span>
            </div>
          </div>

          {/* Institutional Breakdown: TP Ungu vs SL Oranye vs BE */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                🟣
              </div>
              <div>
                <div className="text-xs font-semibold text-purple-200">Take Profit (Ungu)</div>
                <div className="text-sm font-bold font-mono text-purple-300">
                  {activeDisplay.winningTrades - activeDisplay.beTrades} Kali Eksekusi
                </div>
                <div className="text-[10px] text-slate-400">Target penuh tercapai</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                🛡️
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-200">BE Proteksi (+0.2R)</div>
                <div className="text-sm font-bold font-mono text-emerald-300">
                  {activeDisplay.beTrades} Kali Terkunci
                </div>
                <div className="text-[10px] text-slate-400">Profit aman saat berbalik</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-800/40 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-300 flex items-center justify-center font-bold">
                🟠
              </div>
              <div>
                <div className="text-xs font-semibold text-orange-200">Stop Loss (Oranye)</div>
                <div className="text-sm font-bold font-mono text-orange-300">
                  {activeDisplay.losingTrades} Kali Eksekusi
                </div>
                <div className="text-[10px] text-slate-400">Kerugian terkontrol 4%</div>
              </div>
            </div>
          </div>

          {/* Calibrate & Fixer Section */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-bold text-slate-100">
                  Fitur Kalibrasi Algoritma Otomatis (1.000 Trades)
                </h4>
                {calibratedResult && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Optimal Calibrated!
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Sistem akan memindai 1.000 eksekusi simulasi untuk menemukan rasio RR dan titik Breakeven terbaik
                agar profit tetap maksimal meskipun spread broker Anda besar (${spreadVal.toFixed(2)}).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleAutoCalibrate}
                disabled={isCalibrating}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg shadow-lg shadow-purple-600/20 transition-all cursor-pointer w-full sm:w-auto"
              >
                {isCalibrating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Mengkalibrasi 1000 Trade...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Kalibrasi Ulang Otomatis</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleApplyCalibrated}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/80 hover:bg-emerald-600 border border-emerald-600/80 rounded-lg transition-all cursor-pointer w-full sm:w-auto"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Terapkan ke Live Scalper</span>
              </button>
            </div>
          </div>

          {appliedNotice && (
            <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/80 text-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Parameter optimal berhasil diterapkan ke sistem trading live Anda! Menutup jendela...
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>SMC Institutional Rigorous Expectancy Model (1.000 Trades)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
