import { useCallback } from "react";
import { log } from "@ledgerhq/logs";
import type { SignedOperation, Operation, AccountLike, Account } from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-env";
import { formatOperation, getMainAccount } from "../account/index";
import { getAccountBridge } from "../bridge/index";
import { execAndWaitAtLeast } from "../promise";

type SignTransactionArgs = {
  account?: AccountLike | null;
  parentAccount?: Account | null;
};

export const useBroadcast = ({ account, parentAccount }: SignTransactionArgs) => {
  const broadcast = useCallback(
    async (signedOperation: SignedOperation): Promise<Operation> => {
      if (!account) throw new Error("account not present");
      const mainAccount = getMainAccount(account, parentAccount);
      const bridge = getAccountBridge(account, parentAccount);

      if (getEnv("DISABLE_TRANSACTION_BROADCAST")) {
        return Promise.resolve(signedOperation.operation);
      }

      return execAndWaitAtLeast(3000, async () => {
        const operation = await bridge.broadcast({
          account: mainAccount,
          signedOperation,
        });
        log(
          "transaction-summary",
          `✔️ broadcasted! optimistic operation: ${formatOperation(mainAccount)(operation)}`,
        );
        return operation;
      });
    },
    [account, parentAccount],
  );

  return broadcast;
};
