import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { BigNumber } from "bignumber.js";

const rippleUnit = getCryptoCurrencyById("ripple").units[0];
export const parseAPIValue = (value: string): BigNumber => parseCurrencyUnit(rippleUnit, value);
