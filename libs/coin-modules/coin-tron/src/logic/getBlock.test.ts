import { getBlock as networkGetBlock, getBlockWithTransactions } from "../network";
import { getBlock, getBlockInfo } from "./getBlock";

jest.mock("../network", () => ({
  getBlock: jest.fn(),
  getBlockWithTransactions: jest.fn(),
}));

describe("getBlockInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty block info for height <= 0", async () => {
    const result = await getBlockInfo(0);

    expect(result).toEqual({ height: 0, hash: "", time: new Date(0) });
    expect(networkGetBlock).not.toHaveBeenCalled();
  });

  it("should return block info from network", async () => {
    (networkGetBlock as jest.Mock).mockResolvedValue({
      height: 100,
      hash: "blockhash",
      time: new Date(1700000000000),
    });

    const result = await getBlockInfo(100);

    expect(result).toEqual({
      height: 100,
      hash: "blockhash",
      time: new Date(1700000000000),
    });
    expect(networkGetBlock).toHaveBeenCalledWith(100);
  });
});

describe("getBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty block for height <= 0", async () => {
    const result = await getBlock(0);

    expect(result).toEqual({
      info: { height: 0, hash: "", time: new Date(0) },
      transactions: [],
    });
    expect(getBlockWithTransactions).not.toHaveBeenCalled();
  });

  it("should map TRX transfer to transfer operations", async () => {
    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000, parentHash: "parent" } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "TransferContract",
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    to_address: "41f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5",
                    amount: 1000000,
                  },
                },
              },
            ],
          },
          ret: [{ contractRet: "SUCCESS", fee: 1000 }],
        },
      ],
    });

    const result = await getBlock(100);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].hash).toBe("tx1");
    expect(result.transactions[0].failed).toBe(false);
    expect(result.transactions[0].operations).toHaveLength(2);
    expect(result.transactions[0].operations[0]).toMatchObject({
      type: "transfer",
      asset: { type: "native" },
      amount: BigInt(-1000000),
    });
    expect(result.transactions[0].operations[1]).toMatchObject({
      type: "transfer",
      asset: { type: "native" },
      amount: BigInt(1000000),
    });
    expect(getBlockWithTransactions).toHaveBeenCalledWith(100);
  });

  it("should map TRC10 transfer to transfer operations", async () => {
    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "TransferAssetContract",
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    to_address: "41f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5",
                    amount: 500000,
                    asset_name: "1000001",
                  },
                },
              },
            ],
          },
          ret: [{ contractRet: "SUCCESS" }],
        },
      ],
    });

    const result = await getBlock(100);

    expect(result.transactions[0].operations[0]).toMatchObject({
      type: "transfer",
      asset: { type: "trc10", assetReference: "1000001" },
    });
  });

  it("should map non-transfer contracts to other operations", async () => {
    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "VoteWitnessContract",
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    votes: [{ vote_address: "41abc", vote_count: 10 }],
                  },
                },
              },
            ],
          },
          ret: [{ contractRet: "SUCCESS" }],
        },
      ],
    });

    const result = await getBlock(100);

    expect(result.transactions[0].operations[0]).toMatchObject({
      type: "other",
      contractType: "VoteWitnessContract",
    });
  });

  it("should handle failed transactions", async () => {
    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "TransferContract",
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    to_address: "41f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5",
                    amount: 1000000,
                  },
                },
              },
            ],
          },
          ret: [{ contractRet: "FAILED" }],
        },
      ],
    });

    const result = await getBlock(100);

    expect(result.transactions[0].failed).toBe(true);
  });

  it("should handle blocks with no transactions", async () => {
    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
    });

    const result = await getBlock(100);

    expect(result.transactions).toHaveLength(0);
  });
});
