import type { OnboardingPrepareResponse, PrepareTransferResponse } from "../../types/gateway";
import { PrepareTransactionResponse } from "../../types/onboard";
import { CantonSigner, CantonSignature } from "../../types/signer";
import { splitTransaction } from "./split";

/**
 * Sign a Canton transaction - handles both prepared transactions and untyped versioned messages
 */

export async function signTransaction(
  signer: CantonSigner,
  derivationPath: string,
  transactionData: PrepareTransferResponse | PrepareTransactionResponse | OnboardingPrepareResponse,
): Promise<CantonSignature> {
  let signature: CantonSignature;

  if ("json" in transactionData) {
    const components = splitTransaction(transactionData.json);
    signature = await signer.signTransaction(derivationPath, components);
  } else {
    const challenge = getTransactionChallenge(transactionData);

    const transactions = [
      transactionData.transactions.namespace_transaction.serialized,
      transactionData.transactions.party_to_key_transaction.serialized,
      transactionData.transactions.party_to_participant_transaction.serialized,
    ];

    signature = await signer.signTransaction(derivationPath, {
      transactions,
      ...(challenge && { challenge }),
    });
  }

  if (!signature?.signature) {
    throw new Error("Device returned empty signature");
  }

  return signature;
}

const getTransactionChallenge = ({
  challenge_nonce,
  challenge_deadline,
}: OnboardingPrepareResponse) => {
  if (!challenge_nonce || !challenge_deadline) {
    return undefined;
  }

  try {
    const deadlineHex = Buffer.alloc(8);
    deadlineHex.writeBigInt64BE(BigInt(challenge_deadline), 0);

    // Format: [length (1B) = 0x18][challenge (16 bytes)][deadline (8 bytes)]
    return "18" + challenge_nonce.toLowerCase() + deadlineHex.toString("hex");
  } catch (error) {
    return undefined;
  }
};
