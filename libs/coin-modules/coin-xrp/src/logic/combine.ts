import { decode, encode } from "ripple-binary-codec";
import { JsonObject } from "ripple-binary-codec/dist/types/serialized-type";

type XRPTransaction = JsonObject & {
  TxnSignature: string;
  SigningPubKey?: string;
};

export function combine(transaction: string, signature: string, publicKey?: string): string {
  const xrplTransaction: JsonObject = decode(transaction);
  let transactionWithSignature: XRPTransaction = { ...xrplTransaction, TxnSignature: signature };

  if (publicKey) {
    transactionWithSignature = { ...transactionWithSignature, SigningPubKey: publicKey };
  }

  const encoded = encode(transactionWithSignature);
  return encoded;
}
