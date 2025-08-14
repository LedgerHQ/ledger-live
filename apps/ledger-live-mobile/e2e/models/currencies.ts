import { Unit } from "@ledgerhq/types-cryptoassets";
import {
  formatCurrencyUnit,
  formatCurrencyUnitOptions,
} from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";
import { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { AccountLike } from "@ledgerhq/types-live";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";

export const COSMOS_MIN_SAFE = new BigNumber(100000); // 100000 uAtom
export const COSMOS_MIN_FEES = new BigNumber(6000);
const defaultFormatOptions = {
  showCode: true,
  showAllDigits: false,
  disableRounding: false,
};

export const formattedAmount = (
  unit: Unit,
  amount: BigNumber,
  options: formatCurrencyUnitOptions = defaultFormatOptions,
) =>
  // amount formatted with the same unit as what the input should use
  formatCurrencyUnit(unit, amount, options);

export const getAccountUnit = (account: AccountLike) => getAccountCurrency(account).units[0];
export const getAccountName = (account: AccountLike) => getDefaultAccountName(account);

export function initTestAccounts(currencyIds: string[]) {
  setSupportedCurrencies(currencyIds as CryptoCurrencyId[]);
  return currencyIds.map((currencyId: string) =>
    genAccount("mock" + currencyId, { currency: getCryptoCurrencyById(currencyId) }),
  );
}
