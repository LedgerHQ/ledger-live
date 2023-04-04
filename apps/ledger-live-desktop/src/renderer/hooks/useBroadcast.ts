import invariant from "invariant";
import { useCallback } from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { SignedOperation, Operation, AccountLike, Account } from "@ledgerhq/types-live";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { execAndWaitAtLeast } from "@ledgerhq/live-common/promise";
import { getEnv } from "@ledgerhq/live-common/env";
type SignTransactionArgs = {
  account: AccountLike | undefined | null;
  parentAccount: Account | undefined | null;
};
export const useBroadcast = ({ account, parentAccount }: SignTransactionArgs) => {
  const broadcast = useCallback(
    async (signedOperation: SignedOperation): Promise<Operation> => {
      invariant(account, "account not present");
      const mainAccount = getMainAccount(account, parentAccount);
      const bridge = getAccountBridge(account, parentAccount);
      if (getEnv("DISABLE_TRANSACTION_BROADCAST")) {
        return Promise.resolve(signedOperation.operation);
      }
      return execAndWaitAtLeast(3000, () =>
        bridge.broadcast({
          account: mainAccount,
          signedOperation,
        }),
      );
    },
    [account, parentAccount],
  );
  return broadcast;
};
