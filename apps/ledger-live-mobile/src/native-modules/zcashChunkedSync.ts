import { log } from "@ledgerhq/logs";
import { createMMKV } from "react-native-mmkv";
import { chainTip, syncRange, ZcashFfiError, type ZcashSyncResult } from "./ZcashFfiModule";

/**
 * Chunked shielded sync, persisting after every chunk.
 *
 * A direct port of desktop's `startSyncJob`
 * (`libs/coin-modules/coin-zcash/src/network/engine.ts`), and deliberately so:
 * the engine primitive is a single blocking range scan, and everything that
 * makes a full history tractable — chunking, carrying nullifiers forward,
 * cancelling, persisting progress — is orchestration written above it. Desktop
 * already worked that out; this mirrors it rather than inventing a second
 * shape.
 *
 * Two properties matter more than speed:
 *
 * 1. **A death costs one chunk.** Every chunk is written before the next
 *    starts, and the cursor only moves forward, so a crash, an OOM kill or a
 *    force-quit resumes from the last boundary instead of from the birthday.
 *    Mobile has no process isolation (desktop runs the engine in an Electron
 *    `utilityProcess`), so surviving death matters more here than preventing it.
 * 2. **Spent detection survives the chunk boundary.** See `accumulated` below.
 *
 * It is not fast: re-establishing a stream per chunk costs roughly 11x
 * throughput against one continuous scan. That is the price of matching
 * desktop, and in-stream checkpointing is the change that would recover it.
 */

/** Desktop's chunk size. Kept identical so behaviour is comparable. */
const CHUNK_SIZE = 5_000;

const LOG_TYPE = "zcash-ffi";

/**
 * Scan output, **one store per account**.
 *
 * Sharing a store across accounts is not merely untidy, it is silently wrong:
 * account B would read account A's cursor, conclude it had already scanned
 * that far, and report `complete` having scanned nothing — a wrong balance
 * that never self-corrects, because the cursor only moves forward. Desktop
 * avoids this for free by hanging state off the account object; here the
 * separation has to be deliberate.
 *
 * MMKV is unencrypted at rest and, on iOS, is included in iCloud backup by
 * default — so this holds identifiers, heights and counts, never memos, note
 * randomness or raw transaction bytes.
 */
function storeFor(accountId: string) {
  return createMMKV({ id: `zcash-sync-${accountId}` });
}

type Store = ReturnType<typeof storeFor>;

const KEY_CURSOR = "cursor";
const KEY_TXS = "txs";
const KEY_STATE = "syncState";

type PersistedNote = {
  amount: number;
  pool: string;
  spent: boolean;
  /** Needed on the next run, to notice this note being spent later. */
  nullifier: string | null;
};

type PersistedTx = {
  txid: string;
  height: number;
  time: number;
  notes: PersistedNote[];
};

function readTxs(store: Store): PersistedTx[] {
  try {
    return JSON.parse(store.getString(KEY_TXS) ?? "[]") as PersistedTx[];
  } catch {
    // A corrupt store should cost a rescan, not a crash loop.
    return [];
  }
}

/**
 * Nullifiers of notes we hold and believe unspent.
 *
 * These are what the engine watches for. A spend publishes the nullifier but
 * nothing that links it back to the note, so unless we hand the engine the
 * values to look for, a note received in an earlier chunk can be spent in a
 * later one and never noticed — leaving it stored as unspent and inflating the
 * balance.
 */
function unspentNullifiers(txs: PersistedTx[]): string[] {
  return [
    ...new Set(
      txs.flatMap(tx =>
        tx.notes.filter(n => !n.spent && n.nullifier).map(n => n.nullifier as string),
      ),
    ),
  ];
}

function toPersisted(result: ZcashSyncResult): PersistedTx[] {
  return result.transactions.map(tx => ({
    txid: tx.txid,
    height: tx.block_height,
    time: tx.block_time,
    notes: [...tx.sapling_notes, ...tx.orchard_notes, ...tx.ironwood_notes].map(n => ({
      amount: n.amount,
      pool: n.pool,
      spent: n.is_spent,
      nullifier: n.nullifier,
    })),
  }));
}

/** Apply `spent_known_nullifiers` to notes already in the store. */
function markSpent(txs: PersistedTx[], spent: readonly string[]): PersistedTx[] {
  if (spent.length === 0) return txs;
  const set = new Set(spent);
  return txs.map(tx => ({
    ...tx,
    notes: tx.notes.map(n => (n.nullifier && set.has(n.nullifier) ? { ...n, spent: true } : n)),
  }));
}

export type ChunkedSyncOptions = {
  /**
   * Scopes the store. Must be stable for an account and distinct between
   * accounts — see {@link storeFor}.
   */
  accountId: string;
  ufvk: string;
  grpcUrl: string;
  network: "mainnet" | "testnet";
  /** Where to start when the store holds no cursor. */
  birthdayHeight: number;
  /** Checked between chunks. Cancellation is not possible mid-chunk. */
  isCancelled?: () => boolean;
};

