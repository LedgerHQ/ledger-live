export type SuiOperationMode = "send";

export type AccountInfoResponse = Record<string, string>;

export type CoreTransaction = {
  unsigned: Uint8Array;
};
