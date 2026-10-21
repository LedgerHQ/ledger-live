import { MAX_ERROR_MESSAGE_LENGTH, sanitizeErrorMessage } from "./errorMessage";

describe("sanitizeErrorMessage", () => {
  it("keeps an ordinary message as is", () => {
    expect(sanitizeErrorMessage("nonce too low")).toBe("nonce too low");
    expect(sanitizeErrorMessage("timeout of 30000ms exceeded")).toBe("timeout of 30000ms exceeded");
  });

  it("keeps long error codes, which are what a dashboard groups on", () => {
    expect(sanitizeErrorMessage("ERR_INSUFFICIENT_FUNDS_FOR_GAS_AND_VALUE: tx rejected")).toBe(
      "ERR_INSUFFICIENT_FUNDS_FOR_GAS_AND_VALUE: tx rejected",
    );
  });

  it("redacts a raw transaction and a hash, with or without 0x", () => {
    const rawTx = "0x02f8b1" + "ab".repeat(120);
    const hash = "9f".repeat(32);
    expect(sanitizeErrorMessage(`rejected ${rawTx}: nonce too low (tx ${hash})`)).toBe(
      "rejected [hex]: nonce too low (tx [hex])",
    );
  });

  it("redacts an EVM address", () => {
    expect(
      sanitizeErrorMessage("insufficient funds for 0x71C7656EC7ab88b098defB751B7401B5f6d8976F"),
    ).toBe("insufficient funds for [hex]");
  });

  it("redacts base58, base64 and bech32 runs", () => {
    expect(
      sanitizeErrorMessage(
        "account 7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV not found, " +
          "payload AQABAgMEBQYHCAkKCwwNDg8QERITFBUWFxgZGhscHR4f= rejected, " +
          "to cosmos1qyqszqgpqyqszqgpqyqszqgpqyqszqgp8apuk3",
      ),
    ).toBe("account [data] not found, payload [data] rejected, to [data]");
  });

  it("caps a long message", () => {
    const message = "node said: " + "too many requests, ".repeat(40);
    const sanitized = sanitizeErrorMessage(message);
    expect(sanitized).toHaveLength(MAX_ERROR_MESSAGE_LENGTH + 1);
    expect(sanitized.endsWith("…")).toBe(true);
  });
});
