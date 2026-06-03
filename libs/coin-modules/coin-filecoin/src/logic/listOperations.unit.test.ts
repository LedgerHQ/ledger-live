import { fetchTxs, fetchERC20Transactions } from "../api/api";
import { listOperations } from "./listOperations";

jest.mock("../api/api");
jest.mock("@ledgerhq/logs");

const mockedFetchTxs = fetchTxs as jest.MockedFunction<typeof fetchTxs>;
const mockedFetchERC20 = fetchERC20Transactions as jest.MockedFunction<
  typeof fetchERC20Transactions
>;

const ADDRESS = "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za";

const makeNativeTx = (overrides = {}) => ({
  hash: "nativehash1",
  to: "f1z4nykg7q6q5qnxs7h4zknhlqbqhq5jxcqm5qw4y",
  from: ADDRESS,
  amount: "1000000000000000000",
  fee_data: {
    TotalCost: "150000000000",
    MinerFee: { MinerAddress: "", Amount: "" },
    OverEstimationBurnFee: { BurnAddress: "", Amount: "" },
    BurnFee: { BurnAddress: "", Amount: "" },
  },
  status: "Ok",
  type: "transfer",
  timestamp: 1700000000,
  height: 3_000_000,
  ...overrides,
});

describe("listOperations", () => {
  beforeEach(() => jest.clearAllMocks());

  it("OUT value equals amount + fee", async () => {
    mockedFetchTxs.mockResolvedValueOnce({
      txs: [makeNativeTx()],
      metadata: { limit: 50, offset: 0 },
    });
    mockedFetchERC20.mockResolvedValueOnce({ txs: [] });

    const result = await listOperations(ADDRESS, { minHeight: 0 });

    const outOp = result.items.find(op => op.type === "OUT");
    // value = 1000000000000000000 + 150000000000
    expect(outOp?.value).toBe(1_000_000_150_000_000_000n);
  });

  it("next is undefined when both streams are empty", async () => {
    mockedFetchTxs.mockResolvedValueOnce({ txs: [], metadata: { limit: 50, offset: 0 } });
    mockedFetchERC20.mockResolvedValueOnce({ txs: [] });

    const result = await listOperations(ADDRESS, { minHeight: 0 });
    expect(result.next).toBeUndefined();
  });

  it("next is defined when native stream has full page", async () => {
    const fullPage = Array.from({ length: 50 }, (_, i) =>
      makeNativeTx({ hash: `hash${i}`, timestamp: 1700000000 - i }),
    );
    mockedFetchTxs.mockResolvedValueOnce({
      txs: fullPage,
      metadata: { limit: 50, offset: 0 },
    });
    mockedFetchERC20.mockResolvedValueOnce({ txs: [] });

    const result = await listOperations(ADDRESS, { minHeight: 0, limit: 50 });
    expect(typeof result.next).toBe("string");
  });

  it("IN operation value excludes fees", async () => {
    const inTx = makeNativeTx({
      from: "f1z4nykg7q6q5qnxs7h4zknhlqbqhq5jxcqm5qw4y",
      to: ADDRESS,
    });
    mockedFetchTxs.mockResolvedValueOnce({
      txs: [inTx],
      metadata: { limit: 50, offset: 0 },
    });
    mockedFetchERC20.mockResolvedValueOnce({ txs: [] });

    const result = await listOperations(ADDRESS, { minHeight: 0 });
    const inOp = result.items.find(op => op.type === "IN");
    expect(inOp).toBeDefined();
    // IN value = amount only (no fee added)
    expect(inOp!.value).toBe(1_000_000_000_000_000_000n);
  });

  it("gracefully handles undefined txs from API", async () => {
    mockedFetchTxs.mockResolvedValueOnce({
      txs: undefined as any,
      metadata: { limit: 50, offset: 0 },
    });
    mockedFetchERC20.mockResolvedValueOnce({ txs: [] });

    const result = await listOperations(ADDRESS, { minHeight: 0 });
    expect(result.items).toEqual([]);
    expect(result.next).toBeUndefined();
  });
});
