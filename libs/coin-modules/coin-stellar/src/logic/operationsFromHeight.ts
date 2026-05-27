import { ListOperationsOptions, Operation, Page } from "@ledgerhq/coin-module-framework/api/types";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { fetchOpsForLedgerForAddress } from "../network";
import { convertToLegacyOperation, listOperations } from "./listOperations";

type PaginationState = {
  readonly pageSize: number;
  readonly heightLimit: number;
  continueIterations: boolean;
  apiNextCursor?: string;
  accumulator: Operation[];
};

/**
 * Max concurrent `/ledgers/{seq}/operations` requests issued during the
 * recipient-gap supplement. Chosen conservatively to avoid Horizon 429s when
 * supplementing accounts with many active ledgers; tune via this constant
 * rather than per-call to keep the public listOperations signature stable.
 */
const SUPPLEMENT_CONCURRENCY = 2;

/**
 * Minimum delay between supplement batches, in milliseconds. Caps the burst
 * rate so an account touching N ledgers doesn't fire `~N / SUPPLEMENT_CONCURRENCY`
 * requests back-to-back at the same Horizon endpoint. Sized for public
 * Horizon's burst threshold (`~1.7 req/s sustained`): with concurrency 2 this
 * yields ~5 req/s peak, which the rate limiter tolerates without throttling.
 */
const SUPPLEMENT_BATCH_INTERVAL_MS = 400;

/**
 * Sleep applied after a 429 before retrying a supplement batch (matches the
 * existing listOperations backoff). On the second 429 in a row we stop
 * supplementing instead of looping further — production traffic against
 * authenticated Horizon never hits this path; the public testnet does.
 */
const SUPPLEMENT_429_BACKOFF_MS = 4000;

export async function operationsFromHeight(
  address: string,
  minHeight: number,
): Promise<Page<Operation>> {
  const state: PaginationState = {
    pageSize: 200,
    heightLimit: minHeight,
    continueIterations: true,
    accumulator: [],
  };

  // unfortunately, the stellar API does not support an option to filter by min height
  // so the only strategy to get ALL operations is to iterate over all of them in descending order
  // until we reach the desired minHeight
  while (state.continueIterations) {
    const options: ListOperationsOptions = { limit: state.pageSize, order: "desc", minHeight };
    if (state.apiNextCursor) {
      options.cursor = state.apiNextCursor;
    }
    try {
      const { items: operations, next: nextCursor } = await listOperations(address, options);
      state.accumulator.push(...operations);
      state.apiNextCursor = nextCursor ?? "";
      state.continueIterations = !!nextCursor;
    } catch (e: unknown) {
      if (e instanceof LedgerAPI4xx && e.status === 429) {
        log("coin:stellar", "(api/operations): TooManyRequests, retrying in 4s");
        await new Promise(resolve => setTimeout(resolve, 4000));
      } else {
        throw e;
      }
    }
  }

  // Horizon's `/accounts/X/operations` (and `/accounts/X/payments`, which shares
  // the same `history_operation_participants` index) occasionally omits ops
  // where X is only the recipient — incoming `payment` / `create_account` made
  // from a different fee-payer. For each ledger we already have indexed activity
  // in, pull the full ledger via `/ledgers/{seq}/operations` (the same source
  // `getBlock` uses) and merge in any address-involving ops that were missed.
  const supplemented = await supplementAccumulator(address, minHeight, state.accumulator);

  return { items: supplemented, next: state.apiNextCursor ? state.apiNextCursor : "" };
}

