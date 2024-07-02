import { decode, encode } from "ripple-binary-codec";

export function combine(transaction: string, signature: string, pubkey: string): string {
  const xrplTransaction = decode(transaction);

  return encode({
    ...xrplTransaction,
    SigningPubKey: pubkey,
    TxnSignature: signature,
  });
}
