import { BigNumber } from "bignumber.js";
import { parseCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

const boilerplateUnit = getCryptoCurrencyById("ripple").units[0];
export const parseAPIValue = (value: string): BigNumber => parseCurrencyUnit(boilerplateUnit, value);
