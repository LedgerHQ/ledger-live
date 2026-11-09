import BigNumber from "bignumber.js";
import { defer, throwError } from "rxjs";
import { catchError, filter, map, mergeMap } from "rxjs/operators";
import type {
  Account,
  AccountBridge,
  SignedOperation,
  SignOperationEvent,
  TransactionStatusCommon,
} from "@ledgerhq/types-live";
import type { AccountTarget } from "@domain/api-account-data";
import {
  SignatureMismatchError,
  SignatureRefusedError,
  type AccountSendCapability,
  type TransactionSignEvent,
} from "@domain/api-account-transaction";
import { AmountStrSchema } from "@domain/entity-account-balance";
import {
  CryptoOrTokenCurrencyIdSchema,
  type CryptoOrTokenCurrencyId,
} from "@domain/entity-currency";
import { TransactionHashSchema } from "@domain/entity-account-operation";
import type {
  BroadcastedTransaction,
  FeeEstimate,
  SendRequest,
  TransactionIssue,
} from "@domain/entity-account-transaction";
import { addPendingOperation } from "@ledgerhq/ledger-wallet-framework/account";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { getAccountBridge } from "../../bridge";
import { getSendDescriptor } from "../../bridge/descriptor/registry";
import { buildRecipientTransactionPatch } from "../../bridge/descriptor/send/memo";
import { sendFeatures } from "../../bridge/descriptor/send/features";
import type { Transaction } from "../../coin-modules/transaction-types";
import {
  buildPresetEstimationPatch,
  getFeesStrategyForPreset,
} from "../../flows/send/utils/feeEstimation";
import { log } from "@ledgerhq/logs";
import {
  FullSyncAccountNotFoundError,
  FullSyncSendExpiredError,
  FullSyncSendOutdatedError,
} from "./errors";
import { toAccountOperations } from "./operations";
import { isFullSyncSupported } from "./supports";
import type { FullSyncHost } from "./createFullSyncSource";

/** How long an untouched preparation or signature stays held: a flow left open longer prepares again. */
export const FULL_SYNC_SEND_TTL_MS = 30 * 60 * 1000;

/** The most preparations, or signatures, held at once: the oldest goes first. */
export const FULL_SYNC_SEND_MAX_HELD = 64;

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

// A family may report a negative send-max amount next to its error: the summary shows zero.
const amountOf = (value: BigNumber) =>
  AmountStrSchema.parse(BigNumber.max(value.integerValue(), 0).toFixed());

function subAccountIdOf(account: Account, request: SendRequest): string | undefined {
  if (request.assetId === account.currency.id) return undefined;
  const token = account.subAccounts?.find(sub => sub.token.id === request.assetId);
  if (!token) throw new Error(`No ${request.assetId} in account ${account.id}`);
  return token.id;
}

function feeAssetIdOf(account: Account, transaction: Transaction): CryptoOrTokenCurrencyId {
  const feeAccountId = sendFeatures.getFeeCurrencyAccountId(account.currency, transaction);
  const feeAccount = feeAccountId
    ? account.subAccounts?.find(sub => sub.id === feeAccountId)
    : undefined;
  return CryptoOrTokenCurrencyIdSchema.parse(
    feeAccount?.token.id ?? sendFeatures.getFeeAssetId(account.currency) ?? account.currency.id,
  );
}

