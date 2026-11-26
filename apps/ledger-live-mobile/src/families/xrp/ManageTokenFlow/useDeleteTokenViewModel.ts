import { useCallback, useEffect } from "react";
import type { Account } from "@ledgerhq/types-live";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { makeOptOutTransaction } from "@ledgerhq/live-common/families/xrp/tokens";
import type { Transaction, XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { useAccountName } from "~/reducers/wallet";
import { useSignAndBroadcast } from "../components/SignAndBroadcast/useSignAndBroadcast";

export type Props = Readonly<{
  account: Account;
  tokenAccount: XrpTokenAccount;
  onSuccess: () => void;
  onDone: () => void;
}>;

export function useDeleteTokenViewModel(props: Props) {
  const { account, tokenAccount, onSuccess, onDone } = props;

  const accountName = useAccountName(account);

  const bridge = useAccountBridge<Transaction>(account);
  const bridgeTransaction = useBridgeTransaction<Transaction>(bridge, () => {
    return { account, transaction: makeOptOutTransaction(bridge, account, tokenAccount.token) };
  });

  const { transaction, updateAccount, updateTransaction } = bridgeTransaction;
  const bridgeAccount = bridgeTransaction.account;

  useEffect(() => {
    if (bridgeAccount === account) return;

    updateAccount(account);
    updateTransaction(tx => ({ ...tx }));
  }, [account, bridgeAccount, updateAccount, updateTransaction]);

  const signAndBroadcast = useSignAndBroadcast({
    account,
    transaction,
    token: tokenAccount.token,
    action: "delete",
    initialStep: tokenAccount.balance.gt(0) ? "blocked" : "confirm",
    onCancel: onDone,
    onExit: onDone,
  });

  const { showStep } = signAndBroadcast;

  // The confirmation shows refusals and preparation that may have changed since the failure
  const onRetry = useCallback(() => showStep("confirm"), [showStep]);

  const statusErrors = Object.values(bridgeTransaction.status.errors);
  const statusError = bridgeTransaction.bridgeError ?? statusErrors[0];

  const isTransactionReady = !bridgeTransaction.bridgePending && !!transaction;

  return {
    ...signAndBroadcast,
    accountName,
    statusError,
    onSuccess,
    onRetry,
    onContinue: signAndBroadcast.onSign,
    token: tokenAccount.token,
    isContinueDisabled: !isTransactionReady || !!statusError,
    isContinueLoading: bridgeTransaction.bridgePending,
  };
}
