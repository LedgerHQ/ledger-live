import type { BroadcastTransactionRequest } from "../types";

// Serialisation contract (symmetric with craftTransaction.ts):
//   craftTransaction output: JSON.stringify({ cbor, message }) where
//     - cbor: base64 of the Filecoin Message bytes (what the signer signs)
//     - message: the Lotus-shape message fields
//   combine input: same JSON string + a base64 signature string.
//   combine output: JSON.stringify(BroadcastTransactionRequest) consumed by broadcast().
type CraftedPayload = {
  cbor: string;
  message: {
    version: number;
    to: string;
    from: string;
    nonce: number;
    value: string;
    gasLimit: number;
    gasFeeCap: string;
    gasPremium: string;
    method: number;
    params: string;
  };
};

export function combine(tx: string, signature: string, _pubkey?: string): string {
  const parsed: CraftedPayload = JSON.parse(tx);
  const { message } = parsed;

  const request: BroadcastTransactionRequest = {
    message: {
      version: message.version,
      to: message.to,
      from: message.from,
      nonce: message.nonce,
      value: message.value,
      gaslimit: message.gasLimit,
      gasfeecap: message.gasFeeCap,
      gaspremium: message.gasPremium,
      method: message.method,
      params: message.params,
    },
    signature: {
      type: 1,
      data: signature,
    },
  };

  return JSON.stringify(request);
}
