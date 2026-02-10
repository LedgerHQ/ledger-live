import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { EvmCoinConfig, setCoinConfig } from "../config";
import { getNodeApi } from "../network/node";
import { getBlock } from "./getBlock";

jest.mock("../network/node");

describe("getBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns block with transactions and ERC20 transfers", async () => {
    setCoinConfig(() => ({ info: { node: { type: "external" } } }) as unknown as EvmCoinConfig);

    const mockGetNodeApi = jest.mocked(getNodeApi);
    const mockGetBlockByHeight = jest.fn();
    mockGetBlockByHeight.mockResolvedValueOnce({
      hash: "0xabc123",
      height: 12345,
      timestamp: new Date("2025-01-15T10:30:00Z").getTime(),
      parentHash: "0xparent123",
      transactionHashes: ["0xtx1", "0xtx2"],
    });
    const mockGetTransaction = jest.fn();
    mockGetTransaction
      .mockResolvedValueOnce({
        hash: "0xtx1",
        blockHeight: 12345,
        blockHash: "0xabc123",
        nonce: 1,
        gasUsed: "21000",
        gasPrice: "20000000000",
        status: 1,
        value: "1000",
        from: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
        to: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
        erc20Transfers: [
          {
            asset: { type: "erc20", assetReference: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
            from: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
            to: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
            value: "1000000",
          },
        ],
      })
      .mockResolvedValueOnce({
        hash: "0xtx2",
        blockHeight: 12345,
        blockHash: "0xabc123",
        nonce: 2,
        gasUsed: "21000",
        gasPrice: "20000000000",
        status: 1,
        value: "0",
        from: "0x6cBCD73CD8e8a42844662f0A0e76D7F79Afd933d",
        to: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
        erc20Transfers: [],
      });

    mockGetNodeApi.mockReturnValue({
      getBlockByHeight: mockGetBlockByHeight,
      getTransaction: mockGetTransaction,
    } as any);

    const result = await getBlock({} as CryptoCurrency, 12345);

    expect(result.info).toEqual({
      hash: "0xabc123",
      height: 12345,
      time: new Date("2025-01-15T10:30:00Z"),
      parent: {
        hash: "0xparent123",
        height: 12344,
      },
    });
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0].hash).toBe("0xtx1");

    // Check native transfer operations (tx1 has value: 1000)
    const tx1NativeOps = result.transactions[0].operations.filter(op => op.asset.type === "native");
    expect(tx1NativeOps).toHaveLength(2); // sender and receiver

    // Check ERC20 transfer operations (tx1 has one ERC20 transfer)
    const tx1Erc20Ops = result.transactions[0].operations.filter(op => op.asset.type === "erc20");
    expect(tx1Erc20Ops).toHaveLength(2); // sender and receiver
    expect(tx1Erc20Ops[0].asset.assetReference).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");

    // tx2 has no value and no ERC20 transfers
    expect(result.transactions[1].operations).toHaveLength(0);
  });
});
