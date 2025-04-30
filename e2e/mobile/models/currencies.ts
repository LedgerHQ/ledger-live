import { Unit } from "@ledgerhq/types-cryptoassets";
import {
  findCryptoCurrencyById,
  formatCurrencyUnit,
  formatCurrencyUnitOptions,
} from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";

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

export const getCurrencyManagerApp = (currencyId: string) =>
  findCryptoCurrencyById(currencyId)?.managerAppName.toLowerCase().split(" ")[0];
