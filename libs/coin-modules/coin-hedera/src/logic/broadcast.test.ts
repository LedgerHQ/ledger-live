import { broadcast } from "./broadcast";
import { rpcClient } from "../network/rpc";
import { deserializeTransaction } from "./utils";

jest.mock("../network/rpc");
jest.mock("./utils");

describe("broadcast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should deserialize and broadcast a transaction successfully", async () => {
    const txWithSignature = "serialized-transaction-with-signature";
    const mockDeserializedTx = { someProperty: "mockTransaction" } as any;
    const mockResponse = { transactionId: "mock-transaction-id" } as any;

    (deserializeTransaction as jest.Mock).mockReturnValue(mockDeserializedTx);
    (rpcClient.broadcastTransaction as jest.Mock).mockResolvedValue(mockResponse);

    const result = await broadcast(txWithSignature);

    expect(deserializeTransaction).toHaveBeenCalledTimes(1);
    expect(deserializeTransaction).toHaveBeenCalledWith(txWithSignature);
    expect(rpcClient.broadcastTransaction).toHaveBeenCalledTimes(1);
    expect(rpcClient.broadcastTransaction).toHaveBeenCalledWith(mockDeserializedTx);
    expect(result).toBe(mockResponse);
  });

  it("should propagate errors from deserializeTransaction", async () => {
    const txWithSignature = "serialized-transaction-with-signature";
    const error = new Error("Deserialization error");

    (deserializeTransaction as jest.Mock).mockImplementation(() => {
      throw error;
    });

    await expect(broadcast(txWithSignature)).rejects.toThrow(error);
    expect(deserializeTransaction).toHaveBeenCalledTimes(1);
    expect(deserializeTransaction).toHaveBeenCalledWith(txWithSignature);
    expect(rpcClient.broadcastTransaction).not.toHaveBeenCalled();
  });

  it("should propagate errors from broadcastTransaction", async () => {
    const txWithSignature = "serialized-transaction-with-signature";
    const mockDeserializedTx = { someProperty: "mockTransaction" } as any;
    const error = new Error("Network error");

    (deserializeTransaction as jest.Mock).mockReturnValue(mockDeserializedTx);
    (rpcClient.broadcastTransaction as jest.Mock).mockRejectedValue(error);

    await expect(broadcast(txWithSignature)).rejects.toThrow(error);
    expect(deserializeTransaction).toHaveBeenCalledTimes(1);
    expect(deserializeTransaction).toHaveBeenCalledWith(txWithSignature);
    expect(rpcClient.broadcastTransaction).toHaveBeenCalledTimes(1);
    expect(rpcClient.broadcastTransaction).toHaveBeenCalledWith(mockDeserializedTx);
  });
});
