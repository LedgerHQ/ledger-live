export interface Unit {
  name: string;
  code: string;
  magnitude: number;
  showAllDigits?: boolean;
  prefixCode?: boolean;
}

export interface ExplorerView {
  [key: string]: unknown;
}

export interface CryptoCurrency {
  type: "CryptoCurrency";
  id: string;
  name: string;
  ticker: string;
  deviceTicker?: string;
  color: string;
  coinType: number;
  family: string;
  scheme: string;
  units: Unit[];
  managerAppName: string;
  supportsSegwit?: boolean;
  supportsNativeSegwit?: boolean;
  forkedFrom?: string;
  isTestnetFor?: string;
  blockAvgTime?: number;
  explorerViews: ExplorerView[];
  ethereumLikeInfo?: { chainId: number };
  bitcoinLikeInfo?: {
    P2PKH: number;
    P2SH: number;
    XPUBVersion?: number;
  };
  symbol?: string;
  disableCountervalue?: boolean;
  delisted?: boolean;
  keywords?: string[];
}

export interface TokenCurrency {
  type: "TokenCurrency";
  id: string;
  name: string;
  ticker: string;
  contractAddress: string;
  parentCurrencyId: string;
  units: Unit[];
  tokenType: string;
  delisted?: boolean;
  disableCountervalue?: boolean;
  ledgerSignature?: string;
}