export type ChunkedSyncSummary = {
  chunks: number;
  blocksScanned: number;
  bytesDownloaded: number;
  elapsedMs: number;
  transactions: number;
  notes: number;
  cursor: number;
  cancelled: boolean;
};

/**
 * Scan from the stored cursor (or the birthday) to the chain tip.
 *
 * Runs entirely off the JavaScript thread: each `syncRange` is a promise
 * resolved from a native worker, so the UI stays responsive for the whole scan.
 * Between chunks this thread does one parse and one write.
 */
export async function runChunkedSync(opts: ChunkedSyncOptions): Promise<ChunkedSyncSummary> {
  const { accountId, ufvk, grpcUrl, network, birthdayHeight, isCancelled = () => false } = opts;

  const store = storeFor(accountId);
  const tip = await chainTip(grpcUrl);
  const storedCursor = Number(store.getString(KEY_CURSOR) ?? NaN);
  let chunkStart = Number.isFinite(storedCursor) ? storedCursor + 1 : birthdayHeight;

  let txs = readTxs(store);
  // Seeded from storage so a note received in a previous *run* is still
  // watched, then grown in the loop so one received in chunk N is watched in
  // chunk N+1 of this run. Desktop does both for the same reason.
  const accumulated = new Set(unspentNullifiers(txs));

  const summary: ChunkedSyncSummary = {
    chunks: 0,
    blocksScanned: 0,
    bytesDownloaded: 0,
    elapsedMs: 0,
    transactions: 0,
    notes: 0,
    cursor: chunkStart - 1,
    cancelled: false,
  };

  if (chunkStart > tip) {
    log(LOG_TYPE, `already at tip (${tip}), nothing to scan`);
    store.set(KEY_STATE, "complete");
    return summary;
  }

  log(LOG_TYPE, `chunked sync ${chunkStart}..${tip} (${tip - chunkStart + 1} blocks)`);
  store.set(KEY_STATE, "running");

  while (chunkStart <= tip) {
    if (isCancelled()) {
      summary.cancelled = true;
      break;
    }

    const chunkEnd = Math.min(chunkStart + CHUNK_SIZE - 1, tip);
    const result = await syncRange(ufvk, grpcUrl, network, chunkStart, chunkEnd, [...accumulated]);

    // Fold this chunk in, then write. The cursor is written last, so a death
    // between the two costs a repeated chunk rather than a skipped one.
    txs = [...markSpent(txs, result.spent_known_nullifiers ?? []), ...toPersisted(result)];
    for (const tx of toPersisted(result)) {
      for (const note of tx.notes) {
        if (!note.spent && note.nullifier) accumulated.add(note.nullifier);
      }
    }

    store.set(KEY_TXS, JSON.stringify(txs));
    store.set(KEY_CURSOR, String(chunkEnd));

    summary.chunks += 1;
    summary.blocksScanned += result.blocks_scanned;
    summary.bytesDownloaded += result.bytes_downloaded;
    summary.elapsedMs += result.elapsed_ms;
    summary.cursor = chunkEnd;

    log(
      LOG_TYPE,
      `chunk ${summary.chunks}: ${chunkStart}..${chunkEnd}, ` +
        `${result.transactions.length} txs, ${(result.bytes_downloaded / 1024).toFixed(0)} KiB`,
    );

    chunkStart = chunkEnd + 1;
  }

  summary.transactions = txs.length;
  summary.notes = txs.reduce((n, tx) => n + tx.notes.length, 0);
  store.set(KEY_STATE, summary.cancelled ? "running" : "complete");

  return summary;
}

/** Everything the scan has persisted for one account. Safe to call mid-sync. */
export function readPersistedSync(accountId: string): {
  cursor: number | null;
  state: string | null;
  transactions: PersistedTx[];
} {
  const store = storeFor(accountId);
  const cursor = Number(store.getString(KEY_CURSOR) ?? NaN);
  return {
    cursor: Number.isFinite(cursor) ? cursor : null,
    state: store.getString(KEY_STATE) ?? null,
    transactions: readTxs(store),
  };
}

/**
 * A stable, non-reversible id for a viewing key.
 *
 * Only used to scope the store. Deriving it from the key rather than taking a
 * caller-supplied name means pointing the probe at a different account cannot
 * silently inherit the previous one's cursor — the exact failure this scoping
 * exists to prevent. Not a security boundary: a store id is not secret, and
 * this deliberately keeps the key itself out of a filename.
 */
export function accountIdForUfvk(ufvk: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < ufvk.length; i++) {
    h ^= ufvk.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export { ZcashFfiError };
