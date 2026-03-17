import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { useMemo } from "react";
import { useMaybeAccountUnit } from "~/hooks";
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

  return useCoinControlAmountInputCommon({
    transaction,
    status,
    onUpdateTransaction,
    locale,
    accountUnit,
  });
}
