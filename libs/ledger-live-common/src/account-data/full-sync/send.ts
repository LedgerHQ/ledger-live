import { BigNumber } from "bignumber.js";
import { defer, throwError } from "rxjs";
import { catchError, filter, map, mergeMap } from "rxjs/operators";
import type {
  Account,
  SignedOperation,
  SignOperationEvent,
  TransactionStatusCommon,
} from "@ledgerhq/types-live";
import type { AccountTarget } from "@domain/api-account-data";
import {
  SignatureRefusedError,
  type AccountSendCapability,
  type TransactionSignEvent,
} from "@domain/api-account-transaction";
import { AmountStrSchema } from "@domain/entity-account-balance";
import { TransactionHashSchema } from "@domain/entity-account-operation";
import type { SendRequest, TransactionIssue } from "@domain/entity-account-transaction";
import { addPendingOperation } from "@ledgerhq/ledger-wallet-framework/account";
import { getAccountBridge } from "../../bridge";
import { buildRecipientTransactionPatch } from "../../bridge/descriptor/send/memo";
import { sendFeatures } from "../../bridge/descriptor/send/features";
import type { Transaction } from "../../coin-modules/transaction-types";
import { FullSyncAccountNotFoundError, FullSyncSendExpiredError } from "./errors";
import { toAccountOperations } from "./operations";
import { isFullSyncSupported } from "./supports";
import type { FullSyncHost } from "./createFullSyncSource";

/** The bridge's status key, when it names a field of the request rather than a family one. */
function fieldOf(key: string): TransactionIssue["field"] {
  switch (key) {
    case "recipient":
    case "amount":
    case "fees":
    case "memo":
      return key;
    default:
      return undefined;
  }
}

const OWN_ERROR_KEYS = new Set(["name", "message", "stack"]);

/** The error's own primitive properties: what its translation interpolates. */
function paramsOf(error: Error): TransactionIssue["params"] {
  const entries = Object.entries(error).filter(
    (entry): entry is [string, string | number] =>
      !OWN_ERROR_KEYS.has(entry[0]) &&
      (typeof entry[1] === "string" || typeof entry[1] === "number"),
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

const issuesOf = (errors: Record<string, Error>): TransactionIssue[] =>
  Object.entries(errors).map(([key, error]) => ({
    name: error.name,
    message: error.message,
    field: fieldOf(key),
    params: paramsOf(error),
  }));

const amountOf = (value: BigNumber) => AmountStrSchema.parse(value.integerValue().toFixed());

function subAccountIdOf(account: Account, request: SendRequest): string | undefined {
  if (request.assetId === account.currency.id) return undefined;
  const token = account.subAccounts?.find(sub => sub.token.id === request.assetId);
  if (!token) throw new Error(`No ${request.assetId} in account ${account.id}`);
  return token.id;
}

/** The family's own objects stay here, keyed by the handle the payload carries: the store never holds them. */
function createHandles<T>() {
  const held = new Map<string, T>();
  let next = 0;
  return {
    hold(value: T) {
      const handle = `full-sync:${++next}`;
      held.set(handle, value);
      return { handle };
    },
    take(payload: unknown): T {
      const handle =
        typeof payload === "object" && payload !== null && "handle" in payload
          ? payload.handle
          : undefined;
      const value = typeof handle === "string" ? held.get(handle) : undefined;
      if (value === undefined) throw new FullSyncSendExpiredError();
      return value;
    },
    drop(payload: unknown) {
      if (typeof payload === "object" && payload !== null && "handle" in payload) {
        held.delete(String(payload.handle));
      }
    },
  };
}

function toSignEvent(
  event: SignOperationEvent,
  hold: (signed: SignedOperation) => { handle: string },
): TransactionSignEvent | undefined {
  switch (event.type) {
    case "device-streaming":
      return { type: "device-streaming", progress: event.progress };
    case "device-signature-requested":
    case "device-signature-granted":
      return { type: event.type };
    case "signed":
      return { type: "signed", signed: { payload: hold(event.signedOperation) } };
    default:
      return undefined;
  }
}

/** Sends through the legacy `AccountBridge`, as the send flows do, from the account the store holds. */
export function createFullSyncSender(host: FullSyncHost): AccountSendCapability {
  const transactions = createHandles<Transaction>();
  const signatures = createHandles<SignedOperation>();

  const accountOf = ({ accountUUID }: AccountTarget): Account => {
    const account = host.findAccount(accountUUID);
    if (!account) throw new FullSyncAccountNotFoundError(`No legacy account for ${accountUUID}`);
    return account;
  };

  return {
    supports: isFullSyncSupported,

    async prepare(target, request) {
      const account = accountOf(target);
      const bridge = await getAccountBridge(account);
      const created = bridge.createTransaction(account);
      const memoErrors: TransactionIssue[] = [];
      const canCarryMemo = sendFeatures.hasMemoForRecipient(account.currency, request.recipient);
      if (request.memo !== undefined && !canCarryMemo) {
        memoErrors.push({ name: "MemoNotSupported", message: "", field: "memo" });
      }
      const recipientPatch = buildRecipientTransactionPatch(created, {
        address: request.recipient,
        memo: request.memo !== undefined && canCarryMemo ? { value: request.memo } : undefined,
      });
      const draft = bridge.updateTransaction(created, {
        ...recipientPatch,
        amount: new BigNumber(request.amount),
        useAllAmount: request.useAllAmount ?? false,
        feesStrategy: request.feeStrategy ?? "medium",
        subAccountId: subAccountIdOf(account, request),
      });
      const transaction: Transaction = await bridge.prepareTransaction(account, draft);
      const status: TransactionStatusCommon = await bridge.getTransactionStatus(
        account,
        transaction,
      );
      return {
        request,
        amount: amountOf(status.amount),
        fees: amountOf(status.estimatedFees),
        feeAssetId: account.currency.id,
        totalSpent: amountOf(status.totalSpent),
        errors: [...issuesOf(status.errors), ...memoErrors],
        warnings: issuesOf(status.warnings),
        payload: transactions.hold(transaction),
      };
    },

    sign: (target, prepared, device) =>
      defer(async () => {
        const account = accountOf(target);
        const transaction = transactions.take(prepared.payload);
        return { account, transaction, bridge: await getAccountBridge(account) };
      }).pipe(
        mergeMap(({ account, transaction, bridge }) =>
          bridge
            .signOperation({ account, transaction, deviceId: device.compatDeviceId })
            .pipe(
              catchError((error: unknown) =>
                throwError(() =>
                  sendFeatures.isUserRefusedTransactionError(account.currency, error)
                    ? new SignatureRefusedError(String(error))
                    : error,
                ),
              ),
            ),
        ),
        map(event => toSignEvent(event, signatures.hold)),
        filter((event): event is TransactionSignEvent => event !== undefined),
      ),

    async broadcast(target, prepared, signed) {
      const account = accountOf(target);
      const signedOperation = signatures.take(signed.payload);
      const bridge = await getAccountBridge(account);
      const operation = await bridge.broadcast({ account, signedOperation });
      signatures.drop(signed.payload);
      transactions.drop(prepared.payload);
      const hash = TransactionHashSchema.parse(operation.hash || signedOperation.operation.hash);
      try {
        host.updateAccountWithUpdater(account.id, stored => addPendingOperation(stored, operation));
        const updated = host.findAccount(target.accountUUID) ?? account;
        const rows = toAccountOperations(updated).operations.filter(row => row.hash === hash);
        return { hash, operations: rows };
      } catch {
        return { hash, operations: [] };
      }
    },
  };
}
