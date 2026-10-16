import type {
  ListOperationsOptions,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/types";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { boundedListingModule, UNBOUNDED_HISTORY, type ListingWalk } from "./listing";

const context = { config: async () => ({}) } as never;

const operation = (height: number, fields: Partial<Operation> = {}): Operation =>
  ({
    id: `tx-${height}`,
    type: "IN",
    senders: [],
    recipients: [],
    value: 1n,
    asset: { type: "native" },
    ...fields,
    tx: {
      hash: `tx-${height}`,
      block: { height, hash: `block-${height}`, time: new Date(height * 60_000) },
      fees: 0n,
      date: new Date(height * 60_000),
      failed: false,
      ...fields.tx,
    },
  }) as Operation;

/** A coin module listing `pages` in turn, cursor `c<index>` leading to page `index`. */
function moduleListing(...pages: Operation[][]) {
  return {
    listOperations: jest.fn(
      async (
        _context: Context<any>,
        _address: string,
        { cursor }: ListOperationsOptions,
      ): Promise<Page<Operation>> => {
        const index = cursor ? Number(cursor.slice(1)) : 0;
        return {
          items: pages[index],
          ...(index + 1 < pages.length ? { next: `c${index + 1}` } : {}),
        };
      },
    ),
    lastBlock: jest.fn(async (_context: Context<any>) => ({ height: 99 })),
  };
}

describe("boundedListingModule", () => {
  it("answers the walk of the coin module's pages as one page, its other methods its own", async () => {
    const module = moduleListing([operation(9), operation(8)], [operation(7)]);
    const walk: ListingWalk = { bounded: true };
    const listing = boundedListingModule(module, { bound: UNBOUNDED_HISTORY, walk });

    const page = await listing.listOperations(context, "addr", { minHeight: 5, order: "desc" });

    expect(page).toEqual({ items: [operation(9), operation(8), operation(7)] });
    expect(
      module.listOperations.mock.calls.map(([, address, options]) => [address, options]),
    ).toEqual([
      ["addr", { minHeight: 5, cursor: undefined, order: "desc" }],
      ["addr", { minHeight: 5, cursor: "c1", order: "desc" }],
    ]);
    expect(walk.bounded).toBe(false);
    await expect(listing.lastBlock(context)).resolves.toEqual({ height: 99 });
  });

  it("walks under the bound: its page size as limit, the operations a sync leaves out dropped first", async () => {
    const nft = operation(10, { details: { ledgerOpType: "NFT_IN" } });
    const module = moduleListing(
      [nft, operation(9), operation(8)],
      [operation(7), operation(6)],
      [operation(5)],
    );
    const walk: ListingWalk = { bounded: false };
    const listing = boundedListingModule(module, {
      bound: { maxOperations: 3, pageSize: 3 },
      walk,
    });

    const page = await listing.listOperations(context, "addr", { minHeight: 0, order: "desc" });

    // Two pages walked (four kept operations), the lowest block of the last dropped.
    expect(page.items.map(({ tx }) => tx.block.height)).toEqual([9, 8, 7]);
    expect(module.listOperations).toHaveBeenCalledTimes(2);
    expect(module.listOperations.mock.calls[1][2]).toEqual({
      minHeight: 0,
      cursor: "c1",
      order: "desc",
      limit: 3,
    });
    expect(walk.bounded).toBe(true);
  });
});
