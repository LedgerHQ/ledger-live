import { fetchTxs, fetchERC20Transactions } from "../../network/api";
import { convertAddressFilToEth } from "../../network/addresses";
import { ERC20Transfer, TransactionResponse } from "../../types";
import { listOperations } from "./listOperations";

jest.mock("../../network/api");
jest.mock("../../network/addresses", () => ({
  convertAddressFilToEth: jest.fn(),
}));
jest.mock("@ledgerhq/logs");

const mockedFetchTxs = fetchTxs as jest.MockedFunction<typeof fetchTxs>;
const mockedFetchERC20 = fetchERC20Transactions as jest.MockedFunction<
  typeof fetchERC20Transactions
>;
const mockedConvertToEth = convertAddressFilToEth as jest.MockedFunction<
  typeof convertAddressFilToEth
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
  beforeEach(() => jest.resetAllMocks());

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
    const inOp = result.items.find(op => op.type === "IN")!;
    // IN value = amount only (no fee added)
    expect(inOp.value).toBe(1_000_000_000_000_000_000n);
  });

  it("recovers from malformed cursor JSON", async () => {
    mockedFetchTxs.mockResolvedValueOnce({
      txs: [makeNativeTx()],
      metadata: { limit: 50, offset: 0 },
    });
    mockedFetchERC20.mockResolvedValueOnce({ txs: [] });

    const result = await listOperations(ADDRESS, {
      minHeight: 100,
      cursor: "NOT-VALID-JSON",
    });

    // Should fall back to default cursor (minHeight=100, offset=0)
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("maps ERC-20 transfers into token operations", async () => {
    const ethAddr = "0xabc0000000000000000000000000000000000001";
    mockedConvertToEth.mockReturnValue(ethAddr);

    const tokenTx: ERC20Transfer = {
      id: "erc20-1",
      height: 3_100_000,
      type: "transfer",
      status: "Ok",
      from: "0x0000000000000000000000000000000000000002",
      to: ethAddr,
      amount: "5000000000000000000",
      contract_address: "0xCONTRACTaddress0000000000000000000000AA",
      timestamp: 1700001000,
      tx_hash: "0xtokenhash1",
    };

    mockedFetchTxs.mockResolvedValueOnce({ txs: [], metadata: { limit: 50, offset: 0 } });
    mockedFetchERC20.mockResolvedValueOnce({ txs: [tokenTx] });

    const result = await listOperations(ADDRESS, { minHeight: 0 });

    const tokenOps = result.items.filter(op => op.asset.type === "erc20");
    expect(tokenOps).toHaveLength(1);
    const tokenOp = tokenOps[0];
    expect(tokenOp.type).toBe("IN");
    expect(tokenOp.value).toBe(5_000_000_000_000_000_000n);
    expect(tokenOp.asset).toEqual({
      type: "erc20",
      assetReference: "0xcontractaddress0000000000000000000000aa",
    });
    expect(tokenOp.tx.hash).toBe("0xtokenhash1");
  });

  it("gracefully handles undefined txs from API", async () => {
    mockedFetchTxs.mockResolvedValueOnce({
      txs: undefined as unknown as TransactionResponse[],
      metadata: { limit: 50, offset: 0 },
    });
    mockedFetchERC20.mockResolvedValueOnce({ txs: [] });

    const result = await listOperations(ADDRESS, { minHeight: 0 });
    expect(result.items).toEqual([]);
    expect(result.next).toBeUndefined();
  });
});
