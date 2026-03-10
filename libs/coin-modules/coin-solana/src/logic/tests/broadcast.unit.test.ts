import type { BlockhashWithExpiryBlockHeight } from "@solana/web3.js";
import { SolanaTxConfirmationTimeout, SolanaTxSimulationFailedWhilePendingOp } from "../../errors";
import type { ChainAPI } from "../../network";
import { broadcast } from "../broadcast";

describe("broadcast", () => {
  const mockSendRawTransaction = jest.fn();
  const api = {
    sendRawTransaction: mockSendRawTransaction,
  } as unknown as ChainAPI;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should decode base64 and send raw transaction", async () => {
    const txSignature = "5xSig123abc";
    mockSendRawTransaction.mockResolvedValue(txSignature);

    const dummyTxBase64 = Buffer.from("dummy-tx").toString("base64");
    const result = await broadcast(api, dummyTxBase64);

    expect(result).toBe(txSignature);
    expect(mockSendRawTransaction).toHaveBeenCalledWith(
      Buffer.from(dummyTxBase64, "base64"),
      undefined,
    );
  });

  it("should forward recentBlockhash when provided", async () => {
    const txSignature = "5xSig123abc";
    mockSendRawTransaction.mockResolvedValue(txSignature);
    const recentBlockhash: BlockhashWithExpiryBlockHeight = {
      blockhash: "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3",
      lastValidBlockHeight: 280064048,
    };

    const dummyTxBase64 = Buffer.from("dummy-tx").toString("base64");
    const result = await broadcast(api, dummyTxBase64, { recentBlockhash });

    expect(result).toBe(txSignature);
    expect(mockSendRawTransaction).toHaveBeenCalledWith(
      Buffer.from(dummyTxBase64, "base64"),
      recentBlockhash,
    );
  });

  it("should throw SolanaTxConfirmationTimeout on confirmation timeout", async () => {
    mockSendRawTransaction.mockRejectedValue(
      new Error("TransactionExpiredBlockheightExceededError: was not confirmed in 60.00 seconds"),
    );

    const dummyTxBase64 = Buffer.from("dummy-tx").toString("base64");
    await expect(broadcast(api, dummyTxBase64)).rejects.toThrow(SolanaTxConfirmationTimeout);
  });

  it("should throw SolanaTxSimulationFailedWhilePendingOp when simulation fails with pending ops", async () => {
    mockSendRawTransaction.mockRejectedValue(
      new Error("Transaction simulation failed: insufficient funds"),
    );

    const dummyTxBase64 = Buffer.from("dummy-tx").toString("base64");
    await expect(broadcast(api, dummyTxBase64, { hasPendingOperations: true })).rejects.toThrow(
      SolanaTxSimulationFailedWhilePendingOp,
    );
  });

  it("should propagate simulation failure when no pending operations", async () => {
    mockSendRawTransaction.mockRejectedValue(
      new Error("Transaction simulation failed: insufficient funds"),
    );

    const dummyTxBase64 = Buffer.from("dummy-tx").toString("base64");
    await expect(broadcast(api, dummyTxBase64, { hasPendingOperations: false })).rejects.toThrow(
      "Transaction simulation failed",
    );
  });

  it("should propagate non-timeout errors from sendRawTransaction", async () => {
    mockSendRawTransaction.mockRejectedValue(new Error("Network error"));

    const dummyTxBase64 = Buffer.from("dummy-tx").toString("base64");
    await expect(broadcast(api, dummyTxBase64)).rejects.toThrow("Network error");
  });

  it("should propagate non-Error throwables", async () => {
    mockSendRawTransaction.mockRejectedValue("string error");

    const dummyTxBase64 = Buffer.from("dummy-tx").toString("base64");
    await expect(broadcast(api, dummyTxBase64)).rejects.toBe("string error");
  });

  it("should handle empty string input and return signature", async () => {
    mockSendRawTransaction.mockResolvedValue("sig");

    const result = await broadcast(api, "");

    expect(result).toBe("sig");
  });
});
