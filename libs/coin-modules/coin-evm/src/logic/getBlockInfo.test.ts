import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import * as externalNode from "../network/node/rpc.common";
import ledgerNode from "../network/node/ledger";
import { EvmCoinConfig, setCoinConfig } from "../config";
import { getBlockInfo } from "./getBlockInfo";

describe("getBlockInfo", () => {
  it.each([
    ["an external node", "external", externalNode],
    ["a ledger node", "ledger", ledgerNode],
  ])("returns block info using %s", async (_, type, node) => {
    setCoinConfig(() => ({ info: { node: { type } } }) as unknown as EvmCoinConfig);
    const mockGetBlockByHeight = jest.spyOn(node, "getBlockByHeight");
    mockGetBlockByHeight.mockResolvedValueOnce({
      hash: "0xdef456",
      height: 99999,
      timestamp: new Date("2025-02-20T15:45:00Z").getTime(),
    });
    mockGetBlockByHeight.mockResolvedValueOnce({
      hash: "0xparent123",
      height: 99998,
      timestamp: new Date("2025-02-20T15:44:00Z").getTime(),
    });

    expect(await getBlockInfo({} as CryptoCurrency, 99999)).toEqual({
      hash: "0xdef456",
      height: 99999,
      time: new Date("2025-02-20T15:45:00Z"),
      parent: {
        hash: "0xparent123",
        height: 99998,
        time: new Date("2025-02-20T15:44:00Z"),
      },
    });
  });

  it.each([
    ["an external node", "external", externalNode],
    ["a ledger node", "ledger", ledgerNode],
  ])("returns block info without parent for genesis block using %s", async (_, type, node) => {
    setCoinConfig(() => ({ info: { node: { type } } }) as unknown as EvmCoinConfig);
    jest.spyOn(node, "getBlockByHeight").mockResolvedValue({
      hash: "0xgenesis",
      height: 0,
      timestamp: new Date("2015-07-30T00:00:00Z").getTime(),
    });

    expect(await getBlockInfo({} as CryptoCurrency, 0)).toEqual({
      hash: "0xgenesis",
      height: 0,
      time: new Date("2015-07-30T00:00:00Z"),
    });
  });

  it.each([
    ["an external node", "external", externalNode],
    ["a ledger node", "ledger", ledgerNode],
  ])("returns block info with parent for height 1 using %s", async (_, type, node) => {
    setCoinConfig(() => ({ info: { node: { type } } }) as unknown as EvmCoinConfig);
    const mockGetBlockByHeight = jest.spyOn(node, "getBlockByHeight");
    mockGetBlockByHeight.mockResolvedValueOnce({
      hash: "0xblock1",
      height: 1,
      timestamp: new Date("2015-07-30T00:00:15Z").getTime(),
    });
    mockGetBlockByHeight.mockResolvedValueOnce({
      hash: "0xgenesis",
      height: 0,
      timestamp: new Date("2015-07-30T00:00:00Z").getTime(),
    });

    const result = await getBlockInfo({} as CryptoCurrency, 1);

    expect(result).toEqual({
      hash: "0xblock1",
      height: 1,
      time: new Date("2015-07-30T00:00:15Z"),
      parent: {
        hash: "0xgenesis",
        height: 0,
        time: new Date("2015-07-30T00:00:00Z"),
      },
    });
    expect(result.parent?.height).toBe(0);
  });

  it.each([
    ["an external node", "external", externalNode],
    ["a ledger node", "ledger", ledgerNode],
  ])(
    "ensures parent block height is one less than current block using %s",
    async (_, type, node) => {
      setCoinConfig(() => ({ info: { node: { type } } }) as unknown as EvmCoinConfig);
      const mockGetBlockByHeight = jest.spyOn(node, "getBlockByHeight");
      const currentHeight = 12345;
      mockGetBlockByHeight.mockResolvedValueOnce({
        hash: "0xcurrent",
        height: currentHeight,
        timestamp: new Date("2025-02-20T15:45:00Z").getTime(),
      });
      mockGetBlockByHeight.mockResolvedValueOnce({
        hash: "0xparent",
        height: currentHeight - 1,
        timestamp: new Date("2025-02-20T15:44:00Z").getTime(),
      });

      const result = await getBlockInfo({} as CryptoCurrency, currentHeight);

      expect(result.height).toBe(currentHeight);
      expect(result.parent?.height).toBe(currentHeight - 1);
      expect(result.parent?.height).toBe(result.height - 1);
    },
  );

  it.each([
    ["an external node", "external", externalNode],
    ["a ledger node", "ledger", ledgerNode],
  ])("ensures parent block time is before current block time using %s", async (_, type, node) => {
    setCoinConfig(() => ({ info: { node: { type } } }) as unknown as EvmCoinConfig);
    const mockGetBlockByHeight = jest.spyOn(node, "getBlockByHeight");
    mockGetBlockByHeight.mockResolvedValueOnce({
      hash: "0xcurrent",
      height: 100,
      timestamp: new Date("2025-02-20T15:45:00Z").getTime(),
    });
    mockGetBlockByHeight.mockResolvedValueOnce({
      hash: "0xparent",
      height: 99,
      timestamp: new Date("2025-02-20T15:44:00Z").getTime(),
    });

    const result = await getBlockInfo({} as CryptoCurrency, 100);

    expect(result.time).toBeInstanceOf(Date);
    expect(result.parent?.time).toBeInstanceOf(Date);
    expect(result.parent?.time!.getTime()).toBeLessThan(result.time!.getTime());
  });
});
