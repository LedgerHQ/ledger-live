export type SuiOperationMode = "send";

export type TransactionPayloadInfo = {
  address: string;
  blockHash: string;
  era: `0x${string}`;
  genesisHash: string;
  method: `0x${string}`;
  nonce: number;
  specVersion: `0x${string}`;
  transactionVersion: `0x${string}`;
  version: number;
  mode: number;
  metadataHash: Uint8Array;
};

export type CoreTransaction = {
  unsigned: Uint8Array;
};
