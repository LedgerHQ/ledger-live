import type {
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";

import { MAX_CURSOR_DRAIN, MAX_PAGINATION_SIZE } from "../constants";
import { isValidAddress } from "../logic";
import { mapToOperation } from "./mappers";

import type { MultiversXApiTransaction } from "../types";

/**
 * API client interface for listOperations.
 *
 * Backed by the unified `/accounts/{address}/transfers` endpoint, which returns
 * native EGLD and ESDT transfers in a single timestamp-sorted, paginated stream.
 */
interface ApiClient {
  getTransfers(
    address: string,
    options: {
      size: number;
      from?: number;
      before?: number;
      after?: number;
      order?: "asc" | "desc";
    },
  ): Promise<MultiversXApiTransaction[]>;
}

/** Cursor is "{timestamp}:{txHash}" — a non-volatile position in the transfer stream. */
type ParsedCursor = { timestamp: number; hash: string };

/**
 * Parses a "{timestamp}:{txHash}" cursor. The legacy "{timestamp}" form (no colon,
 * hence no hash) is accepted for backward compatibility and treated as an exclusive
 * timestamp boundary by the caller. Returns undefined when the timestamp is not a
 * number, so an unparseable cursor is ignored rather than throwing.
 */
function parseCursor(cursor?: string): ParsedCursor | undefined {
  if (!cursor) return undefined;
  const colonIndex = cursor.indexOf(":");
  const timestampStr = colonIndex >= 0 ? cursor.slice(0, colonIndex) : cursor;
  const hash = colonIndex >= 0 ? cursor.slice(colonIndex + 1) : "";
  const timestamp = parseInt(timestampStr, 10);
  if (Number.isNaN(timestamp)) return undefined;
  return { timestamp, hash };
}

function heightOf(tx: MultiversXApiTransaction): number {
  return tx.round ?? tx.blockHeight ?? 0;
}

/**
 * Lists historical operations for a MultiversX address with server-side pagination.
 *
 * A `/transfers` call fetches one page (native EGLD + ESDT in one stream); nothing
 * is downloaded beyond the requested window, except when a single timestamp is
 * denser than the window (see cursor note below). SmartContractResults are excluded
 * so the operation set stays aligned with wallet transactions.
 *
 * **Cursor & ordering:**
 * - Cursor format is `"{timestamp}:{txHash}"`. The endpoint windows by timestamp
 *   (`before` for desc, `after` for asc — both inclusive), and the client-side
 *   filter drops everything up to and including the cursor position, using txHash
 *   as a deterministic tiebreaker for transactions sharing the same second.
 * - When a single second holds more transfers than one window, the timestamp cursor
 *   alone can't advance, so the fetch offset-pages (`from`) through that second
 *   until a transfer past the cursor is found or the stream ends — bounded by
 *   `MAX_CURSOR_DRAIN`.
 * - `order: "desc"` (default) is newest first; `order: "asc"` is oldest first.
 *
 * **minHeight** is a block height, which the endpoint cannot filter on, so it is
 * applied client-side to each page; in descending order, paging stops once the page
 * drops below `minHeight`.
 *
 * @param apiClient - MultiversX API client instance
 * @param address - MultiversX bech32 address
 * @param pagination - Pagination options (limit, minHeight, order, cursor)
 * @returns A Page of Operation objects with an optional next cursor
 * @throws Error if the address is invalid
 */
export async function listOperations(
  apiClient: ApiClient,
  address: string,
  pagination: ListOperationsOptions,
): Promise<Page<Operation>> {
  if (!isValidAddress(address)) {
    throw new Error(`Invalid MultiversX address: ${address}`);
  }

  const { limit, minHeight = 0, order = "desc", cursor } = pagination;
  const parsed = parseCursor(cursor);
  const pageSize = limit && limit > 0 ? limit : MAX_PAGINATION_SIZE;
  const requestedSize = pageSize + (parsed ? 1 : 0);
  const timestampWindow = parsed
    ? order === "asc"
      ? { after: parsed.timestamp }
      : { before: parsed.timestamp }
    : {};

  // Stream order: timestamp (asc/desc per `order`), txHash as a stable tiebreaker.
  const byStreamOrder = (a: MultiversXApiTransaction, b: MultiversXApiTransaction) => {
    const ta = a.timestamp ?? 0;
    const tb = b.timestamp ?? 0;
    if (ta !== tb) return order === "asc" ? ta - tb : tb - ta;
    return (a.txHash ?? "").localeCompare(b.txHash ?? "");
  };

  // True for transfers strictly past the cursor position.
  const isAfterCursor = (tx: MultiversXApiTransaction) => {
    if (!parsed) return true;
    const t = tx.timestamp ?? 0;
    const h = tx.txHash ?? "";
    // A legacy hash-less cursor has no txHash to disambiguate same-second
    // transfers, so treat it as an exclusive timestamp boundary (drop the whole
    // second) rather than keeping — and duplicating — every same-second item.
    if (parsed.hash === "") {
      return order === "asc" ? t > parsed.timestamp : t < parsed.timestamp;
    }
    // Same collation as byStreamOrder (localeCompare) so the cursor boundary and
    // the ordering agree — a mismatched comparator could skip or duplicate items
    // sharing the same second.
    if (order === "asc") {
      return t > parsed.timestamp || (t === parsed.timestamp && h.localeCompare(parsed.hash) > 0);
    }
    return t < parsed.timestamp || (t === parsed.timestamp && h.localeCompare(parsed.hash) > 0);
  };

  // Fetch a window and drop everything up to and including the cursor. When the
  // cursor's second holds more transfers than one window, the whole window can be
  // filtered out while the API still has rows to give — the timestamp cursor then
  // can't advance. Page deeper by offset until a transfer past the cursor appears
  // or the stream ends, so a dense second can't stall pagination or silently drop
  // items. Bounded by MAX_CURSOR_DRAIN so the loop always terminates; the common
  // case exits after the first fetch.
  const scanned: MultiversXApiTransaction[] = [];
  let apiReturnedFullWindow = false;
  let from = 0;
  for (;;) {
    const batch = await apiClient.getTransfers(address, {
      from,
      size: requestedSize,
      order,
      ...timestampWindow,
    });
    apiReturnedFullWindow = batch.length === requestedSize;
    // txHash is a transfer's primary key: it is the operation id, the tx hash, and
    // the tiebreaker in both the sort and the cursor. A row without one is invalid
    // data — drop it here so it can't collide ids, corrupt dedup, or poison the
    // emitted cursor. (apiReturnedFullWindow still reflects the raw window size.)
    const validBatch = batch.filter(tx => tx.txHash);
    scanned.push(...validBatch);
    if (validBatch.some(isAfterCursor) || !apiReturnedFullWindow) break;
    from += requestedSize;
    if (from + requestedSize > MAX_CURSOR_DRAIN) break;
  }

  const afterCursor = scanned.sort(byStreamOrder).filter(isAfterCursor);

  const candidates = afterCursor
    .filter(tx => tx.type !== "SmartContractResult")
    .filter(tx => minHeight <= 0 || heightOf(tx) >= minHeight);
  const page = candidates.slice(0, pageSize);
  const items = page.map(tx => mapToOperation(tx, address));

  const truncatedPage = candidates.length > pageSize;
  const deepestScanned = afterCursor[afterCursor.length - 1];
  const reachedMinHeightBoundary =
    order === "desc" &&
    minHeight > 0 &&
    deepestScanned !== undefined &&
    heightOf(deepestScanned) < minHeight;

  // Resume from the last emitted operation; if the whole page was filtered out but
  // more may exist, resume from the last scanned item so pagination still advances.
  const cursorItem = page[page.length - 1] ?? deepestScanned;
  const next =
    (apiReturnedFullWindow || truncatedPage) &&
    !reachedMinHeightBoundary &&
    cursorItem !== undefined
      ? `${cursorItem.timestamp ?? 0}:${cursorItem.txHash ?? ""}`
      : undefined;

  return { items, next };
}
