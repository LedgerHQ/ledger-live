import { getBlock } from "./getBlock";
import { getBlockInfo } from "./getBlockInfo";
import { apiClient } from "../network/api";
import { getTimestampRangeFromBlockHeight } from "./utils";

jest.mock("./getBlockInfo");
jest.mock("../network/api");
jest.mock("./utils");

describe("getBlock", () => {
  const mockBlockInfo = {
    height: 100,
    hash: "mock_hash",
    time: new Date("2024-01-01T00:00:00Z"),
  };

  const mockTimestampRange = {
    start: "1704067200.000000000",
    end: "1704067260.000000000",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getBlockInfo as jest.Mock).mockResolvedValue(mockBlockInfo);
    (getTimestampRangeFromBlockHeight as jest.Mock).mockReturnValue(mockTimestampRange);
  });

  it("should return empty block when no transactions exist", async () => {
    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([]);

    const result = await getBlock(100);

    expect(result).toEqual({
      info: mockBlockInfo,
      transactions: [],
    });
  });

  it("should call dependencies with correct parameters", async () => {
    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([]);

    await getBlock(42);

    expect(getTimestampRangeFromBlockHeight).toHaveBeenCalledWith(42);
    expect(getBlockInfo).toHaveBeenCalledWith(42);
    expect(apiClient.getTransactionsByTimestampRange).toHaveBeenCalledTimes(1);
    expect(apiClient.getTransactionsByTimestampRange).toHaveBeenCalledWith(
      mockTimestampRange.start,
      mockTimestampRange.end,
    );
  });

  it("should extract fee payer from transaction_id", async () => {
    const mockTx = {
      transaction_id: "0.0.999-1234567890-000000000",
      transaction_hash: "hash",
      name: "CRYPTOTRANSFER",
      result: "SUCCESS",
      charged_tx_fee: 100000,
      transfers: [],
      token_transfers: [],
    };

    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([mockTx]);

    const result = await getBlock(100);

    expect(result.transactions[0].feesPayer).toBe("0.0.999");
  });

  it("should exclude fee from payer's operation amount", async () => {
    const mockTx = {
      transaction_id: "0.0.999-1234567890-000000000",
      transaction_hash: "hash",
      name: "CRYPTOTRANSFER",
      result: "SUCCESS",
      charged_tx_fee: 67179,
      transfers: [
        {
          account: "0.0.999",
          amount: -567179,
        },
        {
          account: "0.0.1001",
          amount: 500000,
        },
      ],
      token_transfers: [],
    };

    (apiClient.getTransactionsByTimestampRange as jest.Mock).mockResolvedValue([mockTx]);

    const result = await getBlock(100);
    const senderOperation = result.transactions[0].operations.find(op => op.address === "0.0.999");

    expect(senderOperation).toMatchObject({
      address: "0.0.999",
      amount: BigInt(-567179 + 67179),
    });
  });
});
