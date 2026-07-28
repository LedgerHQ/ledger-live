import { getAllTransactions } from "./getAllTransactions";
import { listOperations } from "./listOperations";

const mockGetAllTransactions = jest.fn();
jest.mock("./getAllTransactions", () => ({
  getAllTransactions: (...args: unknown[]) => mockGetAllTransactions(...args),
}));

const ADDRESS = "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e";

function baseOptions(overrides: Partial<Parameters<typeof listOperations>[1]> = {}) {
  return { minHeight: 0, ...overrides };
}

describe("listOperations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns an undefined cursor (full history is fetched per call)", async () => {
    mockGetAllTransactions.mockResolvedValue([]);

    const page = await listOperations(ADDRESS, baseOptions());

    expect(page.next).toBeUndefined();
  });

  it("maps an OUT transaction to a framework Operation with value = amount (fee excluded)", async () => {
    mockGetAllTransactions.mockResolvedValue([
      {
        transaction_id: "tx-out",
        hash: "tx-out",
        block_hash: ["block-hash"],
        block_time: 1700000000000,
        accepting_block_blue_score: 100,
        inputs: [
          {
            previous_outpoint_address: ADDRESS,
            previous_outpoint_amount: 1000000,
          },
        ],
        outputs: [
          {
            script_public_key_address:
              "kaspa:qyp8y7hlk9uj5l9vqsyz78x90yt84cujdytg93s8q8malhpdq6c4hpg9dyesk65",
            script_public_key: null,
            amount: 700000,
          },
          {
            script_public_key_address: ADDRESS,
            script_public_key: null,
            amount: 250000,
          },
        ],
      },
    ]);

    const page = await listOperations(ADDRESS, baseOptions());

    expect(page.items).toHaveLength(1);
    const [op] = page.items;
    expect(op.type).toBe("OUT");
    // fee = totalInput(1000000) - totalOutput(950000) = 50000; amount sent = 700000.
    // Framework Operation.value is the pure amount — the generic adapter re-adds fees for OUT.
    expect(op.tx.fees).toBe(50000n);
    expect(op.value).toBe(700000n);
    expect(op.asset).toEqual({ type: "native", name: "KAS" });
  });

  it("maps an IN transaction to a framework Operation with the received amount", async () => {
    mockGetAllTransactions.mockResolvedValue([
      {
        transaction_id: "tx-in",
        hash: "tx-in",
        block_hash: ["block-hash"],
        block_time: 1700000000000,
        accepting_block_blue_score: 200,
        inputs: [],
        outputs: [{ script_public_key_address: ADDRESS, script_public_key: null, amount: 12345 }],
      },
    ]);

    const page = await listOperations(ADDRESS, baseOptions());

    const [op] = page.items;
    expect(op.type).toBe("IN");
    expect(op.value).toBe(12345n);
    expect(op.tx.fees).toBe(0n);
  });

  it("filters out transactions below minHeight", async () => {
    mockGetAllTransactions.mockResolvedValue([
      {
        transaction_id: "tx-old",
        hash: "tx-old",
        block_hash: ["h"],
        block_time: 1,
        accepting_block_blue_score: 5,
        inputs: [],
        outputs: [{ script_public_key_address: ADDRESS, script_public_key: null, amount: 1 }],
      },
      {
        transaction_id: "tx-new",
        hash: "tx-new",
        block_hash: ["h"],
        block_time: 2,
        accepting_block_blue_score: 50,
        inputs: [],
        outputs: [{ script_public_key_address: ADDRESS, script_public_key: null, amount: 1 }],
      },
    ]);

    const page = await listOperations(ADDRESS, baseOptions({ minHeight: 10 }));

    expect(page.items.map(op => op.id)).toEqual(["tx-new"]);
  });
});
