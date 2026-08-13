import type { Operation } from "@ledgerhq/coin-module-framework/api/types";
import {
  AleoInvalidArgumentsError,
  AleoProvableIdNotFoundError,
  AleoScannerUnavailableError,
} from "../errors";
import { apiClient } from "../network/api";
import type {
  AleoCoinConfig,
  AleoContext,
  AleoPublicTransaction,
  EnrichedPrivateRecord,
} from "../types";
import {
  determineTransactionType,
  toCoinFrameworkOperation,
  toCoinFrameworkPrivateOperation,
} from "./utils";

export type PrivateContext = {
  provableId: string;
  viewKey: string;
};

/**
 * Reads the ADR-042 pair off the context: both present opts into the merged public + private path,
 * both absent into the public-only listing. Exactly one is rejected before any network call rather
 * than silently serving a partial history.
 */
export function resolvePrivateContext(
  context: AleoContext,
  address: string,
): PrivateContext | null {
  const { provableId, viewKey } = context;

  if (!provableId && !viewKey) return null;

  if (!provableId || !viewKey) {
    throw new AleoInvalidArgumentsError(
      `aleo: listOperations requires provableId and viewKey together for ${address}`,
    );
  }

  return { provableId, viewKey };
}

export type OperationsOrder = "asc" | "desc";

/**
 * Opaque pagination state — callers must not parse it.
 *
 * It carries the identity of the stream, not just a position: `maxBlockHeight` is pinned on the
 * first page so a paging run stays a consistent snapshot as the scanner advances, and
 * `minHeight` / `order` are echoed back so a cursor replayed against a different window is rejected.
 *
 * `resume.height` is where the next page picks up; `resume.emitted` counts the operations already
 * returned at exactly that height, which is what makes the boundary skip exact.
 */
export type OperationsCursor = {
  minHeight: number;
  maxBlockHeight: number;
  order: OperationsOrder;
  resume?: { height: number; emitted: number };
};

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isOperationsOrder(value: unknown): value is OperationsOrder {
  return value === "asc" || value === "desc";
}

