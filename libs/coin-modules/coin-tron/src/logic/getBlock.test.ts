import type { TronCoinConfig } from "../config";
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

const mockConfig = {
  status: { type: "active" },
  explorer: { url: "https://tron.coin.ledger.com" },
} as TronCoinConfig;

describe("getBlockInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw for invalid height", async () => {
    await expect(getBlockInfo(mockConfig, 0)).rejects.toThrow("Invalid block height: 0");
    await expect(getBlockInfo(mockConfig, -1)).rejects.toThrow("Invalid block height: -1");
    await expect(getBlockInfo(mockConfig, 1.5)).rejects.toThrow("Invalid block height: 1.5");
    await expect(getBlockInfo(mockConfig, NaN)).rejects.toThrow("Invalid block height: NaN");
    await expect(getBlockInfo(mockConfig, Infinity)).rejects.toThrow(
      "Invalid block height: Infinity",
    );
    expect(networkGetBlock).not.toHaveBeenCalled();
  });

  it("should return block info from network", async () => {
    (networkGetBlock as jest.Mock).mockResolvedValue({
      height: 100,
      hash: "blockhash",
      time: new Date(1700000000000),
    });

    const result = await getBlockInfo(mockConfig, 100);

    expect(result).toEqual({
      height: 100,
      hash: "blockhash",
      time: new Date(1700000000000),
    });
    expect(networkGetBlock).toHaveBeenCalledWith(mockConfig, 100);
  });
});

