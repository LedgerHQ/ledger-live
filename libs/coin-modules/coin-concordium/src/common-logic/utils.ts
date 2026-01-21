import { AccountAddress, getAccountTransactionHandler } from "@ledgerhq/concordium-sdk-adapter";
import type { AccountTransaction } from "@ledgerhq/hw-app-concordium/lib/types";
import { AccountTransactionWithEnergy } from "../types/transaction";

/**
 * Validates a Concordium account address using the SDK.
 * Checks that the address is exactly 50 characters, valid base58check encoding, and uses version byte 1.
 */
export function isRecipientValid(recipient: string): boolean {
  try {
    AccountAddress.fromBase58(recipient);
    return true;
  } catch {
    return false;
  }
}

/**
 * Encodes a signed Concordium transaction as JSON for storage in signed operations.
 * The encoded format is later parsed by broadcast() to submit to wallet-proxy.
 * Returns a JSON string with separate transaction body and signature.
 */
export const encodeSignedTransaction = (transaction: string, signature: string) => {
  return JSON.stringify({
    transactionBody: transaction,
    signature: signature,
  });
};

export function transformAccountTransaction(
  sdkTx: AccountTransactionWithEnergy,
): AccountTransaction {
  const handler = getAccountTransactionHandler(sdkTx.type);
  const serializedPayload = handler.serialize(sdkTx.payload);

  return {
    sender: Buffer.from(AccountAddress.toBuffer(sdkTx.header.sender)),
    nonce: sdkTx.header.nonce.value,
    expiry: sdkTx.header.expiry.expiryEpochSeconds,
    energyAmount: sdkTx.energyAmount,
    transactionType: sdkTx.type,
    payload: Buffer.from(serializedPayload),
  };
}
