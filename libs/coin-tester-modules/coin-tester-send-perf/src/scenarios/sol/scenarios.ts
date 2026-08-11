import { Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction } from "@solana/web3.js";
import { SendPerfFixture } from "../../engine/fixtureTypes";

export const SOL_RPC = process.env.SOLANA_RPC_URL ?? "http://127.0.0.1:8899";

export type SolScenario = {
  fixture: SendPerfFixture;
  run: (connection: Connection) => Promise<void>;
};

async function assertRpcRejection(
  connection: Connection,
  rawTx: Buffer,
  fixture: SendPerfFixture,
  alternates: string[] = [],
): Promise<void> {
  try {
    await connection.sendRawTransaction(rawTx, { skipPreflight: false });
    throw new Error(`${fixture.id}: expected rejection containing "${fixture.expectReject}" but tx was accepted`);
  } catch (err) {
    const message = (err as Error).message ?? String(err);
    const needles = [fixture.expectReject, ...alternates].map(s => s.toLowerCase());
    if (!needles.some(needle => message.toLowerCase().includes(needle))) {
      throw new Error(
        `${fixture.id}: expected rejection containing "${fixture.expectReject}", got: ${message}`,
      );
    }
  }
}

export const SOL_LAYER1_SCENARIOS: SolScenario[] = [
  {
    fixture: {
      id: "sol-already-processed",
      chain: "solana",
      layer: 1,
      description: "Submit the same signed transaction twice",
      expectReject: "already been processed",
      productionWeight: { source: "Errors/Solana.md", note: "LIVE-32549 retry" },
    },
    run: async connection => {
      const payer = Keypair.generate();
      const recipient = Keypair.generate();
      const sig1 = await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
      const sig2 = await connection.requestAirdrop(recipient.publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig1);
      await connection.confirmTransaction(sig2);

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: recipient.publicKey,
          lamports: 1000,
        }),
      );
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = payer.publicKey;
      tx.sign(payer);

      const raw = tx.serialize();
      await connection.sendRawTransaction(raw, { skipPreflight: false });
      await assertRpcRejection(connection, raw, {
        id: "sol-already-processed",
        chain: "solana",
        layer: 1,
        description: "",
        expectReject: "already been processed",
      }, ["already processed"]);
    },
  },
  {
    fixture: {
      id: "sol-blockhash-not-found",
      chain: "solana",
      layer: 1,
      description: "Transaction signed with an expired blockhash",
      expectReject: "blockhash not found",
      productionWeight: { source: "Errors/Solana.md", note: "LIVE-32551 simulation" },
    },
    run: async connection => {
      const payer = Keypair.generate();
      const sig = await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig);

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: Keypair.generate().publicKey,
          lamports: 1000,
        }),
      );
      tx.recentBlockhash = "11111111111111111111111111111111";
      tx.feePayer = payer.publicKey;
      tx.sign(payer);

      await assertRpcRejection(connection, tx.serialize(), {
        id: "sol-blockhash-not-found",
        chain: "solana",
        layer: 1,
        description: "",
        expectReject: "blockhash not found",
      });
    },
  },
  {
    fixture: {
      id: "sol-insufficient-funds-for-rent",
      chain: "solana",
      layer: 1,
      description: "Transfer more lamports than the payer holds",
      expectReject: "insufficient funds",
      productionWeight: { source: "Errors/Solana.md", note: "ATA rent class" },
    },
    run: async connection => {
      const payer = Keypair.generate();
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: Keypair.generate().publicKey,
          lamports: LAMPORTS_PER_SOL,
        }),
      );
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = payer.publicKey;
      tx.sign(payer);

      await assertRpcRejection(connection, tx.serialize(), {
        id: "sol-insufficient-funds-for-rent",
        chain: "solana",
        layer: 1,
        description: "",
        expectReject: "insufficient funds",
      }, ["debit an account but found no record", "insufficient funds for rent"]);
    },
  },
];
