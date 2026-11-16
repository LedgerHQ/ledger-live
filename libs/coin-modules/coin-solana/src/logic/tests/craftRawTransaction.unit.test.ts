import {
  PublicKey,
  SystemProgram,
  VersionedTransaction,
  TransactionMessage,
} from "@solana/web3.js";
import { craftRawTransaction } from "../craftRawTransaction";

const TEST_BLOCKHASH = "EEbZs6DmDyDjucyYbo3LwVJU7pQYuVopYcYTSEZXskW3";
const TEST_PAYER = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const TEST_CO_SIGNER = "AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ";

function makeSerializedTx(coSigner?: string): string {
  const message = new TransactionMessage({
    payerKey: new PublicKey(TEST_PAYER),
    recentBlockhash: TEST_BLOCKHASH,
    instructions: coSigner
      ? [
          SystemProgram.transfer({
            fromPubkey: new PublicKey(coSigner),
            toPubkey: new PublicKey(TEST_PAYER),
            lamports: 1,
          }),
        ]
      : [],
  });
  const tx = new VersionedTransaction(message.compileToLegacyMessage());
  return Buffer.from(tx.serialize()).toString("base64");
}

describe("craftRawTransaction", () => {
  it("should return the transaction unchanged with recentBlockhash in details", async () => {
    const txBase64 = makeSerializedTx();

    const result = await craftRawTransaction(txBase64);

    expect(result.transaction).toBe(txBase64);
    expect(result.details).toEqual({ recentBlockhash: TEST_BLOCKHASH });
  });

  it("should succeed when sender matches the fee payer", async () => {
    const txBase64 = makeSerializedTx();

    const result = await craftRawTransaction(txBase64, TEST_PAYER);

    expect(result.transaction).toBe(txBase64);
    expect(result.details).toEqual({ recentBlockhash: TEST_BLOCKHASH });
  });

  it("should succeed when sender co-signs a transaction another account pays for", async () => {
    const txBase64 = makeSerializedTx(TEST_CO_SIGNER);

    const result = await craftRawTransaction(txBase64, TEST_CO_SIGNER);

    expect(result.transaction).toBe(txBase64);
  });

  it("should throw when sender is not a signer of the transaction", async () => {
    const txBase64 = makeSerializedTx();
    const wrongSender = "3Mc6bGBhgRyT5RMa2Cfkp3BD2TXFoaVaKzDrKJLemnaZ";

    await expect(craftRawTransaction(txBase64, wrongSender)).rejects.toThrow(
      "Sender is not a signer of the transaction",
    );
  });

  it("should throw for invalid base64 input", async () => {
    await expect(craftRawTransaction("not-valid-base64!!!")).rejects.toThrow(
      "Invalid or unsupported raw transaction",
    );
  });

  it("should throw for empty string", async () => {
    await expect(craftRawTransaction("")).rejects.toThrow("Empty raw transaction");
  });

  it("should throw for whitespace-only string", async () => {
    await expect(craftRawTransaction("   ")).rejects.toThrow("Empty raw transaction");
  });

  it("should throw for valid base64 that is not a transaction", async () => {
    const notATx = Buffer.from("hello world").toString("base64");
    await expect(craftRawTransaction(notATx)).rejects.toThrow(
      "Invalid or unsupported raw transaction",
    );
  });
});
