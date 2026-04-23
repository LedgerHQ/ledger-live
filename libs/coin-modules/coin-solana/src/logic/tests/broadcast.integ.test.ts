import { Keypair, Connection, SystemProgram, Transaction, clusterApiUrl } from "@solana/web3.js";
import { createApi } from "../../api";

const api = createApi(
  {
    token2022Enabled: false,
    legacyOCMSMaxVersion: "1.0.0",
    status: { type: "active" },
  },
  "solana",
);

describe("broadcast", () => {
  it("should reject an invalid transaction with a deserialization error", async () => {
    const invalidTx = Buffer.from("invalid-transaction-bytes").toString("base64");

    await expect(api.broadcast(invalidTx)).rejects.toThrow(/failed to deserialize/i);
  });

  it("throws on insufficient funds", async () => {
    const connection = new Connection(clusterApiUrl("mainnet-beta"));
    const from = Keypair.generate();
    const { blockhash } = await connection.getLatestBlockhash();
    const tx = new Transaction({
      recentBlockhash: blockhash,
      feePayer: from.publicKey,
    }).add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: from.publicKey,
        lamports: 1,
      }),
    );

    tx.recentBlockhash = blockhash;
    tx.feePayer = from.publicKey;

    tx.sign(from);

    const raw = tx.serialize().toString("base64");

    await expect(api.broadcast(raw)).rejects.toThrow(/Transaction simulation failed/);
  });
});
