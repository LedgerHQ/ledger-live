import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import { getAccountBridge } from "../bridge";
import type { Account, AccountLike } from "@ledgerhq/types-live";

export {
  getReceiveFlowError,
  checkAccountSupported,
} from "@ledgerhq/ledger-wallet-framework/account/support";

export async function canSend(
  account: AccountLike,
  parentAccount: Account | null | undefined,
): Promise<boolean> {
  try {
    (await getAccountBridge(account, parentAccount)).createTransaction(
      getMainAccount(account, parentAccount),
    );
    return true;
  } catch {
    return false;
  }
}
