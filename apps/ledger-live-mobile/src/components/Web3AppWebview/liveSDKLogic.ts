import { isTokenAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { Account, AccountBridge, AccountLike, TransactionCommon } from "@ledgerhq/types-live";
import { bridge as ACREBridge } from "@ledgerhq/live-common/families/bitcoin/ACRESetup";

export default function prepareSignTransaction(
  account: AccountLike,
  parentAccount: Account | undefined,
  liveTx: Partial<Transaction>,
  isACRE?: boolean,
): TransactionCommon {
  const bridge = isACRE
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ACREBridge.accountBridge as unknown as AccountBridge<any>)
    : getAccountBridge(account, parentAccount);
  const t = bridge.createTransaction(account);
  const { recipient, ...txData } = liveTx;
  const t2 = bridge.updateTransaction(t, {
    recipient,
    subAccountId: isTokenAccount(account) ? account.id : undefined,
  });

  return bridge.updateTransaction(t2, txData);
}
