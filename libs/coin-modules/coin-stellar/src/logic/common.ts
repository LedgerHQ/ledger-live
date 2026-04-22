import { parseCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import BigNumber from "bignumber.js";

export const stellarUnit = {
  name: "Lumen",
  code: "XLM",
  magnitude: 7,
};
export const parseAPIValue = (value: string): BigNumber => parseCurrencyUnit(stellarUnit, value);
