import { Keypair, Connection, SystemProgram, Transaction, clusterApiUrl } from "@solana/web3.js";
import { makeBridges } from "./bridge";
import { getChainAPI } from "../network";

describe("Broadcast", () => {
  it("throws on insufficient funds", async () => {
    const connection = new Connection(clusterApiUrl("mainnet-beta"));
    const broadcast = makeBridges({ getAPI: getChainAPI } as any).accountBridge.broadcast;
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

    const raw = tx.serialize().toString("hex");

    await expect(
      broadcast({
        signedOperation: { signature: raw },
        account: { currency: { id: "solana" }, pendingOperations: [] },
      } as any),
    ).rejects.toThrow(/Transaction simulation failed/);
  });
});
