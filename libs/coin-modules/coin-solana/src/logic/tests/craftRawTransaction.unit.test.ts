import { PublicKey, VersionedTransaction, TransactionMessage } from "@solana/web3.js";
import type { ChainAPI } from "../../network";
import { craftRawTransaction } from "../craftRawTransaction";

const TEST_ADDRESS = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const OTHER_ADDRESS = "AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ";
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

const api = {} as unknown as ChainAPI;

describe("craftRawTransaction", () => {
  it("should return the transaction unchanged with recentBlockhash in details", async () => {
    const txBase64 = makeSerializedTx();

    const result = await craftRawTransaction(api, txBase64, TEST_ADDRESS, "", 0n);

    expect(result.transaction).toBe(txBase64);
    expect(result.details?.recentBlockhash).toBe(TEST_BLOCKHASH);
  });

  it("should throw when sender does not match fee payer", async () => {
    const txBase64 = makeSerializedTx(TEST_ADDRESS);

    await expect(craftRawTransaction(api, txBase64, OTHER_ADDRESS, "", 0n)).rejects.toThrow(
      "Sender address does not match the transaction fee payer",
    );
  });

  it("should throw for invalid base64 input", async () => {
    await expect(
      craftRawTransaction(api, "not-valid-base64!!!", TEST_ADDRESS, "", 0n),
    ).rejects.toThrow();
  });
});
