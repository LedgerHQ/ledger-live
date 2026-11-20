import { isTokenAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Account, AccountBridge, AccountLike } from "@ledgerhq/types-live";

export async function prepareWalletApiTransaction(
  account: AccountLike,
  parentAccount: Account | undefined,
  liveTx: Partial<Transaction>,
): Promise<Transaction> {
  const bridge: AccountBridge<Transaction> = await getAccountBridge(account, parentAccount);
  const initialTx = bridge.createTransaction(account);
  const { recipient, ...txData } = liveTx;
  const txWithRecipient = bridge.updateTransaction(initialTx, {
    recipient,
    subAccountId: isTokenAccount(account) ? account.id : undefined,
  });

  return bridge.updateTransaction(txWithRecipient, txData);
}
