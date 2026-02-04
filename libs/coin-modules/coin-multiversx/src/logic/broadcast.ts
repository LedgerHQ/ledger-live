/**
 * Broadcasts a signed transaction to the MultiversX network.
 * Pure transformation function for transaction broadcasting (Story 4.6).
 */
import type { SignedOperation } from "@ledgerhq/types-live";
import type MultiversXApiClient from "../api/apiCalls";
import type { MultiversXProtocolTransaction } from "../types";
import { isValidAddress } from "../logic";
import { MIN_GAS_LIMIT } from "../constants";

/**
 * Broadcasts a signed transaction to the MultiversX network.
 *
 * @param signedTx - JSON string from combine() containing signed transaction
 * @param apiClient - MultiversX API client instance for network calls
 * @returns Transaction hash as string
 * @throws Error if signedTx is malformed JSON or missing required fields
 * @throws Error if network call fails (with network error message)
 */
export async function broadcast(
  signedTx: string,
  apiClient: MultiversXApiClient,
): Promise<string> {
  // Parse the signed transaction from combine()
  let tx: MultiversXProtocolTransaction;
  try {
    tx = JSON.parse(signedTx);
  } catch {
    throw new Error("Invalid signed transaction: malformed JSON");
  }

  // Validate signature (check for missing or empty string)
  if (!tx.signature || tx.signature.trim() === "") {
    throw new Error("Invalid signed transaction: missing or empty signature");
  }

  // Validate required fields presence
  if (
    tx.nonce === undefined ||
    !tx.sender ||
    !tx.receiver ||
    tx.value === undefined ||
    tx.gasPrice === undefined ||
    tx.gasLimit === undefined ||
    !tx.chainID
  ) {
    throw new Error("Invalid signed transaction: missing required fields");
  }

  // Validate address formats
  if (!isValidAddress(tx.sender)) {
    throw new Error(`Invalid signed transaction: invalid sender address format: ${tx.sender}`);
  }

  if (!isValidAddress(tx.receiver)) {
    throw new Error(`Invalid signed transaction: invalid receiver address format: ${tx.receiver}`);
  }

  // Validate numeric ranges
  if (typeof tx.nonce !== "number" || tx.nonce < 0) {
    throw new Error(`Invalid signed transaction: nonce must be a non-negative number, got ${tx.nonce}`);
  }

  if (typeof tx.gasPrice !== "number" || tx.gasPrice <= 0) {
    throw new Error(`Invalid signed transaction: gasPrice must be a positive number, got ${tx.gasPrice}`);
  }

  if (typeof tx.gasLimit !== "number" || tx.gasLimit < MIN_GAS_LIMIT) {
    throw new Error(`Invalid signed transaction: gasLimit must be at least ${MIN_GAS_LIMIT}, got ${tx.gasLimit}`);
  }

  // Validate value format (must be a valid numeric string)
  if (typeof tx.value !== "string" || tx.value.trim() === "") {
    throw new Error(`Invalid signed transaction: value must be a non-empty string, got ${tx.value}`);
  }

  // Validate value is numeric (can be parsed as BigInt)
  try {
    BigInt(tx.value);
  } catch {
    throw new Error(`Invalid signed transaction: value must be a valid numeric string, got ${tx.value}`);
  }

  // Validate chainID format (should be a non-empty string)
  if (typeof tx.chainID !== "string" || tx.chainID.trim() === "") {
    throw new Error(`Invalid signed transaction: chainID must be a non-empty string, got ${tx.chainID}`);
  }

  // Extract signature and create rawData (all fields except signature)
  const { signature, ...rawData } = tx;

  // Create SignedOperation format expected by network layer
  const signedOperation: SignedOperation = {
    signature,
    rawData,
  };

  // Call network layer
  try {
    const hash = await apiClient.submit(signedOperation);
    return hash;
  } catch (error) {
    // Preserve original error with context
    if (error instanceof Error) {
      // Preserve the original error but add context
      const enhancedError = new Error(`Transaction broadcast failed: ${error.message}`);
      enhancedError.cause = error;
      enhancedError.stack = error.stack;
      throw enhancedError;
    }
    throw new Error("Transaction broadcast failed: unknown error");
  }
}
