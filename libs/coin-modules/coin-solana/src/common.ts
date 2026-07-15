import { parseCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/formatCurrencyUnit";
import { BigNumber } from "bignumber.js";

export const solanaUnit = {
  name: "Solana",
  code: "SOL",
  magnitude: 9,
};

export const parseAPIValue = (value: string): BigNumber => parseCurrencyUnit(solanaUnit, value);

export const formatAPIValue = (value: BigNumber | number | bigint | string): string =>
  formatCurrencyUnit(solanaUnit, new BigNumber(value.toString()));

export const formatAPIValueWithCode = (value: BigNumber | number | bigint | string): string =>
  `${formatAPIValue(value)} ${solanaUnit.code}`;
