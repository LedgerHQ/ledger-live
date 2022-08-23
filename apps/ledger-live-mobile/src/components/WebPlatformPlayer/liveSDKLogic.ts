import { isTokenAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getPlatformTransactionSignFlowInfos } from "@ledgerhq/live-common/platform/converters";
import { deserializePlatformTransaction } from "@ledgerhq/live-common/platform/serializers";
import { TrackFunction } from "@ledgerhq/live-common/platform/tracking";
import { AppManifest } from "@ledgerhq/live-common/platform/types";
import { RawPlatformTransaction } from "@ledgerhq/live-common/platform/rawTypes";
import { Account, AccountLike, TransactionCommon } from "@ledgerhq/types-live";

export default function peprareSignTransaction(
  accounts: AccountLike[],
  manifest: AppManifest,
  tracking: Record<string, TrackFunction>,
  accountId: string,
  transaction: RawPlatformTransaction,
): {
  parentAccount: Account | undefined;
  tx: TransactionCommon;
} {
  const platformTransaction = deserializePlatformTransaction(transaction);
  const account = accounts.find(account => account.id === accountId);

  if (!account) {
    tracking.platformSignTransactionFail(manifest);
    throw new Error("Account required");
  }

  const parentAccount = isTokenAccount(account)
    ? (accounts.find(a => a.id === account.parentId) as Account)
    : undefined;

  if (
    (isTokenAccount(account)
      ? parentAccount?.currency.family
      : account.currency.family) !== platformTransaction.family
  ) {
    throw new Error("Transaction family not matching account currency family");
  }

  // @TODO replace with correct error
  if (!transaction) {
    tracking.platformSignTransactionFail(manifest);
    throw new Error("Transaction required");
  }

  const bridge = getAccountBridge(account, parentAccount);
  const { liveTx } = getPlatformTransactionSignFlowInfos(platformTransaction);
  const t = bridge.createTransaction(account);
  const { recipient, ...txData } = liveTx;
  const t2 = bridge.updateTransaction(t, {
    recipient,
    subAccountId: isTokenAccount(account) ? account.id : undefined,
  });

  const tx = bridge.updateTransaction(t2, {
    userGasLimit: txData.gasLimit,
    ...txData,
  });

  return {
    parentAccount,
    tx,
  };
}
