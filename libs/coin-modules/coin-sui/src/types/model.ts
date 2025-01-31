import { ExecuteTransactionBlockParams, SuiTransactionBlockResponse } from "@mysten/sui/client";

export type SuiOperationMode = "send";

// type TypeRegistry = any;

export type TransactionPayloadInfo = {
  // after runtime upgrade
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
  // registry: TypeRegistry;
  executeTransactionBlock: (
    params: ExecuteTransactionBlockParams,
  ) => Promise<SuiTransactionBlockResponse | undefined>;
  unsigned: Uint8Array;
};
