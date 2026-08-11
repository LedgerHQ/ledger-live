import BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { SendPerfFixture } from "../../engine/fixtureTypes";
import {
  buildSignedOperation,
  mockSolAccount,
  SolSignedPayload,
} from "../../engine/solLayer2Runner";

export type SolLayer2Scenario = {
  fixture: SendPerfFixture;
  buildPayload: (connection: Connection) => Promise<SolSignedPayload>;
  withPendingOps: boolean;
};

/** Tx that fails Agave preflight with a simulation error (empty payer). */
export async function buildSimulationFailPayload(connection: Connection): Promise<SolSignedPayload> {
  const payer = Keypair.generate();
  const recipient = Keypair.generate().publicKey;
  const blockhash = await connection.getLatestBlockhash();

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: recipient,
      lamports: LAMPORTS_PER_SOL,
    }),
  );
  tx.recentBlockhash = blockhash.blockhash;
  tx.feePayer = payer.publicKey;
  tx.sign(payer);

  return {
    signatureHex: tx.serialize().toString("hex"),
    accountId: `js:2:solana:${payer.publicKey.toBase58()}:solanaMain`,
    payerAddress: payer.publicKey.toBase58(),
    recentBlockhash: blockhash,
  };
}

export const SOL_LAYER2_SCENARIOS: SolLayer2Scenario[] = [
  {
    fixture: {
      id: "sol-simulation-failed-while-pending-op",
      chain: "solana",
      layer: 2,
      description:
        "Simulation failure while account has pending operations maps to SolanaTxSimulationFailedWhilePendingOp",
      expectReject: "SolanaTxSimulationFailedWhilePendingOp",
      expectErrorClass: "SolanaTxSimulationFailedWhilePendingOp",
      productionWeight: {
        source: "MS team SOL broadcast_failure report (2026-08-07)",
        count_14d: 233,
        note: "SolanaTxSimulationFailedWhilePendingOp bucket",
      },
    },
    buildPayload: buildSimulationFailPayload,
    withPendingOps: true,
  },
  {
    fixture: {
      id: "sol-simulation-failed-no-pending-op",
      chain: "solana",
      layer: 2,
      description:
        "Same simulation failure without pending ops surfaces raw RPC error, not pending-op class",
      expectReject: "simulation failed",
      productionWeight: {
        source: "MS team SOL broadcast_failure report (2026-08-07)",
        count_14d: 169,
        note: "Generic simulation failed; must not be misclassified as pending-op",
      },
    },
    buildPayload: buildSimulationFailPayload,
    withPendingOps: false,
  },
];

export async function runSolLayer2Scenario(
  connection: Connection,
  scenario: SolLayer2Scenario,
): Promise<{
  account: ReturnType<typeof mockSolAccount>;
  signedOperation: ReturnType<typeof buildSignedOperation>;
}> {
  const payload = await scenario.buildPayload(connection);
  const pendingOps: Operation[] = scenario.withPendingOps
    ? [
        {
          id: "pending-mock",
          hash: "pending-mock-hash",
          type: "OUT",
          value: new BigNumber(1000),
          fee: new BigNumber(5000),
          blockHeight: null,
          blockHash: null,
          accountId: payload.accountId,
          senders: [payload.payerAddress],
          recipients: [],
          date: new Date(),
          extra: {},
        },
      ]
    : [];

  const account = mockSolAccount(payload.accountId, pendingOps);
  const signedOperation = buildSignedOperation(payload);
  return { account, signedOperation };
}
