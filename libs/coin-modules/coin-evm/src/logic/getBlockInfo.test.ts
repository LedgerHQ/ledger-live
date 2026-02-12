import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { EvmCoinConfig, setCoinConfig } from "../config";
import ledgerNode from "../network/node/ledger";
import { getBlockByHeight as externalGetBlockByHeight } from "../network/node/rpc.common";
import { getBlockInfo } from "./getBlockInfo";

jest.mock("../network/node/rpc.common", () => ({
  getBlockByHeight: jest.fn(),
}));

jest.mock("../network/node/ledger", () => ({
  __esModule: true,
  default: {
    getBlockByHeight: jest.fn(),
  },
}));

const mockExternalGetBlockByHeight = externalGetBlockByHeight as jest.Mock;
const mockLedgerGetBlockByHeight = ledgerNode.getBlockByHeight as jest.Mock;

describe("getBlockInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    ["an external node", "external", mockExternalGetBlockByHeight],
    ["a ledger node", "ledger", mockLedgerGetBlockByHeight],
  ])("using %s", (_, type, mockGetBlockByHeight) => {
    beforeEach(() => {
      setCoinConfig(() => ({ info: { node: { type } } }) as unknown as EvmCoinConfig);
    });

    it("returns block info", async () => {
      mockGetBlockByHeight.mockResolvedValueOnce({
        hash: "0xdef456",
        height: 99999,
        timestamp: new Date("2025-02-20T15:45:00Z").getTime(),
        parentHash: "0xparent123",
      });

      expect(await getBlockInfo({} as CryptoCurrency, 99999)).toEqual({
        hash: "0xdef456",
        height: 99999,
        time: new Date("2025-02-20T15:45:00Z"),
        parent: {
          hash: "0xparent123",
          height: 99998,
        },
      });
    });

    it("returns block info without parent for genesis block", async () => {
      mockGetBlockByHeight.mockResolvedValue({
        hash: "0xgenesis",
        height: 0,
        timestamp: new Date("2015-07-30T00:00:00Z").getTime(),
        parentHash: "",
      });

      expect(await getBlockInfo({} as CryptoCurrency, 0)).toEqual({
        hash: "0xgenesis",
        height: 0,
        time: new Date("2015-07-30T00:00:00Z"),
      });
    });

    it("returns block info with parent for height 1", async () => {
      mockGetBlockByHeight.mockResolvedValueOnce({
        hash: "0xblock1",
        height: 1,
        timestamp: new Date("2015-07-30T00:00:15Z").getTime(),
        parentHash: "0xgenesis",
      });

      const result = await getBlockInfo({} as CryptoCurrency, 1);

      expect(result).toEqual({
        hash: "0xblock1",
        height: 1,
        time: new Date("2015-07-30T00:00:15Z"),
        parent: {
          hash: "0xgenesis",
          height: 0,
        },
      });
      expect(result.parent?.height).toBe(0);
    });

    it("ensures parent block height is one less than current block", async () => {
      const currentHeight = 12345;
      mockGetBlockByHeight.mockResolvedValueOnce({
        hash: "0xcurrent",
        height: currentHeight,
        timestamp: new Date("2025-02-20T15:45:00Z").getTime(),
        parentHash: "0xparent",
      });

      const result = await getBlockInfo({} as CryptoCurrency, currentHeight);

      expect(result.height).toBe(currentHeight);
      expect(result.parent?.height).toBe(currentHeight - 1);
      expect(result.parent?.height).toBe(result.height - 1);
    });

    it("ensures parent block exists when height > 0", async () => {
      mockGetBlockByHeight.mockResolvedValueOnce({
        hash: "0xcurrent",
        height: 100,
        timestamp: new Date("2025-02-20T15:45:00Z").getTime(),
        parentHash: "0xparent",
      });

      const result = await getBlockInfo({} as CryptoCurrency, 100);

      expect(result.time).toBeInstanceOf(Date);
      expect(result.parent).not.toBeUndefined();
      expect(result.parent?.height).toBe(99);
      expect(result.parent?.hash).toBe("0xparent");
    });
  });
});
