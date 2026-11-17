import { InvalidTransactionError } from "@ledgerhq/ledger-wallet-framework/errors";
import { log } from "@ledgerhq/logs";
import {
  BlockhashWithExpiryBlockHeight,
  SystemProgram,
  TransactionError,
  TransactionExpiredBlockheightExceededError,
  TransactionExpiredTimeoutError,
  VersionedMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import type { ChainAPI } from "../network";
import { SolanaTxBlockhashExpired, SolanaTxConfirmationTimeout } from "../errors";

type BroadcastOptions = {
  recentBlockhash?: BlockhashWithExpiryBlockHeight;
};

// SPL Token program error codes — https://github.com/solana-program/token/blob/main/program/src/error.rs
const SPL_TOKEN_INSUFFICIENT_FUNDS = 1;
const SPL_TOKEN_ACCOUNT_FROZEN = 17;

function getTransactionErrorKey(err: TransactionError | null): string | undefined {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") return Object.keys(err)[0];
  return undefined;
}

function classifySimulationError(err: TransactionError): Error {
  switch (getTransactionErrorKey(err)) {
    case "InsufficientFundsForRent":
      return new InvalidTransactionError("Insufficient funds for rent");
    case "InsufficientFundsForFee":
      return new InvalidTransactionError("Insufficient funds for fee");
    case "AccountInUse":
      return new InvalidTransactionError("Account in use");
    case "AlreadyProcessed":
      return new InvalidTransactionError("Already processed");
    case "BlockhashNotFound":
      return new InvalidTransactionError("Blockhash not found");
    case "InstructionError": {
      const [instructionIndex, detail] =
        (err as { InstructionError: [number, unknown] }).InstructionError ?? [];
      const fields = { err, instructionIndex };
      if (detail === "InsufficientFunds")
        return new InvalidTransactionError("Insufficient funds", fields);
      if (detail && typeof detail === "object" && "Custom" in detail) {
        const custom = (detail as { Custom: number }).Custom;
        if (custom === SPL_TOKEN_ACCOUNT_FROZEN)
          return new InvalidTransactionError("Token account frozen", fields);
        if (custom === SPL_TOKEN_INSUFFICIENT_FUNDS)
          return new InvalidTransactionError("Insufficient funds", fields);
      }
      return new InvalidTransactionError("Transaction simulation failed", fields);
    }
    default:
      return new InvalidTransactionError("Transaction simulation failed", { err });
  }
}

// Time for a node to confirm a blockhash it has only processed.
const BLOCKHASH_RETRY_DELAY_MS = 500;

function simulate(api: ChainAPI, signedTx: VersionedTransaction) {
  return api.simulateTransaction(signedTx, {
    sigVerify: true,
    replaceRecentBlockhash: false,
    commitment: "confirmed",
  });
}

// The node treats a transaction as durable-nonce when its first instruction is the System program's
// AdvanceNonceAccount (4 as a little-endian u32). Its `recentBlockhash` then holds the nonce value,
// which `isBlockhashValid` always reports as invalid: only the simulation can check it.
const ADVANCE_NONCE_ACCOUNT = 4;

function usesDurableNonce(message: VersionedMessage): boolean {
  const [first] = message.compiledInstructions;
  if (!first) return false;
  const programId = message.staticAccountKeys[first.programIdIndex];
  return (
    !!programId?.equals(SystemProgram.programId) &&
    first.data.length >= 4 &&
    Buffer.from(first.data).readUInt32LE(0) === ADVANCE_NONCE_ACCOUNT
  );
}

// Checked at `processed`, the node's latest view, so a blockhash not yet confirmed is not called expired.
async function isBlockhashExpired(api: ChainAPI, blockhash: string): Promise<boolean> {
  try {
    return !(await api.isBlockhashValid(blockhash, "processed"));
  } catch (error) {
    log("solana", "blockhash validity check failed", { error });
    return false;
  }
}

/**
 *
 * @param api - The Solana API client
 * @param tx - The transaction to broadcast in base64 format
 * @param options - The broadcast options
 * @returns The transaction hash
 */
export async function broadcast(
  api: ChainAPI,
  tx: string,
  options?: BroadcastOptions,
): Promise<string> {
  const buffer = Buffer.from(tx, "base64");
  const signedTx = VersionedTransaction.deserialize(buffer);
  const { message } = signedTx;

  // An expired blockhash cannot pass the simulation, so it is not run.
  if (!usesDurableNonce(message) && (await isBlockhashExpired(api, message.recentBlockhash))) {
    throw new SolanaTxBlockhashExpired();
  }

  let { value } = await simulate(api, signedTx);

  if (getTransactionErrorKey(value.err) === "BlockhashNotFound") {
    // Valid at `processed`, or not checked: this node may not have confirmed the blockhash yet.
    log("solana", "blockhash not found, simulating again", { logs: value.logs });
    await new Promise(resolve => setTimeout(resolve, BLOCKHASH_RETRY_DELAY_MS));
    ({ value } = await simulate(api, signedTx));
  }

  if (value.err !== null) {
    log("solana", "transaction simulation failed", { err: value.err, logs: value.logs });
    throw classifySimulationError(value.err);
  }

  try {
    return await api.sendRawTransaction(buffer, options?.recentBlockhash);
  } catch (error) {
    // web3.js reports a blockhash expiry with two distinct classes.
    if (
      error instanceof TransactionExpiredTimeoutError ||
      error instanceof TransactionExpiredBlockheightExceededError
    ) {
      throw new SolanaTxConfirmationTimeout();
    }
    throw error;
  }
}
