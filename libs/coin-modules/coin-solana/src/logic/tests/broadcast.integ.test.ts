import { Keypair, Connection, SystemProgram, Transaction, clusterApiUrl } from "@solana/web3.js";
import { createApi } from "../../api";
import { solanaDefaults } from "../../config";
import type { SolanaContext } from "../../config";

const api = createApi();
const context: SolanaContext = {
  config: async () => solanaDefaults.solana,
  logger: () => {},
};

describe("broadcast", () => {
  it("should reject an invalid transaction with a deserialization error", async () => {
    const invalidTx = Buffer.from("invalid-transaction-bytes").toString("base64");

    await expect(api.broadcast(context, invalidTx)).rejects.toThrow(
      /Reached end of buffer unexpectedly/i,
    );
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

    await expect(api.broadcast(context, raw)).rejects.toThrow(/Transaction simulation failed/);
  });
});
