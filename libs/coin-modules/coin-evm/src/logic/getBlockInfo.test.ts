import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { EvmCoinConfig, getCoinConfig, setCoinConfig } from "../config";
import { getNodeApi } from "../network/node";
import { mockNodeApi } from "../network/node/test.utils";
import { getBlockInfo } from "./getBlockInfo";

jest.mock("../network/node", () => ({
  ...jest.requireActual("../network/node"),
  getNodeApi: jest.fn(),
}));

const mockGetNodeApi = jest.mocked(getNodeApi);

describe("getBlockInfo", () => {
  const externalMocks = mockNodeApi();
  const ledgerMocks = mockNodeApi();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNodeApi.mockImplementation((currency: CryptoCurrency) => {
      const config = getCoinConfig(currency);
      return config?.info?.node?.type === "ledger" ? ledgerMocks : externalMocks;
    });
  });

  describe.each([
    ["an external node", "external", externalMocks],
    ["a ledger node", "ledger", ledgerMocks],
  ])("using %s", (_, type, nodeApiMock) => {
    beforeEach(() => {
      setCoinConfig(() => ({ info: { node: { type } } }) as unknown as EvmCoinConfig);
    });

    it("returns block info", async () => {
      nodeApiMock.getBlockByHeight.mockResolvedValueOnce({
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
      nodeApiMock.getBlockByHeight.mockResolvedValue({
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
      nodeApiMock.getBlockByHeight.mockResolvedValueOnce({
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
      nodeApiMock.getBlockByHeight.mockResolvedValueOnce({
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
      nodeApiMock.getBlockByHeight.mockResolvedValueOnce({
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
