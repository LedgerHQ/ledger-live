import {
  getBlock as networkGetBlock,
  getBlockWithTransactions,
  getTransactionInfoByBlockNum,
} from "../network";
import { encode58Check } from "../network/format";
import { getBlock, getBlockInfo } from "./getBlock";

jest.mock("../network", () => ({
  getBlock: jest.fn(),
  getBlockWithTransactions: jest.fn(),
  getTransactionInfoByBlockNum: jest.fn(),
}));

const mockGetTransactionInfoByBlockNum = getTransactionInfoByBlockNum as jest.Mock;

describe("getBlockInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw for invalid height", async () => {
    await expect(getBlockInfo(0)).rejects.toThrow("Invalid block height: 0");
    await expect(getBlockInfo(-1)).rejects.toThrow("Invalid block height: -1");
    await expect(getBlockInfo(1.5)).rejects.toThrow("Invalid block height: 1.5");
    await expect(getBlockInfo(NaN)).rejects.toThrow("Invalid block height: NaN");
    await expect(getBlockInfo(Infinity)).rejects.toThrow("Invalid block height: Infinity");
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
    mockGetTransactionInfoByBlockNum.mockResolvedValue([]);
  });

  it("should throw for invalid height", async () => {
    await expect(getBlock(0)).rejects.toThrow("Invalid block height: 0");
    await expect(getBlock(-1)).rejects.toThrow("Invalid block height: -1");
    await expect(getBlock(1.5)).rejects.toThrow("Invalid block height: 1.5");
    await expect(getBlock(NaN)).rejects.toThrow("Invalid block height: NaN");
    await expect(getBlock(Infinity)).rejects.toThrow("Invalid block height: Infinity");
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

  it("should map TRC20 transfer to transfer operations", async () => {
    const contractAddress = "41aabbccdd11223344556677889900aabbccdd1122";
    const recipientHex = "f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5";
    const amountHex = "00000000000000000000000000000000000000000000000000000000000f4240";
    const transferData = "a9059cbb" + recipientHex.padStart(64, "0") + amountHex;

    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "TriggerSmartContract",
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    contract_address: contractAddress,
                    data: transferData,
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
    const expectedAssetReference = encode58Check(contractAddress);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].operations).toHaveLength(2);
    expect(result.transactions[0].operations[0]).toMatchObject({
      type: "transfer",
      asset: { type: "trc20", assetReference: expectedAssetReference },
      amount: BigInt(-1000000),
    });
    expect(result.transactions[0].operations[1]).toMatchObject({
      type: "transfer",
      asset: { type: "trc20", assetReference: expectedAssetReference },
      amount: BigInt(1000000),
    });
  });

  it("should map TriggerSmartContract without transfer data to other operations", async () => {
    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "TriggerSmartContract",
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    contract_address: "41aabbccdd11223344556677889900aabbccdd1122",
                    data: "12345678",
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
      operationType: "NONE",
      contractType: "TriggerSmartContract",
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
      operationType: "VOTE",
      contractType: "VoteWitnessContract",
    });
  });

  it("should handle failed transactions with empty operations but fees set", async () => {
    mockGetTransactionInfoByBlockNum.mockResolvedValue([{ id: "tx1", fee: 5000 }]);

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
    expect(result.transactions[0].operations).toHaveLength(0);
    expect(result.transactions[0].fees).toBe(BigInt(5000));
  });

  it("should handle blocks with no transactions", async () => {
    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
    });

    const result = await getBlock(100);

    expect(result.transactions).toHaveLength(0);
  });

  it("should treat missing ret as success (not failed)", async () => {
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
        },
      ],
    });

    const result = await getBlock(100);

    expect(result.transactions[0].failed).toBe(false);
  });

  it("should get fees from getTransactionInfoByBlockNum when missing in ret", async () => {
    mockGetTransactionInfoByBlockNum.mockResolvedValue([{ id: "tx1", fee: 2500 }]);

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
          ret: [{ contractRet: "SUCCESS" }],
        },
      ],
    });

    const result = await getBlock(100);

    expect(mockGetTransactionInfoByBlockNum).toHaveBeenCalledWith(100);
    expect(result.transactions[0].fees).toBe(BigInt(2500));
  });

  it("should always use fees from getTransactionInfoByBlockNum", async () => {
    mockGetTransactionInfoByBlockNum.mockResolvedValue([{ id: "tx1", fee: 9999 }]);

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
          ret: [{ contractRet: "SUCCESS" }],
        },
      ],
    });

    const result = await getBlock(100);

    expect(result.transactions[0].fees).toBe(BigInt(9999));
  });

  it("should fallback to ret fee when tx info not found", async () => {
    mockGetTransactionInfoByBlockNum.mockResolvedValue([]);

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
          ret: [{ contractRet: "SUCCESS", fee: 7500 }],
        },
      ],
    });

    const result = await getBlock(100);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].fees).toBe(BigInt(7500));
  });

  it("should fallback to zero fees when neither tx info nor ret has fee", async () => {
    mockGetTransactionInfoByBlockNum.mockResolvedValue([]);

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
          ret: [{ contractRet: "SUCCESS" }],
        },
      ],
    });

    const result = await getBlock(100);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].fees).toBe(BigInt(0));
  });

  it("should still succeed when getTransactionInfoByBlockNum fails", async () => {
    mockGetTransactionInfoByBlockNum.mockRejectedValue(new Error("Network error"));

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
          ret: [{ contractRet: "SUCCESS", fee: 4000 }],
        },
      ],
    });

    const result = await getBlock(100);

    expect(result.info.height).toBe(100);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].fees).toBe(BigInt(4000));
  });
});
