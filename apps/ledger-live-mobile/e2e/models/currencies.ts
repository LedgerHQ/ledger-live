import { Unit } from "@ledgerhq/types-cryptoassets";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";

export const COSMOS_MIN_SAFE = new BigNumber(100000); // 100000 uAtom
export const COSMOS_MIN_FEES = new BigNumber(6000);

export const formattedAmount = (unit: Unit, amount: BigNumber, showAllDigits = false) =>
  // amount formatted with the same unit as what the input should use
  formatCurrencyUnit(unit, amount, {
    showCode: true,
    showAllDigits: showAllDigits,
    disableRounding: false,
  });

export function initTestAccounts(currencyIds: string[]) {
  setSupportedCurrencies(currencyIds as CryptoCurrencyId[]);
  return currencyIds.map((currencyId: string) =>
    genAccount("mock" + currencyId, { currency: getCryptoCurrencyById(currencyId) }),
  );
}
export const capitalize = (s: string) => s && s[0].toUpperCase() + s.slice(1);
