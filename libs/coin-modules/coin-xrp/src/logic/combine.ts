import { decode, encode } from "ripple-binary-codec";

export function combine(transaction: string, signature: string, publicKey?: string): string {
  const xrplTransaction = decode(transaction);

  return publicKey
    ? encode({
        ...xrplTransaction,
        SigningPubKey: publicKey,
        TxnSignature: signature,
      })
    : encode({
        ...xrplTransaction,
        TxnSignature: signature,
      });
}
