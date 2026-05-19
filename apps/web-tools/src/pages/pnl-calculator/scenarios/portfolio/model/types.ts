import type BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AssetPnL, PortfolioPnL } from "@ledgerhq/wallet-pnl";

export type PortfolioErrorKind =
  | "invalid-json"
  | "missing-accounts"
  | "encrypted"
  | "decode-all-failed"
  | "countervalues-failed";

export type PortfolioError = {
  kind: PortfolioErrorKind;
  message: string;
};

export type SkippedReason = "decode-failed" | "no-countervalue" | "empty";

export type SkippedAccount = {
  reason: SkippedReason;
  id: string;
  /** Friendly label: account name or `currencyId — shortId`. */
  label: string;
  /** Underlying decode error message, if any. */
  detail?: string;
};

export type AssetRow = {
  id: string;
  ticker: string;
  currencyId: string;
  label: string;
  isTokenAccount: boolean;
  /** Currently held atomic balance (used to format the crypto amount). */
  balance: BigNumber;
  currency: CryptoCurrency | TokenCurrency;
  pnl: AssetPnL;
};

export type PortfolioBreakdown = {
  totals: PortfolioPnL;
  rows: AssetRow[];
  /** Accounts that flattened but produced no PnL (no CV / empty / etc). */
  unsupported: SkippedAccount[];
};

export type DecodeResult = {
  accounts: Account[];
  /** User-specified account name ("Account 1 name") by account id, when present. */
  namesById: Map<string, string>;
  failures: SkippedAccount[];
};
