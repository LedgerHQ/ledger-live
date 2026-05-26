import { listOperations } from "./listOperations";
import { fetchTxs, fetchERC20Transactions } from "../../api/api";
import { TxStatus } from "../../types";

jest.mock("../../api/api");
const mockedFetchTxs = jest.mocked(fetchTxs);
const mockedFetchERC20Transactions = jest.mocked(fetchERC20Transactions);

describe("listOperations", () => {
  afterEach(() => jest.resetAllMocks());

  it("returns empty page for address with no transactions", async () => {
    mockedFetchTxs.mockResolvedValue({ txs: [], metadata: { limit: 50, offset: 0 } });
    mockedFetchERC20Transactions.mockResolvedValue({ txs: [] });

    const result = await listOperations("f1empty", { minHeight: 0 });
    expect(result.items).toHaveLength(0);
    expect(result.next).toBeUndefined();
  });

  it("maps native IN/OUT transactions with unique operationIndex", async () => {
    mockedFetchTxs.mockResolvedValue({
      txs: [
        {
          to: "f1addr", from: "f1other", hash: "hash1",
          timestamp: 1700000000, amount: "1000", status: TxStatus.Ok,
          type: "send", height: 100,
        },
        {
          to: "f1other", from: "f1addr", hash: "hash2",
          timestamp: 1700000001, amount: "500",
          fee_data: { MinerFee: { MinerAddress: "", Amount: "10" }, OverEstimationBurnFee: { BurnAddress: "", Amount: "0" }, BurnFee: { BurnAddress: "", Amount: "0" }, TotalCost: "10" },
          status: TxStatus.Ok, type: "send", height: 101,
        },
      ],
      metadata: { limit: 50, offset: 0 },
    });
    mockedFetchERC20Transactions.mockResolvedValue({ txs: [] });

    const result = await listOperations("f1addr", { minHeight: 0 });

    const inOp = result.items.find(op => op.type === "IN");
    const outOp = result.items.find(op => op.type === "OUT");
    expect(inOp).toBeDefined();
    expect(outOp).toBeDefined();
    // IDs must be unique (Fix #2: operationIndex)
    expect(inOp!.id).not.toBe(outOp!.id);
    expect(inOp!.id).toMatch(/hash1-IN-\d+/);
    expect(outOp!.id).toMatch(/hash2-OUT-\d+/);
    // OUT value = amount + fees
    expect(outOp!.value).toBe(510n);
  });

  it("normalizes ERC-20 assetReference to lowercase", async () => {
    mockedFetchTxs.mockResolvedValue({ txs: [], metadata: { limit: 50, offset: 0 } });
    mockedFetchERC20Transactions.mockResolvedValue({
      txs: [{
        id: "t1", to: "0xRecipient", from: "f1addr", amount: "999",
        contract_address: "0xAbCdEf", timestamp: 1700000000,
        tx_hash: "txhash1", height: 200, type: "transfer", status: TxStatus.Ok,
      }],
    });

    const result = await listOperations("f1addr", { minHeight: 0 });
    expect(result.items[0].asset).toEqual({ type: "token", assetReference: "0xabcdef" });
  });

  it("paginates when either stream fills a page", async () => {
    const txs = Array.from({ length: 50 }, (_, i) => ({
      to: "f1addr", from: "f1other", hash: `hash${i}`,
      timestamp: 1700000000 + i, amount: "1", status: TxStatus.Ok,
      type: "send", height: 100 + i,
    }));

    mockedFetchTxs.mockResolvedValue({ txs, metadata: { limit: 50, offset: 0 } });
    // ERC20 stream empty — cursor must still be set because native stream is full
    mockedFetchERC20Transactions.mockResolvedValue({ txs: [] });

    const result = await listOperations("f1addr", { minHeight: 0, limit: 50 });
    expect(result.next).toBeDefined();
  });

  it("does NOT paginate when both streams return less than limit", async () => {
    mockedFetchTxs.mockResolvedValue({
      txs: [{ to: "f1addr", from: "f1other", hash: "h1", timestamp: 1700000000, amount: "1", status: TxStatus.Ok, type: "send", height: 100 }],
      metadata: { limit: 50, offset: 0 },
    });
    mockedFetchERC20Transactions.mockResolvedValue({ txs: [] });

    const result = await listOperations("f1addr", { minHeight: 0, limit: 50 });
    expect(result.next).toBeUndefined();
  });
});