async function supplementAccumulator(
  address: string,
  minHeight: number,
  accumulator: Operation[],
): Promise<Operation[]> {
  const ledgerSeqs = new Set<number>();
  for (const op of accumulator) {
    const height = op.tx.block.height;
    if (Number.isFinite(height) && height >= minHeight) {
      ledgerSeqs.add(height);
    }
  }

  if (ledgerSeqs.size === 0) {
    return accumulator;
  }

  const existingIds = new Set(accumulator.map(op => op.id));
  const supplemental: Operation[] = [];
  const seqs = Array.from(ledgerSeqs);

  const runBatch = (batch: number[]) =>
    Promise.allSettled(
      batch.map(async seq => {
        // accountId is unused once `convertToLegacyOperation` re-keys the id
        // from `${accountId}-${hash}-${type}` to `${hash}-${index}`; pass ""
        // to match the existing `listOperations` call site.
        const ops = await fetchOpsForLedgerForAddress(seq, address, "", minHeight);
        return ops.map(convertToLegacyOperation);
      }),
    );

  let sawConsecutive429 = false;

  for (let i = 0; i < seqs.length; i += SUPPLEMENT_CONCURRENCY) {
    if (i > 0) {
      await sleep(SUPPLEMENT_BATCH_INTERVAL_MS);
    }
    const batch = seqs.slice(i, i + SUPPLEMENT_CONCURRENCY);
    let settled = await runBatch(batch);

    // Detect Horizon rate-limiting: if every failure in the batch is a 429,
    // back off and retry once. A second 429 in a row means Horizon's cooldown
    // hasn't cleared; abandon the supplement so we don't burn the request
    // budget for the rest of the listOperations call (and any subsequent
    // Horizon calls in the same process).
    if (batchIsAll429(settled)) {
      if (sawConsecutive429) {
        log(
          "coin:stellar",
          `(operationsFromHeight) supplement aborted: persistent 429 from Horizon, skipping ${
            seqs.length - i
          } remaining ledger(s)`,
        );
        break;
      }
      sawConsecutive429 = true;
      log(
        "coin:stellar",
        `(operationsFromHeight) supplement throttled, backing off ${SUPPLEMENT_429_BACKOFF_MS}ms`,
      );
      await sleep(SUPPLEMENT_429_BACKOFF_MS);
      settled = await runBatch(batch);
      if (batchIsAll429(settled)) {
        log(
          "coin:stellar",
          `(operationsFromHeight) supplement aborted: still 429 after backoff, skipping ${
            seqs.length - i
          } remaining ledger(s)`,
        );
        break;
      }
    } else {
      sawConsecutive429 = false;
    }

    for (const result of settled) {
      if (result.status === "rejected") {
        // Don't fail the whole listOperations call if a per-ledger fill-in
        // errors: degrade to the (possibly incomplete) forAccount result.
        log(
          "coin:stellar",
          `(operationsFromHeight) supplement failed: ${String(result.reason)}`,
        );
        continue;
      }
      for (const op of result.value) {
        if (!existingIds.has(op.id)) {
          existingIds.add(op.id);
          supplemental.push(op);
        }
      }
    }
  }

  if (supplemental.length === 0) {
    return accumulator;
  }

  const merged = accumulator.concat(supplemental);
  // Caller (api/index.ts `operations`) consumes desc-by-height order. Within a
  // single ledger, Horizon op ids are monotonic; the legacy id format
  // `${tx.hash}-${horizon_op_id}` lets us recover that ordering as int64.
  merged.sort((a, b) => {
    const heightDiff = b.tx.block.height - a.tx.block.height;
    if (heightDiff !== 0) return heightDiff;
    const ai = extractLegacyIdIndex(a.id);
    const bi = extractLegacyIdIndex(b.id);
    return ai < bi ? 1 : ai > bi ? -1 : 0;
  });
  return merged;
}

function batchIsAll429(settled: PromiseSettledResult<unknown>[]): boolean {
  let hadRejection = false;
  for (const r of settled) {
    if (r.status === "rejected") {
      hadRejection = true;
      const reason = r.reason as unknown;
      if (!(reason instanceof LedgerAPI4xx) || reason.status !== 429) {
        return false;
      }
    }
  }
  return hadRejection;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractLegacyIdIndex(id: string): bigint {
  const dashIdx = id.lastIndexOf("-");
  if (dashIdx === -1) return 0n;
  const tail = id.slice(dashIdx + 1);
  try {
    return BigInt(tail || "0");
  } catch {
    return 0n;
  }
}
