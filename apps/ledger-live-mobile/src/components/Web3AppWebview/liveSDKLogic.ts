import { isTokenAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { Account, AccountLike, TransactionCommon } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

export default function prepareSignTransaction(
  account: AccountLike,
  parentAccount: Account | null | undefined,
  liveTx: Partial<
    Transaction & {
      gasLimit: BigNumber;
    }
  >,
): TransactionCommon {
  const bridge = getAccountBridge(account, parentAccount);
  return bridge.updateTransaction(liveTx, {
    subAccountId: isTokenAccount(account) ? account.id : undefined,
  });
}
