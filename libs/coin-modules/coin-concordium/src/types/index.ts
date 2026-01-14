export * from "./bridge";
export * from "./signer";

export type ConcordiumNativeTransaction = {
  TransactionType: "Payment";
  Account: string;
  Amount: string;
  Destination: string;
  Fee: string;
  Sequence: number;
  SigningPubKey?: string;
  TxnSignature?: string;
};
