import { BroadcastTransactionRequest } from "../../types";

/**
 * Combines an unsigned Filecoin message with a hardware wallet signature to
 * produce a serialized `BroadcastTransactionRequest` JSON string, ready for
 * submission via `broadcast()`.
 *
 * The `transaction` parameter is the JSON string returned by `craftTransaction()`.
 * The signature type is always 1 (secp256k1), matching Ledger's signing scheme.
 */
export function combine(transaction: string, signature: string, _pubkey?: string): string {
  const message = JSON.parse(transaction) as BroadcastTransactionRequest["message"];

  const payload: BroadcastTransactionRequest = {
    message,
    signature: {
      type: 1,
      data: signature,
    },
  };

  return JSON.stringify(payload);
}
