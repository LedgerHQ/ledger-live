import { decode, encode } from "ripple-binary-codec";
import { JsonObject } from "ripple-binary-codec/dist/types/serialized-type";

type XRPTransaction = JsonObject & {
  TxnSignature: string;
  SigningPubKey?: string;
};

export function combine(transaction: string, signature: string, publicKey?: string): string {
  const xrplTransaction: JsonObject = decode(transaction);

  let transactionWithSignature: XRPTransaction = { ...xrplTransaction } as any;

  if (publicKey) {
    transactionWithSignature = {
      ...transactionWithSignature,
      SigningPubKey: publicKey,
    };
  }

  transactionWithSignature = { ...transactionWithSignature, TxnSignature: signature };

  const encoded = encode(transactionWithSignature).toUpperCase();
  return encoded;
}
