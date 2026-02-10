/**
 * Unit tests for broadcast function.
 * Tests transaction broadcasting logic (Story 4.6).
 */
import { broadcast } from "./broadcast";
import MultiversXApiClient from "../api/apiCalls";

describe("broadcast", () => {
  let mockApiClient: jest.Mocked<MultiversXApiClient>;

  beforeEach(() => {
    mockApiClient = {
      submit: jest.fn(),
    } as unknown as jest.Mocked<MultiversXApiClient>;
  });

  const VALID_SIGNED_TX = JSON.stringify({
    nonce: 42,
    value: "1000000000000000000",
    receiver: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
    sender: "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th",
    gasPrice: 1000000000,
    gasLimit: 50000,
    chainID: "1",
    version: 1,
    options: 1,
    signature:
      "abc123def4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  });

  it("broadcasts valid signed transaction successfully", async () => {
    const expectedHash = "tx_hash_12345";
    mockApiClient.submit.mockResolvedValue(expectedHash);

    const result = await broadcast(VALID_SIGNED_TX, mockApiClient);

    expect(result).toBe(expectedHash);
    expect(mockApiClient.submit).toHaveBeenCalledWith({
      signature: expect.any(String),
      rawData: expect.objectContaining({
        nonce: 42,
        value: "1000000000000000000",
      }),
    });
  });

  it("returns transaction hash as string", async () => {
    const expectedHash = "tx_hash_12345";
    mockApiClient.submit.mockResolvedValue(expectedHash);

    const result = await broadcast(VALID_SIGNED_TX, mockApiClient);

    expect(typeof result).toBe("string");
    expect(result).toBe(expectedHash);
  });

  it("handles malformed JSON input", async () => {
    await expect(broadcast("invalid json", mockApiClient)).rejects.toThrow(
      "Invalid signed transaction: malformed JSON",
    );
  });

  it("handles missing signature", async () => {
    const txWithoutSignature = JSON.stringify({
      ...JSON.parse(VALID_SIGNED_TX),
      signature: undefined,
    });

    await expect(broadcast(txWithoutSignature, mockApiClient)).rejects.toThrow(
      "Invalid signed transaction: missing or empty signature",
    );
  });

  it("handles empty string signature", async () => {
    const txWithEmptySignature = JSON.stringify({
      ...JSON.parse(VALID_SIGNED_TX),
      signature: "",
    });

    await expect(broadcast(txWithEmptySignature, mockApiClient)).rejects.toThrow(
      "Invalid signed transaction: missing or empty signature",
    );
  });

  it("handles whitespace-only signature", async () => {
    const txWithWhitespaceSignature = JSON.stringify({
      ...JSON.parse(VALID_SIGNED_TX),
      signature: "   ",
    });

    await expect(broadcast(txWithWhitespaceSignature, mockApiClient)).rejects.toThrow(
      "Invalid signed transaction: missing or empty signature",
    );
  });

  it("handles invalid sender address format", async () => {
    const txWithInvalidSender = JSON.stringify({
      ...JSON.parse(VALID_SIGNED_TX),
      sender: "invalid_address",
    });

    await expect(broadcast(txWithInvalidSender, mockApiClient)).rejects.toThrow(
      "Invalid signed transaction: invalid sender address format",
    );
  });

  it("handles invalid receiver address format", async () => {
    const txWithInvalidReceiver = JSON.stringify({
      ...JSON.parse(VALID_SIGNED_TX),
      receiver: "invalid_address",
    });

    await expect(broadcast(txWithInvalidReceiver, mockApiClient)).rejects.toThrow(
      "Invalid signed transaction: invalid receiver address format",
    );
  });

  it("handles negative nonce", async () => {
    const txWithNegativeNonce = JSON.stringify({
      ...JSON.parse(VALID_SIGNED_TX),
      nonce: -1,
    });

    await expect(broadcast(txWithNegativeNonce, mockApiClient)).rejects.toThrow(
      "Invalid signed transaction: nonce must be a non-negative number",
    );
  });

  it("handles negative gasPrice", async () => {
    const txWithNegativeGasPrice = JSON.stringify({
      ...JSON.parse(VALID_SIGNED_TX),
      gasPrice: -1000,
    });

    await expect(broadcast(txWithNegativeGasPrice, mockApiClient)).rejects.toThrow(
      "Invalid signed transaction: gasPrice must be a positive number",
    );
  });

  it("handles zero gasPrice", async () => {
    const txWithZeroGasPrice = JSON.stringify({
      ...JSON.parse(VALID_SIGNED_TX),
      gasPrice: 0,
    });

    await expect(broadcast(txWithZeroGasPrice, mockApiClient)).rejects.toThrow(
      "Invalid signed transaction: gasPrice must be a positive number",
    );
  });

  it("handles gasLimit below minimum", async () => {
    const txWithLowGasLimit = JSON.stringify({
      ...JSON.parse(VALID_SIGNED_TX),
      gasLimit: 10000, // Below MIN_GAS_LIMIT (50000)
    });

    await expect(broadcast(txWithLowGasLimit, mockApiClient)).rejects.toThrow(
      "Invalid signed transaction: gasLimit must be at least",
    );
  });

  it("handles invalid value format (non-numeric string)", async () => {
    const txWithInvalidValue = JSON.stringify({
      ...JSON.parse(VALID_SIGNED_TX),
      value: "not_a_number",
    });

    await expect(broadcast(txWithInvalidValue, mockApiClient)).rejects.toThrow(
      "Invalid signed transaction: value must be a valid numeric string",
    );
  });

  it("handles empty value string", async () => {
    const txWithEmptyValue = JSON.stringify({
      ...JSON.parse(VALID_SIGNED_TX),
      value: "",
    });

    await expect(broadcast(txWithEmptyValue, mockApiClient)).rejects.toThrow(
      "Invalid signed transaction: value must be a non-empty string",
    );
  });

  it("handles invalid chainID format (empty string)", async () => {
    const txWithEmptyChainID = JSON.stringify({
      ...JSON.parse(VALID_SIGNED_TX),
      chainID: "",
    });

    // Empty chainID is caught by the required fields check first (falsy value)
    await expect(broadcast(txWithEmptyChainID, mockApiClient)).rejects.toThrow(
      "Invalid signed transaction: missing required fields",
    );
  });

  it("handles whitespace-only chainID", async () => {
    const txWithWhitespaceChainID = JSON.stringify({
      ...JSON.parse(VALID_SIGNED_TX),
      chainID: "   ",
    });

    await expect(broadcast(txWithWhitespaceChainID, mockApiClient)).rejects.toThrow(
      "Invalid signed transaction: chainID must be a non-empty string",
    );
  });

  it("handles network errors with descriptive messages", async () => {
    const networkError = new Error("Network timeout");
    mockApiClient.submit.mockRejectedValue(networkError);

    await expect(broadcast(VALID_SIGNED_TX, mockApiClient)).rejects.toThrow(
      "Transaction broadcast failed: Network timeout",
    );
  });

  it("preserves original error context when network fails", async () => {
    const originalError = new Error("Network timeout");
    originalError.stack = "Error: Network timeout\n    at network.js:123";
    mockApiClient.submit.mockRejectedValue(originalError);

    try {
      await broadcast(VALID_SIGNED_TX, mockApiClient);
      fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain("Transaction broadcast failed: Network timeout");
      expect((error as Error).cause).toBe(originalError);
      expect((error as Error).stack).toBeDefined();
    }
  });

  it("handles non-Error exception with generic message", async () => {
    // When the network layer throws something that's not an Error instance
    mockApiClient.submit.mockRejectedValue("simple string error");

    await expect(broadcast(VALID_SIGNED_TX, mockApiClient)).rejects.toThrow(
      "Transaction broadcast failed: unknown error",
    );
  });

  it("handles null exception with generic message", async () => {
    mockApiClient.submit.mockRejectedValue(null);

    await expect(broadcast(VALID_SIGNED_TX, mockApiClient)).rejects.toThrow(
      "Transaction broadcast failed: unknown error",
    );
  });

  it("converts transaction format correctly for network layer", async () => {
    const expectedHash = "tx_hash_12345";
    mockApiClient.submit.mockResolvedValue(expectedHash);

    await broadcast(VALID_SIGNED_TX, mockApiClient);

    expect(mockApiClient.submit).toHaveBeenCalledWith({
      signature: expect.stringContaining("abc123"),
      rawData: expect.objectContaining({
        nonce: 42,
        value: "1000000000000000000",
        receiver: expect.any(String),
        sender: expect.any(String),
        gasPrice: 1000000000,
        gasLimit: 50000,
        chainID: "1",
        version: 1,
        options: 1,
      }),
    });
    expect(mockApiClient.submit.mock.calls[0][0].rawData).not.toHaveProperty("signature");
  });

  it("handles transaction with optional data field", async () => {
    const txWithData = JSON.stringify({
      ...JSON.parse(VALID_SIGNED_TX),
      data: "dGVzdA==", // base64 encoded "test"
    });

    const expectedHash = "tx_hash_12345";
    mockApiClient.submit.mockResolvedValue(expectedHash);

    const result = await broadcast(txWithData, mockApiClient);

    expect(result).toBe(expectedHash);
    expect(mockApiClient.submit).toHaveBeenCalledWith(
      expect.objectContaining({
        rawData: expect.objectContaining({
          data: "dGVzdA==",
        }),
      }),
    );
  });

  it("handles missing required transaction fields", async () => {
    const txMissingFields = JSON.stringify({
      signature: "abc123",
      // Missing nonce, sender, receiver, etc.
    });

    await expect(broadcast(txMissingFields, mockApiClient)).rejects.toThrow(
      "Invalid signed transaction: missing required fields",
    );
  });
});