const randomHex = (bytes: number) =>
  Array.from(globalThis.crypto.getRandomValues(new Uint8Array(bytes)), byte =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

const handleOf = (payload: unknown): string | undefined =>
  typeof payload === "object" &&
  payload !== null &&
  "handle" in payload &&
  typeof payload.handle === "string"
    ? payload.handle
    : undefined;

/** The family's own objects stay here, keyed by the handle the payload carries: the store never holds them. */
function createHandles<T>(kind: string, now: () => number) {
  const held = new Map<string, { value: T; expiresAt: number }>();
  const prefix = `full-sync:${randomHex(8)}:${kind}:`;
  let next = 0;
  const sweep = () => {
    const at = now();
    for (const [handle, entry] of held) if (entry.expiresAt <= at) held.delete(handle);
  };
  return {
    hold(value: T) {
      sweep();
      const oldest = held.keys().next();
      if (held.size >= FULL_SYNC_SEND_MAX_HELD && !oldest.done) held.delete(oldest.value);
      const handle = `${prefix}${++next}`;
      held.set(handle, { value, expiresAt: now() + FULL_SYNC_SEND_TTL_MS });
      return { handle };
    },
    take(payload: unknown): T {
      const handle = handleOf(payload);
      const entry = handle === undefined ? undefined : held.get(handle);
      if (!entry || entry.expiresAt <= now()) throw new FullSyncSendExpiredError();
      entry.expiresAt = now() + FULL_SYNC_SEND_TTL_MS;
      return entry.value;
    },
    drop(payload: unknown) {
      const handle = handleOf(payload);
      if (handle !== undefined) held.delete(handle);
    },
    dropWhere(matches: (value: T) => boolean) {
      for (const [handle, entry] of held) if (matches(entry.value)) held.delete(handle);
    },
  };
}

type HeldSignature = { signedOperation: SignedOperation; transactionHandle: string };

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

const feeIssue = (name: string): TransactionIssue => ({ name, message: "", field: "fees" });

/** The fee part of the patch: a preset, the custom inputs of the send descriptor, or the bridge's default. */
function feePatchOf(
  account: Account,
  request: SendRequest,
): { patch: Record<string, unknown>; issue?: TransactionIssue } {
  if (request.feeStrategy === undefined) return { patch: {} };
  if (request.feeStrategy === "custom") {
    const custom = sendFeatures.getCustomFeeConfig(account.currency);
    if (!custom || !request.customFees) {
      return { patch: {}, issue: feeIssue("CustomFeesNotSupported") };
    }
    return {
      patch: { feesStrategy: "custom", ...custom.buildTransactionPatch(request.customFees) },
    };
  }
  const feesStrategy = getFeesStrategyForPreset(request.feeStrategy);
  if (!feesStrategy) return { patch: {}, issue: feeIssue("FeeStrategyNotSupported") };
  return { patch: buildPresetEstimationPatch(feesStrategy) };
}

type Draft = { transaction: Transaction; issues: TransactionIssue[] };

/** Builds the bridge transaction of a request, as the send flows patch it step by step. */
async function draftOf(
  account: Account,
  bridge: AccountBridge<Transaction>,
  request: SendRequest,
): Promise<Draft> {
  const { currency } = account;
  const issues: TransactionIssue[] = [];
  const blank = bridge.createTransaction(account);
  // Family options go first: the request's own fields always win over them.
  const created = request.familyOptions
    ? bridge.updateTransaction(blank, request.familyOptions)
    : blank;
  const canCarryMemo = sendFeatures.hasMemoForRecipient(currency, request.recipient);
  if (request.memo !== undefined && !canCarryMemo) {
    issues.push({ name: "MemoNotSupported", message: "", field: "memo" });
  }
  const memo =
    request.memo !== undefined && canCarryMemo
      ? {
          value: request.memo.value,
          type: request.memo.type ?? sendFeatures.getMemoDefaultOption(currency),
        }
      : undefined;
  const fees = feePatchOf(account, request);
  if (fees.issue) issues.push(fees.issue);
  let transaction = bridge.updateTransaction(created, {
    ...buildRecipientTransactionPatch(created, { address: request.recipient, memo }),
    amount: new BigNumber(request.amount),
    useAllAmount: request.useAllAmount ?? false,
    subAccountId: subAccountIdOf(account, request),
    ...fees.patch,
  });
  if (
    request.feeAssetId !== undefined &&
    request.feeAssetId !== feeAssetIdOf(account, transaction)
  ) {
    const feeAssets = getSendDescriptor(currency)?.fees.customAssets;
    const context = { mainAccount: account, transaction };
    const option = feeAssets
      ?.getOptions(context)
      .find(candidate => candidate.currency?.id === request.feeAssetId);
    const patch = option && feeAssets?.buildPatch(option.id, context);
    if (patch) transaction = bridge.updateTransaction(transaction, patch);
    else issues.push(feeIssue("FeeAssetNotSupported"));
  }
  return { transaction: await bridge.prepareTransaction(account, transaction), issues };
}

/** Sends through the legacy `AccountBridge`, as the send flows do, from the account the store holds. */
export function createFullSyncSender(
  host: FullSyncHost,
  now: () => number = Date.now,
): AccountSendCapability {
  const transactions = createHandles<Transaction>("tx", now);
  const signatures = createHandles<HeldSignature>("sig", now);
  const broadcasting = new Map<
    string,
    { transactionHandle: string; run: Promise<BroadcastedTransaction> }
  >();

  const accountOf = ({ accountUUID }: AccountTarget): Account => {
    const account = host.findAccount(accountUUID);
    if (!account) throw new FullSyncAccountNotFoundError(`No legacy account for ${accountUUID}`);
    return account;
  };

  async function broadcastOnce(
    target: AccountTarget,
    transactionHandle: string,
    signatureHandle: string,
    held: HeldSignature,
  ): Promise<BroadcastedTransaction> {
    const account = accountOf(target);
    const bridge = await getAccountBridge(account);
    const operation = await bridge.broadcast({ account, signedOperation: held.signedOperation });
    signatures.drop({ handle: signatureHandle });
    transactions.drop({ handle: transactionHandle });
    // The network took it: nothing after this point may fail the send, or a retry would send twice.
    const hash = TransactionHashSchema.parse(
      operation.hash || held.signedOperation.operation.hash || operation.id,
    );
    try {
      host.updateAccountWithUpdater(account.id, stored => addPendingOperation(stored, operation));
      const updated = host.findAccount(target.accountUUID) ?? account;
      const rows = toAccountOperations(updated).operations.filter(row => row.hash === hash);
      return { hash, operations: rows };
    } catch (error) {
      log("account-data", "full-sync: broadcast accepted, pending operation not stored", {
        hash,
        error: String(error),
      });
      return { hash, operations: [] };
    }
  }

  return {
    supports: isFullSyncSupported,

    async prepare(target, request) {
      const account = accountOf(target);
      const bridge = await getAccountBridge(account);
      const { transaction, issues } = await draftOf(account, bridge, request);
      const status: TransactionStatusCommon = await bridge.getTransactionStatus(
        account,
        transaction,
      );
      return {
        request,
        amount: amountOf(status.amount),
        fees: amountOf(status.estimatedFees),
        feeAssetId: feeAssetIdOf(account, transaction),
        totalSpent: amountOf(status.totalSpent),
        errors: [...issuesOf(status.errors), ...issues],
        warnings: issuesOf(status.warnings),
        payload: transactions.hold(transaction),
      };
    },

    async estimateFees(target, request, strategies) {
      const account = accountOf(target);
      const bridge = await getAccountBridge(account);
      const { transaction } = await draftOf(account, bridge, {
        ...request,
        feeStrategy: undefined,
      });
      const presets = sendFeatures.getFeePresetOptions(account.currency, transaction);
      const feeAssetId = feeAssetIdOf(account, transaction);
      // A fee-rate preset (per byte, per gram) is not a total: only the bridge knows the total.
      const estimateWithBridge =
        sendFeatures.shouldEstimateFeePresetsWithBridge(account.currency, transaction) ||
        sendFeatures.hasFeeRateLegend(account.currency);
      const estimates = await Promise.all(
        strategies.map(async (strategy): Promise<FeeEstimate | undefined> => {
          const preset = presets.find(option => option.id === strategy);
          if (preset && !estimateWithBridge) {
            return { strategy, fees: amountOf(preset.amount), feeAssetId };
          }
          const feesStrategy = getFeesStrategyForPreset(strategy);
          if (!feesStrategy || feesStrategy === "custom") return undefined;
          const prepared = await bridge.prepareTransaction(
            account,
            bridge.updateTransaction(transaction, buildPresetEstimationPatch(feesStrategy)),
          );
          const status = await bridge.getTransactionStatus(account, prepared);
          return { strategy, fees: amountOf(status.estimatedFees), feeAssetId };
        }),
      );
      return estimates.filter((estimate): estimate is FeeEstimate => estimate !== undefined);
    },

    sign: (target, prepared, device) =>
      defer(async () => {
        const account = accountOf(target);
        const transactionHandle = handleOf(prepared.payload);
        if (transactionHandle === undefined) throw new FullSyncSendExpiredError();
        const bridge = await getAccountBridge(account);
        // Prepared again on the account as it is now: a send broadcast since may have spent its inputs.
        const transaction = await bridge.prepareTransaction(
          account,
          transactions.take(prepared.payload),
        );
        const status = await bridge.getTransactionStatus(account, transaction);
        if (
          Object.keys(status.errors).length > 0 ||
          amountOf(status.amount) !== prepared.amount ||
          amountOf(status.totalSpent) !== prepared.totalSpent ||
          amountOf(status.estimatedFees) !== prepared.fees ||
          feeAssetIdOf(account, transaction) !== prepared.feeAssetId
        ) {
          throw new FullSyncSendOutdatedError();
        }
        return { account, transaction, transactionHandle, bridge };
      }).pipe(
        mergeMap(({ account, transaction, transactionHandle, bridge }) =>
          bridge
            .signOperation({
              account,
              transaction,
              deviceId: device.compatDeviceId,
              deviceModelId: dmkToLedgerDeviceIdMap[device.deviceModelId],
            })
            .pipe(
              catchError((error: unknown) =>
                throwError(() =>
                  sendFeatures.isUserRefusedTransactionError(account.currency, error)
                    ? new SignatureRefusedError(String(error))
                    : error,
                ),
              ),
              map(event =>
                toSignEvent(event, signedOperation =>
                  signatures.hold({ signedOperation, transactionHandle }),
                ),
              ),
            ),
        ),
        filter((event): event is TransactionSignEvent => event !== undefined),
      ),

    broadcast(target, prepared, signed) {
      const transactionHandle = handleOf(prepared.payload);
      const signatureHandle = handleOf(signed.payload);
      if (transactionHandle === undefined || signatureHandle === undefined) {
        return Promise.reject(new FullSyncSendExpiredError());
      }
      const inFlight = broadcasting.get(signatureHandle);
      if (inFlight) {
        return inFlight.transactionHandle === transactionHandle
          ? inFlight.run
          : Promise.reject(new SignatureMismatchError("This signature is not of this preparation"));
      }
      let held: HeldSignature;
      try {
        held = signatures.take(signed.payload);
        transactions.take(prepared.payload);
      } catch (error) {
        return Promise.reject(error);
      }
      if (held.transactionHandle !== transactionHandle) {
        return Promise.reject(
          new SignatureMismatchError("This signature is not of this preparation"),
        );
      }
      const run = broadcastOnce(target, transactionHandle, signatureHandle, held).finally(() =>
        broadcasting.delete(signatureHandle),
      );
      broadcasting.set(signatureHandle, { transactionHandle, run });
      return run;
    },

    release(_target, prepared) {
      const transactionHandle = handleOf(prepared.payload);
      if (transactionHandle === undefined) return;
      transactions.drop(prepared.payload);
      signatures.dropWhere(held => held.transactionHandle === transactionHandle);
    },
  };
}
