import * as network from "../network";
import { broadcast } from "./broadcast";

jest.mock("../network");

const mockBroadcastTransaction = network.broadcastTransaction as jest.MockedFunction<
  typeof network.broadcastTransaction
>;

describe("broadcast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should broadcast a signed transaction and return the transaction ID", async () => {
    const signedTx = "abcdef123456";
    const expectedTxId = "TX_HASH_123";
    mockBroadcastTransaction.mockResolvedValue(expectedTxId);

    const result = await broadcast(signedTx);

    expect(result).toBe(expectedTxId);
    expect(mockBroadcastTransaction).toHaveBeenCalledTimes(1);
    expect(mockBroadcastTransaction).toHaveBeenCalledWith(Buffer.from(signedTx, "hex"));
  });

  it("should convert hex string to buffer before broadcasting", async () => {
    const signedTx = "48656c6c6f"; // "Hello" in hex
    mockBroadcastTransaction.mockResolvedValue("TX_ID");

    await broadcast(signedTx);

    const expectedBuffer = Buffer.from(signedTx, "hex");
    expect(mockBroadcastTransaction).toHaveBeenCalledWith(expectedBuffer);
  });

  it("should propagate network errors", async () => {
    const signedTx = "abcdef";
    const networkError = new Error("Network error");
    mockBroadcastTransaction.mockRejectedValue(networkError);

    await expect(broadcast(signedTx)).rejects.toThrow("Network error");
  });
});
