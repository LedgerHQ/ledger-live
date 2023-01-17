import { isTokenAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { Account, AccountLike, TransactionCommon } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

export default function prepareSignTransaction(
  account: AccountLike,
  parentAccount: Account | undefined,
  liveTx: Partial<Transaction & { gasLimit: BigNumber }>,
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
