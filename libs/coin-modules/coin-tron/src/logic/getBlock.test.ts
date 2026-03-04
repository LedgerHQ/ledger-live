import { getBlock as getBlockHeader, getBlockWithTransactions } from "../network";
import type { BlockWithTransactionsAPI } from "../network/types";
import { getBlock, getBlockInfo } from "./getBlock";

jest.mock("../network");

describe("getBlockInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty block info for height <= 0", async () => {
    const result = await getBlockInfo(0);

    expect(result).toEqual({
      height: 0,
      hash: "",
      time: new Date(0),
    });
    expect(getBlockHeader).not.toHaveBeenCalled();
  });

  it("should return block info", async () => {
    const mockBlock = {
      height: 50000000,
      hash: "0000000002faf08012345678901234567890123456789012345678901234567",
      time: new Date(1700000000000),
    };

    (getBlockHeader as jest.Mock).mockResolvedValue(mockBlock);

    const result = await getBlockInfo(50000000);

    expect(result).toEqual({
      height: 50000000,
      hash: "0000000002faf08012345678901234567890123456789012345678901234567",
      time: new Date(1700000000000),
    });
    expect(getBlockHeader).toHaveBeenCalledWith(50000000);
  });
});

describe("getBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty block for height <= 0", async () => {
    const result = await getBlock(0);

    expect(result).toEqual({
      info: {
        height: 0,
        hash: "",
        time: new Date(0),
      },
      transactions: [],
    });
    expect(getBlockWithTransactions).not.toHaveBeenCalled();
  });

  it("should return block with TRX transfer transaction", async () => {
    const mockResponse: BlockWithTransactionsAPI = {
      blockID: "0000000002faf08012345678901234567890123456789012345678901234567",
      block_header: {
        raw_data: {
          number: 50000000,
          txTrieRoot: "abc123",
          witness_address: "41abc123",
          parentHash: "0000000002faf07f12345678901234567890123456789012345678901234567",
          timestamp: 1700000000000,
        },
        witness_signature: "sig123",
      },
      transactions: [
        {
          txID: "tx123",
          raw_data: {
            contract: [
              {
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    to_address: "41f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5",
                    amount: 1000000,
                  },
                  type_url: "type.googleapis.com/protocol.TransferContract",
                },
                type: "TransferContract",
              },
            ],
            ref_block_bytes: "1234",
            ref_block_hash: "abcd1234",
            expiration: 1700000060000,
            timestamp: 1700000000000,
          },
          raw_data_hex: "0a0212341234",
          signature: ["sig1"],
          ret: [{ contractRet: "SUCCESS", fee: 100000 }],
        },
      ],
    };

    (getBlockWithTransactions as jest.Mock).mockResolvedValue(mockResponse);

    const result = await getBlock(50000000);

    expect(result.info.height).toBe(50000000);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].hash).toBe("tx123");
    expect(result.transactions[0].failed).toBe(false);
    expect(result.transactions[0].fees).toBe(BigInt(100000));
    expect(result.transactions[0].operations).toHaveLength(2);
    expect(result.transactions[0].operations[0]).toMatchObject({
      type: "transfer",
      asset: { type: "native", name: "TRX" },
      amount: BigInt(-1000000),
    });
    expect(result.transactions[0].operations[1]).toMatchObject({
      type: "transfer",
      asset: { type: "native", name: "TRX" },
      amount: BigInt(1000000),
    });
  });

  it("should mark failed transactions correctly", async () => {
    const mockResponse: BlockWithTransactionsAPI = {
      blockID: "block123",
      block_header: {
        raw_data: {
          number: 100,
          txTrieRoot: "abc",
          witness_address: "41abc",
          parentHash: "block122",
          timestamp: 1700000000000,
        },
        witness_signature: "sig",
      },
      transactions: [
        {
          txID: "failedTx",
          raw_data: {
            contract: [
              {
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    to_address: "41f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5",
                    amount: 1000000,
                  },
                  type_url: "type.googleapis.com/protocol.TransferContract",
                },
                type: "TransferContract",
              },
            ],
            ref_block_bytes: "1234",
            ref_block_hash: "abcd",
            expiration: 1700000060000,
          },
          raw_data_hex: "0a0212341234",
          ret: [{ contractRet: "FAILED" }],
        },
      ],
    };

    (getBlockWithTransactions as jest.Mock).mockResolvedValue(mockResponse);

    const result = await getBlock(100);

    expect(result.transactions[0].failed).toBe(true);
    expect(result.transactions[0].operations).toHaveLength(0);
  });

  it("should handle TRC10 transfer", async () => {
    const mockResponse: BlockWithTransactionsAPI = {
      blockID: "block123",
      block_header: {
        raw_data: {
          number: 100,
          txTrieRoot: "abc",
          witness_address: "41abc",
          parentHash: "block122",
          timestamp: 1700000000000,
        },
        witness_signature: "sig",
      },
      transactions: [
        {
          txID: "trc10Tx",
          raw_data: {
            contract: [
              {
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    to_address: "41f6e5d4c3b2a1f6e5d4c3b2a1f6e5d4c3b2a1f6e5",
                    amount: 500000,
                    asset_name: "1000001",
                  },
                  type_url: "type.googleapis.com/protocol.TransferAssetContract",
                },
                type: "TransferAssetContract",
              },
            ],
            ref_block_bytes: "1234",
            ref_block_hash: "abcd",
            expiration: 1700000060000,
          },
          raw_data_hex: "0a0212341234",
          ret: [{ contractRet: "SUCCESS" }],
        },
      ],
    };

    (getBlockWithTransactions as jest.Mock).mockResolvedValue(mockResponse);

    const result = await getBlock(100);

    expect(result.transactions[0].operations[0]).toMatchObject({
      type: "transfer",
      asset: { type: "trc10", assetReference: "1000001" },
    });
  });

  it("should handle blocks with no transactions", async () => {
    const mockResponse: BlockWithTransactionsAPI = {
      blockID: "block123",
      block_header: {
        raw_data: {
          number: 100,
          txTrieRoot: "abc",
          witness_address: "41abc",
          parentHash: "block122",
          timestamp: 1700000000000,
        },
        witness_signature: "sig",
      },
    };

    (getBlockWithTransactions as jest.Mock).mockResolvedValue(mockResponse);

    const result = await getBlock(100);

    expect(result.transactions).toHaveLength(0);
  });

  it("should handle other contract types as 'other' operations", async () => {
    const mockResponse: BlockWithTransactionsAPI = {
      blockID: "block123",
      block_header: {
        raw_data: {
          number: 100,
          txTrieRoot: "abc",
          witness_address: "41abc",
          parentHash: "block122",
          timestamp: 1700000000000,
        },
        witness_signature: "sig",
      },
      transactions: [
        {
          txID: "voteTx",
          raw_data: {
            contract: [
              {
                parameter: {
                  value: {
                    owner_address: "41a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
                    votes: [{ vote_address: "41voter", vote_count: 100 }],
                  },
                  type_url: "type.googleapis.com/protocol.VoteWitnessContract",
                },
                type: "VoteWitnessContract",
              },
            ],
            ref_block_bytes: "1234",
            ref_block_hash: "abcd",
            expiration: 1700000060000,
          },
          raw_data_hex: "0a0212341234",
          ret: [{ contractRet: "SUCCESS" }],
        },
      ],
    };

    (getBlockWithTransactions as jest.Mock).mockResolvedValue(mockResponse);

    const result = await getBlock(100);

    expect(result.transactions[0].operations[0]).toMatchObject({
      type: "other",
      contractType: "VoteWitnessContract",
    });
  });
});
