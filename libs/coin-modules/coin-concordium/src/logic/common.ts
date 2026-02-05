import { BigNumber } from "bignumber.js";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

const concordiumUnit = getCryptoCurrencyById("concordium").units[0];
export const parseAPIValue = (value: string): BigNumber => parseCurrencyUnit(concordiumUnit, value);
