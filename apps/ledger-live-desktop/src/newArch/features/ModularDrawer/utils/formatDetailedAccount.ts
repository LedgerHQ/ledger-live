import { Unit } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";

// Raw detailed account with unformatted values for UI formatting
export type RawDetailedAccount = {
  name: string;
  id: string;
  ticker: string;
  balance: BigNumber;
  balanceUnit: Unit;
  // Raw fiat value for UI formatting
  fiatValue?: number;
  fiatUnit?: Unit;
  // Formatting parameters
  locale?: string;
  discreet?: boolean;
  // Other properties
  address: string;
  cryptoId: string;
  parentId?: string;
};
