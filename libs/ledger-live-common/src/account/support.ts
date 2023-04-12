import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { getAccountBridge } from "../bridge";
import type { Account, AccountLike } from "@ledgerhq/types-live";

import {
  shouldShowNewAccount,
  getReceiveFlowError,
  checkAccountSupported,
} from "@ledgerhq/coin-framework/account/support";

export { shouldShowNewAccount, getReceiveFlowError, checkAccountSupported };

export function canSend(
  account: AccountLike,
  parentAccount: Account | null | undefined
): boolean {
  try {
    getAccountBridge(account, parentAccount).createTransaction(
      getMainAccount(account, parentAccount)
    );
    return true;
  } catch (e) {
    return false;
  }
}
