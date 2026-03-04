import { getBlock as networkGetBlock, getBlockWithTransactions } from "../network";
import { getBlock, getBlockInfo } from "./getBlock";

jest.mock("../network");

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

  it("should return block with transactions", async () => {
    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: {
        raw_data: {
          number: 100,
          timestamp: 1700000000000,
          parentHash: "parenthash",
        },
      },
      transactions: [
        {
          txID: "tx1",
          raw_data: {
            contract: [
              {
                type: "TransferContract",
                parameter: { value: { owner_address: "41abcd" } },
              },
            ],
          },
          ret: [{ contractRet: "SUCCESS", fee: 1000 }],
        },
      ],
    });

    const result = await getBlock(100);

    expect(result.info).toEqual({
      height: 100,
      hash: "blockhash",
      time: new Date(1700000000000),
      parent: { height: 99, hash: "parenthash" },
    });
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].hash).toBe("tx1");
    expect(result.transactions[0].failed).toBe(false);
    expect(result.transactions[0].fees).toBe(BigInt(1000));
  });

  it("should handle failed transactions", async () => {
    (getBlockWithTransactions as jest.Mock).mockResolvedValue({
      blockID: "blockhash",
      block_header: { raw_data: { number: 100, timestamp: 1700000000000 } },
      transactions: [
        {
          txID: "tx1",
          raw_data: { contract: [{ type: "TransferContract", parameter: { value: {} } }] },
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
