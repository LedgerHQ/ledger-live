import {
  Account,
  AccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type BigNumber from "bignumber.js";
import type { NearStakingPosition } from "./network/sdk.types";

export type { NearStakingPosition } from "./network/sdk.types";

export type Transaction = TransactionCommon & {
  family: "near";
  mode: string;
  /** `null` until estimated, matching the generic-coin-framework's `createTransaction`. */
  fees?: BigNumber | null;
  /**
   * Set by the generic-coin-framework's `createTransaction`. A NEAR nonce belongs to an access key
   * rather than to the account, so the value is inert for crafting — it exists so `signOperation`
   * can skip `getNextSequence`, which this module deliberately does not implement. It has to
   * survive serialization, or a restored transaction sends `signOperation` down that throwing path.
   */
  nonce?: BigNumber;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "near";
  mode: string;
  fees?: string | null;
  nonce?: string;
};

export type NearPreloadedData = {
  storageCost: BigNumber;
  gasPrice: BigNumber;
  createAccountCostSend: BigNumber;
  createAccountCostExecution: BigNumber;
  transferCostSend: BigNumber;
  transferCostExecution: BigNumber;
  addKeyCostSend: BigNumber;
  addKeyCostExecution: BigNumber;
  receiptCreationSend: BigNumber;
  receiptCreationExecution: BigNumber;
  minGasPurchasePrice: BigNumber;
  accountCreationCharge: BigNumber;
};

export type NearResources = {
  stakedBalance: BigNumber;
  availableBalance: BigNumber;
  pendingBalance: BigNumber;
  storageUsageBalance: BigNumber;
  stakingPositions: NearStakingPosition[];
  /** Account state on the node at the last accepted sync; decides whether the history is re-read. */
  accountStateFingerprint?: string;
  /**
   * Time (ms) of the first history read that showed nothing new after a state change. The history is
   * read again until something new comes back or the recheck window has passed.
   */
  historyRecheckSince?: number;
  /**
   * Account state seen by the last recheck. A different state restarts the recheck window: the
   * transactions behind it are newer than the window.
   */
  historyRecheckFingerprint?: string;
  /**
   * A state change was accepted on new operations; the next sync reads the history once more, since
   * the indexer may have indexed only part of the transactions behind the change.
   */
  historyConfirmPending?: boolean;
  /**
   * Newest operation stored before the read that found the new ones. The confirmation read pages
   * until it reaches this hash, as a transaction indexed late may sit below the new ones.
   */
  historyConfirmBoundary?: string;
  /** A needed staking pool listing failed; the next syncs list the pools until one succeeds. */
  poolListingPending?: boolean;
  /** Pools named by a staking call whose node read failed; read again on the next syncs. */
  pendingCandidatePools?: string[];
  /**
   * The last history read returned no operation. With no stored operations, the stored fingerprint
   * then still describes the history (an empty account) rather than a cleared cache.
   */
  historyEmpty?: boolean;
  /** Time (ms) the pools in `pendingCandidatePools` were first named; they are dropped an hour later. */
  pendingCandidatesSince?: number;
  /** Time (ms) of the first failed history read of the current run; an hour later the failure is shown. */
  historyFailedSince?: number;
  /**
   * Time (ms) a read first returned an operation whose outcome the indexer had not recorded; the
   * history is read again until the outcome shows or an hour has passed.
   */
  historyUnsettledSince?: number;
  /**
   * Hashes of the stored operations whose outcome was missing at the last read. The next reads page
   * until each was read again, as one may sit below the first known operation.
   */
  historyUnsettledHashes?: string[];
  /**
   * Time (ms) of the first read that left a node-known account with no operation. An hour later
   * the history is taken as empty (`historyEmpty`) and no longer read on every sync.
   */
  historyEmptySince?: number;
};

export type NearResourcesRaw = {
  stakedBalance: string;
  availableBalance: string;
  pendingBalance: string;
  storageUsageBalance: string;
  stakingPositions: {
    staked: string;
    available: string;
    pending: string;
    validatorId: string;
  }[];
  accountStateFingerprint?: string;
  historyRecheckSince?: number;
  historyRecheckFingerprint?: string;
  historyConfirmPending?: boolean;
  historyConfirmBoundary?: string;
  poolListingPending?: boolean;
  pendingCandidatePools?: string[];
  historyEmpty?: boolean;
  pendingCandidatesSince?: number;
  historyFailedSince?: number;
  historyUnsettledSince?: number;
  historyUnsettledHashes?: string[];
  historyEmptySince?: number;
};

export type NearAccount = Account & { nearResources: NearResources };

export type NearAccountRaw = AccountRaw & {
  nearResources: NearResourcesRaw;
};

export type NearValidatorItem = {
  validatorAddress: string;
  commission: number | null;
  tokens: string;
};

export type NearMappedStakingPosition = NearStakingPosition & {
  formattedAmount: string;
  formattedPending: string;
  formattedAvailable: string;
  rank: number;
  validator: NearValidatorItem | null | undefined;
};

export type StatusErrorMap = {
  recipient?: Error;
  amount?: Error;
  fees?: Error;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
