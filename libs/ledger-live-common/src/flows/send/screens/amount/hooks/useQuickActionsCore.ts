import { useMemo, useState } from "react";
import { BigNumber } from "bignumber.js";
import type { Transaction } from "../../../../generated/types";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import { areAmountsEqual } from "../utils/amount";
import type { AmountScreenQuickAction } from "../types";

type UseQuickActionsCoreParams = Readonly<{
  transaction: Transaction;
  maxAvailable: BigNumber;
  accountBalance: BigNumber;
  accountUnit: Unit;
  onSetAmountFromRatio: (amount: BigNumber) => void;
  onSelectMax: () => void;
  t: (key: string) => string;
}>;

const QUICK_ACTIONS_CONFIG = [
  { id: "quarter", ratio: 0.25, translationKey: "newSendFlow.quickActions.quarter" },
  { id: "half", ratio: 0.5, translationKey: "newSendFlow.quickActions.half" },
  { id: "threeQuarters", ratio: 0.75, translationKey: "newSendFlow.quickActions.threeQuarters" },
];

// Cap tolerance calculation at 8 decimals to prevent floating-point precision errors
// and handle edge cases with very high magnitude currencies
const TOLERANCE_MAGNITUDE_CAP = 8;

export function useQuickActionsCore({
  transaction,
  maxAvailable,
  accountBalance,
  accountUnit,
  onSetAmountFromRatio,
  onSelectMax,
  t,
}: UseQuickActionsCoreParams): AmountScreenQuickAction[] {
  const [lastSelection, setLastSelection] = useState<null | { id: string; amount: BigNumber }>(
    null,
  );

  const tolerance = useMemo(() => {
    const magnitude = Math.min(Math.max(accountUnit.magnitude, 0), TOLERANCE_MAGNITUDE_CAP);
    return new BigNumber(1).dividedBy(new BigNumber(10).pow(magnitude));
  }, [accountUnit.magnitude]);

  const quickActions = useMemo(() => {
    // Don't disable quick actions just because maxAvailable changed due to fee updates
    // Only disable if account balance is actually 0
    const disabled = accountBalance.lte(0);
    const currentAmount = transaction.amount ?? new BigNumber(0);

    const actions = QUICK_ACTIONS_CONFIG.map(config => {
      const targetAmount = maxAvailable
        .multipliedBy(config.ratio)
        .integerValue(BigNumber.ROUND_DOWN);

      // A button is active only if:
      // 1. We're not in "useAllAmount" mode (Max is selected)
      // 2. The current amount matches the target amount
      // 3. AND either we explicitly selected this button OR the amount is not zero
      //    (to avoid all buttons being active when amount is 0)
      const matchesTarget = areAmountsEqual(currentAmount, targetAmount, tolerance);
      const explicitlySelected =
        lastSelection?.id === config.id &&
        areAmountsEqual(currentAmount, lastSelection.amount, tolerance);
      const isActive =
        !transaction.useAllAmount &&
        (explicitlySelected || (matchesTarget && !currentAmount.isZero()));

      return {
        id: config.id,
        label: t(config.translationKey),
        onPress: () => {
          if (isActive) return;
          setLastSelection({ id: config.id, amount: targetAmount });
          onSetAmountFromRatio(targetAmount);
        },
        active: isActive,
        disabled,
      };
    });

    const isMaxActive = transaction.useAllAmount ?? false;
    actions.push({
      id: "max",
      label: t("newSendFlow.quickActions.max"),
      onPress: () => {
        if (isMaxActive) return;
        setLastSelection(null);
        onSelectMax();
      },
      active: isMaxActive,
      disabled,
    });

    return actions;
  }, [
    lastSelection,
    maxAvailable,
    accountBalance,
    onSelectMax,
    onSetAmountFromRatio,
    t,
    transaction.amount,
    transaction.useAllAmount,
    tolerance,
  ]);

  return quickActions;
}
