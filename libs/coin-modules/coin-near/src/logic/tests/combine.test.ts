import * as nearAPI from "near-api-js";
import { combine } from "../combine";

const SENDER = "sender.near";
const RECIPIENT = "recipient.near";
const PUBLIC_KEY = "ed25519:HYgHRZBqhvhV4RLsBTz2CoM3JMVYFHDs1QLLZfDdWfPn";
const BLOCK_HASH = "6ykMPuAsmyPvVMSLKvfg7DBUZP9tYcgKNzVLrLxSnLpj";
const SIGNATURE = "ab".repeat(64);

const unsigned = (publicKey = PUBLIC_KEY): string => {
  const transaction = nearAPI.createTransaction(
    SENDER,
    nearAPI.PublicKey.fromString(publicKey),
    RECIPIENT,
    42,
    [nearAPI.actions.transfer(1000000000000000000000000n)],
    nearAPI.baseDecode(BLOCK_HASH),
  );

  return Buffer.from(transaction.encode()).toString("base64");
};

describe("combine", () => {
  it("returns a signed transaction wrapping the crafted one unchanged", () => {
    const tx = unsigned();
    const crafted = nearAPI.Transaction.decode(Buffer.from(tx, "base64"));

    const signed = nearAPI.SignedTransaction.decode(
      Buffer.from(combine(tx, [SIGNATURE]), "base64"),
    );

    expect(signed.transaction.signerId).toBe(SENDER);
    expect(signed.transaction.receiverId).toBe(RECIPIENT);
    expect(signed.transaction.nonce.toString()).toBe(crafted.nonce.toString());
    expect(Buffer.from(signed.transaction.blockHash).toString("hex")).toBe(
      Buffer.from(crafted.blockHash).toString("hex"),
    );
  });

  it("carries the signature bytes through", () => {
    const signed = nearAPI.SignedTransaction.decode(
      Buffer.from(combine(unsigned(), [SIGNATURE]), "base64"),
    );

    // Borsh decoding yields the raw enum variant, not a `Signature` instance.
    expect(Buffer.from(signed.signature.ed25519Signature!.data).toString("hex")).toBe(SIGNATURE);
  });

  it.each([
    ["ed25519", PUBLIC_KEY, SIGNATURE, "ed25519Signature"],
    [
      "secp256k1",
      nearAPI.KeyPair.fromRandom("secp256k1").getPublicKey().toString(),
      "ab".repeat(65),
      "secp256k1Signature",
    ],
  ])(
    "takes the key type from the transaction's own %s public key",
    (_curve, publicKey, signature, variant) => {
      const signed = nearAPI.SignedTransaction.decode(
        Buffer.from(combine(unsigned(publicKey), [signature]), "base64"),
      );

      expect(Object.keys(signed.signature)).toEqual([variant]);
    },
  );

  it("throws on a payload that is not a crafted transaction", () => {
    expect(() => combine("bm90LWEtdHJhbnNhY3Rpb24=", [SIGNATURE])).toThrow(
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
      expect(() => combine(unsigned(), [signature])).toThrow("signature is not valid hex");
    });

    it("rejects an empty signature", () => {
      expect(() => combine(unsigned(), [""])).toThrow("signature is empty");
    });

    it("accepts a well-formed 64-byte signature", () => {
      expect(() => combine(unsigned(), ["ab".repeat(64)])).not.toThrow();
    });

    it("lets Borsh reject a well-formed signature of the wrong length", () => {
      // The NEAR schema pins the signature at 64 bytes, so a longer one cannot be encoded.
      expect(() => combine(unsigned(), ["ab".repeat(65)])).toThrow(
        "does not match schema length 64",
      );
    });
  });
});
