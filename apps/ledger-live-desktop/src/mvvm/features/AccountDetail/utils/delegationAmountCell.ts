import BigNumber from "bignumber.js";
import type { Unit } from "@domain/entity-currency-unit";
import type { DelegationCell } from "@features/flow-account-detail-delegations";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";

const MAX_DISPLAYED_DECIMALS = 4;

const formatAmount = (unit: Unit, amount: BigNumber) =>
  formatCurrencyUnit(unit, amount, {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
  });

export const delegationAmountCell = (unit: Unit, amount: BigNumber): DelegationCell => {
  const step = new BigNumber(1).shiftedBy(unit.magnitude - MAX_DISPLAYED_DECIMALS);
  const exact = formatAmount(unit, amount);

  if (amount.gt(0) && amount.lt(step)) {
    return { value: `<${formatAmount(unit, step)}`, tooltip: exact, sensitive: true };
  }

  const shown = amount.div(step).integerValue(BigNumber.ROUND_DOWN).times(step);
  if (!shown.eq(amount)) {
    return { value: formatAmount(unit, shown), tooltip: exact, sensitive: true };
  }
  return { value: exact, sensitive: true };
};
