import * as nearAPI from "near-api-js";
import { combine } from "./combine";

const SENDER = "sender.near";
const RECIPIENT = "recipient.near";
const PUBLIC_KEY = "ed25519:HYgHRZBqhvhV4RLsBTz2CoM3JMVYFHDs1QLLZfDdWfPn";
const BLOCK_HASH = "6ykMPuAsmyPvVMSLKvfg7DBUZP9tYcgKNzVLrLxSnLpj";
const SIGNATURE = "ab".repeat(64);

const unsigned = (): string => {
  const transaction = nearAPI.transactions.createTransaction(
    SENDER,
    nearAPI.utils.PublicKey.fromString(PUBLIC_KEY),
    RECIPIENT,
    42,
    [nearAPI.transactions.transfer("1000000000000000000000000")],
    nearAPI.utils.serialize.base_decode(BLOCK_HASH),
  );

  return Buffer.from(transaction.encode()).toString("base64");
};

describe("combine", () => {
  it("returns a signed transaction wrapping the crafted one unchanged", () => {
    const tx = unsigned();
    const crafted = nearAPI.transactions.Transaction.decode(Buffer.from(tx, "base64"));

    const signed = nearAPI.transactions.SignedTransaction.decode(
      Buffer.from(combine(tx, SIGNATURE), "base64"),
    );

    expect(signed.transaction.signerId).toBe(SENDER);
    expect(signed.transaction.receiverId).toBe(RECIPIENT);
    expect(signed.transaction.nonce.toString()).toBe(crafted.nonce.toString());
    expect(Buffer.from(signed.transaction.blockHash).toString("hex")).toBe(
      Buffer.from(crafted.blockHash).toString("hex"),
    );
  });

  it("carries the signature bytes through", () => {
    const signed = nearAPI.transactions.SignedTransaction.decode(
      Buffer.from(combine(unsigned(), SIGNATURE), "base64"),
    );

    expect(Buffer.from(signed.signature.data).toString("hex")).toBe(SIGNATURE);
  });

  it("takes the key type from the transaction's own public key", () => {
    const tx = unsigned();
    const expected = nearAPI.transactions.Transaction.decode(Buffer.from(tx, "base64")).publicKey
      .keyType;

    const signed = nearAPI.transactions.SignedTransaction.decode(
      Buffer.from(combine(tx, SIGNATURE), "base64"),
    );

    expect(signed.signature.keyType).toBe(expected);
  });

  it("throws on a payload that is not a crafted transaction", () => {
    expect(() => combine("bm90LWEtdHJhbnNhY3Rpb24=", SIGNATURE)).toThrow(
      "the buffer is smaller than expected",
    );
  });

  describe("malformed signatures", () => {
    // Buffer.from(value, "hex") stops at the first invalid character and drops a trailing
    // half-byte, so without a guard these would be attached silently at the wrong length.
    it.each([
      ["a non-hex character", `zz${"ab".repeat(63)}`],
      ["an odd number of characters", "abc"],
    ])("rejects %s", (_label, signature) => {
      expect(() => combine(unsigned(), signature)).toThrow("signature is not valid hex");
    });

    it("rejects an empty signature", () => {
      expect(() => combine(unsigned(), "")).toThrow("signature is empty");
    });

    it("accepts a well-formed 64-byte signature", () => {
      expect(() => combine(unsigned(), "ab".repeat(64))).not.toThrow();
    });

    it("lets Borsh reject a well-formed signature of the wrong length", () => {
      // The NEAR schema pins the signature at 64 bytes, so a longer one cannot be encoded.
      expect(() => combine(unsigned(), "ab".repeat(65))).toThrow("does not match schema length 64");
    });
  });
});
