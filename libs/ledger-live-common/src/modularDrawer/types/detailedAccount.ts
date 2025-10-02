import { Unit } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

/**
 * Base raw detailed account with unformatted values for UI formatting
 * This is the shared interface that both mobile and desktop can extend
 */
export interface BaseRawDetailedAccount {
  id: string;
  name: string;
  ticker: string;
  balance: BigNumber;
  balanceUnit: Unit;
  fiatValue: number;
  address: string;
  cryptoId: string;
  parentId?: string;
}

/**
 * Extended detailed account that includes the original account references
 * Used by mobile implementation that needs access to the full account objects
 */
export interface ExtendedRawDetailedAccount extends BaseRawDetailedAccount {
  account: AccountLike;
  parentAccount?: AccountLike;
  protocol?: string;
}

/**
 * Configuration for formatting detailed accounts
 */
export interface DetailedAccountFormatConfig {
  discreet?: boolean;
  locale?: string;
  showCode?: boolean;
}

/**
 * Parameters for creating detailed accounts
 */
export interface CreateDetailedAccountsParams {
  asset: any; // CryptoOrTokenCurrency - avoiding import to keep this generic
  accountTuples: any[]; // AccountTuple[] - avoiding import to keep this generic
  accountNameMap: Record<string, string>;
  isTokenCurrency: boolean;
  formatConfig?: DetailedAccountFormatConfig;
}
