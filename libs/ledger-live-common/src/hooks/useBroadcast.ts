import { useCallback } from "react";
import { log } from "@ledgerhq/logs";
import type {
  SignedOperation,
  Operation,
  AccountLike,
  Account,
  BroadcastConfig,
  TransactionCommon,
} from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-env";
import { formatOperation, getMainAccount } from "../account/index";
import { getAccountBridge } from "../bridge/index";
import { execAndWaitAtLeast } from "../promise";
import {
  BroadcastFlow,
  buildBroadcastCommonEvent,
  buildBroadcastFailureEvent,
  buildBroadcastSuccessEvent,
  type BroadcastLogger,
  type LogEvent,
} from "../wallet-api/broadcastLogEvent";

// Re-exported for backward compatibility — consumers import `LogEvent` from this module.
export type { LogEvent, BroadcastLogger };

export type SignTransactionArgs = {
  account?: AccountLike | null;
  parentAccount?: Account | null;
  broadcastConfig?: BroadcastConfig;
  logger?: BroadcastLogger;
  transaction?: TransactionCommon | null;
};

export const useBroadcast = ({
  account,
  parentAccount,
  broadcastConfig,
  logger,
  transaction,
}: SignTransactionArgs) => {
  const broadcast = useCallback(
    async (signedOperation: SignedOperation): Promise<Operation> => {
      if (!account) throw new Error("account not present");
      const mainAccount = getMainAccount(account, parentAccount);
      const bridge = await getAccountBridge(account, parentAccount);

      if (getEnv("DISABLE_TRANSACTION_BROADCAST")) {
        return Promise.resolve(signedOperation.operation);
      }

      const commonLogEvent = buildBroadcastCommonEvent({
        account,
        mainAccount,
        flow: BroadcastFlow.Send,
        source: broadcastConfig?.source,
        isSendMax: Boolean(transaction?.useAllAmount),
      });

      return execAndWaitAtLeast(3000, async () => {
        try {
          const operation = await bridge.broadcast({
            account: mainAccount,
            signedOperation,
            broadcastConfig,
          });
          log(
            "transaction-summary",
            `✔️ broadcasted! optimistic operation: ${(await formatOperation(mainAccount))(operation)}`,
          );
          if (logger) {
            logger(buildBroadcastSuccessEvent(commonLogEvent));
          }
          return operation;
        } catch (err) {
          if (logger) {
            logger(buildBroadcastFailureEvent(commonLogEvent, err, signedOperation));
          }
          throw err;
        }
      });
    },
    [account, parentAccount, broadcastConfig, logger, transaction],
  );

  return broadcast;
};
