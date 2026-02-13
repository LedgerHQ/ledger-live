import { useMemo, useState } from "react";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { areAmountsEqual } from "../utils/amount";
import type { AmountScreenQuickAction } from "../types";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";

type UseQuickActionsParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  maxAvailable: BigNumber;
  onSetAmountFromRatio: (amount: BigNumber) => void;
  onSelectMax: () => void;
}>;

const QUICK_ACTIONS_CONFIG = [
  { id: "quarter", ratio: 0.25 },
  { id: "half", ratio: 0.5 },
  { id: "threeQuarters", ratio: 0.75 },
];

// Cap tolerance calculation at 8 decimals to prevent floating-point precision errors
// and handle edge cases with very high magnitude currencies
const TOLERANCE_MAGNITUDE_CAP = 8;

export function useQuickActions({
  account,
  parentAccount,
  transaction,
  maxAvailable,
  onSetAmountFromRatio,
  onSelectMax,
}: UseQuickActionsParams): AmountScreenQuickAction[] {
  const { t } = useTranslation();
  const [lastSelection, setLastSelection] = useState<null | { id: string; amount: BigNumber }>(
    null,
  );
  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const accountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const accountUnit = useMaybeAccountUnit(mainAccount) ?? accountCurrency.units[0];

  const tolerance = useMemo(() => {
    const magnitude = Math.min(Math.max(accountUnit.magnitude, 0), TOLERANCE_MAGNITUDE_CAP);
    return new BigNumber(1).dividedBy(new BigNumber(10).pow(magnitude));
  }, [accountUnit.magnitude]);

  const quickActions = useMemo(() => {
    // Don't disable quick actions just because maxAvailable changed due to fee updates
    // Only disable if account balance is actually 0 (use main account)
    const disabled = mainAccount.balance.lte(0);
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
        label: t(`newSendFlow.quickActions.${config.id}`),
        onClick: () => {
          if (isActive) return;
          setLastSelection({ id: config.id, amount: targetAmount });
          onSetAmountFromRatio(targetAmount);
        },
        active: isActive,
        disabled,
      };
    });

    const canSendMax = sendFeatures.canSendMax(accountCurrency);
    const isMaxActive = transaction.useAllAmount ?? false;
    actions.push({
      id: "max",
      label: t("newSendFlow.quickActions.max"),
      onClick: () => {
        if (isMaxActive) return;
        setLastSelection(null);
        onSelectMax();
      },
      active: isMaxActive,
      disabled: disabled || !canSendMax,
    });

    return actions;
  }, [
    lastSelection,
    maxAvailable,
    mainAccount.balance,
    onSelectMax,
    onSetAmountFromRatio,
    t,
    transaction.amount,
    transaction.useAllAmount,
    tolerance,
    accountCurrency,
  ]);

  return quickActions;
}
