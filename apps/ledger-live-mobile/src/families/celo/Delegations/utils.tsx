import BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { Unit } from "@ledgerhq/types-cryptoassets";

export const formatAmount = (amount: BigNumber, unit: Unit) => {
  return formatCurrencyUnit(unit, new BigNumber(amount), {
    disableRounding: false,
    alwaysShowSign: false,
    showCode: true,
  });
};
