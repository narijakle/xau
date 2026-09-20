export type SupportedSymbol = 'XAUUSD' | 'BTCUSD' | 'ETHUSD';

export interface CandleData {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TradeType = 'BUY' | 'SELL';
export type TradeStatus = 'OPEN' | 'TP_HIT' | 'SL_HIT';

export interface Trade {
  id: string;
  symbol: SupportedSymbol;
  type: TradeType;
  entryTime: number;
  entryPrice: number;
  exitTime?: number;
  exitPrice?: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  status: TradeStatus;
  pnl: number;
  pnlPercent: number;
  balanceAfter: number;
  lotSize: number;
  riskAmount: number;
  rewardAmount: number;
  exitReason?: 'TP (Ungu)' | 'SL (Oranye)' | 'BE (Proteksi)' | 'MANUAL';
  confluenceScore?: number; // Institutional Confluence Score 0 - 100%
  setupReason?: string; // Reason for entry (e.g. "SMC Liquidity Sweep & Reclaim")
  isBreakevenSecured?: boolean; // True if SL has trailed to lock profit/breakeven
  spreadCost?: number; // Biaya Spread Broker yang dipotong (USD)
  grossPnl?: number; // Profit kotor sebelum potongan spread
}

export interface IndicatorValues {
  emaFast: number; // EMA 9
  emaSlow: number; // EMA 21
  emaTrend: number; // EMA 50/200
  rsi: number;
  atr: number;
  supertrend: {
    value: number;
    direction: 1 | -1; // 1 = bullish, -1 = bearish
  };
}

export type StrategyPresetMode = 'SMC_INSTITUTIONAL' | 'MOMENTUM_TREND' | 'CAPITAL_PRESERVER';

export interface StrategyParams {
  strategyMode: StrategyPresetMode; // 'SMC_INSTITUTIONAL' (70%+ WinRate), 'MOMENTUM_TREND', 'CAPITAL_PRESERVER'
  riskToReward: number; // e.g. 1.3
  atrMultiplierSL: number; // e.g. 1.0
  atrMultiplierTP: number; // e.g. 1.3
  initialBalance: number; // default $28.00
  riskPerTradePercent: number; // e.g. 4.0%
  lotSize: number; // 0.01 micro lot
  emaFastPeriod: number; // 9
  emaSlowPeriod: number; // 21
  emaTrendPeriod: number; // 50
  rsiPeriod: number; // 14
  useBreakeven: boolean; // Trailing breakeven protection
  breakevenRatio: number; // Trigger ratio towards TP (e.g. 0.55 = 55%)
  smcLookback: number; // Liquidity sweep candle lookback (e.g. 6)
  brokerSpread: number; // Spread broker dalam USD untuk 0.01 lot (default: 0.18 = 18 pips XAUUSD)
}

export interface AccountSummary {
  initialBalance: number;
  currentBalance: number;
  totalPnl: number;
  totalPnlPercent: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number; // TP Ungu
  losingTrades: number;  // SL Oranye
  profitFactor: number;
  maxDrawdown: number;
  bestTrade: number;
  worstTrade: number;
  expectancy: number; // Expected profit per trade ($)
  strategyMode: StrategyPresetMode;
  totalSpreadPaid: number; // Total biaya spread broker
  grossProfit: number; // Total profit kotor sebelum spread
  brokerSpread: number;
}

export interface Simulation1000Result {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  beTrades: number;
  winRate: number;
  initialBalance: number;
  finalBalance: number;
  netProfit: number;
  totalSpreadPaid: number;
  profitFactor: number;
  maxDrawdown: number;
  expectancy: number;
  equityCurve: { tradeIndex: number; balance: number }[];
  trades: Trade[];
  isCalibrated: boolean;
  appliedParams: StrategyParams;
}

