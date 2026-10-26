import { MAX_ERROR_MESSAGE_LENGTH, sanitizeErrorMessage } from "./errorMessage";

describe("sanitizeErrorMessage", () => {
  it.each([
    "utxos already spent",
    "Ledger sequence too high.",
    "Insufficient funds for rent",
    "Blockhash not found",
    "Broadcast failed due to DUP_TRANSACTION_ERROR",
    "ERR_INSUFFICIENT_FUNDS_FOR_GAS_AND_VALUE: tx rejected",
    "Network Error",
  ])("keeps a message made of words and error codes: %s", message => {
    expect(sanitizeErrorMessage(message)).toBe(message);
  });

  it.each([
    // Named and numeric accounts, which a length-based redaction misses.
    ["Near: no access key found for alice.near", "Near: no access key found for [id]"],
    ["hedera: evm address is missing for 0.0.1234", "hedera: evm address is missing for [id]"],
    ["transfer to vitalik.eth failed", "transfer to [id] failed"],
    ["stake for f01234 rejected", "stake for [id] rejected"],
    // Short and long addresses of every encoding.
    ["no balance for rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY", "no balance for [id]"],
    ["utxos for 1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2 spent", "utxos for [id] spent"],
    [
      "insufficient funds for 0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      "insufficient funds for [id]",
    ],
    ["account 7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV not found", "account [id] not found"],
    ["to cosmos1qyqszqgpqyqszqgpqyqszqgpqyqszqgp8apuk3", "to [id]"],
    // Transactions, hashes, amounts, URLs and emails.
    [`rejected 0x02f8b1${"ab".repeat(120)}: nonce too low`, "rejected [id]: nonce too low"],
    ["timeout of 30000ms exceeded", "timeout of [id] exceeded"],
    ["txn-mempool-conflict (-26) (102)", "txn-mempool-conflict ([n]) ([n])"],
    ["request to https://node.example.com/v1/tx failed", "request to [id] failed"],
    ["contact user@example.com", "contact [id]"],
    ["payload AQABAgMEBQYHCAkKCwwNDg8QERITFBUWFxgZGhscHR4fICEi rejected", "payload [id] rejected"],
  ])("replaces identifiers by their shape: %s", (message, expected) => {
    expect(sanitizeErrorMessage(message)).toBe(expected);
  });

  it("gives the same message for the same failure on different accounts", () => {
    expect(sanitizeErrorMessage("Near: no access key found for alice.near")).toBe(
      sanitizeErrorMessage("Near: no access key found for bob.testnet"),
    );
  });

  it("keeps the whitespace and punctuation around words", () => {
    expect(sanitizeErrorMessage("failed:  account (0.0.42),  retry")).toBe(
      "failed:  account ([id]),  retry",
    );
  });

  it("stays fast on a pathological message", () => {
    const message = "a" + "!".repeat(200_000) + "b " + "x(".repeat(50_000);
    const start = Date.now();
    sanitizeErrorMessage(message);
    expect(Date.now() - start).toBeLessThan(100);
  });

  // Known limit, accepted: a value made only of letters cannot be told apart from a word.
  it("keeps an alphabetic value the user typed", () => {
    expect(sanitizeErrorMessage("Near: invalid recipient address alice")).toBe(
      "Near: invalid recipient address alice",
    );
  });

  it("caps a long message", () => {
    const sanitized = sanitizeErrorMessage("node said: " + "too many requests, ".repeat(40));
    expect(sanitized).toHaveLength(MAX_ERROR_MESSAGE_LENGTH + 1);
    expect(sanitized.endsWith("…")).toBe(true);
  });
});
