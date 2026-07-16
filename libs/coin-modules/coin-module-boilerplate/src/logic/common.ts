import { parseCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { BigNumber } from "bignumber.js";

// NOTE: replace ripple by your currency id, it should be found in
// libs/ledgerjs/packages/cryptoassets/src/currencies.ts
export const parseAPIValue = (value: string): BigNumber =>
  parseCurrencyUnit(getCryptoCurrencyById("ripple").units[0], value);
