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
  _context: BitcoinContext,
  currencyId: string,
  xpub: string,
  options: ListOperationsOptions,
): Promise<Page<NativeOperation>> {
  const { minHeight, cursor, limit, order = "desc", derivationPath } = options;
  const account = await buildSyncedAccount(currencyId, xpub, derivationPath);

  const addresses = await account.xpub.getXpubAddresses();
  const accountAddresses = new Set(addresses.map(a => a.address));

  const all: NativeOperation[] = account.xpub.storage
    .getTxs()
    .map(tx => mapTxToOperation(tx, accountAddresses))
    // Confirmed operations are filtered by height; pending ones (height 0) are kept as newest.
    .filter(op => op.tx.block.height === 0 || op.tx.block.height >= minHeight);

  all.sort((a, b) => {
    const byHeight = a.tx.block.height - b.tx.block.height;
    const cmp = byHeight !== 0 ? byHeight : a.tx.hash.localeCompare(b.tx.hash);
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
 * Derive a native operation from a UTXO transaction relative to the account's addresses.
 *
 * OUT `value = spent − received = amount-to-others + fees` (the total debited beyond change);
 * IN `value = received`. Values come as integer sat strings on the wallet-btc TX.
 */
function mapTxToOperation(tx: TX, accountAddresses: Set<string>): NativeOperation {
  const hash = tx.hash ?? tx.id;
  const fees = BigInt(tx.fees ?? 0);

  let spent = 0n;
  const senders = new Set<string>();
  for (const input of tx.inputs) {
    if (input.address) {
      senders.add(input.address);
      if (accountAddresses.has(input.address) && input.value) {
        spent += BigInt(input.value);
      }
    }
  }

  let received = 0n;
  let externalOut = 0n;
  const externalRecipients: string[] = [];
  const accountRecipients: string[] = [];
  for (const output of tx.outputs) {
    if (!output.address || output.address.includes("unknown")) continue;
    if (accountAddresses.has(output.address)) {
      received += BigInt(output.value);
      accountRecipients.push(output.address);
    } else {
      externalOut += BigInt(output.value);
      externalRecipients.push(output.address);
    }
  }

  const isOut = spent > 0n;
  const type = isOut ? "OUT" : "IN";
  // Alpaca value convention: **fee-excluded**. OUT value = the amount sent to external recipients
  // (the generic coin-module adapter re-adds `fees` for OUT-family ops when converting to the
  // @ledgerhq/types-live operation); IN value = what the account received. Using external outputs
  // rather than `spent - received` also avoids the fee drift on pending txs whose input prevout
  // values the explorer may not populate.
  const value = isOut ? externalOut : received;
  const recipients = isOut
    ? externalRecipients.length > 0
      ? externalRecipients
      : accountRecipients // self-send: no external output
    : accountRecipients;

  const block = tx.block
    ? { height: tx.block.height, hash: tx.block.hash, time: new Date(tx.block.time) }
    : { height: 0, hash: "", time: new Date(tx.received_at) };

  return {
    id: `${hash}-${type}`,
    type,
    senders: [...senders],
    recipients,
    value,
    asset: { type: "native" },
    tx: {
      hash,
      block,
      fees,
      date: new Date(tx.block?.time ?? tx.received_at),
      failed: false,
    },
  };
}
