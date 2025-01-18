import { BigNumber } from "bignumber.js";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

// NOTE: replace ripple by your currency id, it should be found in
// libs/ledgerjs/packages/cryptoassets/src/currencies.ts
const boilerplateUnit = getCryptoCurrencyById("ripple").units[0];
export const parseAPIValue = (value: string): BigNumber =>
  parseCurrencyUnit(boilerplateUnit, value);
