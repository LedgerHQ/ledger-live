import {
  PublicKey,
  SystemProgram,
  VersionedTransaction,
  TransactionMessage,
} from "@solana/web3.js";
import { combine } from "../combine";

const TEST_ADDRESS = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const TEST_PARTNER = "AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ";
const TEST_BLOCKHASH = "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3";

/** A partner pays the fees (index 0) and TEST_ADDRESS signs second, as in a gasless swap. */
function makeCoSignedTx(): string {
  const message = new TransactionMessage({
    payerKey: new PublicKey(TEST_PARTNER),
    recentBlockhash: TEST_BLOCKHASH,
    instructions: [
      SystemProgram.transfer({
        fromPubkey: new PublicKey(TEST_ADDRESS),
        toPubkey: new PublicKey(TEST_PARTNER),
        lamports: 1,
      }),
    ],
  });
  return Buffer.from(new VersionedTransaction(message.compileToV0Message()).serialize()).toString(
    "base64",
  );
}

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
  it("should inject signature using first account key", () => {
    const txBase64 = makeSerializedTx();
    const signature = Buffer.alloc(64, 2).toString("hex");

    const result = combine(txBase64, [signature]);

    const deserialized = VersionedTransaction.deserialize(Buffer.from(result, "base64"));
    expect(deserialized.signatures).toHaveLength(1);
    expect(Buffer.from(deserialized.signatures[0]).toString("hex")).toBe(signature);
  });

  it("places the signature in the signer's slot when a partner pays the fees", () => {
    const signature = Buffer.alloc(64, 2).toString("hex");

    const result = combine(makeCoSignedTx(), [signature], TEST_ADDRESS);

    const deserialized = VersionedTransaction.deserialize(Buffer.from(result, "base64"));
    expect(deserialized.signatures).toHaveLength(2);
    expect(Buffer.from(deserialized.signatures[1]).toString("hex")).toBe(signature);
    expect(Buffer.from(deserialized.signatures[0]).equals(Buffer.alloc(64))).toBe(true);
  });

  it("places the signature in the signer's slot when the signer pays the fees", () => {
    const signature = Buffer.alloc(64, 2).toString("hex");

    const result = combine(makeSerializedTx(), [signature], TEST_ADDRESS);

    const deserialized = VersionedTransaction.deserialize(Buffer.from(result, "base64"));
    expect(Buffer.from(deserialized.signatures[0]).toString("hex")).toBe(signature);
  });

  it("refuses a signer the transaction does not require", () => {
    const signature = Buffer.alloc(64, 2).toString("hex");

    expect(() =>
      combine(makeCoSignedTx(), [signature], "3Mc6bGBhgRyT5RMa2Cfkp3BD2TXFoaVaKzDrKJLemnaZ"),
    ).toThrow("not required to sign");
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

    expect(() => combine(txBase64, [signature])).toThrow("Transaction has no account keys");
  });

  it("should throw for signature with wrong length", () => {
    const txBase64 = makeSerializedTx();
    const shortSignature = Buffer.alloc(32, 1).toString("hex");

    expect(() => combine(txBase64, [shortSignature])).toThrow("Invalid signature length");
  });

  it("should produce a valid re-serializable transaction", () => {
    const txBase64 = makeSerializedTx();
    const signature = Buffer.alloc(64, 0xab).toString("hex");

    const result = combine(txBase64, [signature]);

    const roundTrip = VersionedTransaction.deserialize(Buffer.from(result, "base64"));
    expect(roundTrip.signatures).toHaveLength(1);
    const reEncoded = Buffer.from(roundTrip.serialize()).toString("base64");
    expect(reEncoded).toBe(result);
  });
});
