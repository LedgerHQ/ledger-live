import { fetchTxsWithPages } from "../api/api";
import {
  createMockTransactionResponse,
  TEST_ADDRESSES,
  TEST_BLOCK_HEIGHTS,
  TEST_TRANSACTION_HASHES,
} from "../test/fixtures";
import { listOperations } from "./listOperations";

jest.mock("../api/api");

const mockedFetchTxsWithPages = fetchTxsWithPages as jest.MockedFunction<
  typeof fetchTxsWithPages
>;

const ADDRESS = TEST_ADDRESSES.F1_ADDRESS;

describe("listOperations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns an OUT operation when address is the sender", async () => {
    mockedFetchTxsWithPages.mockResolvedValueOnce([
      createMockTransactionResponse({
        from: ADDRESS,
        to: TEST_ADDRESSES.RECIPIENT_F1,
        amount: "100000000000000000",
      }),
    ]);

    const result = await listOperations(ADDRESS, { minHeight: 0 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe("OUT");
    expect(result.items[0].senders).toContain(ADDRESS);
  });

  it("returns an IN operation when address is the recipient", async () => {
    mockedFetchTxsWithPages.mockResolvedValueOnce([
      createMockTransactionResponse({
        from: TEST_ADDRESSES.RECIPIENT_F1,
        to: ADDRESS,
        amount: "100000000000000000",
      }),
    ]);

    const result = await listOperations(ADDRESS, { minHeight: 0 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe("IN");
    expect(result.items[0].recipients).toContain(ADDRESS);
  });

  it("returns FEES type when amount is zero and address is sender", async () => {
    mockedFetchTxsWithPages.mockResolvedValueOnce([
      createMockTransactionResponse({
        from: ADDRESS,
        to: TEST_ADDRESSES.RECIPIENT_F1,
        amount: "0",
      }),
    ]);

    const result = await listOperations(ADDRESS, { minHeight: 0 });

    expect(result.items[0].type).toBe("FEES");
  });

  it("passes minHeight to fetchTxsWithPages", async () => {
    mockedFetchTxsWithPages.mockResolvedValueOnce([]);

    await listOperations(ADDRESS, { minHeight: TEST_BLOCK_HEIGHTS.RECENT });

    expect(mockedFetchTxsWithPages).toHaveBeenCalledWith(ADDRESS, TEST_BLOCK_HEIGHTS.RECENT);
  });

  it("marks failed transactions correctly", async () => {
    mockedFetchTxsWithPages.mockResolvedValueOnce([
      createMockTransactionResponse({
        from: ADDRESS,
        status: "Fail",
        amount: "100000000000000000",
      }),
    ]);

    const result = await listOperations(ADDRESS, { minHeight: 0 });

    expect(result.items[0].tx.failed).toBe(true);
  });

  it("includes tx.fees from fee_data.TotalCost", async () => {
    mockedFetchTxsWithPages.mockResolvedValueOnce([
      createMockTransactionResponse({
        from: ADDRESS,
        amount: "100000000000000000",
        fee_data: {
          MinerFee: { MinerAddress: "f0123", Amount: "60000" },
          OverEstimationBurnFee: { BurnAddress: "f099", Amount: "20000" },
          BurnFee: { BurnAddress: "f099", Amount: "20000" },
          TotalCost: "200000",
        },
      }),
    ]);

    const result = await listOperations(ADDRESS, { minHeight: 0 });

    expect(result.items[0].tx.fees).toBe(200_000n);
  });

  it("returns empty items when no transactions", async () => {
    mockedFetchTxsWithPages.mockResolvedValueOnce([]);

    const result = await listOperations(ADDRESS, { minHeight: 0 });

    expect(result.items).toHaveLength(0);
    expect(result.next).toBeUndefined();
  });

  it("does not duplicate operations when sender equals recipient (self-send)", async () => {
    mockedFetchTxsWithPages.mockResolvedValueOnce([
      createMockTransactionResponse({
        from: ADDRESS,
        to: ADDRESS,
        amount: "100000000000000000",
        hash: TEST_TRANSACTION_HASHES.VALID,
      }),
    ]);

    const result = await listOperations(ADDRESS, { minHeight: 0 });

    // Self-send: only OUT is emitted (IN branch skipped when sender === recipient)
    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe("OUT");
  });
});
