import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import type { AmountScreenQuickAction } from "../types";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { useQuickActionsCore } from "@ledgerhq/live-common/flows/send/screens/amount";
import { BigNumber } from "bignumber.js";

type UseQuickActionsParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  maxAvailable: BigNumber;
  onSetAmountFromRatio: (amount: BigNumber) => void;
  onSelectMax: () => void;
}>;

export function useQuickActions({
  account,
  parentAccount,
  transaction,
  maxAvailable,
  onSetAmountFromRatio,
  onSelectMax,
}: UseQuickActionsParams): AmountScreenQuickAction[] {
  const { t } = useTranslation();
  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const accountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const accountUnit = useMaybeAccountUnit(mainAccount) ?? accountCurrency.units[0];

  const coreActions = useQuickActionsCore({
    transaction,
    maxAvailable,
    accountBalance: mainAccount.balance,
    accountUnit,
    onSetAmountFromRatio,
    onSelectMax,
    t,
  });

  // Map onPress to onClick for desktop
  return useMemo(
    () =>
      coreActions.map(action => ({
        ...action,
        onClick: action.onPress,
      })),
    [coreActions],
  );
}
