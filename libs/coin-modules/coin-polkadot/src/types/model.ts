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

export type PalletMethodName =
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

export type ExplorerExtrinsic = {
  blockNumber: number;
  timestamp: number;
  nonce: number;
  hash: string;
  signer: string;
  affectedAddress1: string;
  affectedAddress2?: string;
  method: PalletMethodName;
  section: string;
  index: number;
  isSuccess: boolean;
  amount: number;
  partialFee: number;
  isBatch: boolean;
  validatorStash?: string;
  staking?: {
    validators: { address: string }[];
    eventStaking: [
      {
        section: "staking";
        method: string;
        value: number;
      },
    ];
  };
};

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
  registry: TypeRegistry;
  unsigned: CoreTransasctionInfo | TransasctionPayloadInfo;
};
