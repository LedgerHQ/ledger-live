import { isTokenAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Transaction } from "@ledgerhq/live-common/lib/generated/types";
import { Account, AccountLike, TransactionCommon } from "@ledgerhq/types-live";

export default function prepareSignTransaction(
  account: AccountLike,
  parentAccount: Account | null,
  liveTx: Partial<Transaction>,
): TransactionCommon {
  const bridge = getAccountBridge(account, parentAccount);
  const t = bridge.createTransaction(account);
  const { recipient, ...txData } = liveTx;
  const t2 = bridge.updateTransaction(t, {
    recipient,
    subAccountId: isTokenAccount(account) ? account.id : undefined,
  });

  return bridge.updateTransaction(t2, {
    userGasLimit: txData.gasLimit,
    ...txData,
  });
}
