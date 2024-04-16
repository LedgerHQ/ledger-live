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
interface IUnlocking {
  value: string;
  era: string;
}
interface IStakingLedger {
  stash: string;
  total: string;
  active: string;
  unlocking: IUnlocking[];
  claimedRewards: string[];
}
interface ITarget {
  address: string;
  value: string;
  status: "active" | "inactive" | "waiting" | null;
}
interface IIdentity {
  display?: string;
  displayParent?: string;
  email?: string;
  image?: string;
  legal?: string;
  other?: Record<string, any>;
  parent?: string;
  pgp?: string;
  riot?: string;
  twitter?: string;
  web?: string;
  judgements: Array<[string, Record<string, any>]>;
}
interface IValidatorExposure {
  who: string;
  value: string;
}
interface IValidator {
  at?: IAt;
  accountId: string;
  controllerId?: string | null;
  identity: IIdentity;
  own: string;
  total: string;
  nominatorsCount: string;
  nominators?: IValidatorExposure[];
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
  at: IAt;
  controller: string;
  rewardDestination: string;
  numSlashingSpans: string;
  staking: IStakingLedger;
}
export interface SidecarNominations {
  at?: IAt;
  submittedIn: string | null;
  targets: ITarget[];
}
export interface SidecarConstants {
  at: IAt;
  consts: Record<string, any>;
}
export type SidecarValidatorsParamStatus = "all" | "elected" | "waiting";
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
