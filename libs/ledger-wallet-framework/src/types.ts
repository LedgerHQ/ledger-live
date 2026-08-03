import { z } from "zod";

/** Opaque identifier for a crypto currency (e.g. `"bitcoin"`, `"ethereum"`). Non-empty string. */
export const CryptoCurrencyIdSchema = z.string().min(1).brand<"CryptoCurrencyId">();
export type CryptoCurrencyId = z.infer<typeof CryptoCurrencyIdSchema>;

/** Opaque identifier for a token (e.g. `"ethereum/erc20/usd-tether"`). Non-empty string. */
export const TokenCurrencyIdSchema = z.string().min(1).brand<"TokenCurrencyId">();
export type TokenCurrencyId = z.infer<typeof TokenCurrencyIdSchema>;

export type LedgerExplorerId = string;

export interface Unit {
  name: string;
  code: string;
  magnitude: number;
  showAllDigits?: boolean;
  prefixCode?: boolean;
}

export interface ExplorerView {
  tx?: string;
  address?: string;
  token?: string;
  stakePool?: string;
  [key: string]: unknown;
}

export interface CryptoCurrency {
  type: "CryptoCurrency";
  id: CryptoCurrencyId;
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
  explorerId?: string;
  tokenTypes?: string[];
}

export interface TokenCurrency {
  type: "TokenCurrency";
  id: TokenCurrencyId;
  name: string;
  ticker: string;
  contractAddress: string;
  parentCurrencyId: CryptoCurrencyId;
  units: Unit[];
  tokenType: string;
  delisted?: boolean;
  disableCountervalue?: boolean;
  ledgerSignature?: string;
  symbol?: string;
  keywords?: string[];
}

export interface FiatCurrency {
  type: "FiatCurrency";
  name: string;
  ticker: string;
  units: Unit[];
  symbol?: string;
  disableCountervalue?: boolean;
  delisted?: boolean;
  keywords?: string[];
}

export type Currency = FiatCurrency | CryptoCurrency | TokenCurrency;
