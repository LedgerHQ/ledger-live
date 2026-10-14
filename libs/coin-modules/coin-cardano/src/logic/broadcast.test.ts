import { cardanoCoinConfig as config } from "../fixtures/config";
import { submitTransaction } from "../api/submitTransaction";
import { broadcast } from "./broadcast";

jest.mock("../api/submitTransaction", () => ({
  submitTransaction: jest.fn(),
}));

const mockSubmitTransaction = jest.mocked(submitTransaction);

describe("broadcast function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should submit the signed transaction and return its hash", async () => {
    mockSubmitTransaction.mockResolvedValue({ hash: "mockedHash" });

    const result = await broadcast(config, { signature: "signedTxPayload" });

    expect(mockSubmitTransaction).toHaveBeenCalledWith({
      transaction: "signedTxPayload",
      config,
    });
    expect(result).toBe("mockedHash");
  });

  it("ignores broadcastConfig and submits only the signature and config", async () => {
    mockSubmitTransaction.mockResolvedValue({ hash: "mockedHash" });

    await broadcast(config, {
      signature: "signedTxPayload",
      broadcastConfig: { mevProtected: true },
    });

    expect(mockSubmitTransaction).toHaveBeenCalledTimes(1);
    expect(mockSubmitTransaction).toHaveBeenCalledWith({
      transaction: "signedTxPayload",
      config,
    });
  });

  it("should throw an error if submitTransaction fails", async () => {
    mockSubmitTransaction.mockRejectedValue(new Error("tx submission failed"));

    await expect(broadcast(config, { signature: "signedTxPayload" })).rejects.toThrow(
      "tx submission failed",
    );
  });

  it("throws a clear error when a 2xx response is missing the transaction hash", async () => {
    mockSubmitTransaction.mockResolvedValue({} as { hash: string });

    await expect(broadcast(config, { signature: "signedTxPayload" })).rejects.toThrow(
      "missing the transaction hash",
    );
  });
});
