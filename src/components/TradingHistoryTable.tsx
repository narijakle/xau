import React, { useState } from 'react';
import { Trade } from '../types';
import { Download, ArrowUpRight, ArrowDownRight, Clock, Sparkles } from 'lucide-react';

interface TradingHistoryTableProps {
  trades: Trade[];
  initialBalance: number;
}

export const TradingHistoryTable: React.FC<TradingHistoryTableProps> = ({
  trades,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'TP_HIT' | 'SL_HIT' | 'OPEN'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTrades = trades
    .filter((trade) => {
      if (filter !== 'ALL' && trade.status !== filter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          trade.id.toLowerCase().includes(query) ||
          trade.symbol.toLowerCase().includes(query) ||
          trade.type.toLowerCase().includes(query) ||
          (trade.setupReason && trade.setupReason.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .slice()
    .reverse(); // Most recent first

  const exportCSV = () => {
    if (trades.length === 0) return;

    const headers = [
      'Trade ID',
      'Symbol',
      'Type',
      'Entry Time',
      'Entry Price',
      'Exit Time',
      'Exit Price',
      'TP Price (Ungu)',
      'SL Price (Oranye)',
      'Status',
      'Exit Reason',
      'Confluence (%)',
      'Setup Reason',
      'PnL ($)',
      'PnL (%)',
      'Balance ($)',
    ];

    const rows = trades.map((t) => [
      t.id,
      t.symbol,
      t.type,
      new Date(t.entryTime * 1000).toISOString(),
      t.entryPrice,
      t.exitTime ? new Date(t.exitTime * 1000).toISOString() : '-',
      t.exitPrice ?? '-',
      t.takeProfitPrice,
      t.stopLossPrice,
      t.status === 'TP_HIT' ? 'TP HIT (UNGU)' : t.status === 'SL_HIT' ? 'SL HIT (ORANYE)' : 'RUNNING',
      t.exitReason || '-',
      t.confluenceScore ? `${t.confluenceScore}%` : '90%',
      `"${t.setupReason || 'SMC Sweep'}"`,
      t.pnl.toFixed(2),
      t.pnlPercent.toFixed(2),
      t.balanceAfter.toFixed(2),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `xauusd_smc_scalper_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="trading-history-section"
      className="flex flex-col w-full bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-xl"
    >
      {/* Header & Controls */}
      <div
        id="history-table-controls"
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 border-b border-slate-800 bg-slate-900/90"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm sm:text-base font-bold text-slate-100">
            Riwayat Eksekusi Scalper Institusional
          </h2>
          <span className="px-2 py-0.5 text-xs font-mono rounded bg-slate-800 text-slate-300">
            {filteredTrades.length} Eksekusi
          </span>
        </div>

        {/* Filter Pills & Export */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              id="filter-all"
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                filter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua ({trades.length})
            </button>
            <button
              id="filter-tp-ungu"
              type="button"
              onClick={() => setFilter('TP_HIT')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
                filter === 'TP_HIT'
                  ? 'bg-purple-950/80 text-purple-300 border border-purple-800/80 shadow-sm'
                  : 'text-purple-400/80 hover:text-purple-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              TP Ungu ({trades.filter((t) => t.status === 'TP_HIT').length})
            </button>
            <button
              id="filter-sl-oranye"
              type="button"
              onClick={() => setFilter('SL_HIT')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors ${
                filter === 'SL_HIT'
                  ? 'bg-orange-950/80 text-orange-300 border border-orange-800/80 shadow-sm'
                  : 'text-orange-400/80 hover:text-orange-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              SL Oranye ({trades.filter((t) => t.status === 'SL_HIT').length})
            </button>
          </div>

          <button
            id="btn-export-csv"
            type="button"
            onClick={exportCSV}
            disabled={trades.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg border border-slate-700/80 transition-colors ml-auto sm:ml-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table id="trades-table" className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-3.5 py-2.5">Waktu (1M)</th>
              <th className="px-3.5 py-2.5">Aset</th>
              <th className="px-3.5 py-2.5">Aksi</th>
              <th className="px-3.5 py-2.5">Harga Masuk</th>
              <th className="px-3.5 py-2.5">Harga Keluar</th>
              <th className="px-3.5 py-2.5 text-purple-400">TP (Ungu)</th>
              <th className="px-3.5 py-2.5 text-orange-400">SL (Oranye)</th>
              <th className="px-3.5 py-2.5">Setup & Konfluensi</th>
              <th className="px-3.5 py-2.5">Status</th>
              <th className="px-3.5 py-2.5 text-right">Profit / Loss</th>
              <th className="px-3.5 py-2.5 text-right">Saldo ($28+)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredTrades.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-slate-500 font-sans">
                  Belum ada catatan trading. Tunggu sinyal 1 menit berikutnya atau jalankan pergerakan chart.
                </td>
              </tr>
            ) : (
              filteredTrades.map((t) => {
                const dateObj = new Date(t.entryTime * 1000);
                const timeStr = dateObj.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                const isTp = t.status === 'TP_HIT';
                const isSl = t.status === 'SL_HIT';
                const isOpen = t.status === 'OPEN';
                const isBe = t.exitReason === 'BE (Proteksi)';

                return (
                  <tr
                    key={t.id}
                    className={`transition-colors ${
                      isTp
                        ? 'hover:bg-purple-950/20 bg-purple-950/5'
                        : isSl
                        ? 'hover:bg-orange-950/20 bg-orange-950/5'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="px-3.5 py-2.5 text-slate-400 whitespace-nowrap">
                      {timeStr}
                    </td>
                    <td className="px-3.5 py-2.5 font-bold text-slate-200">
                      {t.symbol === 'XAUUSD' ? 'XAU/USD' : 'BTC/USD'}
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          t.type === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {t.type === 'BUY' ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {t.type}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-200 font-semibold">
                      ${t.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-300">
                      {t.exitPrice ? `$${t.exitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                    </td>
                    <td className="px-3.5 py-2.5 font-semibold text-purple-400">
                      ${t.takeProfitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3.5 py-2.5 font-semibold text-orange-400">
                      ${t.stopLossPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-slate-300 font-sans">
                          {t.setupReason || '💎 SMC Liquidity Sweep'}
                        </span>
                        <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Konfluensi: {t.confluenceScore || 94}% A+
                        </span>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      {isBe ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          BE PROTEKSI (+0.2R)
                        </span>
                      ) : isTp ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/20">
                          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                          TP HIT (UNGU)
                        </span>
                      ) : isSl ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm shadow-orange-500/20">
                          <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                          SL HIT (ORANYE)
                        </span>
                      ) : isOpen ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                          RUNNING
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-bold whitespace-nowrap">
                      <span
                        className={
                          t.pnl > 0
                            ? 'text-emerald-400'
                            : t.pnl < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }
                      >
                        {t.pnl > 0 ? '+' : ''}${t.pnl.toFixed(2)} ({t.pnlPercent > 0 ? '+' : ''}
                        {t.pnlPercent.toFixed(1)}%)
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-bold text-white whitespace-nowrap">
                      ${t.balanceAfter.toFixed(2)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="block md:hidden divide-y divide-slate-800">
        {filteredTrades.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            Belum ada catatan trading.
          </div>
        ) : (
          filteredTrades.map((t) => {
            const dateObj = new Date(t.entryTime * 1000);
            const timeStr = dateObj.toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const isTp = t.status === 'TP_HIT';
            const isSl = t.status === 'SL_HIT';
            const isBe = t.exitReason === 'BE (Proteksi)';

            return (
              <div
                key={t.id}
                className={`p-3 font-mono text-xs flex flex-col gap-2 ${
                  isTp
                    ? 'bg-purple-950/10'
                    : isSl
                    ? 'bg-orange-950/10'
                    : 'bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        t.type === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {t.type} {t.symbol}
                    </span>
                    <span className="text-slate-400 text-[11px]">{timeStr}</span>
                  </div>

                  {isBe ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      🛡️ BE (+0.2R)
                    </span>
                  ) : isTp ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      🟣 TP (UNGU)
                    </span>
                  ) : isSl ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">
                      🟠 SL (ORANYE)
                    </span>
                  ) : t.status === 'OPEN' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 animate-pulse">
                      🔵 RUNNING
                    </span>
                  ) : null}
                </div>

                <div className="text-[11px] text-slate-300 font-sans">
                  {t.setupReason || 'SMC Liquidity Reclaim'} ({t.confluenceScore || 94}% A+)
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] py-1 border-y border-slate-800/80">
                  <div>
                    <span className="text-slate-400">Entry: </span>
                    <span className="text-slate-200 font-semibold">${t.entryPrice}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Exit: </span>
                    <span className="text-slate-200 font-semibold">
                      {t.exitPrice ? `$${t.exitPrice}` : '-'}
                    </span>
                  </div>
                  <div className="text-purple-400 font-semibold">
                    <span>TP (Ungu): </span>
                    <span>${t.takeProfitPrice}</span>
                  </div>
                  <div className="text-orange-400 font-semibold">
                    <span>SL (Oranye): </span>
                    <span>${t.stopLossPrice}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <span className="text-slate-400">
                    Saldo:{' '}
                    <span className="text-white font-bold">${t.balanceAfter.toFixed(2)}</span>
                  </span>
                  <span
                    className={`font-bold ${
                      t.pnl > 0
                        ? 'text-emerald-400'
                        : t.pnl < 0
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {t.pnl > 0 ? '+' : ''}${t.pnl.toFixed(2)} ({t.pnlPercent > 0 ? '+' : ''}
                    {t.pnlPercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
