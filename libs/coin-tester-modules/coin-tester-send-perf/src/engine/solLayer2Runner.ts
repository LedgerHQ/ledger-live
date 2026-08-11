import type { Account, Operation, SignedOperation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { BlockhashWithExpiryBlockHeight, Connection } from "@solana/web3.js";
import { assertRejection, BroadcastAttemptResult } from "./fixtureTypes";
import { SOL_RPC } from "../scenarios/sol/scenarios";

// Require compiled lib so Jest does not resolve the workspace package to TS source (ky ESM).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { broadcastWithAPI } = require("../../../../coin-modules/coin-solana/lib/broadcast.js") as {
  broadcastWithAPI: (
    info: { account: Account; signedOperation: SignedOperation },
    api: { sendRawTransaction: (buffer: Buffer) => Promise<string> },
  ) => Promise<{ hash: string }>;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { SolanaTxSimulationFailedWhilePendingOp } = require("../../../../coin-modules/coin-solana/lib/errors.js") as {
  SolanaTxSimulationFailedWhilePendingOp: new () => Error;
};

export { SolanaTxSimulationFailedWhilePendingOp };

export type SolSignedPayload = {
  signatureHex: string;
  accountId: string;
  payerAddress: string;
  recentBlockhash: BlockhashWithExpiryBlockHeight;
};

export function mockSolAccount(accountId: string, pendingOperations: Operation[] = []): Account {
  return {
    type: "Account",
    id: accountId,
    seedIdentifier: payerPlaceholder(accountId),
    derivationMode: "solanaMain",
    index: 0,
    freshAddress: payerPlaceholder(accountId),
    freshAddressPath: "44'/501'/0'",
    used: true,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    blockHeight: 0,
    currency: { type: "CryptoCurrency", id: "solana" } as Account["currency"],
    unit: { name: "SOL", code: "SOL", magnitude: 9 } as Account["unit"],
    operationsCount: 0,
    operations: [],
    pendingOperations,
    lastSyncDate: new Date(),
    subAccounts: [],
  } as Account;
}

function payerPlaceholder(accountId: string): string {
  return accountId.split(":").pop() ?? accountId;
}

export function buildSignedOperation(payload: SolSignedPayload): SignedOperation {
  return {
    operation: {
      id: "send-perf-op",
      hash: "",
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
    signature: payload.signatureHex,
    rawData: { recentBlockhash: payload.recentBlockhash },
  };
}

/** Minimal ChainAPI surface used by broadcastWithAPI in L2 tests. */
function createLocalChainApi(rpcUrl: string = SOL_RPC) {
  const connection = new Connection(rpcUrl, "confirmed");
  return {
    sendRawTransaction: (buffer: Buffer) =>
      connection.sendRawTransaction(buffer, { preflightCommitment: "confirmed" }),
  };
}

export async function broadcastViaCoinSolana(
  account: Account,
  signedOperation: SignedOperation,
): Promise<BroadcastAttemptResult> {
  const api = createLocalChainApi();

  return broadcastWithAPI({ account, signedOperation }, api)
    .then(op => ({ accepted: true as const, errorMessage: op.hash }))
    .catch((err: unknown) => {
      const error = err as Error;
      return {
        accepted: false as const,
        errorMessage: error.message ?? String(err),
        errorName: error.name,
      };
    });
}

export async function runSolLayer2Fixture(
  fixtureId: string,
  account: Account,
  signedOperation: SignedOperation,
  expectReject: string,
  expectErrorClass?: string,
  alternates: string[] = [],
): Promise<void> {
  const result = await broadcastViaCoinSolana(account, signedOperation);
  assertRejection(fixtureId, result, expectReject, expectErrorClass, alternates);
}
