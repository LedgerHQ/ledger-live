import { TypeRegistry } from "@polkadot/types";

export type PolkadotOperationMode =
  | "send"
  | "bond"
  | "unbond"
  | "rebond"
  | "withdrawUnbonded"
  | "setController"
  | "nominate"
  | "chill"
  | "claimReward";

export type PalletMethod =
  | "transfer"
  | "transferAllowDeath"
  | "transferKeepAlive"
  | "bond"
  | "bondExtra"
  | "rebond"
  | "unbond"
  | "nominate"
  | "chill"
  | "withdrawUnbonded"
  | "setController"
  | "payoutStakers";

/// cf. ExtrinsicPayloadValue
export type CoreTransasctionInfo = {
  // before runtime upgrade
  address: string;
  blockHash: string;
  blockNumber: `0x${string}`;
  era: `0x${string}`;
  genesisHash: string;
  method: `0x${string}`;
  nonce: `0x${string}`;
  signedExtensions: string[];
  specVersion: `0x${string}`;
  tip: `0x${string}`;
  transactionVersion: `0x${string}`;
  version: number;
};

export type TransasctionPayloadInfo = {
  // after runtime upgrade
  address: string;
  method: `0x${string}`;
  nonce: number;
  genesisHash: string;
  era: `0x${string}`;
  blockHash: string;
  transactionVersion: `0x${string}`;
  specVersion: `0x${string}`;
  version: number;
  mode: number;
  metadataHash: Uint8Array;
};

export type CoreTransaction = {
  registry: TypeRegistry;
  unsigned: CoreTransasctionInfo | TransasctionPayloadInfo;
};
