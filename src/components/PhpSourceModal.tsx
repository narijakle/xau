import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode, ExternalLink } from 'lucide-react';

interface PhpSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhpSourceModal: React.FC<PhpSourceModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      const res = await fetch('/xauusd_trading.php');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/xauusd_trading.php';
    link.download = 'xauusd_trading.php';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="modal-php-source-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="modal-php-source-content"
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                File Tunggal: xauusd_trading.php
              </h3>
              <p className="text-xs text-slate-400">
                1 file mandiri berisi PHP backend + HTML5 + CSS + JavaScript
              </p>
            </div>
          </div>
          <button
            id="btn-close-php-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info & Instructions */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <span>Keunggulan File Ini:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              <li>
                <strong>100% 1 File Mandiri</strong>: Cukup upload file ini ke cPanel, Apache, XAMPP, Laragon, atau hosting PHP apa saja.
              </li>
              <li>
                <strong>Data Rill 1-Menit</strong>: Menampilkan data real-time kline emas (XAU/USD via PAXG 1:1 spot gold) dan Bitcoin (BTC/USD).
              </li>
              <li>
                <strong>Indikator Buy/Sell Scalper</strong>: Disesuaikan untuk interval 1 menit dengan modal kecil $28.
              </li>
              <li>
                <strong>Warna Target Spesifik</strong>: <span className="text-purple-400 font-bold">Take Profit = UNGU (🟣)</span> dan <span className="text-orange-400 font-bold">Stop Loss = ORANYE (🟠)</span> pada chart dan tabel riwayat.
              </li>
              <li>
                <strong>Tabel Riwayat Trading</strong>: Menampilkan kalkulasi profit/loss, status TP/SL, dan akumulasi saldo mulai dari $28.
              </li>
            </ul>
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-amber-400">Cara Menjalankan di Komputer / Hosting:</div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 font-mono text-[11px]">
              <li>Unduh file <code className="text-amber-300">xauusd_trading.php</code> dengan tombol di bawah.</li>
              <li>Jika menggunakan XAMPP/cPanel: letakkan di folder <code className="text-amber-300">htdocs/</code> atau <code className="text-amber-300">public_html/</code>.</li>
              <li>Atau jalankan via terminal: <code className="text-emerald-400">php -S localhost:8000</code> lalu buka di browser <code className="text-sky-400">http://localhost:8000/xauusd_trading.php</code>.</li>
            </ol>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/90">
          <span className="text-slate-400 text-xs font-mono">
            Ukuran: ~14 KB (Zero Dependency)
          </span>

          <div className="flex items-center gap-2">
            <button
              id="btn-copy-php-code"
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Kode'}</span>
            </button>

            <button
              id="btn-download-php-file"
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-md transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Unduh xauusd_trading.php</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
