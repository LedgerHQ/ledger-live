import { OnboardingPrepareResponse, PrepareTransferResponse } from "../../network/gateway";
import { PrepareTransactionResponse } from "../../types/onboard";
import { CantonSigner } from "../../types/signer";
import { splitTransaction } from "./split";

/**
 * Sign a Canton transaction - handles both prepared transactions and untyped versioned messages
 */
export async function signTransaction(
  signer: CantonSigner,
  derivationPath: string,
  transactionData: PrepareTransferResponse | OnboardingPrepareResponse | PrepareTransactionResponse,
): Promise<string> {
  let signature: string;

  if ("json" in transactionData) {
    const components = splitTransaction(transactionData.json);
    signature = await signer.signTransaction(derivationPath, components);
  } else {
    const transactions = [
      transactionData.transactions.namespace_transaction.serialized,
      transactionData.transactions.party_to_key_transaction.serialized,
      transactionData.transactions.party_to_participant_transaction.serialized,
    ];
    signature = await signer.signTransaction(derivationPath, { transactions });
  }

  if (!signature || signature.length === 0) {
    throw new Error("Device returned empty signature");
  }

  return signature;
}
