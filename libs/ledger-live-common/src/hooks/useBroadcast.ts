import { useCallback } from "react";
import { log } from "@ledgerhq/logs";
import type {
  SignedOperation,
  Operation,
  AccountLike,
  Account,
  BroadcastConfig,
  TransactionSource,
} from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-env";
import { formatOperation, getMainAccount } from "../account/index";
import { getAccountBridge } from "../bridge/index";
import { execAndWaitAtLeast } from "../promise";

type CommonLogEvent = {
  appVersion: string;
  source?: TransactionSource;
  currencyId: string;
  family: string;
  tokenId?: string;
};

type ErrorLogEvent = { status: "failure"; error: Error; txPayload: string } & CommonLogEvent;

type SuccessLogEvent = { status: "success" } & CommonLogEvent;

export type LogEvent = SuccessLogEvent | ErrorLogEvent;

export type SignTransactionArgs = {
  account?: AccountLike | null;
  parentAccount?: Account | null;
  broadcastConfig?: BroadcastConfig;
  logger?: (event: LogEvent) => void;
};

function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (typeof err === "string") return new Error(err);
  try {
    return new Error(JSON.stringify(err));
  } catch {
    return new Error(String(err));
  }
}

export const useBroadcast = ({
  account,
  parentAccount,
  broadcastConfig,
  logger,
}: SignTransactionArgs) => {
  const broadcast = useCallback(
    async (signedOperation: SignedOperation): Promise<Operation> => {
      if (!account) throw new Error("account not present");
      const mainAccount = getMainAccount(account, parentAccount);
      const bridge = await getAccountBridge(account, parentAccount);

      if (getEnv("DISABLE_TRANSACTION_BROADCAST")) {
        return Promise.resolve(signedOperation.operation);
      }

      const commonLogEvent: CommonLogEvent = {
        appVersion: getEnv("LEDGER_CLIENT_VERSION"),
        source: broadcastConfig?.source,
        currencyId: mainAccount.currency.id,
        family: mainAccount.currency.family,
        ...(account.type === "TokenAccount" ? { tokenId: account.token.id } : {}),
      };

      return execAndWaitAtLeast(3000, async () => {
        try {
          const operation = await bridge.broadcast({
            account: mainAccount,
            signedOperation,
            broadcastConfig,
          });
          log(
            "transaction-summary",
            `✔️ broadcasted! optimistic operation: ${formatOperation(mainAccount)(operation)}`,
          );
          if (logger) {
            logger({
              status: "success",
              ...commonLogEvent,
            });
          }
          return operation;
        } catch (err) {
          const error = toError(err);
          if (logger) {
            logger({
              status: "failure",
              error,
              txPayload: signedOperation.signature,
              ...commonLogEvent,
            });
          }
          throw err;
        }
      });
    },
    [account, parentAccount, broadcastConfig, logger],
  );

  return broadcast;
};
