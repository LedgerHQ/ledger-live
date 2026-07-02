import { InvalidTransactionError } from "@ledgerhq/errors";
import {
  BlockhashWithExpiryBlockHeight,
  TransactionError,
  VersionedTransaction,
} from "@solana/web3.js";
import type { ChainAPI } from "../network";

type BroadcastOptions = {
  recentBlockhash?: BlockhashWithExpiryBlockHeight;
};

// SPL Token program error codes — https://github.com/solana-program/token/blob/main/program/src/error.rs
const SPL_TOKEN_INSUFFICIENT_FUNDS = 1;
const SPL_TOKEN_ACCOUNT_FROZEN = 17;

function getTransactionErrorKey(err: TransactionError): string | undefined {
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
      const detail = (err as { InstructionError: [number, unknown] }).InstructionError?.[1];
      if (detail === "InsufficientFunds") return new InvalidTransactionError("Insufficient funds");
      if (detail && typeof detail === "object" && "Custom" in detail) {
        const custom = (detail as { Custom: number }).Custom;
        if (custom === SPL_TOKEN_ACCOUNT_FROZEN)
          return new InvalidTransactionError("Token account frozen");
        if (custom === SPL_TOKEN_INSUFFICIENT_FUNDS)
          return new InvalidTransactionError("Insufficient funds");
      }
      return new InvalidTransactionError("Transaction simulation failed");
    }
    default:
      return new InvalidTransactionError("Transaction simulation failed");
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

  const { value } = await api.simulateTransaction(signedTx, {
    sigVerify: true,
    replaceRecentBlockhash: false,
    commitment: "confirmed",
  });

  if (value.err !== null) {
    throw classifySimulationError(value.err);
  }

  return api.sendRawTransaction(buffer, options?.recentBlockhash);
}
