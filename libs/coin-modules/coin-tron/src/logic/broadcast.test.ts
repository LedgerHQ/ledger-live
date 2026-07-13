import { broadcastHexTron, broadcastTron } from "../network";
import { broadcast } from "./broadcast";

jest.mock("../network", () => ({
  broadcastHexTron: jest.fn(),
  broadcastTron: jest.fn(),
}));

const mockBroadcastHexTron = broadcastHexTron as jest.Mock;
const mockBroadcastTron = broadcastTron as jest.Mock;

describe("broadcast function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should broadcast a transaction string as a byte-preserving full transaction hex", async () => {
    mockBroadcastHexTron.mockResolvedValue("mockedTxID");

    // "0008" (hex-string length of raw_data) + raw_data hex "abcd1234" + signature hex "aabbccdd"
    const result = await broadcast("0008abcd1234aabbccdd");

    // Assembled Transaction protobuf: field 1 (raw_data) = 0x0a 0x04 + abcd1234,
    // field 2 (signature) = 0x12 0x04 + aabbccdd.
    expect(mockBroadcastHexTron).toHaveBeenCalledWith("0a04abcd12341204aabbccdd");
    expect(mockBroadcastTron).not.toHaveBeenCalled();
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

    expect(mockBroadcastHexTron).not.toHaveBeenCalled();
    expect(mockBroadcastTron).toHaveBeenCalledWith(txObject);
    expect(result).toBe("mockedTxID");
  });

  it("should throw an error if broadcastHexTron fails", async () => {
    mockBroadcastHexTron.mockRejectedValue(new Error("Broadcasting failed"));

    await expect(broadcast("0008abcd1234aabbccdd")).rejects.toThrow("Broadcasting failed");
  });

  it("should throw on a malformed signed transaction string", async () => {
    // Non-hex prefix, and a truncated payload whose raw_data is shorter than its length prefix.
    await expect(broadcast("zzzz")).rejects.toThrow(/malformed/);
    await expect(broadcast("0008abcd")).rejects.toThrow(/malformed/);
    expect(mockBroadcastHexTron).not.toHaveBeenCalled();
  });
});
