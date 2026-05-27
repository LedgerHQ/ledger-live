import type { FilecoinCraftedMessage } from "./craftTransaction";

/**
 * Combine an unsigned crafted transaction with a device signature.
 *
 * @param tx  - JSON string produced by {@link craftTransaction}
 * @param signature - base64-encoded compact secp256k1 signature from the hardware wallet
 * @returns JSON string ready to pass to {@link broadcast}
 */
export function combine(tx: string, signature: string, _pubkey?: string): string {
  const crafted: FilecoinCraftedMessage = JSON.parse(tx);
  const { message, signatureType } = crafted;

  const broadcastRequest = {
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
      type: signatureType,
      data: signature,
    },
  };

  return JSON.stringify(broadcastRequest);
}
