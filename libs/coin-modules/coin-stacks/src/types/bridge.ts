import type { Stake } from "@ledgerhq/coin-module-framework/api/index";
import {
  Account,
  AccountRaw,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import { AnchorMode } from "@stacks/transactions";
import BigNumber from "bignumber.js";

import { StacksNetwork } from "../network/api";

export type FamilyType = "stacks";
export const TokenPrefix = "stacks/sip010/";

export type NetworkInfo = {
  family: FamilyType;
};
export type NetworkInfoRaw = {
  family: FamilyType;
};

export type StacksTransactionMode = "send" | "delegate" | "undelegate";

export type StacksFamilySpecificData = {
  numCycles?: number;
  startBurnHt?: number;
};

export type Transaction = TransactionCommon & {
  family: FamilyType;
  fee?: BigNumber;
  /** The `GenericTransaction` fee field (generic-coin-framework/types.ts) -- read this once the
   * documented flag-flip PR routes Stacks through the generic bridge, which never sets `fee`. */
  fees?: BigNumber | null;
  nonce?: BigNumber;
  memo?: string;
  network: keyof typeof StacksNetwork;
  anchorMode: AnchorMode;
  /** pox-5 staking mode; unset (or "send") on a classic transfer. */
  mode?: StacksTransactionMode;
  /** pox-5 signer-manager contract principal (the staking pool); unused on a transfer. */
  valAddress?: string;
  familySpecificData?: StacksFamilySpecificData;
  /** The generic bridge's token selector (SIP-010 `CONTRACT_ID::ASSET_NAME`); unset on the legacy
   * bridge, which selects the token through `subAccountId`. */
  assetReference?: string;
  assetOwner?: string;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
  fee?: string;
  fees?: string | null;
  nonce?: string;
  memo?: string;
  /** Absent on a generic-bridge transaction (see `Transaction.assetReference`). */
  network?: string;
  anchorMode?: number;
  mode?: StacksTransactionMode;
  valAddress?: string;
  familySpecificData?: StacksFamilySpecificData;
  assetReference?: string;
  assetOwner?: string;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type StacksOperation = Operation<StacksOperationExtra>;

export type StacksOperationExtra = {
  memo?: string | undefined;
};

/**
 * On-Account shape for `stakingPositions`: framework `Stake` with `bigint` amounts converted to
 * `BigNumber`, matching the convention used elsewhere on the Account (`balance`,
 * `spendableBalance`) and matching exactly the shape the generic-coin-framework's own
 * `getAccountShape.ts` (`toStakingPositionOnAccount`) will produce once this family is enrolled in
 * `genericCoinFrameworkFamilies.json` -- this is a same-shape backport for the classic bridge that
 * remains active until then, not a divergent implementation.
 */
export type StakingPosition = Omit<Stake, "amount" | "amountDeposited" | "amountRewarded"> & {
  amount: BigNumber;
  amountDeposited?: BigNumber;
  amountRewarded?: BigNumber;
};

export type StacksAccount = Account & { stakingPositions?: StakingPosition[] };

/** JSON-safe `StakingPosition`: `BigNumber` amounts as decimal strings, dates as ISO strings. */
export type StakingPositionRaw = Omit<
  StakingPosition,
  "amount" | "amountDeposited" | "amountRewarded" | "stateUpdatedAt" | "createdAt"
> & {
  amount: string;
  amountDeposited?: string;
  amountRewarded?: string;
  stateUpdatedAt?: string;
  createdAt?: string;
};

export type StacksAccountRaw = AccountRaw & { stakingPositions?: StakingPositionRaw[] };

/** `Stake.details` as produced by `getStakes` from pox-5's `get-staker-info`. */
export type StacksStakeDetails = {
  firstRewardCycle: number;
  numCycles: number;
  rewardAsset: string;
  amountRewarded: string;
};
