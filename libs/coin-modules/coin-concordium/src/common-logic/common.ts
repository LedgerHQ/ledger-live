import { BigNumber } from "bignumber.js";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

// NOTE: replace ripple by your currency id, it should be found in
// libs/ledgerjs/packages/cryptoassets/src/currencies.ts
const concordiumUnit = getCryptoCurrencyById("concordium").units[0];
export const parseAPIValue = (value: string): BigNumber => parseCurrencyUnit(concordiumUnit, value);
