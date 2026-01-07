export type SuiOperationMode = "send";

export type AccountInfoResponse = Record<string, string>;

export type CoreTransaction = {
  /** The transaction in a serialized format, ready to be signed. */
  unsigned: Uint8Array;

  /** The input objects referenced in the transaction, in serialized form.. */
  objects?: Uint8Array[];
};
