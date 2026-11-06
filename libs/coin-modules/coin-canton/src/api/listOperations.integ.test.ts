import type {
  AssetInfo,
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/index";
import { encodeDescendingCursor } from "../logic/cursor";
import { getLedgerEnd } from "../network/gateway";
import { getDevnetValidatorParty, readRawWindow, UNKNOWN_PARTY } from "../test/devnet";
import { createMockCoinConfigValue, createMockContext } from "../test/fixtures";
import type { OperationView } from "../types/gateway";
import { createApi } from ".";

const MAX_WINDOW = 20_000;
const PAGE_LIMIT = 20;

const config = createMockCoinConfigValue();
const context = createMockContext(config);
const api = createApi();

async function walk(
  partyId: string,
  options: ListOperationsOptions,
  isPastWindow: (page: Page<Operation>) => boolean = () => false,
): Promise<Page<Operation>[]> {
  const pages: Page<Operation>[] = [];
  let page: Page<Operation> = { items: [], next: options.cursor };
  do {
    page = await api.listOperations(context, partyId, { ...options, cursor: page.next });
    pages.push(page);
  } while (page.next && !isPastWindow(page));
  return pages;
}

const operationsOf = (pages: Page<Operation>[]) => pages.flatMap(page => page.items);

const fieldsOf = (operation: Operation) => ({
  id: operation.id,
  value: operation.value,
  fees: operation.tx.fees,
  height: operation.tx.block.height,
  hash: operation.tx.hash,
  time: operation.tx.date.getTime(),
});

const rawFieldsOf = (row: OperationView) => ({
  id: row.uid,
  value: BigInt(row.transfers?.[0]?.value ?? "0"),
  fees: BigInt(row.fee.value),
  height: row.block.height,
  hash: row.transaction_hash,
  time: Date.parse(row.transaction_timestamp),
});

const isIdentifiedAsset = (asset: AssetInfo) =>
  asset.type === "native" ||
  ("assetReference" in asset &&
    !!asset.assetReference &&
    (asset.type === "template" || !!asset.assetOwner));

describe("listOperations (devnet)", () => {
  let partyId: string;
  let lowestOffset: number;
  let highestOffset: number;
  let rawRows: OperationView[];

  beforeAll(async () => {
    partyId = await getDevnetValidatorParty(config);
    highestOffset = await getLedgerEnd(config);
    ({ lowestOffset, rows: rawRows } = await readRawWindow(
      config,
      partyId,
      highestOffset,
      MAX_WINDOW,
    ));
  });

  it("walks a fixed window newest first across several pages, matching the gateway rows", async () => {
    const pages = await walk(partyId, {
      minHeight: lowestOffset,
      order: "desc",
      limit: PAGE_LIMIT,
      cursor: encodeDescendingCursor({
        highestOffset,
        windowWidth: highestOffset - lowestOffset + 1,
      }),
    });
    const operations = operationsOf(pages);
    const memoById = new Map(operations.map(op => [op.id, op.details?.memo]));
    const reasons = rawRows.flatMap(row => {
      const reason = row.details.metadata?.reason;
      return typeof reason === "string" ? [{ id: row.uid, reason }] : [];
    });

    expect(new Set(rawRows.map(row => row.block.height)).size).toBeGreaterThan(PAGE_LIMIT);
    expect(pages.length).toBeGreaterThan(1);
    expect(operations.map(fieldsOf)).toEqual(rawRows.map(rawFieldsOf).reverse());
    expect(reasons.map(({ id }) => memoById.get(id))).toEqual(reasons.map(({ reason }) => reason));
    expect(operations.filter(op => op.details?.ledgerOpType !== op.type)).toEqual([]);
    expect(operations.filter(op => !isIdentifiedAsset(op.asset))).toEqual([]);
  });

  it("walks the same window oldest first, matching the gateway rows", async () => {
    const pages = await walk(
      partyId,
      { minHeight: lowestOffset, order: "asc" },
      page => Number(page.next) > highestOffset,
    );
    const operations = operationsOf(pages).filter(op => op.tx.block.height <= highestOffset);

    expect(operations.map(fieldsOf)).toEqual(rawRows.map(rawFieldsOf));
  });

  it("returns nothing for a party the node does not host", async () => {
    const pages = await walk(UNKNOWN_PARTY, { minHeight: lowestOffset, order: "desc" });

    expect(operationsOf(pages)).toEqual([]);
  });
});
