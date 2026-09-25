import cryptoFactory from "@ledgerhq/wallet-btc/crypto/factory";
import { blockchainBaseURL } from "@ledgerhq/wallet-btc/explorer/baseUrl";
import type { Currency } from "@ledgerhq/wallet-btc/crypto/types";
import type { TX } from "@ledgerhq/wallet-btc/storage/types";
import type {
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import type { BitcoinContext } from "../api/config";
import { walletBtcCurrencyById } from "../walletBtcCurrency";
import { deriveAccountMeta } from "./buildAccount";
import { CHUNK, chunk, discoverHorizon, rpcBatch, type Transport } from "../network/rpc";

/**
 * Account-wide operation history for the xpub (every gap-limit-discovered address), mapped to the
 * framework {@link Operation} shape. Native only (Scope A).
 *
 * HEIGHT-WINDOWED & STATELESS — a page is fetched WITHOUT resyncing the whole history. Each call
 * fetches only one block-height window: a batched `POST /rpc` of `atlas_getTxs` bounded by the cursor
 * (`to_height` for descending, `from_height` for ascending) across the account's addresses, then a
 * client-side k-way merge. Because the height bound is GLOBAL and height is the global ordering axis,
 * the cursor stays a single scalar (`height` + the boundary op id) rather than a per-address token
 * vector — the EVM `height:hash` trick. The cursor also carries the address horizon so later pages
 * re-derive the address set client-side (no network) instead of re-discovering it. All state is
 * caller-supplied → stateless; the cursor is the ADR-053 `accountState` shape (a few scalars).
 *
 * `order` is honored both ways. Pending (mempool) operations are the account's newest activity and
 * are returned only on the first DESCENDING page, on top; the cursor then tracks CONFIRMED height
 * only, so it is never 0 and an all-pending page cannot stall pagination. The explorer base honors
 * `config.explorer.uri` (ADR-019), falling back to the currency's default endpoint.
 *
 * Cost: page 1 = discover + newest window + pending (~6 POST); pages 2+ = one window fetch (~2 POST).
 * No page ever resyncs the full history (the prior full-sync path cost ~561 requests per call).
 *
 * Requirement: per-address window depth K ≥ page size L, so no single address can hide part of a page
 * below its returned window; a hyper-active address that exceeds K is handled by the boundary fallback.
 *
 * Explorer facts: `POST /rpc` accepts a JSON-RPC 2.0 batch (`atlas_getTxs`/`atlas_getTxsPending`,
 * up to 500 calls/POST); the per-address tx view is byte-identical to the REST `address/{a}/txs`
 * response, so wallet-btc's `TX` shape + {@link mapTxToOperations} apply unchanged.
 */

const DEFAULT_LIMIT = 200;

type NativeOperation = Operation;

/** Opaque pagination cursor (serialized into the framework `Cursor` string). */
type WindowedCursor = {
  /** boundary op id — the last op the previous page returned (slice resumes right after it) */
  opId: string;
  /** block height of the boundary op — becomes the next `to_height` */
  height: number;
  /** address horizon: number of derived receive / change addresses discovered on page 1 */
  ext: number;
  chg: number;
};

const compareOps =
  (order: "asc" | "desc") =>
  (a: NativeOperation, b: NativeOperation): number => {
    const byHeight = a.tx.block.height - b.tx.block.height;
    const cmp =
      byHeight !== 0 ? byHeight : a.tx.hash.localeCompare(b.tx.hash) || a.id.localeCompare(b.id);
    return order === "asc" ? cmp : -cmp;
  };

/**
 * Fetch one height window for all addresses, bounded by the cursor.
 * - desc: newest-first, bounded above by `to_height = bound` (page 1: no bound → the tip).
 * - asc:  oldest-first, bounded below by `from_height = bound` (page 1: no bound → from 0).
 * Guards against silent truncation: if an address returns a full `K`-sized window AND signals more
 * (a continuation token), the window is incomplete for that address and we fail loud rather than
 * dropping operations (cf. EVM's UnpageableLedgerExplorerBlock). Raise `limit` for such an account.
 */
async function fetchWindow(
  base: string,
  addrs: string[],
  order: "asc" | "desc",
  bound: number | undefined,
  K: number,
  t: Transport,
): Promise<Map<string, TX>> {
  const explorerOrder = order === "asc" ? "ascending" : "descending";
  const boundKey = order === "asc" ? "from_height" : "to_height";
  const txByHash = new Map<string, TX>();
  for (const group of chunk(addrs, CHUNK)) {
    const res = await rpcBatch(
      base,
      group.map(address => ({
        method: "atlas_getTxs",
        params: [
          {
            address,
            verbosity: "Full",
            order: explorerOrder,
            batch_size: K,
            ...(bound !== undefined ? { [boundKey]: bound } : {}),
          },
        ],
      })),
      t,
    );
    res.forEach(rr => {
      const r = rr as { data?: TX[]; token?: string } | undefined;
      const data = r?.data ?? [];
      if (data.length >= K && r?.token) {
        throw new Error(
          `listOperations: an address window hit batch_size=${K} with more operations available — ` +
            `the page would silently drop history. Increase the page limit for this account.`,
        );
      }
      for (const tx of data) {
        const k = tx.hash ?? tx.id;
        if (!txByHash.has(k)) txByHash.set(k, tx);
      }
    });
  }
  return txByHash;
}

export async function listOperations(
  context: BitcoinContext,
  currencyId: string,
  xpub: string,
  options: ListOperationsOptions,
): Promise<Page<NativeOperation>> {
  const { minHeight, cursor: cursorStr, limit, order = "desc", derivationPath } = options;
  const config = await context.config(currencyId);

  // Honor an explorer override from the coin config (ADR-019, as buildSyncedAccount does for the
  // other methods); fall back to the currency's default endpoint otherwise.
  const base = config?.explorer?.uri ?? blockchainBaseURL(walletBtcCurrencyById(currencyId));
  const { derivationMode } = deriveAccountMeta(derivationPath);
  const crypto = cryptoFactory(currencyId as unknown as Currency);
  const L = limit ?? DEFAULT_LIMIT;
  const K = Math.max(L * 3, 100); // per-address window depth, must be ≥ L

  const cursor: WindowedCursor | undefined = cursorStr ? JSON.parse(cursorStr) : undefined;
  const t: Transport = {}; // batched /rpc when the explorer supports it, else per-address REST

  // 1) address set: discover on page 1, re-derive from the carried horizon on later pages (no network)
  let ext: number;
  let chg: number;
  if (cursor) {
    ext = cursor.ext;
    chg = cursor.chg;
  } else {
    ext = await discoverHorizon(base, crypto, derivationMode, xpub, 0, t);
    chg = await discoverHorizon(base, crypto, derivationMode, xpub, 1, t);
  }
  const receiveAddrs = await Promise.all(
    Array.from({ length: ext }, (_, i) => crypto.getAddress(derivationMode, xpub, 0, i)),
  );
  const changeAddrs = await Promise.all(
    Array.from({ length: chg }, (_, i) => crypto.getAddress(derivationMode, xpub, 1, i)),
  );
  const allAddrs = [...receiveAddrs, ...changeAddrs];
  const accountAddresses = new Set(allAddrs);
  const changeAddresses = new Set(changeAddrs);

  // 2) fetch just this height window (direction bounded by the cursor)
  const txByHash = await fetchWindow(base, allAddrs, order, cursor?.height, K, t);

  // Pending (mempool, height 0) are the account's newest activity. They only belong on the
  // newest page, i.e. the first descending page. In ascending order that page is the OLDEST slice,
  // so pending are not fetched there (a documented limitation — pending surface only in desc).
  if (!cursor && order === "desc") {
    for (const group of chunk(allAddrs, CHUNK)) {
      const res = await rpcBatch(
        base,
        group.map(address => ({
          method: "atlas_getTxsPending",
          params: [{ address, verbosity: "Full" }],
        })),
        t,
      );
      res.forEach(rr => {
        const r = rr as { data?: TX[] } | TX[] | undefined;
        const txs = (Array.isArray(r) ? r : (r?.data ?? [])) as TX[];
        for (const tx of txs) {
          const k = tx.hash ?? tx.id;
          if (!txByHash.has(k)) txByHash.set(k, tx);
        }
      });
    }
  }

  // 3) map → operations, filter minHeight, sort
  const ops: NativeOperation[] = [...txByHash.values()]
    .flatMap(tx => mapTxToOperations(tx, accountAddresses, changeAddresses))
    .filter(op => op.tx.block.height === 0 || op.tx.block.height >= minHeight);
  ops.sort(compareOps(order));

  const cursorFor = (op: NativeOperation): string =>
    JSON.stringify({ opId: op.id, height: op.tx.block.height, ext, chg } as WindowedCursor);

  // 4a) First descending page: show ALL pending on top, then the newest L confirmed. The cursor
  // tracks CONFIRMED height only, so it is never 0 — an all-pending page can't stall page 2 (A3).
  if (!cursor && order === "desc") {
    const pending = ops.filter(op => op.tx.block.height === 0);
    const confirmed = ops.filter(op => op.tx.block.height > 0); // already sorted desc
    const confirmedPage = confirmed.slice(0, L);
    const lastConfirmed = confirmedPage[confirmedPage.length - 1];
    const next = confirmed.length > L && lastConfirmed ? cursorFor(lastConfirmed) : undefined;
    return { items: [...pending, ...confirmedPage], next };
  }

  // 4b) Cursor pages and ascending page 1: confirmed-only, slice right after the boundary op.
  let start = 0;
  if (cursor) {
    const idx = ops.findIndex(op => op.id === cursor.opId);
    if (idx !== -1) {
      start = idx + 1;
    } else {
      // Boundary op fell outside the window (K too small / reorg). Fall back to the first op strictly
      // past the boundary height in the requested direction, so we never re-serve or skip a height.
      start = ops.findIndex(op =>
        order === "asc" ? op.tx.block.height > cursor.height : op.tx.block.height < cursor.height,
      );
      if (start === -1) start = ops.length;
    }
  }

  const pageOps = ops.slice(start, start + L);
  const last = pageOps[pageOps.length - 1];
  // ADR-061: a full page means "more may exist"; a short page means the stream is exhausted.
  const next = pageOps.length === L && last !== undefined ? cursorFor(last) : undefined;

  return { items: pageOps, next };
}

/**
 * Derive the account operations from a UTXO transaction. A transaction can yield up to two operations
 * sharing the tx hash: an `OUT` when the account funds the tx, and an `IN` when the account receives
 * to one of its own NON-change addresses. A self-send (account → own address) therefore produces BOTH
 * `${hash}-OUT` and `${hash}-IN`, which the generic framework consumes as two parent operations —
 * mirroring the legacy bridge's `mapTxToOperations`. Change outputs are never a real receive: on a
 * send they are excluded from the IN leg (they only count on a pure receive).
 *
 * Alpaca value convention is **fee-excluded** (the generic coin-module adapter re-adds `fees` for
 * OUT-family ops). Values are computed from outputs (not `inputs − outputs`) so pending txs whose
 * input prevout values the explorer has not populated are still correct.
 */
export function mapTxToOperations(
  tx: TX,
  accountAddresses: Set<string>,
  changeAddresses: Set<string>,
): NativeOperation[] {
  const hash = tx.hash ?? tx.id;
  const fees = BigInt(tx.fees ?? 0);

  const senders = new Set<string>();
  let hasAccountInput = false;
  for (const input of tx.inputs) {
    if (input.address) {
      senders.add(input.address);
      // Ownership is established by the address alone. Don't also require `input.value`: a pending
      // spend can omit the prevout value, and gating on it would misclassify that spend as a pure
      // receive and drop its OUT leg.
      if (accountAddresses.has(input.address)) {
        hasAccountInput = true;
      }
    }
  }

  let externalOut = 0n;
  let accountReceived = 0n; // to the account's own non-change addresses
  let changeReceived = 0n;
  const externalRecipients: string[] = [];
  const accountRecipients: string[] = []; // non-change account outputs
  const changeRecipients: string[] = []; // account outputs on the internal/change chain
  for (const output of tx.outputs) {
    if (!output.address || output.address.includes("unknown")) continue;
    const outValue = BigInt(output.value);
    if (!accountAddresses.has(output.address)) {
      externalOut += outValue;
      externalRecipients.push(output.address);
    } else if (changeAddresses.has(output.address)) {
      changeReceived += outValue;
      changeRecipients.push(output.address);
    } else {
      accountReceived += outValue;
      accountRecipients.push(output.address);
    }
  }

  const block = tx.block
    ? { height: tx.block.height, hash: tx.block.hash, time: new Date(tx.block.time) }
    : { height: 0, hash: "", time: new Date(tx.received_at) };
  const txMeta = {
    hash,
    block,
    fees,
    date: new Date(tx.block?.time ?? tx.received_at),
    failed: false,
  };
  const sendersList = [...senders];
  const operations: NativeOperation[] = [];

  // OUT — the account funded the tx. Fee-excluded value = everything that left the account beyond its
  // own change: amounts to external recipients plus, for a self-send, amounts to the account's own
  // non-change addresses.
  if (hasAccountInput) {
    operations.push({
      id: `${hash}-OUT`,
      type: "OUT",
      senders: sendersList,
      recipients: externalRecipients.length > 0 ? externalRecipients : accountRecipients,
      value: externalOut + accountReceived,
      asset: { type: "native" },
      tx: txMeta,
    });
  }

  // IN — the account received. On a send, only real (non-change) receives count, so an ordinary send
  // with change produces no IN whereas a self-send does. On a pure receive (no account input) every
  // account output counts, including a payment that lands on a change address — which is then a
  // genuine recipient (mirroring the legacy mapper), so it must appear in `recipients` too.
  const inValue = hasAccountInput ? accountReceived : accountReceived + changeReceived;
  if (inValue > 0n) {
    operations.push({
      id: `${hash}-IN`,
      type: "IN",
      senders: sendersList,
      recipients: hasAccountInput ? accountRecipients : [...accountRecipients, ...changeRecipients],
      value: inValue,
      asset: { type: "native" },
      tx: txMeta,
    });
  }

  return operations;
}
