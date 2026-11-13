import { InvalidTransactionError } from "@ledgerhq/ledger-wallet-framework/errors";
import { log } from "@ledgerhq/logs";
import {
  BlockhashWithExpiryBlockHeight,
  TransactionError,
  TransactionExpiredBlockheightExceededError,
  TransactionExpiredTimeoutError,
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

// Time for a node behind its peers to catch up with the blockhash it could not find.
const LAGGING_NODE_RETRY_DELAY_MS = 500;

function simulate(api: ChainAPI, signedTx: VersionedTransaction) {
  return api.simulateTransaction(signedTx, {
    sigVerify: true,
    replaceRecentBlockhash: false,
    commitment: "confirmed",
  });
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

  let { value } = await simulate(api, signedTx);

  if (getTransactionErrorKey(value.err) === "BlockhashNotFound") {
    // This node may lag behind the one that served the blockhash: give it a moment.
    log("solana", "blockhash not found, simulating again", { logs: value.logs });
    await new Promise(resolve => setTimeout(resolve, LAGGING_NODE_RETRY_DELAY_MS));
    ({ value } = await simulate(api, signedTx));
    if (
      getTransactionErrorKey(value.err) === "BlockhashNotFound" &&
      (await isBlockhashExpired(api, signedTx.message.recentBlockhash))
    ) {
      throw new SolanaTxBlockhashExpired();
    }
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
