import type {
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";
import type { CantonCoinConfig, CantonContext } from "../config";
import { getLedgerEnd, getOperations, isGatewayEnabled } from "../network/gateway";
import type { OperationView } from "../types/gateway";
import {
  decodeAscendingCursor,
  decodeDescendingCursor,
  encodeDescendingCursor,
  type DescendingCursor,
} from "./cursor";
import { toOperation } from "./toOperation";

const DEFAULT_PAGE_SIZE = 100;
const INITIAL_WINDOW_WIDTH = 10_000;
const GATEWAY_PAGE_SIZE = 1_000;

type Query = {
  config: CantonCoinConfig;
  partyId: string;
  minHeight: number;
  pageSize: number;
};

type NewestRows = { offsetGroups: OperationView[][]; rowCount: number; evicted: boolean };

function assertInteger(name: string, value: number, min: number): void {
  if (!Number.isSafeInteger(value) || value < min) {
    throw new InvalidParameterError(`canton: listOperations ${name} must be an integer >= ${min}`);
  }
}

// The gateway's `next` is one past the first transaction it did not serve, so resuming at it skips that transaction.
function resumeOffset(start: number, rows: OperationView[], next: number): number {
  if (next <= start) {
    throw new Error(`canton: gateway operations cursor ${next} does not advance past ${start}`);
  }
  const lastRow = rows.at(-1);
  return Math.max(lastRow ? lastRow.block.height + 1 : next - 1, start + 1);
}

async function ascendingPage(
  { config, partyId, minHeight }: Query,
  cursor: string | undefined,
  limit: number | undefined,
): Promise<Page<OperationView>> {
  const start = Math.max(minHeight, cursor === undefined ? 0 : decodeAscendingCursor(cursor));
  if (start > (await getLedgerEnd(config))) return { items: [] };
  const { operations, next } = await getOperations(config, partyId, { minOffset: start, limit });
  return {
    items: operations,
    next: next < 0 ? undefined : String(resumeOffset(start, operations, next)),
  };
}

function keepNewest(buffer: NewestRows, rows: OperationView[], pageSize: number): void {
  for (const row of rows) {
    const lastGroup = buffer.offsetGroups.at(-1);
    if (lastGroup?.[0]?.block.height === row.block.height) lastGroup.push(row);
    else buffer.offsetGroups.push([row]);
    buffer.rowCount++;
  }
  let oldestGroup = buffer.offsetGroups[0];
  while (
    oldestGroup &&
    buffer.offsetGroups.length > 1 &&
    buffer.rowCount - oldestGroup.length >= pageSize
  ) {
    buffer.offsetGroups.shift();
    buffer.rowCount -= oldestGroup.length;
    buffer.evicted = true;
    oldestGroup = buffer.offsetGroups[0];
  }
}

async function readWindow(
  { config, partyId, pageSize }: Query,
  lowestOffset: number,
  highestOffset: number,
): Promise<NewestRows> {
  const buffer: NewestRows = { offsetGroups: [], rowCount: 0, evicted: false };
  let cursor: number | undefined;
  for (;;) {
    const { operations, next } = await getOperations(config, partyId, {
      minOffset: lowestOffset,
      maxOffset: highestOffset,
      cursor,
      limit: GATEWAY_PAGE_SIZE,
    });
    keepNewest(buffer, operations, pageSize);
    if (next < 0) return buffer;
    const resume = resumeOffset(cursor ?? lowestOffset, operations, next);
    if (resume > highestOffset) return buffer;
    cursor = resume;
  }
}

function nextDescendingCursor(
  { minHeight, pageSize }: Query,
  lowestOffset: number,
  windowWidth: number,
  buffer: NewestRows,
): string | undefined {
  const oldestKeptOffset = buffer.offsetGroups[0]?.[0]?.block.height;
  if (buffer.evicted && oldestKeptOffset !== undefined) {
    return encodeDescendingCursor({
      highestOffset: oldestKeptOffset - 1,
      windowWidth: Math.max(1, Math.floor(windowWidth / 2)),
    });
  }
  if (lowestOffset <= minHeight) return undefined;
  const highestOffset = lowestOffset - 1;
  const grownWidth = buffer.rowCount < pageSize / 2 ? windowWidth * 2 : windowWidth;
  return encodeDescendingCursor({
    highestOffset,
    windowWidth: Math.min(grownWidth, highestOffset - minHeight + 1),
  });
}

async function descendingPage(
  query: Query,
  cursor: string | undefined,
): Promise<Page<OperationView>> {
  const { highestOffset, windowWidth }: DescendingCursor =
    cursor === undefined
      ? { highestOffset: await getLedgerEnd(query.config), windowWidth: INITIAL_WINDOW_WIDTH }
      : decodeDescendingCursor(cursor);
  if (query.minHeight > highestOffset) return { items: [] };

  const lowestOffset = Math.max(query.minHeight, highestOffset - windowWidth + 1);
  const buffer = await readWindow(query, lowestOffset, highestOffset);
  return {
    items: buffer.offsetGroups.flat().reverse(),
    next: nextDescendingCursor(query, lowestOffset, windowWidth, buffer),
  };
}

/**
 * The gateway lists operations oldest first only, so a newest-first walk reads ledger-offset windows downwards from the ledger end.
 */
export async function listOperations(
  context: CantonContext,
  partyId: string,
  { minHeight, cursor, limit, order }: ListOperationsOptions,
): Promise<Page<Operation>> {
  assertInteger("minHeight", minHeight, 0);
  if (limit !== undefined) assertInteger("limit", limit, 1);
  const config = await context.config();
  if (!isGatewayEnabled(config)) throw new Error("Not implemented");

  const query: Query = { config, partyId, minHeight, pageSize: limit ?? DEFAULT_PAGE_SIZE };
  const page =
    order === "desc"
      ? await descendingPage(query, cursor)
      : await ascendingPage(query, cursor, limit);
  return {
    items: page.items.map(row => toOperation(config.nativeInstrumentId, partyId, row)),
    next: page.next,
  };
}
