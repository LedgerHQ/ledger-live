import {
  Ed25519PublicKey,
  RawTransaction,
  SimpleTransaction,
  UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { node } from "../network";

export async function simulateTransaction(
  address: Ed25519PublicKey,
  tx: RawTransaction,
  options = {
    estimateGasUnitPrice: true,
    estimateMaxGasAmount: true,
    estimatePrioritizedGasUnitPrice: false,
  },
): Promise<UserTransactionResponse[]> {
  const client = await node();

  return client.transaction.simulate.simple({
    signerPublicKey: address,
    transaction: { rawTransaction: tx } as SimpleTransaction,
    options,
  });
}
