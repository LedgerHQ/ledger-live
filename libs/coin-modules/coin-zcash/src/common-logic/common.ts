import { BigNumber } from "bignumber.js";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

// NOTE: replace zcash by your currency id, it should be found in
// libs/ledgerjs/packages/cryptoassets/src/currencies.ts
const zcashUnit = getCryptoCurrencyById("zcash").units[0];
export const parseAPIValue = (value: string): BigNumber => parseCurrencyUnit(zcashUnit, value);
