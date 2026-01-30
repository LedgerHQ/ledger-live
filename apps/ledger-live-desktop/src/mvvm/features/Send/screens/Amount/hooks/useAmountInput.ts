import { useCallback, useMemo, type ChangeEvent } from "react";
import { BigNumber } from "bignumber.js";
import { useSelector } from "LLD/hooks/redux";
import {
  useSendAmount,
  useCalculateCountervalueCallback,
} from "@ledgerhq/live-countervalues-react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { useAmountInputCore } from "@ledgerhq/live-common/flows/send/screens/amount";

type UseAmountInputParams = Readonly<{
  account: AccountLike;
  parentAccount: Account | null;
  transaction: Transaction;
  status: TransactionStatus;
  onUpdateTransaction: (patch: Partial<Transaction>) => void;
}>;

export function useAmountInput({
  account,
  parentAccount,
  transaction,
  status,
  onUpdateTransaction,
}: UseAmountInputParams) {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);

  const mainAccount = useMemo(
    () => getMainAccount(account, parentAccount ?? undefined),
    [account, parentAccount],
  );

  const accountCurrency = useMemo(() => getAccountCurrency(mainAccount), [mainAccount]);
  const accountUnit = useMaybeAccountUnit(mainAccount) ?? accountCurrency.units[0];
  const fiatUnit = counterValueCurrency.units[0];

  // When useAllAmount is true, the bridge calculates the actual amount (balance - fees)
  // This calculated amount is available in status.amount
  const cryptoAmount = useMemo(() => {
    if (transaction.useAllAmount) {
      return status.amount ?? new BigNumber(0);
    }
    return transaction.amount ?? new BigNumber(0);
  }, [transaction.amount, transaction.useAllAmount, status.amount]);

  const { fiatAmount, calculateCryptoAmount } = useSendAmount({
    account,
    fiatCurrency: counterValueCurrency,
    cryptoAmount,
  });
  const calculateFiatFromCrypto = useCalculateCountervalueCallback({
    to: counterValueCurrency,
  });

  const core = useAmountInputCore({
    transaction,
    status,
    locale,
    accountCurrency,
    accountUnit,
    counterValueCurrency,
    fiatUnit,
    cryptoAmount,
    fiatAmount,
    calculateCryptoAmount,
    calculateFiatFromCrypto,
    onUpdateTransaction,
  });

  // Wrap onChangeText to accept DOM ChangeEvent for desktop
  const onAmountChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      core.onChangeText(event.target.value);
    },
    [core],
  );

  return {
    ...core,
    onAmountChange,
  };
}
