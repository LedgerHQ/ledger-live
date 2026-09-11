import type {
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import type { TX } from "@ledgerhq/wallet-btc/storage/types";
import type { BitcoinContext } from "../api/config";
import { buildSyncedAccount } from "./buildAccount";

const DEFAULT_LIMIT = 200;

type NativeOperation = Operation;

const opKey = (op: NativeOperation): string => op.id;

/**
 * Account-wide operation history for the xpub (every gap-limit-discovered address), mapped to the
 * framework {@link Operation} shape. Native only (Scope A). Stateless: rebuilds and re-syncs the
 * account each call, so the cursor is a stable operation key rather than a volatile offset.
 *
 * `minHeight` bounds confirmed operations; `limit`/`order`/`cursor` page over a deterministic sort.
 * The cursor is ALWAYS propagated when more operations remain (never hardcoded `undefined`).
 */
export async function listOperations(
  context: BitcoinContext,
  currencyId: string,
  xpub: string,
  options: ListOperationsOptions,
): Promise<Page<NativeOperation>> {
  const { minHeight, cursor, limit, order = "desc", derivationPath } = options;
  const config = await context.config(currencyId);
  const account = await buildSyncedAccount(currencyId, xpub, derivationPath, config);

  const addresses = await account.xpub.getXpubAddresses();
  const accountAddresses = new Set(addresses.map(a => a.address));
  // Change addresses live on the internal chain (account index 1). They are the account's own change,
  // not a real receive, so an ordinary send must not surface them as an incoming leg.
  const changeAddresses = new Set(addresses.filter(a => a.account === 1).map(a => a.address));

  // wallet-btc's storage indexes a transaction per (address, tx id), so a transaction touching
  // several of the account's addresses is stored once per address. Deduplicate by tx hash/id before
  // mapping, otherwise a single transaction yields duplicate operation ids and can duplicate or skip
  // cursor pages.
  const uniqueTxs = new Map<string, TX>();
  for (const tx of account.xpub.storage.getTxs()) {
    const key = tx.hash ?? tx.id;
    if (!uniqueTxs.has(key)) uniqueTxs.set(key, tx);
  }

  const all: NativeOperation[] = [...uniqueTxs.values()]
    .flatMap(tx => mapTxToOperations(tx, accountAddresses, changeAddresses))
    // Confirmed operations are filtered by height; pending ones (height 0) are kept as newest.
    .filter(op => op.tx.block.height === 0 || op.tx.block.height >= minHeight);

  all.sort((a, b) => {
    const byHeight = a.tx.block.height - b.tx.block.height;
    // A self-send yields an OUT and an IN sharing the same hash+height; break the tie on the unique
    // operation id so the ordering is deterministic across calls (the cursor relies on it).
    const cmp =
      byHeight !== 0 ? byHeight : a.tx.hash.localeCompare(b.tx.hash) || a.id.localeCompare(b.id);
    return order === "asc" ? cmp : -cmp;
  });

  // Resolve the cursor to a start offset. A provided-but-unknown cursor is an error, NOT a silent
  // restart: `findIndex` returns -1, and `-1 + 1 === 0` would re-serve the first page, causing the
  // caller to loop forever / duplicate operations. The framework guarantees a non-volatile cursor,
  // so an unmatched one signals a stale or corrupted cursor and must surface.
  let start = 0;
  if (cursor) {
    const index = all.findIndex(op => opKey(op) === cursor);
    if (index === -1) {
      throw new Error(
        `listOperations: unknown cursor "${cursor}" — it matches no operation in the account history`,
      );
    }
    start = index + 1;
  }

  const page = all.slice(start, start + (limit ?? DEFAULT_LIMIT));
  const hasMore = start + page.length < all.length;
  const last = page[page.length - 1];

  return {
    items: page,
    next: hasMore && last !== undefined ? opKey(last) : undefined,
  };
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
function mapTxToOperations(
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
      if (accountAddresses.has(input.address) && input.value) {
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