describe("getBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTransactionInfoByBlockNum.mockResolvedValue([]);
  });

  it("should throw for invalid height", async () => {
    await expect(getBlock(mockConfig, 0)).rejects.toThrow("Invalid block height: 0");
    await expect(getBlock(mockConfig, -1)).rejects.toThrow("Invalid block height: -1");
    await expect(getBlock(mockConfig, 1.5)).rejects.toThrow("Invalid block height: 1.5");
    await expect(getBlock(mockConfig, NaN)).rejects.toThrow("Invalid block height: NaN");
    await expect(getBlock(mockConfig, Infinity)).rejects.toThrow("Invalid block height: Infinity");
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

    const result = await getBlock(mockConfig, 100);

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
    expect(getBlockWithTransactions).toHaveBeenCalledWith(mockConfig, 100);
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
                    asset_name: "31303030303031",
                  },
                },
              },
            ],
          },
          ret: [{ contractRet: "SUCCESS" }],
        },
      ],
    });

    const result = await getBlock(mockConfig, 100);

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

    const result = await getBlock(mockConfig, 100);
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

  // Same transaction as the /operations regression: block 85277401 holds a TRC20 deployed and
  // minted in one go, whose transfer exists only as an event log.
  it("should map a TRC20 minted by a contract creation to transfer operations", async () => {
    const deployerHex = "41679c8dd7488038252f935ca3465fbc94d29a940f";

    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 85277401, timestamp: 1786503237000 } },
      transactions: [
        {
          txID: "4d8f740330ec0c2158cd29db807c98b2c8ba11f7217e645d5c4421106138a399",
          raw_data: {
            contract: [
              {
                type: "CreateSmartContract",
                parameter: {
                  value: {
                    owner_address: deployerHex,
                    new_contract: { name: "Token", origin_address: deployerHex },
                  },
                },
              },
            ],
          },
          ret: [{ contractRet: "SUCCESS", fee: 57131600 }],
        },
      ],
    });
    mockGetTransactionInfoByBlockNum.mockResolvedValue([
      {
        id: "4d8f740330ec0c2158cd29db807c98b2c8ba11f7217e645d5c4421106138a399",
        fee: 57131600,
        contract_address: "411fd80baee7c53e92e69447ff8c48d6b3a008572f",
        log: [
          {
            address: "1fd80baee7c53e92e69447ff8c48d6b3a008572f",
            topics: [
              "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
              "0000000000000000000000000000000000000000000000000000000000000000",
              "000000000000000000000000679c8dd7488038252f935ca3465fbc94d29a940f",
            ],
            data: "00000000000000000000000000000000000004ee2d6d415b85acef8100000000",
          },
        ],
      },
    ]);

    const result = await getBlock(mockConfig, 85277401);
    const amount = BigInt("100000000000000000000000000000000");

    expect(result.transactions).toHaveLength(1);
    // The deployer paid for the deployment; the mint itself comes from the zero address.
    expect(result.transactions[0].feesPayer).toBe(encode58Check(deployerHex));
    expect(result.transactions[0].operations).toEqual([
      {
        type: "transfer",
        address: encode58Check("41" + "0".repeat(40)),
        peer: encode58Check(deployerHex),
        asset: { type: "trc20", assetReference: "TCsam7uH3NbYLpKMCAayquN4Qwm3q717qu" },
        amount: -amount,
      },
      {
        type: "transfer",
        address: encode58Check(deployerHex),
        peer: encode58Check("41" + "0".repeat(40)),
        asset: { type: "trc20", assetReference: "TCsam7uH3NbYLpKMCAayquN4Qwm3q717qu" },
        amount,
      },
    ]);
  });

  it("should map every constructor mint of a contract creation, not just the first", async () => {
    const deployerHex = "41679c8dd7488038252f935ca3465fbc94d29a940f";
    const transferTopic = "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    const mintedTo = "000000000000000000000000679c8dd7488038252f935ca3465fbc94d29a940f";
    const amountData = "0000000000000000000000000000000000000000000000000000000000000064";

    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "CreateSmartContract",
                parameter: {
                  value: { owner_address: deployerHex, new_contract: { name: "Token" } },
                },
              },
            ],
          },
          ret: [{ contractRet: "SUCCESS" }],
        },
      ],
    });
    mockGetTransactionInfoByBlockNum.mockResolvedValue([
      {
        id: "tx1",
        fee: 0,
        log: [
          {
            address: "1fd80baee7c53e92e69447ff8c48d6b3a008572f",
            topics: [transferTopic, "0".repeat(64), mintedTo],
            data: amountData,
          },
          {
            address: "a614f803b6fd780986a42c78ec9c7f77e6ded13c",
            topics: [transferTopic, "0".repeat(64), mintedTo],
            data: amountData,
          },
        ],
      },
    ]);

    const result = await getBlock(mockConfig, 100);

    expect(result.transactions[0].operations).toHaveLength(4);
    expect(
      result.transactions[0].operations.map(
        op => (op as { asset: { assetReference: string } }).asset.assetReference,
      ),
    ).toEqual([
      "TCsam7uH3NbYLpKMCAayquN4Qwm3q717qu",
      "TCsam7uH3NbYLpKMCAayquN4Qwm3q717qu",
      "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
      "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    ]);
  });

  it("should map a contract creation with no token event to a plain operation", async () => {
    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "CreateSmartContract",
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    new_contract: { name: "Whatever" },
                  },
                },
              },
            ],
          },
          ret: [{ contractRet: "SUCCESS" }],
        },
      ],
    });

    const result = await getBlock(mockConfig, 100);

    expect(result.transactions[0].operations).toEqual([
      { type: "other", operationType: "NONE", contractType: "CreateSmartContract" },
    ]);
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

    const result = await getBlock(mockConfig, 100);

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

    const result = await getBlock(mockConfig, 100);

    expect(result.transactions[0].operations[0]).toMatchObject({
      type: "other",
      operationType: "VOTE",
      contractType: "VoteWitnessContract",
    });
  });

  it("should include operations for failed transactions so downstream can see transfer details", async () => {
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

    const result = await getBlock(mockConfig, 100);

    expect(result.transactions[0].failed).toBe(true);
    expect(result.transactions[0].fees).toBe(BigInt(5000));
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
  });

  it("should handle blocks with no transactions", async () => {
    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
    });

    const result = await getBlock(mockConfig, 100);

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

    const result = await getBlock(mockConfig, 100);

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

    const result = await getBlock(mockConfig, 100);

    expect(mockGetTransactionInfoByBlockNum).toHaveBeenCalledWith(mockConfig, 100);
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

    const result = await getBlock(mockConfig, 100);

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

    const result = await getBlock(mockConfig, 100);

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

    const result = await getBlock(mockConfig, 100);

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

    const result = await getBlock(mockConfig, 100);

    expect(result.info.height).toBe(100);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].fees).toBe(BigInt(4000));
  });
});