export function encodeOperationsCursor(cursor: OperationsCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeOperationsCursor(raw: string | undefined): OperationsCursor | null {
  if (!raw) return null;

  try {
    const { minHeight, maxBlockHeight, order, resume } = JSON.parse(
      Buffer.from(raw, "base64url").toString(),
    ) as Partial<OperationsCursor>;

    if (
      !isNonNegativeInteger(minHeight) ||
      !isNonNegativeInteger(maxBlockHeight) ||
      !isOperationsOrder(order)
    ) {
      throw new Error("out of range");
    }

    if (resume === undefined) {
      return { minHeight, maxBlockHeight, order };
    }

    if (!isNonNegativeInteger(resume?.height) || !isNonNegativeInteger(resume?.emitted)) {
      throw new Error("out of range");
    }

    return { minHeight, maxBlockHeight, order, resume };
  } catch {
    throw new AleoInvalidArgumentsError("aleo: malformed listOperations cursor");
  }
}

/**
 * A position is only meaningful relative to the window it was cut from, so a caller that changes
 * `minHeight` or flips `order` mid-run is told, not silently served rows it has already seen.
 */
export function assertCursorMatchesRequest(
  cursor: OperationsCursor,
  minHeight: number,
  order: OperationsOrder,
): void {
  if (cursor.minHeight !== minHeight || cursor.order !== order) {
    throw new AleoInvalidArgumentsError(
      "aleo: listOperations cursor does not match the requested range",
    );
  }
}

/**
 * The height window this page must read. `asc` walks upward, so the resume point becomes the new
 * lower bound — which the record fetch applies server-side. `desc` walks downward, so it only
 * narrows the upper bound and every page still reads from `minHeight`.
 */
export function resolveHeightWindow(
  cursor: OperationsCursor | null,
  minHeight: number,
  maxBlockHeight: number,
): { from: number; to: number } {
  if (!cursor?.resume) return { from: minHeight, to: maxBlockHeight };

  return cursor.order === "asc"
    ? { from: cursor.resume.height, to: maxBlockHeight }
    : { from: minHeight, to: cursor.resume.height };
}

/**
 * Where the next page picks up: the last emitted operation's height, plus how many operations at that
 * height have gone out across the whole run. The window opens on the previous resume height, so the
 * emitted prefix of `ordered` still contains the earlier pages' rows at that height.
 */
export function buildResumePoint(
  ordered: Operation[],
  emittedBefore: number,
  emittedNow: number,
): OperationsCursor["resume"] {
  const last = ordered[emittedBefore + emittedNow - 1];
  if (!last) return undefined;

  const height = last.tx.block.height;
  const emitted = ordered
    .slice(0, emittedBefore + emittedNow)
    .filter(operation => operation.tx.block.height === height).length;

  return { height, emitted };
}

/**
 * Resolves the height the record scanner is complete through. Operations above it are withheld
 * rather than returned public-only (ADR-042 completeness ceiling).
 *
 * `synced_up_to` ships with LIVE-34092. Until then a fully-synced scanner is assumed complete
 * through the chain tip, and a lagging one yields 0 (empty page) rather than a partial range.
 */
export async function getScannerSyncedHeight({
  config,
  provableId,
  address,
  latestBlockHeight,
}: {
  config: AleoCoinConfig;
  provableId: string;
  address: string;
  latestBlockHeight: number;
}): Promise<number> {
  let status;

  try {
    status = await apiClient.getRecordScannerStatus(config, provableId);
  } catch (error) {
    const err = error as { name?: string; status?: number } | null | undefined;

    // Messages stay address-only, never provableId (ADR-042 §Secret handling).
    if (err?.name === "LedgerAPI4xx" && err?.status === 422) {
      throw new AleoProvableIdNotFoundError(`aleo: unknown scanner enrollment for ${address}`, {
        cause: error,
      });
    }

    throw new AleoScannerUnavailableError(`aleo: record scanner unavailable for ${address}`, {
      cause: error,
    });
  }

  if (typeof status.synced_up_to === "number") {
    return status.synced_up_to;
  }

  return status.synced ? latestBlockHeight : 0;
}

/**
 * A public↔private self-transfer puts the account on both sides. `senders` is checked first so both
 * shapes report OUT of the balance they leave — a shield leaves the public balance, an unshield the
 * private one — even though an unshield's public row is the receiving leg.
 */
function resolveOperationType(
  senders: string[],
  recipients: string[],
  address: string,
): "IN" | "OUT" | "NONE" {
  if (senders.includes(address)) return "OUT";
  if (recipients.includes(address)) return "IN";
  return "NONE";
}

/**
 * Completes a public row with its private side. Owning a record produced by the transaction is proof
 * that this account is the counterparty the explorer left blank, so no decryption is needed.
 */
function toMergedOperation(
  publicTx: AleoPublicTransaction,
  address: string,
  hasOwnedRecord: boolean,
): Operation {
  const operation = toCoinFrameworkOperation(publicTx, address);
  if (!hasOwnedRecord) return operation;

  const senders = publicTx.sender_address ? operation.senders : [address];
  const recipients = publicTx.recipient_address ? operation.recipients : [address];
  const type = resolveOperationType(senders, recipients, address);

  return {
    ...operation,
    type,
    senders,
    recipients,
    details: {
      ...operation.details,
      transactionType: determineTransactionType(publicTx.function_id, type),
      ledgerOpType: type,
    },
  };
}

/** One operation per `(account, tx)`, ordered totally so the result is reproducible across calls. */
export function buildOrderedOperations({
  publicTransactions,
  ownedRecordTxIds,
  privateOnlyRecords,
  address,
  order,
}: {
  publicTransactions: AleoPublicTransaction[];
  ownedRecordTxIds: Set<string>;
  privateOnlyRecords: (EnrichedPrivateRecord | null)[];
  address: string;
  order: "asc" | "desc";
}): Operation[] {
  const operations = publicTransactions.map(publicTx =>
    toMergedOperation(publicTx, address, ownedRecordTxIds.has(publicTx.transaction_id.trim())),
  );

  for (const record of privateOnlyRecords) {
    if (record) operations.push(toCoinFrameworkPrivateOperation(record, address));
  }

  const direction = order === "asc" ? 1 : -1;

  // Tie-break on hash so the ordering is total.
  return operations.sort(
    (a, b) =>
      direction * (a.tx.block.height - b.tx.block.height || a.tx.hash.localeCompare(b.tx.hash)),
  );
}
