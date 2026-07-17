import { BigNumber } from "bignumber.js";
import { parseCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";

export const parseAPIValue = (value: string): BigNumber =>
  parseCurrencyUnit(getCryptoCurrencyById("concordium").units[0], value);
