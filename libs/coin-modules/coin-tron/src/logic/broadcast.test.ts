import { broadcastTron } from "../network";
import { broadcast } from "./broadcast";
import { decodeTransaction } from "./utils";

jest.mock("../network", () => ({
  broadcastTron: jest.fn(),
}));

jest.mock("./utils", () => ({
  decodeTransaction: jest.fn(),
}));

const mockDecodeTransaction = decodeTransaction as jest.Mock;
const mockBroadcastTron = broadcastTron as jest.Mock;

describe("broadcast function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should broadcast a transaction string successfully", async () => {
    mockDecodeTransaction.mockResolvedValue({
      txID: "mockedTxID",
      raw_data: { some: "data" },
      raw_data_hex: "abcd1234",
    });

    mockBroadcastTron.mockResolvedValue("mockedTxID");

    const result = await broadcast("0008abcd1234mocksignature");

    expect(mockDecodeTransaction).toHaveBeenCalledWith("abcd1234");
    expect(mockBroadcastTron).toHaveBeenCalledWith({
      txID: "mockedTxID",
      raw_data: { some: "data" },
      raw_data_hex: "abcd1234",
      signature: ["mocksignature"],
    });
    expect(result).toBe("mockedTxID");
  });

  it("should broadcast a TxObject successfully", async () => {
    const txObject = {
      txID: "mockedTxID",
      raw_data: { some: "data" },
      signature: ["mocksignature"],
    };

    mockBroadcastTron.mockResolvedValue("mockedTxID");

    const result = await broadcast(txObject);

    expect(mockDecodeTransaction).not.toHaveBeenCalled();
    expect(mockBroadcastTron).toHaveBeenCalledWith(txObject);
    expect(result).toBe("mockedTxID");
  });

  it("should throw an error if decodeTransaction fails", async () => {
    mockDecodeTransaction.mockRejectedValue(new Error("Decoding failed"));

    await expect(broadcast("0008abcd1234mocksignature")).rejects.toThrow("Decoding failed");
  });

  it("should throw an error if broadcastTron fails", async () => {
    mockDecodeTransaction.mockResolvedValue({
      txID: "mockedTxID",
      raw_data: { some: "data" },
      raw_data_hex: "abcd1234",
    });

    mockBroadcastTron.mockRejectedValue(new Error("Broadcasting failed"));

    await expect(broadcast("0008abcd1234mocksignature")).rejects.toThrow("Broadcasting failed");
  });

  it("should handle invalid transaction format gracefully", async () => {
    await expect(broadcast("invalidtransaction")).rejects.toThrow();
  });
});
