import type { HexString } from "@polkadot/util/types";

interface IAt {
  hash: string;
  height: string;
}
interface IBalanceLock {
  id: string;
  amount: string;
}
interface IPallet {
  at: IAt;
  pallet: string;
  palletIndex: number;
}
export interface IUnlocking {
  value: string;
  era: string;
}
interface IStakingLedger {
  unlocking: IUnlocking[];
}
interface ITarget {
  address: string;
  value: string;
  status: "active" | "inactive" | "waiting" | null;
}
export interface IIdentity {
  display?: string | undefined;
  displayParent?: string | undefined;
  email?: string | undefined;
  image?: string | undefined;
  legal?: string | undefined;
  other?: Record<string, any>;
  parent?: string | undefined;
  pgp?: string | undefined;
  riot?: string | undefined;
  twitter?: string | undefined;
  web?: string | undefined;
  judgements: Array<[string, Record<string, any>]>;
}
export interface IValidator {
  accountId: string;
  identity: IIdentity;
  own: string;
  total: string;
  nominatorsCount: number;
  commission: string;
  rewardsPoints: string | null;
  isElected: boolean;
  isOversubscribed: boolean;
}
interface IChainType {
  isDevelopment?: boolean;
  isLocal?: boolean;
  isLive?: boolean;
  isCustom?: boolean;
  asCustom?: Text;
}
interface IChainProperties {
  ss58Format: string;
  tokenDecimals: string;
  tokenSymbol: string;
}
export interface SidecarAccountBalanceInfo {
  at: IAt;
  tokenSymbol: string;
  nonce: string;
  free: string;
  reserved: string;
  miscFrozen: string;
  feeFrozen: string;
  locks: IBalanceLock[];
}
export interface SidecarPallet {
  at: IAt;
  tokenSymbol: string;
  nonce: string;
  free: string;
  reserved: string;
  miscFrozen: string;
  feeFrozen: string;
  locks: IBalanceLock[];
}
export interface SidecarPalletStorageItem extends IPallet {
  storageItem: string;
  keys?: string[];
  key1?: string;
  key2?: string;
  value?: any;
}
export interface SidecarStakingInfo {
  numSlashingSpans: number;
  staking: IStakingLedger;
}
export interface SidecarNominations {
  submittedIn: string | null;
  targets: ITarget[];
}
export interface SidecarConstants {
  consts: Record<string, any>;
}
export type SidecarValidatorsParamStatus = "all" | "elected" | "waiting" | "nextElected";
export type SidecarValidatorsParamAddresses = string[];
export type SidecarValidators = IValidator[];
export interface SidecarPalletStakingProgress {
  at: IAt;
  idealValidatorCount?: string | null;
  activeEra: string | null;
  forceEra: string;
  nextActiveEraEstimate?: string;
  nextSessionEstimate: string | null;
  unappliedSlashes: string[] | null;
  electionStatus?: {
    status: Record<string, any>;
    toggleEstimate: string | null;
  };
  validatorSet?: string[] | null;
}
export interface SidecarTransactionMaterial {
  at: IAt;
  genesisHash: string;
  chainName: string;
  specName: string;
  specVersion: string;
  txVersion: string;
  metadata?: HexString;
}
export interface SidecarTransactionBroadcast {
  hash: string;
}
export interface SidecarPaymentInfo {
  weight: string;
  class: string;
  partialFee: string;
}
export interface SidecarRuntimeSpec {
  at: IAt;
  authoringVersion: string;
  transactionVersion: string;
  implVersion: string;
  specName: string;
  specVersion: string;
  chainType: IChainType;
  properties: IChainProperties;
}

//BlockInfo
export type BlockInfo = {
  number: string;
  hash: string;
  parentHash: string;
  stateRoot: string;
  extrinsicsRoot: string;
  authorId: string;
  logs: Log[];
  // onInitialize: OnInitialize;
  extrinsics: Extrinsic[];
  onFinalize: {
    events: any[];
  };
  finalized: boolean;
};
type Log = {
  type: string;
  index: string;
  value: string[];
};
type Extrinsic = {
  method: Method;
  signature: any;
  nonce: any;
  args: Args;
  tip: any;
  hash: string;
  era: {
    immortalEra: string;
  };
  events: {
    method: Method;
    data: any[];
  }[];
  success: boolean;
  paysFee: boolean;
};
type Method = {
  pallet: string;
  method: string;
};
type Args = {
  now?: string;
  data?: Data;
};
type Data = {
  bitfields: Bitfield[];
  backedCandidates: BackedCandidate[];
  disputes: any[];
  parentHeader: ParentHeader;
};
type Bitfield = {
  payload: string;
  validatorIndex: string;
  signature: string;
};
type BackedCandidate = {
  candidate: Candidate;
  validityVotes: {
    explicit?: string;
    implicit?: string;
  }[];
  validatorIndices: string;
};
type Candidate = {
  descriptor: Descriptor;
  commitments: Commitments;
};
type Descriptor = {
  paraId: string;
  relayParent: string;
  collator: string;
  persistedValidationDataHash: string;
  povHash: string;
  erasureRoot: string;
  signature: string;
  paraHead: string;
  validationCodeHash: string;
};
type Commitments = {
  upwardMessages: any[];
  horizontalMessages: any[];
  newValidationCode: any;
  headData: string;
  processedDownwardMessages: string;
  hrmpWatermark: string;
};
type ParentHeader = {
  parentHash: string;
  number: string;
  stateRoot: string;
  extrinsicsRoot: string;
  digest: Digest;
};
type Digest = {
  logs: {
    preRuntime?: string[];
    consensus?: string[];
    seal?: string[];
  }[];
};
