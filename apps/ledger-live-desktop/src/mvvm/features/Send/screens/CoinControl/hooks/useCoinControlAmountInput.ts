import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useCallback, useMemo } from "react";
import type { ChangeEvent } from "react";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import {
  getMainAccount,
  getAccountCurrency,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useCoinControlAmountInput as useCoinControlAmountInputCommon } from "@ledgerhq/live-common/flows/send/coinControl/hooks/useCoinControlAmountInput";

type UseAmountInputParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  onUpdateTransaction: (patch: Partial<Transaction>) => void;
  locale: string;
}>;

export function useCoinControlAmountInput({
  account,
  parentAccount,
  transaction,
  status,
  onUpdateTransaction,
  locale,
}: UseAmountInputParams) {
  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );
  const accountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const accountUnit = useMaybeAccountUnit(mainAccount) ?? accountCurrency.units[0];

  const common = useCoinControlAmountInputCommon({
    transaction,
    status,
    onUpdateTransaction,
    locale,
    accountUnit,
  });

  const onAmountChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      common.onAmountChange(event.target.value);
    },
    [common],
  );

  return {
    ...common,
    onAmountChange,
  };
}
