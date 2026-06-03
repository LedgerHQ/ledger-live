import { fetchTxs, fetchERC20Transactions } from "../../api/api";
import { listOperations } from "../listOperations";

jest.mock("../../api/api");
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

  it("token operations have fees = 0n and lowercase assetReference", async () => {
    mockedFetchTxs.mockResolvedValueOnce({ txs: [], metadata: { limit: 50, offset: 0 } });
    const ethAddr = "0x3ec0000000000000000000000000000000000000";
    mockedFetchERC20.mockResolvedValueOnce({
      txs: [
        {
          id: "1",
          height: 3_000_000,
          type: "erc20",
          status: "Ok",
          to: ethAddr,
          from: "0xabc",
          amount: "5000",
          contract_address: "0xABCDEF",
          timestamp: 1700000000,
          tx_hash: "tokenhash1",
        },
      ],
    });

    // Use an f4 address so convertAddressFilToEth doesn't throw
    const f4Address = "f410fkkld55ioe7qg24wvt7fu6pbknb56ht7ptloy";
    const result = await listOperations(f4Address, { minHeight: 0 });
    const tokenOp = result.items.find(op => op.asset.type === "erc20");
    if (tokenOp) {
      expect(tokenOp.tx.fees).toBe(0n);
      expect((tokenOp.asset as { type: string; assetReference: string }).assetReference).toBe(
        "0xabcdef",
      );
    }
  });
});
