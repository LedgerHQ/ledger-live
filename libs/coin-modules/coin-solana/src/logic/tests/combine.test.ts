import { PublicKey, VersionedTransaction, TransactionMessage } from "@solana/web3.js";
import { combine } from "../combine";

const TEST_ADDRESS = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const TEST_BLOCKHASH = "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3";

function makeSerializedTx(payerKey: string = TEST_ADDRESS): string {
  const message = new TransactionMessage({
    payerKey: new PublicKey(payerKey),
    recentBlockhash: TEST_BLOCKHASH,
    instructions: [],
  });
  const tx = new VersionedTransaction(message.compileToLegacyMessage());
  return Buffer.from(tx.serialize()).toString("base64");
}

describe("combine", () => {
  it("should inject signature with explicit pubkey", () => {
    const txBase64 = makeSerializedTx();
    const signature = Buffer.alloc(64, 1).toString("hex");

    const result = combine(txBase64, signature, TEST_ADDRESS);

    expect(typeof result).toBe("string");
    const deserialized = VersionedTransaction.deserialize(Buffer.from(result, "base64"));
    expect(deserialized.signatures).toHaveLength(1);
    expect(Buffer.from(deserialized.signatures[0]).toString("hex")).toBe(signature);
  });

  it("should inject signature using first account key when pubkey not provided", () => {
    const txBase64 = makeSerializedTx();
    const signature = Buffer.alloc(64, 2).toString("hex");

    const result = combine(txBase64, signature);

    const deserialized = VersionedTransaction.deserialize(Buffer.from(result, "base64"));
    expect(deserialized.signatures).toHaveLength(1);
    expect(Buffer.from(deserialized.signatures[0]).toString("hex")).toBe(signature);
  });

  it("should throw for transaction with no account keys", () => {
    const txBase64 = makeSerializedTx();
    const signature = Buffer.alloc(64, 1).toString("hex");

    const origDeserialize = VersionedTransaction.deserialize;
    jest.spyOn(VersionedTransaction, "deserialize").mockImplementationOnce((...args) => {
      const tx = origDeserialize(...args);
      Object.defineProperty(tx.message, "staticAccountKeys", {
        get: () => [],
        configurable: true,
      });
      return tx;
    });

    expect(() => combine(txBase64, signature)).toThrow("Transaction has no account keys");
  });

  it("should throw for signature with wrong length", () => {
    const txBase64 = makeSerializedTx();
    const shortSignature = Buffer.alloc(32, 1).toString("hex");

    expect(() => combine(txBase64, shortSignature)).toThrow("Invalid signature length");
  });

  it("should produce a valid re-serializable transaction", () => {
    const txBase64 = makeSerializedTx();
    const signature = Buffer.alloc(64, 0xab).toString("hex");

    const result = combine(txBase64, signature, TEST_ADDRESS);

    const roundTrip = VersionedTransaction.deserialize(Buffer.from(result, "base64"));
    expect(roundTrip.signatures).toHaveLength(1);
    const reEncoded = Buffer.from(roundTrip.serialize()).toString("base64");
    expect(reEncoded).toBe(result);
  });
});
